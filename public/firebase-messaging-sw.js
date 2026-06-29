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
// Fires when the app is NOT in the foreground (closed or minimized)
messaging.onBackgroundMessage((payload) => {
  console.log('[Mavia SW] Background message received:', payload);

  const notification = payload.notification || {};
  const title = notification.title || 'Mavia';
  const body  = notification.body  || 'Tienes un recordatorio';
  const icon  = notification.icon  || '/pwa-192x192.png';

  // Keep options minimal for maximum iOS compatibility
  // iOS does NOT support: actions, requireInteraction, vibrate
  return self.registration.showNotification(title, {
    body,
    icon,
    badge: '/pwa-192x192.png',
    tag:   payload.data?.taskId || payload.data?.eventId || 'mavia-reminder',
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
