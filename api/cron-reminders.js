// ============================================
// Vercel Cron Job — Send Scheduled Notifications
// GET /api/cron-reminders  (called by Vercel Cron every minute)
// ============================================

import admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(raw)),
  });
}

export default async function handler(req, res) {
  // Vercel Cron sends a GET with the Authorization header
  // Validate it to prevent abuse
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    getAdminApp();
    const db = admin.firestore();

    // Get current time in Mexico City timezone (UTC-6)
    // Using Intl.DateTimeFormat for accurate local time
    const now = new Date();
    const mexTime = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now);

    const getPart = (type) => mexTime.find(p => p.type === type)?.value || '00';
    const todayStr   = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    const currentMin = `${getPart('hour')}:${getPart('minute')}`;

    console.log(`[Mavia Cron] Checking for notifications at ${todayStr} ${currentMin} (Mexico City)`);

    // Query scheduledNotifications collection for due, unsent notifications
    const snap = await db.collection('scheduledNotifications')
      .where('sent', '==', false)
      .where('scheduledDate', '==', todayStr)
      .where('scheduledTime', '==', currentMin)
      .get();

    if (snap.empty) {
      return res.status(200).json({ sent: 0, message: 'No notifications due' });
    }

    const batch = db.batch();
    const sends = [];

    for (const doc of snap.docs) {
      const notif = doc.data();
      if (!notif.fcmToken) continue;

      // Send FCM push via Admin SDK
      const message = {
        token: notif.fcmToken,
        notification: {
          title: notif.title || 'Mavia',
          body:  notif.body  || '',
        },
        webpush: {
          notification: {
            title:   notif.title || 'Mavia',
            body:    notif.body  || '',
            icon:    '/pwa-192x192.png',
            badge:   '/favicon.ico',
            requireInteraction: false,
          },
          fcmOptions: { link: '/' },
        },
        data: notif.data || {},
      };

      sends.push(
        admin.messaging().send(message)
          .then((id) => {
            console.log(`[Mavia Cron] Sent to ${notif.uid}: ${id}`);
            // Mark as sent
            batch.update(doc.ref, { sent: true, sentAt: admin.firestore.FieldValue.serverTimestamp() });
          })
          .catch((err) => {
            console.error(`[Mavia Cron] Failed for ${notif.uid}:`, err.message);
            // If token is invalid, mark as failed so we don't retry forever
            if (err.code === 'messaging/registration-token-not-registered') {
              batch.update(doc.ref, { sent: true, failed: true, error: err.message });
            }
          })
      );
    }

    await Promise.allSettled(sends);
    await batch.commit();

    return res.status(200).json({ sent: sends.length });
  } catch (err) {
    console.error('[Mavia Cron] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
