// ============================================
// Vercel Cron — Send Scheduled Push Notifications
// Uses Firestore REST API + FCM HTTP v1 REST API
// No firebase-admin → no native modules → Vercel friendly
// ============================================

// ─── JWT + Auth helper ────────────────────────────────────────────────────

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   serviceAccount.client_email,
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

  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pemContents, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(toSign));
  const jwt = `${toSign}.${Buffer.from(sig).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });

  const td = await tokenRes.json();
  if (!td.access_token) throw new Error('Token error: ' + JSON.stringify(td));
  return td.access_token;
}

// ─── Firestore REST helpers ────────────────────────────────────────────────

async function firestoreQuery(projectId, accessToken, structuredQuery) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body:    JSON.stringify({ structuredQuery }),
  });
  return res.json();
}

async function firestorePatch(projectId, accessToken, docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body:    JSON.stringify({ fields }),
  });
  return res.json();
}

// ─── FCM send ─────────────────────────────────────────────────────────────

async function sendPush(projectId, accessToken, { token, title, body, data = {} }) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body: body || '' },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        webpush: {
          notification: { title, body: body || '', icon: '/pwa-192x192.png', badge: '/favicon.ico' },
          fcm_options: { link: '/' },
        },
      },
    }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(result?.error || result));
  return result;
}

// ─── Main handler ─────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Vercel Cron auth — Vercel sends Authorization: Bearer <CRON_SECRET>
  // Only enforce if CRON_SECRET is configured (skip check if not set)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (!sa.project_id) throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');

    const accessToken = await getAccessToken(sa);

    // Current time in Mexico City (UTC-6)
    const now = new Date();
    const mexTime = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now);

    const gp = (type) => mexTime.find(p => p.type === type)?.value || '00';
    const todayStr   = `${gp('year')}-${gp('month')}-${gp('day')}`;
    const currentMin = `${gp('hour')}:${gp('minute')}`;

    console.log(`[Mavia Cron] ${todayStr} ${currentMin} MX`);

    // Query scheduledNotifications where sent=false, date=today, time=now
    const queryResult = await firestoreQuery(sa.project_id, accessToken, {
      from: [{ collectionId: 'scheduledNotifications' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            { fieldFilter: { field: { fieldPath: 'sent' },          op: 'EQUAL', value: { booleanValue: false } } },
            { fieldFilter: { field: { fieldPath: 'scheduledDate' }, op: 'EQUAL', value: { stringValue: todayStr } } },
            { fieldFilter: { field: { fieldPath: 'scheduledTime' }, op: 'EQUAL', value: { stringValue: currentMin } } },
          ],
        },
      },
    });

    const docs = queryResult.filter(r => r.document);
    if (docs.length === 0) {
      return res.status(200).json({ sent: 0, at: `${todayStr} ${currentMin}` });
    }

    let sent = 0;
    for (const { document } of docs) {
      const fields   = document.fields;
      const token    = fields?.fcmToken?.stringValue;
      const title    = fields?.title?.stringValue || 'Mavia';
      const body     = fields?.body?.stringValue   || '';
      const docName  = document.name; // full resource path
      const docPath  = docName.split('/documents/')[1]; // scheduledNotifications/docId

      if (!token) continue;

      try {
        await sendPush(sa.project_id, accessToken, { token, title, body });
        // Mark as sent
        await firestorePatch(sa.project_id, accessToken, docPath, {
          sent:   { booleanValue: true },
          sentAt: { stringValue: new Date().toISOString() },
        });
        sent++;
        console.log(`[Mavia Cron] ✅ Sent: ${title}`);
      } catch (err) {
        console.error(`[Mavia Cron] ❌ Failed: ${err.message}`);
        // Mark invalid tokens as failed
        if (err.message.includes('UNREGISTERED') || err.message.includes('NOT_FOUND')) {
          await firestorePatch(sa.project_id, accessToken, docPath, {
            sent:   { booleanValue: true },
            failed: { booleanValue: true },
          });
        }
      }
    }

    return res.status(200).json({ sent, total: docs.length, at: `${todayStr} ${currentMin}` });
  } catch (err) {
    console.error('[Mavia Cron] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
