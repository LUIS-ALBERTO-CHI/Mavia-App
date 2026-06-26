// ============================================
// FIREBASE MESSAGING SERVICE WORKER — Mavia
// Required by FCM for background push notifications
// ============================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDXc0fcSFElPR39MSkvBidGMuZpOrtBfIo",
  authDomain:        "mavia-779df.firebaseapp.com",
  projectId:         "mavia-779df",
  storageBucket:     "mavia-779df.firebasestorage.app",
  messagingSenderId: "987581633414",
  appId:             "1:987581633414:web:d4da0216fc07803bff1207",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[Mavia SW] Background message:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Mavia', {
    body:   body   || 'Tienes una nueva notificación',
    icon:   icon   || '/pwa-192x192.png',
    badge:  '/favicon.ico',
    data:   payload.data || {},
    actions: [
      { action: 'open',    title: 'Abrir app'  },
      { action: 'dismiss', title: 'Descartar'  },
    ],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app tab is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
