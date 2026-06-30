// ============================================
// NOTIFICATION SERVICE — Mavia
// Phase 1: Web Notification API (local fallback)
// Phase 2: FCM real push (browser open OR closed)
// ============================================
import { getMessagingInstance } from './firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken, getUserFCMTokens } from './firestoreService';

import { localToday, localDateStr, formatTime12h } from './utils';

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
            body:  `Tu tarea comienza a las ${formatTime12h(time24)}`,
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

  // ── Local setTimeout — ONLY used as fallback when FCM is unavailable ──
  // If FCM push is active (token present + uid + future task), the Vercel cron
  // handles delivery. Local timers would create duplicates.
  const hasFCM = !!(uid && fcmToken && taskMs > now);
  if (!hasFCM) {
    const ids = [];
    const offsetMin = task.reminderOffset || 15;
    const warnMs    = taskMs - offsetMin * 60 * 1000;

    if (warnMs > now) {
      ids.push(setTimeout(() => {
        showNotification(
          `En ${offsetMin >= 60 ? '1 hora' : `${offsetMin} min`}`,
          `${task.title}\nTu tarea comienza a las ${formatTime12h(time24)}`,
          { tag: `task-warn-${task.id}` }
        );
      }, warnMs - now));
    }

    if (taskMs > now) {
      ids.push(setTimeout(() => {
        showNotification(
          '¡Es hora!',
          `${task.title}\nInicia ahora | ${formatTime12h(time24)}`,
          { tag: `task-now-${task.id}` }
        );
      }, taskMs - now));
    }

    if (ids.length > 0) {
      _timers.set(task.id, ids);
    }
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
 * Schedules habit reminders:
 * 1. A global daily reminder at 8PM (if ANY habit is incomplete) — FCM or local.
 * 2. Per-habit reminders at each habit's custom reminderTime (if reminder=true).
 */
export async function scheduleHabitReminder(habits = [], uid = null, fcmToken = null) {
  if (_habitTimer.id) {
    clearTimeout(_habitTimer.id);
    _habitTimer.id = null;
  }

  const today      = localToday();
  const now        = new Date();
  const nowMs      = now.getTime();

  // ── 1. Per-habit reminders at their custom reminderTime ──
  for (const h of habits) {
    if (!h.reminder || !h.reminderTime || h.completedToday) continue;

    const [hh, mm]  = h.reminderTime.split(':').map(Number);
    const habitDt   = new Date();
    habitDt.setHours(hh, mm, 0, 0);
    if (habitDt.getTime() <= nowMs) continue; // already past

    const notifTitle = `Hábito: ${h.name}`;
    const notifBody  = `Es hora de completar tu hábito de hoy`;

    if (uid && fcmToken) {
      try {
        const rDate = habitDt.toLocaleDateString('en-CA');
        const rTime = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
        await upsertScheduledNotification({
          uid, fcmToken,
          title:         notifTitle,
          body:          notifBody,
          scheduledDate: rDate,
          scheduledTime: rTime,
          taskId:        `habit-${h.id}-${today}`,
          type:          'habit-reminder',
          data:          { habitId: h.id, type: 'habit-reminder' },
        });
        console.log(`[Mavia] FCM habit reminder for "${h.name}" at ${rTime}`);
        continue;
      } catch (err) {
        console.warn('[Mavia] FCM habit reminder failed:', err.message);
      }
    }

    // local fallback
    setTimeout(() => {
      showNotification(notifTitle, notifBody, { tag: `habit-${h.id}` });
    }, habitDt.getTime() - nowMs);
  }

  // ── 2. Global daily reminder at 8PM (if any habit incomplete) ──
  const incomplete = habits.filter(h => !h.completedToday);
  if (incomplete.length === 0) return;

  const target = new Date();
  target.setHours(20, 0, 0, 0); // 8:00 PM local
  if (target.getTime() <= nowMs) return;

  const names      = incomplete.slice(0, 3).map(h => h.name).join(', ');
  const suffix     = incomplete.length > 3 ? ` y ${incomplete.length - 3} más` : '';
  const notifTitle = 'Hábitos pendientes';
  const notifBody  = `Tienes pendiente: ${names}${suffix}`;

  if (uid && fcmToken) {
    try {
      const targetDate = target.toLocaleDateString('en-CA');
      const targetTime = `${String(target.getHours()).padStart(2,'0')}:${String(target.getMinutes()).padStart(2,'0')}`;
      await upsertScheduledNotification({
        uid, fcmToken,
        title:         notifTitle,
        body:          notifBody,
        scheduledDate: targetDate,
        scheduledTime: targetTime,
        taskId:        `habit-daily-${uid}-${targetDate}`,
        type:          'habit-daily',
        data:          { type: 'habit-daily' },
      });
      console.log(`[Mavia] FCM global habit reminder at 20:00`);
      return;
    } catch (err) {
      console.warn('[Mavia] FCM habit reminder failed, falling back:', err.message);
    }
  }

  // local fallback
  const delay = target.getTime() - nowMs;
  _habitTimer.id = setTimeout(() => {
    showNotification(notifTitle, notifBody, { tag: 'habit-reminder' });
  }, delay);
}

// ─── Event reminders ────────────────────────────────────────────────────────

/**
 * Schedules reminders for today's events.
 * Respects ev.reminder offset. Uses FCM push when uid+fcmToken available.
 * Local setTimeout kept as fallback.
 */
export async function scheduleEventReminders(events = [], uid = null, fcmToken = null) {
  const today = localToday();
  const now   = Date.now();

  for (const ev of events.filter(ev => ev.date === today && ev.startTime)) {
    const time24 = parseTimeTo24h(ev.startTime);
    if (!time24) continue;

    const [h, m] = time24.split(':').map(Number);
    const evDt   = new Date(`${today}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);

    // Respect the event's reminder offset (default 15 min)
    const reminderStr = ev.reminder || '15 minutos antes';
    let offsetMin = 15;
    if (reminderStr.includes('30'))       offsetMin = 30;
    else if (reminderStr.includes('1 hora')) offsetMin = 60;
    else if (reminderStr.includes('1 día')) offsetMin = 60 * 24;

    const warnMs = evDt.getTime() - offsetMin * 60 * 1000;

    if (warnMs <= now) continue; // already past

    const warnDt   = new Date(warnMs);
    const warnDate = warnDt.toLocaleDateString('en-CA');
    const warnTime = `${String(warnDt.getHours()).padStart(2,'0')}:${String(warnDt.getMinutes()).padStart(2,'0')}`;
    const notifTitle = `${offsetMin < 60 ? `En ${offsetMin} minutos` : 'En 1 hora'}: ${ev.title}`;
    const notifBody  = ev.location
      ? `${ev.startTime} — ${ev.location}`
      : `Tu evento comienza a las ${ev.startTime}`;

    // ── FCM push via Firestore upsert ──
    if (uid && fcmToken) {
      try {
        await upsertScheduledNotification({
          uid,
          fcmToken,
          title:         notifTitle,
          body:          notifBody,
          scheduledDate: warnDate,
          scheduledTime: warnTime,
          taskId:        ev.id,
          type:          'event-reminder',
          data:          { eventId: ev.id, type: 'event-reminder' },
        });
        console.log(`[Mavia] FCM event reminder scheduled for "${ev.title}" at ${warnDate} ${warnTime}`);
        continue; // FCM handles it — skip local timer
      } catch (err) {
        console.warn('[Mavia] FCM event reminder failed, falling back to local:', err.message);
      }
    }

    // ── Local fallback ──
    setTimeout(() => {
      showNotification(notifTitle, notifBody, { tag: `event-${ev.id}`, data: { eventId: ev.id } });
    }, warnMs - now);
  }
}

