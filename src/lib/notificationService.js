// ============================================
// NOTIFICATION SERVICE — Mavia
// Phase 1: Web Notification API (local fallback)
// Phase 2: FCM real push (browser open OR closed)
// ============================================
import { getMessagingInstance } from './firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken, createScheduledNotification, deleteScheduledNotification, getUserFCMTokens } from './firestoreService';

import { localToday, localDateStr } from './utils';

// VAPID key from Vercel env — set PUBLIC_FIREBASE_VAPID_KEY in your Vercel project settings
const VAPID_KEY = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY || '';

// Map of active local timers: taskId → [timeoutId, ...]
const _timers = new Map();
// Map of taskId → scheduledNotification Firestore doc ID
const _schedNotifIds = new Map();

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
      await saveFCMToken(uid, token);
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

// ─── Schedule reminders for a task ─────────────────────────────────────────

/**
 * Schedules 1 or 2 notifications for a task.
 * - If FCM token is available: creates Firestore documents (works even when browser is closed)
 * - Fallback: setTimeout local notifications (only while browser is open)
 *
 * @param {Object} task      — must have { id, title, date, time, reminder }
 * @param {string} uid       — user ID (needed for Firestore scheduling)
 * @param {string} fcmToken  — FCM push token (optional; enables background push)
 */
export async function scheduleTaskReminder(task, uid, fcmToken) {
  if (!task?.reminder || !task?.date || !task?.time) return;
  cancelReminder(task.id);

  const now    = Date.now();
  const time24 = parseTimeTo24h(task.time); // handle both "05:15 PM" and "17:15"
  if (!time24) { console.warn('[Mavia] Invalid task time:', task.time); return; }

  const [h, m] = time24.split(':').map(Number);
  const taskDt = new Date(`${task.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const taskMs = taskDt.getTime();

  // ── FCM Firestore scheduling (background push — works even when browser closed) ──
  if (uid && taskMs > now) {
    try {
      // Fetch ALL device tokens for this user (phone + PC + tablet)
      const allTokens = await getUserFCMTokens(uid);
      // Also include the token from the current session (may not be in Firestore yet)
      if (fcmToken && !allTokens.includes(fcmToken)) allTokens.push(fcmToken);

      for (const tok of allTokens) {
        // 15-minute warning
        if (taskMs - 15 * 60 * 1000 > now) {
          const warn15Dt   = new Date(taskMs - 15 * 60 * 1000);
          const warn15Date = localDateStr(warn15Dt);
          const warn15Time = `${String(warn15Dt.getHours()).padStart(2,'0')}:${String(warn15Dt.getMinutes()).padStart(2,'0')}`;
          await createScheduledNotification({
            uid, fcmToken: tok,
            title: `En 15 minutos: ${task.title}`,
            body:  `Tu tarea comienza a las ${task.time}`,
            scheduledDate: warn15Date,
            scheduledTime: warn15Time,
            data: { taskId: task.id, type: 'task-warn' },
          });
        }

        // At exact task time
        const notifId = await createScheduledNotification({
          uid, fcmToken: tok,
          title: `Es hora: ${task.title}`,
          body:  task.description || `Tu tarea comienza ahora`,
          scheduledDate: task.date,
          scheduledTime: time24,
          data: { taskId: task.id, type: 'task-now' },
        });
        _schedNotifIds.set(`${task.id}_${tok}`, notifId);
      }

      console.log(`[Mavia] FCM push scheduled for "${task.title}" at ${task.time} → ${allTokens.length} dispositivo(s)`);
    } catch (err) {
      console.warn('[Mavia] Firestore scheduling failed, falling back to local only:', err.message);
    }
  }

  // ── Local setTimeout — ALWAYS runs as backup (fires immediately when browser is open) ──
  // This is the primary mechanism for on-device reminders and testing.
  const ids = [];

  const warn15 = taskMs - 15 * 60 * 1000;
  if (warn15 > now) {
    ids.push(setTimeout(() => {
      showNotification(
        `En 15 minutos: ${task.title}`,
        `Tu tarea comienza a las ${task.time}`,
        { tag: `task-warn-${task.id}` }
      );
    }, warn15 - now));
  }

  if (taskMs > now) {
    ids.push(setTimeout(() => {
      showNotification(
        `Es hora: ${task.title}`,
        task.description || `Tu tarea comienza ahora`,
        { tag: `task-now-${task.id}` }
      );
    }, taskMs - now));
  }

  if (ids.length > 0) {
    _timers.set(task.id, ids);
    console.log(`[Mavia] Local reminder scheduled for "${task.title}" at ${task.time}`);
  }
}

/**
 * Cancels all pending reminders for a task.
 * Clears local timers AND deletes the Firestore scheduledNotification document.
 */
export function cancelReminder(taskId) {
  // Clear local timers
  const ids = _timers.get(taskId);
  if (ids) {
    ids.forEach(id => clearTimeout(id));
    _timers.delete(taskId);
  }
  // Delete Firestore scheduled notification (non-blocking)
  const notifDocId = _schedNotifIds.get(taskId);
  if (notifDocId) {
    deleteScheduledNotification(notifDocId).catch(() => {});
    _schedNotifIds.delete(taskId);
  }
}

/**
 * Re-schedules all pending reminders for a list of tasks.
 * Pass uid + fcmToken to also register them in Firestore (enables background push).
 * @param {Array}  tasks
 * @param {string} uid       — Firebase user ID (optional, enables FCM Firestore scheduling)
 * @param {string} fcmToken  — FCM push token  (optional, enables FCM Firestore scheduling)
 */
export function rescheduleAllReminders(tasks = [], uid = null, fcmToken = null) {
  // Clear existing local timers
  _timers.forEach((ids) => ids.forEach(id => clearTimeout(id)));
  _timers.clear();

  const today = localToday();
  tasks.forEach(task => {
    // Only schedule for today and incomplete tasks with reminders
    if (task.reminder && !task.completed && task.date === today) {
      scheduleTaskReminder(task, uid, fcmToken);
    }
  });
}

// ─── Habit reminders ────────────────────────────────────────────────────────

const _habitTimer = { id: null };

/**
 * Schedules a daily habit reminder at 8pm if habits are not completed.
 * @param {Array} habits
 */
export function scheduleHabitReminder(habits = []) {
  if (_habitTimer.id) {
    clearTimeout(_habitTimer.id);
    _habitTimer.id = null;
  }

  const incomplete = habits.filter(h => !h.completedToday);
  if (incomplete.length === 0) return; // All done!

  const now   = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0); // 8:00 PM

  // If already past 8pm, skip for today
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
 * @param {Array} events
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
