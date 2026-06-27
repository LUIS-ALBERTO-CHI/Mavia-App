// ============================================
// Vercel Serverless Function — Send FCM Push
// Uses Google OAuth2 + FCM HTTP v1 REST API
// No firebase-admin needed → tiny bundle size
// ============================================

// Generate a JWT for Google OAuth2 service account auth
async function getAccessToken(serviceAccount) {
  const now  = Math.floor(Date.now() / 1000);
  const exp  = now + 3600;

  // Build JWT header + payload
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const toSign = `${b64(header)}.${b64(payload)}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const keyData = Buffer.from(pemContents, 'base64');
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(toSign)
  );

  const jwt = `${toSign}.${Buffer.from(signature).toString('base64url')}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
  return tokenData.access_token;
}

// Send FCM push via HTTP v1 API
async function sendFCMPush({ projectId, accessToken, token, title, body, data = {} }) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message = {
    message: {
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
        },
        fcm_options: { link: '/' },
      },
    },
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(result));
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['x-mavia-key'];
  if (authHeader !== process.env.MAVIA_INTERNAL_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token, title, body, data = {} } = req.body;
  if (!token || !title) return res.status(400).json({ error: 'Missing token or title' });

  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    const accessToken = await getAccessToken(sa);
    const result = await sendFCMPush({ projectId: sa.project_id, accessToken, token, title, body, data });
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('[Mavia] Push error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
