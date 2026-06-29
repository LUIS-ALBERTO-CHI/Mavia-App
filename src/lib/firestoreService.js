// ============================================
// FIRESTORE SERVICE — Mavia
// Per-user data layer using subcollections
// users/{uid}/tasks, habits, events, goals, ...
// ============================================

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, writeBatch, addDoc, query, limit,
  where, serverTimestamp, onSnapshot, arrayUnion,
} from 'firebase/firestore';

import { db } from './firebase';

// ─── helpers ───────────────────────────────────────────────────────────────

/** Reference to a user's root document */
const userRef  = (uid) => doc(db, 'users', uid);

/** Reference to a subcollection under a user */
const colRef   = (uid, col) => collection(db, 'users', uid, col);

/** Reference to a document inside a user subcollection */
const docRef   = (uid, col, id) => doc(db, 'users', uid, col, id);

// ─── Load all user data (one-time, used for profile) ──────────────────────

/**
 * Loads user profile and static collections once.
 * Real-time collections (tasks, habits, events, goals, notifications) 
 * are synced via subscribeToUserData.
 */
export async function loadUserData(uid) {
  const SUBCOLS = ['tasks', 'habits', 'events', 'goals',
                   'journalEntries', 'gratitudeEntries', 'notifications'];

  const [profileSnap, ...snapshots] = await Promise.all([
    getDoc(userRef(uid)),
    ...SUBCOLS.map(col => getDocs(colRef(uid, col))),
  ]);

  const profile  = profileSnap.exists() ? profileSnap.data() : {};
  const settings = profile.settings || {};
  const userData = { uid, ...profile };

  const result = { user: userData, settings };
  SUBCOLS.forEach((col, i) => {
    result[col] = snapshots[i].docs.map(d => ({ id: d.id, ...d.data() }));
  });

  return result;
}

// ─── Real-time listeners ───────────────────────────────────────────────────

/**
 * Subscribes to real-time Firestore updates for all user collections.
 * Calls onUpdate(collectionName, docs[]) whenever any collection changes.
 * Returns an unsubscribe function — call it on logout/unmount.
 *
 * @param {string} uid
 * @param {function} onUpdate  — (collectionName: string, docs: Array) => void
 * @returns {function} unsubscribe
 */
export function subscribeToUserData(uid, onUpdate) {
  const REALTIME_COLS = ['tasks', 'habits', 'events', 'goals', 'notifications'];

  const unsubs = REALTIME_COLS.map(col =>
    onSnapshot(
      colRef(uid, col),
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(col, docs);
      },
      (err) => console.warn(`[Mavia] onSnapshot error (${col}):`, err.message)
    )
  );

  // Return combined unsubscribe
  return () => unsubs.forEach(fn => fn());
}


// ─── Initial seed (new user) ───────────────────────────────────────────────

/**
 * Seeds Firestore with example data for a brand-new user.
 * Skips if user already has data (idempotent).
 */
export async function seedInitialData(uid, userProfile, seedData) {
  // Check if user already has data — if so, just update profile and stop
  const existingTasksSnap = await getDocs(query(colRef(uid, 'tasks'), limit(1)));
  const isNewUser = existingTasksSnap.empty;

  // Always upsert the profile document
  const profileData = {
    name:      userProfile.name      || '',
    firstName: userProfile.firstName || '',
    email:     userProfile.email     || '',
    photoURL:  userProfile.photoURL  || null,
    joinDate:  new Date().toISOString().split('T')[0],
    settings: { darkMode: false, language: 'es' },
  };
  await setDoc(userRef(uid), profileData, { merge: true });

  // Only seed collections for brand-new users
  if (!isNewUser) return;

  const SUBCOLS = ['tasks', 'habits', 'events', 'goals',
                   'journalEntries', 'gratitudeEntries',
                   'phrases', 'notifications', 'meditations'];

  const batch = writeBatch(db);
  SUBCOLS.forEach(col => {
    (seedData[col] || []).forEach(item => {
      const { id, ...data } = item;
      batch.set(docRef(uid, col, id || Date.now().toString()), data);
    });
  });
  await batch.commit();
}

/**
 * Deletes ALL user data in Firestore subcollections and re-seeds with fresh data.
 * Use this to reset a user's demo data.
 */
export async function resetUserData(uid, userProfile, seedData) {
  const SUBCOLS = ['tasks', 'habits', 'events', 'goals',
                   'journalEntries', 'gratitudeEntries',
                   'phrases', 'notifications', 'meditations'];

  // Delete all documents in all subcollections (batched, max 500 per batch)
  for (const col of SUBCOLS) {
    const snap = await getDocs(colRef(uid, col));
    if (snap.empty) continue;

    // Delete in chunks of 400 to stay under Firestore batch limit
    const chunks = [];
    snap.docs.forEach((d, i) => {
      const chunkIdx = Math.floor(i / 400);
      if (!chunks[chunkIdx]) chunks[chunkIdx] = [];
      chunks[chunkIdx].push(d.ref);
    });

    for (const chunk of chunks) {
      const b = writeBatch(db);
      chunk.forEach(ref => b.delete(ref));
      await b.commit();
    }
  }

  // Re-seed with fresh data (force — isNewUser check bypassed)
  const profileData = {
    name:      userProfile.name      || '',
    firstName: userProfile.firstName || '',
    email:     userProfile.email     || '',
    photoURL:  userProfile.photoURL  || null,
    joinDate:  userProfile.joinDate  || new Date().toISOString().split('T')[0],
    settings:  userProfile.settings  || { darkMode: false, language: 'es' },
  };
  await setDoc(userRef(uid), profileData, { merge: true });

  const batch = writeBatch(db);
  SUBCOLS.forEach(col => {
    (seedData[col] || []).forEach(item => {
      const { id, ...data } = item;
      batch.set(docRef(uid, col, id || `${col}_${Date.now()}`), data);
    });
  });
  await batch.commit();
}

// ─── Profile / Settings ────────────────────────────────────────────────────

export async function saveUserProfile(uid, updates) {
  await updateDoc(userRef(uid), updates);
}

export async function saveSettings(uid, settings) {
  await updateDoc(userRef(uid), { settings });
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export async function saveTask(uid, task) {
  const { id, ...data } = task;
  await setDoc(docRef(uid, 'tasks', id), data);
}

export async function deleteTask(uid, taskId) {
  await deleteDoc(docRef(uid, 'tasks', taskId));
}

// ─── Habits ────────────────────────────────────────────────────────────────

export async function saveHabit(uid, habit) {
  const { id, ...data } = habit;
  await setDoc(docRef(uid, 'habits', id), data);
}

export async function deleteHabit(uid, habitId) {
  await deleteDoc(docRef(uid, 'habits', habitId));
}

// ─── Events ────────────────────────────────────────────────────────────────

export async function saveEvent(uid, event) {
  const { id, ...data } = event;
  await setDoc(docRef(uid, 'events', id), data);
}

export async function deleteEvent(uid, eventId) {
  await deleteDoc(docRef(uid, 'events', eventId));
}

// ─── Goals ─────────────────────────────────────────────────────────────────

export async function saveGoal(uid, goal) {
  const { id, ...data } = goal;
  await setDoc(docRef(uid, 'goals', id), data);
}

export async function deleteGoal(uid, goalId) {
  await deleteDoc(docRef(uid, 'goals', goalId));
}

// ─── Journal ───────────────────────────────────────────────────────────────

export async function saveJournalEntry(uid, entry) {
  const { id, ...data } = entry;
  await setDoc(docRef(uid, 'journalEntries', id || entry.date), data);
}

// ─── FCM Token ─────────────────────────────────────────────────────────────

/**
 * Saves the FCM push token to the user profile using a device map.
 * Each device (browser instance) has a stable deviceId in localStorage.
 * This prevents token accumulation: one slot per device, auto-updates on token rotation.
 */
export async function saveFCMToken(uid, fcmToken, deviceId = 'default') {
  await setDoc(userRef(uid), {
    fcmTokensByDevice: { [deviceId]: fcmToken },
  }, { merge: true });
}

/**
 * Returns all unique FCM tokens (one per registered device).
 */
export async function getUserFCMTokens(uid) {
  try {
    const snap = await getDoc(userRef(uid));
    const data = snap.data() || {};
    // Prefer new map format (one slot per device, no stale tokens)
    const fromMap = data.fcmTokensByDevice ? Object.values(data.fcmTokensByDevice) : [];
    if (fromMap.length > 0) return fromMap.filter(Boolean);
    // Fall back to legacy array only during migration (map not yet written)
    const fromArr = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
    return fromArr.filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Scheduled Notifications ───────────────────────────────────────────────

/**
 * Creates a scheduled notification document using the Firestore REST API directly.
 * This bypasses the Firebase SDK's WebChannel (which can be blocked by CORS in some
 * browsers/networks) and uses plain HTTPS instead.
 *
 * @param {Object} opts
 * @param {string} opts.uid
 * @param {string} opts.fcmToken
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {string} opts.scheduledDate  — 'YYYY-MM-DD'
 * @param {string} opts.scheduledTime  — 'HH:MM'
 * @param {Object} opts.data           — extra payload (taskId etc.)
 * @returns {string} the created document ID
 */
export async function createScheduledNotification({ uid, fcmToken, title, body, scheduledDate, scheduledTime, data = {} }) {
  // Get Firebase Auth ID token for REST API auth
  const { getAuth } = await import('firebase/auth');
  const user = getAuth().currentUser;
  if (!user) throw new Error('No authenticated user');
  const idToken = await user.getIdToken();

  const PROJECT_ID = 'mavia-779df';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/scheduledNotifications`;

  // Encode data map fields
  const dataFields = {};
  for (const [k, v] of Object.entries(data || {})) {
    dataFields[k] = { stringValue: String(v) };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        uid:           { stringValue: uid },
        fcmToken:      { stringValue: fcmToken },
        title:         { stringValue: title },
        body:          { stringValue: body || '' },
        scheduledDate: { stringValue: scheduledDate },
        scheduledTime: { stringValue: scheduledTime },
        sent:          { booleanValue: false },
        data:          { mapValue: { fields: dataFields } },
      },
    }),
  });

  const doc = await response.json();
  if (!response.ok) throw new Error(doc.error?.message || 'Firestore REST error');

  // doc.name = 'projects/.../databases/.../documents/scheduledNotifications/{id}'
  return doc.name.split('/').pop();
}

/**
 * Deletes a scheduled notification by its Firestore document ID.
 * Called when a task is deleted or marked complete before the reminder fires.
 */
export async function deleteScheduledNotification(notifDocId) {
  if (!notifDocId) return;
  try {
    await deleteDoc(doc(db, 'scheduledNotifications', notifDocId));
  } catch (e) {
    console.warn('[Mavia] Could not delete scheduled notification:', e);
  }
}


// ─── Gratitude ─────────────────────────────────────────────────────────────

export async function saveGratitudeEntry(uid, entry) {
  const { id, ...data } = entry;
  await setDoc(docRef(uid, 'gratitudeEntries', id || entry.date), data);
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function markNotificationRead(uid, notifId) {
  await updateDoc(docRef(uid, 'notifications', notifId), { read: true });
}

export async function markAllNotificationsRead(uid, notifIds) {
  const batch = writeBatch(db);
  notifIds.forEach(id => {
    batch.update(docRef(uid, 'notifications', id), { read: true });
  });
  await batch.commit();
}
