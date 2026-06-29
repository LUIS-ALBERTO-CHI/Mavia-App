// ============================================
// /api/cron-reminders.js
// Vercel Serverless Function + Cron Job
// Queries Firestore for due notifications and sends FCM pushes
// Configured in vercel.json to run every minute
// ============================================

export const prerender = false; // Required for Astro SSR API routes

// ─── Service Account from env ────────────────────────────────────────────────

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
  return JSON.parse(raw);
}

// ─── JWT + Access Token ──────────────────────────────────────────────────────

async function getAccessToken(sa) {
  const { webcrypto } = await import('node:crypto');
  const crypto = webcrypto;

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   sa.client_email,
    scope: [
      'https://www.googleapis.com/auth/firebase.messaging',
      'https://www.googleapis.com/auth/datastore',
    ].join(' '),
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const toSign = `${b64(header)}.${b64(payload)}`;

  const pemContents = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pemContents, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(toSign)
  );

  const jwt = `${toSign}.${Buffer.from(sig).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  const td = await tokenRes.json();
  if (!td.access_token) throw new Error('Token error: ' + JSON.stringify(td));
  return td.access_token;
}

// ─── Firestore REST ───────────────────────────────────────────────────────────

async function firestoreQuery(accessToken, projectId, structuredQuery) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body:    JSON.stringify({ structuredQuery }),
  });
  return res.json();
}

async function firestorePatch(accessToken, projectId, docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body:    JSON.stringify({ fields }),
  });
  return res.json();
}

// ─── FCM REST ────────────────────────────────────────────────────────────────

async function sendFCMPush(accessToken, projectId, { token, title, body }) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body: body || '' },
        webpush: {
          notification: {
            title,
            body: body || '',
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
            requireInteraction: true,
          },
          fcm_options: { link: 'https://mavia-app.vercel.app' },
        },
      },
    }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(result?.error || result));
  return result;
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function GET({ request }) {
  // Security: Only allow Vercel Cron calls (or calls with the correct secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);
    const projectId = sa.project_id;

    // Current time in Mexico City timezone — check a 3-minute window to avoid gaps
    const now = new Date();
    const minutesToCheck = [];
    for (let i = 0; i <= 3; i++) {
      const d = new Date(now.getTime() - i * 60 * 1000);
      const parts = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(d);

      const gp = (type) => parts.find(p => p.type === type)?.value || '00';
      minutesToCheck.push({
        date: `${gp('year')}-${gp('month')}-${gp('day')}`,
        time: `${gp('hour')}:${gp('minute')}`,
      });
    }

    // Deduplicate
    const seen = new Set();
    const windows = minutesToCheck.filter(({ date, time }) => {
      const key = `${date}|${time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let totalSent = 0;
    const errors = [];

    for (const { date, time } of windows) {
      const queryResult = await firestoreQuery(accessToken, projectId, {
        from: [{ collectionId: 'scheduledNotifications' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              { fieldFilter: { field: { fieldPath: 'sent' },          op: 'EQUAL', value: { booleanValue: false } } },
              { fieldFilter: { field: { fieldPath: 'scheduledDate' }, op: 'EQUAL', value: { stringValue: date  } } },
              { fieldFilter: { field: { fieldPath: 'scheduledTime' }, op: 'EQUAL', value: { stringValue: time  } } },
            ],
          },
        },
      });

      const docs = Array.isArray(queryResult) ? queryResult.filter(r => r.document) : [];

      for (const { document } of docs) {
        const fields  = document.fields;
        const token   = fields?.fcmToken?.stringValue;
        const title   = fields?.title?.stringValue || 'Mavia';
        const body    = fields?.body?.stringValue   || '';
        const docPath = document.name.split('/documents/')[1];

        if (!token) continue;

        try {
          await sendFCMPush(accessToken, projectId, { token, title, body });
          await firestorePatch(accessToken, projectId, docPath, {
            sent:   { booleanValue: true },
            sentAt: { stringValue: new Date().toISOString() },
          });
          totalSent++;
        } catch (err) {
          errors.push(`"${title}": ${err.message}`);
          // Mark as failed if token is invalid (don't retry)
          if (err.message.includes('UNREGISTERED') || err.message.includes('NOT_FOUND')) {
            await firestorePatch(accessToken, projectId, docPath, {
              sent: { booleanValue: true }, failed: { booleanValue: true },
            }).catch(() => {});
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Mavia Cron] Fatal:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
