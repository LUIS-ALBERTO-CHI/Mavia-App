// ============================================
// FIREBASE CONFIGURATION — Mavia
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Firestore instance
export const db = getFirestore(app);

// Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
