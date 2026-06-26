// ============================================
// NOTIFICATION SERVICE — Mavia
// Phase 1: Web Notification API (local scheduling)
// Phase 2: FCM push (when VAPID key is added)
// ============================================

// Map of active timers: taskId → [timeoutId, ...]
const _timers = new Map();

// ─── Permission ────────────────────────────────────────────────────────────

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

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
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
 * Schedules 1 or 2 notifications for a task:
 *   - 15 minutes before (if more than 15 min away)
 *   - At exact task time
 *
 * @param {Object} task — must have { id, title, date, time, reminder }
 */
export function scheduleTaskReminder(task) {
  if (!task?.reminder || !task?.date || !task?.time) return;
  cancelReminder(task.id); // clear any previous timers for this task

  const now   = Date.now();
  const [h, m] = task.time.split(':').map(Number);
  const taskDt = new Date(`${task.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const taskMs = taskDt.getTime();

  const ids = [];

  // 15-minute warning
  const warn15 = taskMs - 15 * 60 * 1000;
  if (warn15 > now) {
    const t = setTimeout(() => {
      showNotification(
        `⏰ En 15 minutos: ${task.title}`,
        `Preparate para tu tarea a las ${task.time}`,
        { tag: `task-warn-${task.id}`, data: { taskId: task.id } }
      );
    }, warn15 - now);
    ids.push(t);
  }

  // At task time
  if (taskMs > now) {
    const t = setTimeout(() => {
      showNotification(
        `🌸 Es hora: ${task.title}`,
        task.description || 'Tu tarea te está esperando',
        { tag: `task-now-${task.id}`, data: { taskId: task.id } }
      );
    }, taskMs - now);
    ids.push(t);
  }

  if (ids.length > 0) {
    _timers.set(task.id, ids);
    console.log(`[Mavia] Reminder scheduled for "${task.title}" at ${task.time}`);
  }
}

/**
 * Cancels all pending reminders for a task.
 */
export function cancelReminder(taskId) {
  const ids = _timers.get(taskId);
  if (ids) {
    ids.forEach(id => clearTimeout(id));
    _timers.delete(taskId);
  }
}

/**
 * Re-schedules all pending reminders for a list of tasks.
 * Call this on app load / login.
 */
export function rescheduleAllReminders(tasks = []) {
  // Clear everything first
  _timers.forEach((ids) => ids.forEach(id => clearTimeout(id)));
  _timers.clear();

  const today = new Date().toISOString().split('T')[0];
  tasks.forEach(task => {
    // Only schedule for today and incomplete tasks with reminders
    if (task.reminder && !task.completed && task.date === today) {
      scheduleTaskReminder(task);
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
      '🌿 Tus hábitos te esperan',
      `Aún tienes pendiente: ${names}${incomplete.length > 3 ? ' y más...' : ''}`,
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
  const today = new Date().toISOString().split('T')[0];
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
            `📅 En 30 min: ${ev.title}`,
            `Tu evento comienza a las ${ev.startTime}`,
            { tag: `event-${ev.id}`, data: { eventId: ev.id } }
          );
        }, warn30 - now);
      }
    });
}
