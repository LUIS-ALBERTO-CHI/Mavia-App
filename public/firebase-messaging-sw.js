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
// Navigation: Network-first → fallback to /index.html (app shell)
// Images/fonts: Cache-first (they're content-hashed by Vite, safe to cache)
// JS/CSS bundles: NEVER cache in SW — Vite already content-hashes them
//   so the browser's HTTP cache handles them correctly without SW interference.
const CACHE_NAME    = 'mavia-shell-v3';   // bump version to purge old caches
const SHELL_ASSETS  = ['/', '/index.html', '/pwa-192x192.png', '/pwa-512x512.png', '/manifest.webmanifest'];

// On install: pre-cache only the app shell HTML/icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// On activate: delete ALL old caches so stale JS never lingers
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[Mavia SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation (HTML): network-first, fallback to cached index.html for SPA routing
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(cached => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // JS and CSS: SKIP — Vite content-hashes these, let browser HTTP cache handle them.
  // Caching them in SW causes stale-app bugs after deploys.
  if (request.destination === 'script' || request.destination === 'style') {
    return; // fall through to default browser fetch
  }

  // Images and fonts: cache-first (safe — content-addressed or rarely change)
  if (request.destination === 'font' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});

