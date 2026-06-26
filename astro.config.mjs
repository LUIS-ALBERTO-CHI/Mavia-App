// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), AstroPWA({
    mode: 'development',
    base: '/',
    scope: '/',
    includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    registerType: 'autoUpdate',
    manifest: {
      name: 'Mavia',
      short_name: 'Mavia',
      description: 'Mavia - Tu aplicación PWA moderna',
      theme_color: '#0f0f1a',
      background_color: '#0f0f1a',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globDirectory: 'dist',
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
      navigateFallback: 'index.html',
    },
  }), tailwind()],
});