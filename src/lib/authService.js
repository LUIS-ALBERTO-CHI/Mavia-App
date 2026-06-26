// ============================================
// FIREBASE AUTH SERVICE
// Mavia — Wellness & Productivity PWA
// ============================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/* -----------------------------------------------
   EMAIL / PASSWORD — REGISTER
   ----------------------------------------------- */
export async function registerWithEmail({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name on the Firebase user profile
  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential.user;
}

/* -----------------------------------------------
   EMAIL / PASSWORD — LOGIN
   ----------------------------------------------- */
export async function loginWithEmail({ email, password }) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (err) {
    // Log exact code so we can see it in DevTools
    console.error('[Firebase login error]', err.code, err.message);
    throw err;
  }
}

/* -----------------------------------------------
   GOOGLE SIGN-IN (popup)
   ----------------------------------------------- */
export async function loginWithGoogle() {
  const { getAdditionalUserInfo } = await import('firebase/auth');
  const credential = await signInWithPopup(auth, googleProvider);
  const isNewUser = getAdditionalUserInfo(credential)?.isNewUser ?? false;
  return { user: credential.user, isNewUser };
}

/* -----------------------------------------------
   SIGN OUT
   ----------------------------------------------- */
export async function logout() {
  await signOut(auth);
}

/* -----------------------------------------------
   FORGOT PASSWORD
   ----------------------------------------------- */
export async function forgotPassword(email) {
  const actionCodeSettings = {
    // URL a la que se redirige después de resetear la contraseña
    url: window.location.origin + '/?screen=login',
    handleCodeInApp: false,
  };
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
}

/* -----------------------------------------------
   AUTH STATE OBSERVER
   Returns unsubscribe function
   ----------------------------------------------- */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/* -----------------------------------------------
   PARSE FIREBASE ERROR → Spanish message
   ----------------------------------------------- */
export function parseFirebaseError(code) {
  const map = {
    'auth/email-already-in-use':      'Ya existe una cuenta con este correo.',
    'auth/invalid-email':             'El correo electrónico no es válido.',
    'auth/weak-password':             'La contraseña es muy débil (mínimo 6 caracteres).',
    'auth/user-not-found':            'No encontramos una cuenta con este correo.',
    'auth/wrong-password':            'Contraseña incorrecta. Inténtalo de nuevo.',
    // Firebase v9+ agrupa user-not-found + wrong-password en este código:
    'auth/invalid-credential':        'Correo o contraseña incorrectos.',
    'auth/INVALID_LOGIN_CREDENTIALS': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/user-disabled':             'Esta cuenta ha sido deshabilitada.',
    'auth/too-many-requests':         'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed':    'Error de red. Verifica tu conexión.',
    'auth/popup-closed-by-user':      'Cerraste la ventana de inicio de sesión.',
    'auth/cancelled-popup-request':   'Inicio de sesión cancelado.',
    'auth/popup-blocked':             'El popup fue bloqueado por el navegador. Permite popups para este sitio.',
    'auth/account-exists-with-different-credential':
                                      'Ya existe una cuenta con ese correo usando otro método.',
    'auth/operation-not-allowed':     'Este método de inicio de sesión no está habilitado.',
  };
  return map[code] || `Error: ${code || 'desconocido'}. Inténtalo de nuevo.`;
}
