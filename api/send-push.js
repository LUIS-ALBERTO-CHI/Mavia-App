// ============================================
// Vercel Serverless Function — Send FCM Push
// POST /api/send-push
// Body: { token, title, body, data? }
// ============================================

import admin from 'firebase-admin';

// Initialize Admin SDK once (singleton)
function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  );

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check — internal API key to prevent abuse
  const authHeader = req.headers['x-mavia-key'];
  if (authHeader !== process.env.MAVIA_INTERNAL_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token, title, body, data = {} } = req.body;

  if (!token || !title) {
    return res.status(400).json({ error: 'Missing token or title' });
  }

  try {
    getAdminApp();

    const message = {
      token,
      notification: { title, body: body || '' },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      webpush: {
        notification: {
          title,
          body: body || '',
          icon: '/pwa-192x192.png',
          badge: '/favicon.ico',
          requireInteraction: false,
        },
        fcmOptions: {
          link: '/',
        },
      },
    };

    const result = await admin.messaging().send(message);
    console.log('[Mavia] Push sent:', result);
    return res.status(200).json({ success: true, messageId: result });
  } catch (err) {
    console.error('[Mavia] Push error:', err);
    return res.status(500).json({ error: err.message });
  }
}
