// ============================================
// FIREBASE MESSAGING SERVICE WORKER — Mavia
// Required by FCM for background push notifications
// Compatible con iOS 16.4+ PWA instalada en Home Screen
// ============================================

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDXc0fcSFElPR39MSkvBidGMuZpOrtBfIo",
  authDomain:        "mavia-779df.firebaseapp.com",
  projectId:         "mavia-779df",
  storageBucket:     "mavia-779df.firebasestorage.app",
  messagingSenderId: "987581633414",
  appId:             "1:987581633414:web:d4da0216fc07803bff1207",
});

const messaging = firebase.messaging();

// ─── Background push handler ────────────────────────────────────────────────
// The cron sends DATA-ONLY FCM messages (no 'notification' field) so the
// browser does NOT auto-display a notification. This is the ONLY handler
// that shows the notification, preventing the duplicate-notification bug.
messaging.onBackgroundMessage((payload) => {
  console.log('[Mavia SW] Background message received:', payload);

  // Read from data field (data-only FCM message).
  // Fall back to notification field for compatibility.
  const title = payload.data?.title || payload.notification?.title || 'Mavia';
  const body  = payload.data?.body  || payload.notification?.body  || 'Tienes un recordatorio';
  const icon  = payload.data?.icon  || '/pwa-192x192.png';

  // Use fixed tag so iOS replaces a pending notification instead of stacking
  return self.registration.showNotification(title, {
    body,
    icon,
    badge: '/pwa-192x192.png',
    tag:   'mavia-reminder',
    data:  payload.data || {},
  });
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
