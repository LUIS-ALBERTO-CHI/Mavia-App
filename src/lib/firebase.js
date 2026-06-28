// ============================================
// FIREBASE CONFIGURATION — Mavia
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            "AIzaSyDXc0fcSFElPR39MSkvBidGMuZpOrtBfIo",
  authDomain:        "mavia-779df.firebaseapp.com",
  projectId:         "mavia-779df",
  storageBucket:     "mavia-779df.firebasestorage.app",
  messagingSenderId: "987581633414",
  appId:             "1:987581633414:web:d4da0216fc07803bff1207",
  measurementId:     "G-M6XNPY5VGS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth instance
export const auth = getAuth(app);
auth.languageCode = 'es';

// Firestore instance with offline persistence
// This allows the app to serve cached data when the network is unavailable
// and automatically sync when the connection is restored.
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence only works in one tab at a time
    console.warn('[Mavia] Firestore offline persistence: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support IndexedDB
    console.warn('[Mavia] Firestore offline persistence not supported in this browser');
  }
});

// Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firebase Cloud Messaging (only in browser, not SSR)
export let messaging = null;
export async function getMessagingInstance() {
  if (messaging) return messaging;
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  } catch (e) {
    console.warn('[Mavia] FCM not supported:', e);
  }
  return messaging;
}

export default app;
