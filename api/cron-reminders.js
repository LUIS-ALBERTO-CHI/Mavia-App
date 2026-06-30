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

async function fsPost(tok, pid, path, fields) {
  const r = await fetch(
    `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${path}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ fields }) }
  );
  return r.json();
}

// ─── Time helpers ────────────────────────────────────────────────────────────

/** Converts "HH:MM" (24h) to "H:MM a.m./p.m." */
function formatTo12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
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
          // DATA-ONLY: browser does NOT auto-display; SW's onBackgroundMessage is the sole handler.
          data: { title, body, icon: '/pwa-192x192.png' },
          webpush: {
            headers: { Urgency: 'high' },
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
        const f          = document.fields;
        const token      = f?.fcmToken?.stringValue;
        const rawTitle   = f?.title?.stringValue || '';
        const schedTime  = f?.scheduledTime?.stringValue || '';
        const docPath    = document.name.split('/documents/')[1];
        const updateTime = document.updateTime;
        if (!token) continue;

        // Build notification — distinguish between warning reminders vs exact-time vs events vs habits
        // isWarnN matches any "En N minutos:" prefix (15, 30, 60, etc.)
        const warnMatch   = /^En (\d+) minutos:\s*/i.exec(rawTitle);
        const isEvent     = /^Es hora del evento:/i.test(rawTitle);
        const isHabitOne  = /^Hábito:\s*/i.test(rawTitle);
        const isHabitAll  = /^Hábitos pendientes/i.test(rawTitle);
        const isWarn      = !!warnMatch;
        const warnMinStr  = warnMatch ? warnMatch[1] : '15';

        // Strip known prefixes to get the clean task name
        const taskName  = rawTitle
          .replace(/^Es hora del evento:\s*/i, '')
          .replace(/^En \d+ minutos:\s*/i, '')
          .replace(/^Es hora:\s*/i, '')
          .replace(/^Hábito:\s*/i, '')
          .trim();

        // For exact-time notifications: schedTime IS the task time → show it
        // For warnings: schedTime is the REMINDER fire time (e.g. 1:00 PM),
        //   the actual task time is in the stored body ("Tu tarea comienza a las 1:30 p.m.")
        const taskTime12  = formatTo12h(schedTime);
        const storedBody  = f?.body?.stringValue || '';

        let notifTitle, notifBody;

        if (isHabitOne) {
          // Per-habit reminder at its custom time
          notifTitle = `Hábito pendiente`;
          notifBody  = `${taskName}\n${storedBody || 'No olvides completar tu hábito de hoy'}`;

        } else if (isHabitAll) {
          // Global daily 8PM reminder
          notifTitle = 'Hábitos pendientes';
          notifBody  = storedBody || rawTitle;

        } else if (isWarn) {
          // Human-readable offset: "5 min", "15 min", "1 hora", "2 horas"
          const mins   = parseInt(warnMinStr, 10);
          const warnLabel = mins >= 60
            ? (mins === 60 ? '1 hora' : `${Math.round(mins / 60)} horas`)
            : `${mins} min`;

          notifTitle = `En ${warnLabel}`;
          // storedBody already says "Tu tarea comienza a las HH:MM" with the real task time
          notifBody  = storedBody
            ? `${taskName}\n${storedBody}`
            : `${taskName}\nEn ${warnLabel}`;

        } else if (isEvent) {
          notifTitle = 'Evento ahora';
          notifBody  = `${taskName}\nComienza a las ${taskTime12}`;
        } else {
          // Exact task time
          notifTitle = '\u00a1Es hora!';
          notifBody  = `${taskName}\nInicia ahora | ${taskTime12}`;
        }

        try {
          // ── Optimistic lock: claim before sending to prevent race conditions ──
          const claimUrl = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${docPath}`
            + `?currentDocument.updateTime=${encodeURIComponent(updateTime)}`
            + `&updateMask.fieldPaths=sent&updateMask.fieldPaths=sentAt`;

          const claimResp = await fetch(claimUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
            body: JSON.stringify({
              fields: {
                sent:   { booleanValue: true },
                sentAt: { stringValue: new Date().toISOString() },
              },
            }),
          });

          if (!claimResp.ok) {
            // Another cron instance already claimed this doc—skip
            continue;
          }

          await sendFCM(tok, pid, { token, title: notifTitle, body: notifBody });
          sent++;
          console.log(`[Cron] ✅ ${taskName} | ${schedTime}`);

          // ── Write in-app notification to users/{uid}/notifications ──
          const uid = f?.uid?.stringValue;
          if (uid) {
            const notifId  = `cron_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
            const nowIso   = new Date().toISOString();
            // Friendly relative time (always "Ahora" since it was just triggered)
            const timeLabel = new Intl.DateTimeFormat('es-MX', {
              hour: '2-digit', minute: '2-digit', hour12: true,
              timeZone: 'America/Mexico_City',
            }).format(new Date());
            await fsPost(tok, pid, `users/${uid}/notifications`, {
              title:     { stringValue: notifTitle  },
              text:      { stringValue: notifBody   },
              type:      { stringValue: 'reminder'  },
              read:      { booleanValue: false       },
              time:      { stringValue: timeLabel    },
              createdAt: { stringValue: nowIso       },
            }).catch(e => console.warn('[Cron] in-app notif write failed:', e.message));
          }
        } catch (err) {
          errors.push(err.message);
          console.error(`[Cron] ❌ ${taskName}:`, err.message);
          if (err.message.includes('UNREGISTERED') || err.message.includes('NOT_FOUND')) {
            await fetch(
              `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${docPath}?updateMask.fieldPaths=sent&updateMask.fieldPaths=failed`,
              { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
                body: JSON.stringify({ fields: { sent: { booleanValue: true }, failed: { booleanValue: true } } }) }
            ).catch(() => {});
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
