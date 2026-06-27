#!/usr/bin/env node
// ============================================
// send-reminders.mjs
// GitHub Actions scheduled script
// Queries Firestore for due notifications and sends FCM pushes
// Runs every 10 minutes via GitHub Actions cron
// ============================================

// ─── Service Account ─────────────────────────────────────────────────────────

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error('[Mavia] ❌ FIREBASE_SERVICE_ACCOUNT env var not set');
  process.exit(1);
}
const sa = JSON.parse(raw);

// ─── JWT + Access Token ──────────────────────────────────────────────────────

async function getAccessToken() {
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

async function firestoreQuery(accessToken, structuredQuery) {
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body:    JSON.stringify({ structuredQuery }),
  });
  return res.json();
}

async function firestorePatch(accessToken, docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body:    JSON.stringify({ fields }),
  });
  return res.json();
}

// ─── FCM REST ────────────────────────────────────────────────────────────────

async function sendPush(accessToken, { token, title, body }) {
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body: body || '' },
        webpush: {
          notification: {
            title, body: body || '',
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Current time in Mexico City — we check a window of ±5 minutes
  // to account for the 10-minute cron interval
  const now = new Date();

  // Generate all HH:MM values in the last 10 minutes to avoid missing notifications
  const minutesToCheck = [];
  for (let i = 0; i <= 10; i++) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const mexTime = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d);

    const gp = (type) => mexTime.find(p => p.type === type)?.value || '00';
    minutesToCheck.push({
      date: `${gp('year')}-${gp('month')}-${gp('day')}`,
      time: `${gp('hour')}:${gp('minute')}`,
    });
  }

  // Deduplicate by date+time
  const seen = new Set();
  const windows = minutesToCheck.filter(({ date, time }) => {
    const key = `${date}|${time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Mavia] Checking ${windows.length} time windows...`);

  const accessToken = await getAccessToken();
  let totalSent = 0;

  for (const { date, time } of windows) {
    const queryResult = await firestoreQuery(accessToken, {
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
    if (docs.length > 0) console.log(`[Mavia] Found ${docs.length} notification(s) at ${date} ${time}`);

    for (const { document } of docs) {
      const fields  = document.fields;
      const token   = fields?.fcmToken?.stringValue;
      const title   = fields?.title?.stringValue || 'Mavia';
      const body    = fields?.body?.stringValue   || '';
      const docPath = document.name.split('/documents/')[1];

      if (!token) continue;

      try {
        await sendPush(accessToken, { token, title, body });
        await firestorePatch(accessToken, docPath, {
          sent:   { booleanValue: true },
          sentAt: { stringValue: new Date().toISOString() },
        });
        console.log(`[Mavia] ✅ Sent: "${title}"`);
        totalSent++;
      } catch (err) {
        console.error(`[Mavia] ❌ Failed "${title}": ${err.message}`);
        if (err.message.includes('UNREGISTERED') || err.message.includes('NOT_FOUND')) {
          await firestorePatch(accessToken, docPath, {
            sent: { booleanValue: true }, failed: { booleanValue: true },
          });
        }
      }
    }
  }

  console.log(`[Mavia] Done. Total sent: ${totalSent}`);
}

main().catch(err => {
  console.error('[Mavia] Fatal error:', err);
  process.exit(1);
});
