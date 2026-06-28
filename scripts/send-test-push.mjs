#!/usr/bin/env node
// ============================================
// send-test-push.mjs — Mavia
// Envía un push FCM INMEDIATO a un token específico
// Uso: node scripts/send-test-push.mjs <FCM_TOKEN>
//   o: node scripts/send-test-push.mjs  (lee MAVIA_TEST_TOKEN del .env)
// ============================================

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Cargar .env manualmente ─────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const lines   = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env, OK */ }
}
loadEnv();

// ─── Args ────────────────────────────────────────────────────────────────────
const FCM_TOKEN = process.argv[2] || process.env.MAVIA_TEST_TOKEN;
const SA_RAW    = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!FCM_TOKEN) {
  console.error('❌  Falta el FCM token.');
  console.error('    Uso 1: node scripts/send-test-push.mjs <TOKEN>');
  console.error('    Uso 2: agrega MAVIA_TEST_TOKEN=<TOKEN> en tu .env');
  process.exit(1);
}

if (!SA_RAW) {
  console.error('❌  Falta FIREBASE_SERVICE_ACCOUNT en .env');
  console.error('    Descarga el JSON de: Firebase Console → ⚙️ → Cuentas de servicio → Generar nueva clave privada');
  console.error('    Luego en .env agrega: FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account",...}\'');
  process.exit(1);
}

const sa = JSON.parse(SA_RAW);

// ─── JWT + Access Token ───────────────────────────────────────────────────────
async function getAccessToken() {
  const { webcrypto } = await import('node:crypto');
  const now = Math.floor(Date.now() / 1000);

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  const b64     = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const toSign  = `${b64(header)}.${b64(payload)}`;
  const pemBody = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const key = await webcrypto.subtle.importKey(
    'pkcs8', Buffer.from(pemBody, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );

  const sig = await webcrypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign)
  );

  const jwt = `${toSign}.${Buffer.from(sig).toString('base64url')}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

// ─── Send FCM ─────────────────────────────────────────────────────────────────
async function sendPush(accessToken, token) {
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const res  = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title: '🧪 Test Mavia — Push Real',
          body:  'FCM funcionando correctamente ✓  ' + new Date().toLocaleTimeString('es-MX'),
        },
        webpush: {
          notification: {
            title:   '🧪 Test Mavia — Push Real',
            body:    'FCM funcionando correctamente ✓  ' + new Date().toLocaleTimeString('es-MX'),
            icon:    '/pwa-192x192.png',
            badge:   '/favicon.ico',
            vibrate: [200, 100, 200],
            requireInteraction: false,
          },
          fcm_options: { link: 'http://localhost:4321/' },
        },
      },
    }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(result?.error || result));
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Mavia — Test Push Inmediato');
  console.log(`   Token: ${FCM_TOKEN.slice(0, 25)}...`);
  console.log(`   Proyecto: ${sa.project_id}`);
  console.log('');

  console.log('🔑 Obteniendo access token...');
  const accessToken = await getAccessToken();
  console.log('✅ Access token OK');

  console.log('📲 Enviando push...');
  const result = await sendPush(accessToken, FCM_TOKEN);
  console.log('');
  console.log('✅ ¡Push enviado exitosamente!');
  console.log(`   Message ID: ${result.name}`);
  console.log('');
  console.log('📱 Deberías recibir la notificación en tu dispositivo/navegador ahora.');
}

main().catch(err => {
  console.error('');
  console.error('❌ Error:', err.message);
  process.exit(1);
});
