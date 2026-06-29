// ============================================
// /api/cron-reminders.js  — Vercel Serverless Cron
// Ejecutado por Vercel cada minuto (ver vercel.json)
// ES module — compatible con "type":"module" en package.json
// ============================================

// ─── JWT + Access Token ──────────────────────────────────────────────────────

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const toSign = `${b64(header)}.${b64(payload)}`;

  const pem = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const key = await globalThis.crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pem, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sig = await globalThis.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign)
  );
  const jwt = `${toSign}.${Buffer.from(sig).toString('base64url')}`;

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('JWT token error: ' + JSON.stringify(d));
  return d.access_token;
}

// ─── Firestore REST ───────────────────────────────────────────────────────────

async function fsQuery(tok, pid, query) {
  const r = await fetch(
    `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:runQuery`,
    { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ structuredQuery: query }) }
  );
  return r.json();
}

async function fsPatch(tok, pid, path, fields) {
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${path}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ fields }) }
  );
}

// ─── FCM REST ────────────────────────────────────────────────────────────────

async function sendFCM(tok, pid, { token, title, body }) {
  const r = await fetch(
    `https://fcm.googleapis.com/v1/projects/${pid}/messages:send`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body: body || '' },
          webpush: {
            notification: { title, body: body || '', icon: '/pwa-192x192.png', badge: '/favicon.ico', requireInteraction: true },
            fcm_options: { link: 'https://mavia-app.vercel.app' },
          },
        },
      }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d?.error || d));
  return d;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT no configurado' });

    const sa  = JSON.parse(raw);
    const tok = await getAccessToken(sa);
    const pid = sa.project_id;

    // Hora actual en México — revisar ventana de 3 minutos
    const windows = [];
    const seen = new Set();
    for (let i = 0; i <= 3; i++) {
      const d = new Date(Date.now() - i * 60000);
      const parts = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(d);
      const gp   = (t) => parts.find(p => p.type === t)?.value || '00';
      const date = `${gp('year')}-${gp('month')}-${gp('day')}`;
      const time = `${gp('hour')}:${gp('minute')}`;
      const key  = `${date}|${time}`;
      if (!seen.has(key)) { seen.add(key); windows.push({ date, time }); }
    }

    let sent = 0;
    const errors = [];

    for (const { date, time } of windows) {
      const rows = await fsQuery(tok, pid, {
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

      const docs = Array.isArray(rows) ? rows.filter(r => r.document) : [];
      for (const { document } of docs) {
        const f       = document.fields;
        const token   = f?.fcmToken?.stringValue;
        const title   = f?.title?.stringValue   || 'Mavia';
        const body    = f?.body?.stringValue     || '';
        const docPath = document.name.split('/documents/')[1];
        if (!token) continue;

        try {
          await sendFCM(tok, pid, { token, title, body });
          await fsPatch(tok, pid, docPath, {
            sent:   { booleanValue: true },
            sentAt: { stringValue: new Date().toISOString() },
          });
          sent++;
          console.log(`[Cron] ✅ ${title}`);
        } catch (err) {
          errors.push(err.message);
          console.error(`[Cron] ❌ ${title}:`, err.message);
          if (err.message.includes('UNREGISTERED') || err.message.includes('NOT_FOUND')) {
            await fsPatch(tok, pid, docPath, { sent: { booleanValue: true }, failed: { booleanValue: true } }).catch(() => {});
          }
        }
      }
    }

    return res.status(200).json({ ok: true, sent, errors });
  } catch (err) {
    console.error('[Cron] Fatal:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
