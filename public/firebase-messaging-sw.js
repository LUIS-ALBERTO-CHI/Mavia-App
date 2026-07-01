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

// ─── #10 Offline cache strategy ──────────────────────────────────────────────
// Cache-first for static assets; Network-first for navigation (app shell)
const CACHE_NAME    = 'mavia-shell-v1';
const SHELL_ASSETS  = ['/', '/index.html', '/pwa-192x192.png', '/pwa-512x512.png', '/manifest.webmanifest'];

// On install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// On activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML pages): network-first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(cached => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (request.destination === 'script' || request.destination === 'style'
    || request.destination === 'font' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});
