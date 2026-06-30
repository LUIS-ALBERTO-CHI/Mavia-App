// ============================================
// NOTIFICATION SERVICE — Mavia
// Phase 1: Web Notification API (local fallback)
// Phase 2: FCM real push (browser open OR closed)
// ============================================
import { getMessagingInstance } from './firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken, getUserFCMTokens } from './firestoreService';

import { localToday, localDateStr } from './utils';

// VAPID key from Vercel env — set PUBLIC_FIREBASE_VAPID_KEY in your Vercel project settings
const VAPID_KEY = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY || '';

// Map of active local timers: taskId → [timeoutId, ...]
const _timers = new Map();

// ─── Permission + FCM Token ─────────────────────────────────────────────────

/**
 * Requests browser notification permission.
 * Returns 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';

  const result = await Notification.requestPermission();
  return result;
}

/**
 * Initializes FCM: requests permission + gets push token.
 * Returns the FCM token string, or null if unavailable.
 * Call after login and save the token to Firestore.
 */
export async function initFCM(uid) {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return null;
    if (!VAPID_KEY) {
      console.warn('[Mavia] VAPID key not set — FCM push tokens unavailable. Set PUBLIC_FIREBASE_VAPID_KEY in Vercel.');
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    });

    if (token && uid) {
      const deviceId = getOrCreateDeviceId();
      await saveFCMToken(uid, token, deviceId);
      // Cache in localStorage so it's available immediately on next session
      try { localStorage.setItem('mavia_fcm_token', token); } catch {}
      console.log('[Mavia] FCM token saved:', token.slice(0, 20) + '...');
    }

    return token;
  } catch (err) {
    console.warn('[Mavia] FCM init error:', err.message);
    return null;
  }
}

/** Stable device ID — one per browser instance, survives page reloads */
export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem('mavia_device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      localStorage.setItem('mavia_device_id', id);
    }
    return id;
  } catch { return 'default'; }
}

/** Returns the best available FCM token: state → localStorage → null */
export function getCachedFCMToken() {
  try { return localStorage.getItem('mavia_fcm_token') || null; } catch { return null; }
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ─── Time utilities ─────────────────────────────────────────────────────────

/**
 * Converts any time string to 24-hour "HH:MM" format.
 * Handles: "05:15 PM", "05:15 AM", "17:15", "05:15"
 */
export function parseTimeTo24h(timeStr) {
  if (!timeStr) return null;
  const upper = timeStr.toUpperCase().trim();
  const isPM  = upper.includes('PM');
  const isAM  = upper.includes('AM');
  const clean = upper.replace(/[AP]M/g, '').trim();
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h)) return null;

  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;

  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ─── Show notification ──────────────────────────────────────────────────────

/**
 * Shows a browser notification immediately.
 */
export function showNotification(title, body, { icon = '/pwa-192x192.png', tag, data } = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const n = new Notification(title, {
    body,
    icon,
    badge: '/favicon.ico',
    tag,
    data,
    silent: false,
  });

  // Auto-close after 8 seconds
  setTimeout(() => n.close(), 8000);

  // Click handler → focus the app tab
  n.onclick = () => {
    window.focus();
    n.close();
  };

  return n;
}

// ─── Firestore scheduled notifications (idempotent using taskId as doc key) ─

/**
 * Upserts a scheduled notification in Firestore using a deterministic doc ID.
 * Using setDoc (not addDoc) ensures no duplicates even if called multiple times.
 *
 * Doc ID pattern: `{taskId}_{type}_{fcmToken_hash}` — stable per task+type+device.
 */
async function upsertScheduledNotification({ uid, fcmToken, title, body, scheduledDate, scheduledTime, taskId, type, data = {} }) {
  const { getAuth } = await import('firebase/auth');
  const user = getAuth().currentUser;
  if (!user) return null;
  const idToken = await user.getIdToken();

  const PROJECT_ID = 'mavia-779df';

  // Stable doc ID — same task+type+device → same doc (prevents duplicates on reschedule)
  const tokenHash = fcmToken ? fcmToken.slice(-12) : 'local';
  const docId = `${taskId}_${type}_${tokenHash}`;

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/scheduledNotifications/${docId}`;

  const dataFields = {};
  for (const [k, v] of Object.entries(data || {})) {
    dataFields[k] = { stringValue: String(v) };
  }

  const response = await fetch(url, {
    method: 'PATCH',   // PUT/PATCH with full doc path = upsert (idempotent)
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        uid:           { stringValue: uid },
        fcmToken:      { stringValue: fcmToken || '' },
        title:         { stringValue: title },
        body:          { stringValue: body || '' },
        scheduledDate: { stringValue: scheduledDate },
        scheduledTime: { stringValue: scheduledTime },
        sent:          { booleanValue: false },
        taskId:        { stringValue: taskId || '' },
        notifType:     { stringValue: type || '' },
        data:          { mapValue: { fields: dataFields } },
      },
    }),
  });

  if (!response.ok) {
    const d = await response.json().catch(() => ({}));
    throw new Error(d.error?.message || 'Firestore scheduled notif error');
  }

  return docId;
}

/**
 * Deletes all scheduled notification docs for a given taskId across all devices.
 * Uses deterministic doc IDs so we can delete by pattern without a query.
 */
async function deleteScheduledNotificationsForTask(taskId, uid, fcmToken) {
  try {
    const { getAuth } = await import('firebase/auth');
    const user = getAuth().currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const PROJECT_ID = 'mavia-779df';

    // We don't know all device suffixes, so query by taskId field
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'scheduledNotifications' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              { fieldFilter: { field: { fieldPath: 'taskId' }, op: 'EQUAL', value: { stringValue: taskId } } },
              { fieldFilter: { field: { fieldPath: 'uid'    }, op: 'EQUAL', value: { stringValue: uid    } } },
              { fieldFilter: { field: { fieldPath: 'sent'   }, op: 'EQUAL', value: { booleanValue: false } } },
            ],
          },
        },
      },
    };

    const r = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(queryBody),
    });

    const rows = await r.json().catch(() => []);
    const docs = Array.isArray(rows) ? rows.filter(r => r.document) : [];

    await Promise.all(docs.map(({ document }) => {
      const docPath = document.name.split('/documents/')[1];
      return fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } }
      ).catch(() => {});
    }));

    if (docs.length > 0) {
      console.log(`[Mavia] Deleted ${docs.length} scheduled notification(s) for task ${taskId}`);
    }
  } catch (err) {
    console.warn('[Mavia] Could not delete scheduled notifications:', err.message);
  }
}

// ─── Schedule reminders for a task ─────────────────────────────────────────

/**
 * Schedules 1 or 2 notifications for a task.
 * Uses UPSERT (setDoc with deterministic ID) to prevent Firestore duplicates.
 * Falls back to local setTimeout when browser is open.
 *
 * @param {Object} task      — must have { id, title, date, time, reminder }
 * @param {string} uid       — user ID (needed for Firestore scheduling)
 * @param {string} fcmToken  — FCM push token (optional; enables background push)
 */
export async function scheduleTaskReminder(task, uid, fcmToken) {
  if (!task?.reminder || !task?.date || !task?.time) return;

  // Cancel existing local timers first
  const existingTimers = _timers.get(task.id);
  if (existingTimers) {
    existingTimers.forEach(id => clearTimeout(id));
    _timers.delete(task.id);
  }

  const now    = Date.now();
  const time24 = parseTimeTo24h(task.time);
  if (!time24) { console.warn('[Mavia] Invalid task time:', task.time); return; }

  const [h, m] = time24.split(':').map(Number);
  const taskDt = new Date(`${task.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const taskMs = taskDt.getTime();

  // ── FCM Firestore scheduling (background push — IDEMPOTENT via upsert) ──
  if (uid && taskMs > now) {
    try {
      const allTokens = await getUserFCMTokens(uid);
      if (fcmToken && !allTokens.includes(fcmToken)) allTokens.push(fcmToken);

      for (const tok of allTokens) {
        const offsetMin = task.reminderOffset || 15;

        // Warning notification (before task time)
        if (taskMs - offsetMin * 60 * 1000 > now) {
          const warnDt   = new Date(taskMs - offsetMin * 60 * 1000);
          const warnDate = localDateStr(warnDt);
          const warnTime = `${String(warnDt.getHours()).padStart(2,'0')}:${String(warnDt.getMinutes()).padStart(2,'0')}`;
          await upsertScheduledNotification({
            uid, fcmToken: tok,
            title: `En ${offsetMin} minutos: ${task.title}`,
            body:  `Tu tarea comienza a las ${task.time}`,
            scheduledDate: warnDate,
            scheduledTime: warnTime,
            taskId: task.id,
            type: 'warn',
            data: { taskId: task.id, type: 'task-warn' },
          });
        }

        // Exact-time notification
        await upsertScheduledNotification({
          uid, fcmToken: tok,
          title: `Es hora: ${task.title}`,
          body:  task.description || `Tu tarea comienza ahora`,
          scheduledDate: task.date,
          scheduledTime: time24,
          taskId: task.id,
          type: 'now',
          data: { taskId: task.id, type: 'task-now' },
        });
      }

      console.log(`[Mavia] FCM push scheduled (upsert) for "${task.title}" at ${task.time} → ${allTokens.length} device(s)`);
    } catch (err) {
      console.warn('[Mavia] Firestore scheduling failed, falling back to local only:', err.message);
    }
  }

  // ── Local setTimeout — fires while browser is open ──
  const ids = [];
  const offsetMin = task.reminderOffset || 15;
  const warnMs    = taskMs - offsetMin * 60 * 1000;

  if (warnMs > now) {
    ids.push(setTimeout(() => {
      showNotification(
        'Recordatorio',
        `En ${offsetMin} min: ${task.title}\nComienza a las ${task.time}`,
        { tag: `task-warn-${task.id}` }   // tag deduplicates browser notifs
      );
    }, warnMs - now));
  }

  if (taskMs > now) {
    ids.push(setTimeout(() => {
      showNotification(
        '¡Es hora!',
        `${task.title}\nInicia ahora | ${task.time}`,
        { tag: `task-now-${task.id}` }   // tag deduplicates browser notifs
      );
    }, taskMs - now));
  }

  if (ids.length > 0) {
    _timers.set(task.id, ids);
  }
}

/**
 * Cancels all pending reminders for a task.
 * Clears local timers AND deletes Firestore scheduled notification documents.
 */
export function cancelReminder(taskId, uid) {
  // Clear local timers
  const ids = _timers.get(taskId);
  if (ids) {
    ids.forEach(id => clearTimeout(id));
    _timers.delete(taskId);
  }
  // Delete Firestore scheduled notifications by taskId (non-blocking)
  if (uid && taskId) {
    deleteScheduledNotificationsForTask(taskId, uid, null).catch(() => {});
  }
}

/**
 * Re-schedules all pending LOCAL reminders for a list of tasks.
 * Does NOT create new Firestore docs (those are managed by scheduleTaskReminder).
 */
export function rescheduleAllReminders(tasks = [], uid = null, fcmToken = null) {
  // Clear existing local timers
  _timers.forEach((ids) => ids.forEach(id => clearTimeout(id)));
  _timers.clear();

  const today = localToday();
  tasks.forEach(task => {
    if (task.reminder && !task.completed && task.date === today) {
      // Only local timers on reschedule — Firestore docs already exist from task creation
      scheduleTaskReminder(task, null, null);
    }
  });
}

// ─── Habit reminders ────────────────────────────────────────────────────────

const _habitTimer = { id: null };

/**
 * Schedules a daily habit reminder at 8pm if habits are not completed.
 */
export function scheduleHabitReminder(habits = []) {
  if (_habitTimer.id) {
    clearTimeout(_habitTimer.id);
    _habitTimer.id = null;
  }

  const incomplete = habits.filter(h => !h.completedToday);
  if (incomplete.length === 0) return;

  const now    = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0); // 8:00 PM

  if (target <= now) return;

  const delay = target.getTime() - now.getTime();
  _habitTimer.id = setTimeout(() => {
    const names = incomplete.slice(0, 3).map(h => h.name).join(', ');
    showNotification(
      'Hábitos pendientes',
      `Tienes pendiente: ${names}${incomplete.length > 3 ? ' y más' : ''}`,
      { tag: 'habit-reminder' }
    );
  }, delay);
}

// ─── Event reminders ────────────────────────────────────────────────────────

/**
 * Schedules a 30-minute warning for today's events.
 */
export function scheduleEventReminders(events = []) {
  const today = localToday();
  const now   = Date.now();

  events
    .filter(ev => ev.date === today && ev.startTime)
    .forEach(ev => {
      const [h, m] = ev.startTime.split(':').map(Number);
      const evDt   = new Date(`${today}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
      const warn30 = evDt.getTime() - 30 * 60 * 1000;

      if (warn30 > now) {
        setTimeout(() => {
          showNotification(
            `En 30 minutos: ${ev.title}`,
            `Tu evento comienza a las ${ev.startTime}`,
            { tag: `event-${ev.id}`, data: { eventId: ev.id } }
          );
        }, warn30 - now);
      }
    });
}
