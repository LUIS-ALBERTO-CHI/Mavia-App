import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { localToday } from '../lib/utils';
import { onAuthChange } from '../lib/authService';
import { loadUserData, saveTask, deleteTask, saveHabit, saveEvent, deleteEvent,
         saveGoal, saveJournalEntry, saveGratitudeEntry,
         markNotificationRead, markAllNotificationsRead, saveUserProfile,
         saveSettings, createScheduledNotification } from '../lib/firestoreService';
import {
  initFCM,
  scheduleTaskReminder,
  scheduleEventReminders,
  scheduleHabitReminder,
  rescheduleAllReminders,
  cancelReminder,
  getCachedFCMToken,
  parseTimeTo24h,
} from '../lib/notificationService';

/* ============================================
   SEED DATA — only profile is created for new users.
   All user-content collections start empty.
   ============================================ */
export const SEED_DATA = {
  tasks:            [],
  habits:           [],
  events:           [],
  goals:            [],
  journalEntries:   [],
  gratitudeEntries: [],
  notifications:    [],
  // Meditations and phrases are system content — kept in app code, not per-user Firestore
  meditations:      [],
  phrases:          [],
};

/* ============================================
   SYSTEM CONTENT (same for all users, not stored in Firestore)
   ============================================ */
export const SYSTEM_MEDITATIONS = [
  { id: 'm1', title: 'Respiración para calmar la ansiedad', category: 'Ansiedad',      duration: 10, icon: 'wave',    description: 'Una práctica suave para calmar el sistema nervioso', plays: 0 },
  { id: 'm2', title: 'Concentración profunda',              category: 'Concentración', duration: 15, icon: 'focus',   description: 'Aumenta tu enfoque y claridad mental', plays: 0 },
  { id: 'm3', title: 'Relajación para dormir',              category: 'Dormir',        duration: 20, icon: 'sleep',   description: 'Prepara tu mente y cuerpo para un sueño reparador', plays: 0 },
  { id: 'm4', title: 'Meditación de gratitud',              category: 'Gratitud',      duration: 8,  icon: 'flower',  description: 'Cultiva un corazón agradecido', plays: 0 },
  { id: 'm5', title: 'Energía matutina',                    category: 'Energía',       duration: 12, icon: 'sun',     description: 'Activa tu energía positiva para el día', plays: 0 },
  { id: 'm6', title: 'Respiración 4-7-8',                   category: 'Ansiedad',      duration: 5,  icon: 'breathe', description: 'Técnica de respiración para reducir el estrés', plays: 0 },
];

export const SYSTEM_PHRASES = [
  { id: 'p1', text: 'La calma es tu superpoder. Úsala todos los días.',          author: 'Mavia', emoji: '🌸' },
  { id: 'p2', text: 'Pequeños pasos consistentes crean grandes cambios.',        author: 'Mavia', emoji: '🌿' },
  { id: 'p3', text: 'Tu mente merece el mismo cuidado que tu cuerpo.',           author: 'Mavia', emoji: '💜' },
  { id: 'p4', text: 'Eres más fuerte de lo que imaginas.',                       author: 'Mavia', emoji: '✨' },
  { id: 'p5', text: 'Hoy elige la paz por encima del miedo.',                    author: 'Mavia', emoji: '🕊️' },
  { id: 'p6', text: 'Organiza tu día, cuida tu mente.',                          author: 'Mavia', emoji: '🌷' },
  { id: 'p7', text: 'El descanso también es productividad.',                     author: 'Mavia', emoji: '🌙' },
];

/* ============================================
   INITIAL STATE
   ============================================ */
const emptyDataState = {
  tasks:            [],
  events:           [],
  habits:           [],
  goals:            [],
  journalEntries:   [],
  gratitudeEntries: [],
  phrases:          [],
  meditations:      [],
  notifications:    [],
};

const defaultState = {
  // Auth / session
  authLoading:       true,
  isAuthenticated:   false,
  hasCompletedSetup: false,
  user:              { name: '', firstName: '', email: '', uid: null },
  fcmToken:          null,  // FCM push token (stored after initFCM)
  // UI
  currentScreen:     'splash',
  screenParams:      null,
  screenHistory:     [],
  darkMode:          false,
  sideDrawerOpen:    false,
  activeFilter:      'Hoy',
  toast:             null,
  // Data — user content starts empty; system content pre-loaded from constants
  ...emptyDataState,
  meditations: SYSTEM_MEDITATIONS,
  phrases:     SYSTEM_PHRASES,
};

/* ============================================
   REDUCER
   ============================================ */
function reducer(state, action) {
  switch (action.type) {

    /* ── Auth ── */
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.value };

    case 'LOGIN':
      return {
        ...state,
        authLoading:     false,
        isAuthenticated: true,
        currentScreen:   'dashboard',
        screenHistory:   [],
        user: {
          ...state.user,
          ...action.user,
          firstName: action.user.firstName || action.user.name?.split(' ')[0] || '',
        },
        ...action.data,  // Firestore user data
        // Always keep system content (not stored in Firestore)
        meditations: SYSTEM_MEDITATIONS,
        phrases:     SYSTEM_PHRASES,
      };

    case 'LOGIN_GOOGLE':
      return {
        ...state,
        authLoading:     false,
        isAuthenticated: true,
        currentScreen:   'setup-profile',
        screenHistory:   [],
        user: {
          ...state.user,
          ...action.user,
          firstName: action.user.firstName || action.user.name?.split(' ')[0] || '',
        },
        ...action.data,
      };

    case 'COMPLETE_SETUP':
      return {
        ...state,
        currentScreen:     'dashboard',
        hasCompletedSetup: true,
        user: { ...state.user, ...action.user },
      };

    case 'LOGOUT':
      return {
        ...defaultState,
        authLoading: false,
        darkMode:    state.darkMode,
        currentScreen: 'login',
      };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.value, currentScreen: action.value ? 'dashboard' : 'login' };

    case 'SET_FCM_TOKEN':
      return { ...state, fcmToken: action.token };

    /* ── Navigation ── */
    case 'NAVIGATE':
      return {
        ...state,
        currentScreen:  action.screen,
        screenParams:   action.params || null,
        screenHistory:  [...state.screenHistory.slice(-10), state.currentScreen],
        sideDrawerOpen: false,
      };
    case 'GO_BACK': {
      const history = [...state.screenHistory];
      const prev = history.pop() || 'dashboard';
      return { ...state, currentScreen: prev, screenHistory: history, screenParams: null };
    }

    /* ── UI ── */
    case 'TOGGLE_DRAWER':   return { ...state, sideDrawerOpen: !state.sideDrawerOpen };
    case 'CLOSE_DRAWER':    return { ...state, sideDrawerOpen: false };
    case 'TOGGLE_DARK_MODE':return { ...state, darkMode: !state.darkMode };
    case 'SET_FILTER':      return { ...state, activeFilter: action.filter };
    case 'SHOW_TOAST':      return { ...state, toast: { message: action.message, type: action.toastType || 'default' } };
    case 'HIDE_TOAST':      return { ...state, toast: null };
    case 'UPDATE_USER':     return { ...state, user: { ...state.user, ...action.updates } };

    /* ── Tasks ── */
    case 'ADD_TASK':
      return { ...state, tasks: [{ ...action.task, id: action.task.id || Date.now().toString() }, ...state.tasks] };
    case 'TOGGLE_TASK': {
      const tasks = state.tasks.map(t => t.id === action.id ? { ...t, completed: !t.completed } : t);
      return { ...state, tasks };
    }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(t => t.id === action.task.id ? { ...t, ...action.task } : t);
      return { ...state, tasks };
    }

    /* ── Habits ── */
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, { ...action.habit, id: action.habit.id || Date.now().toString() }] };
    case 'TOGGLE_HABIT': {
      const todayIdx = (new Date().getDay() + 6) % 7;
      const habits = state.habits.map(h => {
        if (h.id !== action.id) return h;
        const newCompleted = !h.completedToday;
        const weekData = [...(h.weekData || Array(7).fill(false))];
        weekData[todayIdx] = newCompleted;
        return { ...h, completedToday: newCompleted, streak: newCompleted ? h.streak + 1 : Math.max(0, h.streak - 1), weekData };
      });
      return { ...state, habits };
    }
    case 'TOGGLE_HABIT_DAY': {
      const habits = state.habits.map(h => {
        if (h.id !== action.id) return h;
        const weekData = [...(h.weekData || Array(7).fill(false))];
        weekData[action.dayIdx] = !weekData[action.dayIdx];
        return { ...h, weekData };
      });
      return { ...state, habits };
    }
    case 'UPDATE_HABIT_WATER': {
      const habits = state.habits.map(h => h.id === action.id ? { ...h, current: action.current } : h);
      return { ...state, habits };
    }

    /* ── Events ── */
    case 'ADD_EVENT':
      return { ...state, events: [{ ...action.event, id: action.event.id || Date.now().toString() }, ...state.events] };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.id) };

    /* ── Goals ── */
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { ...action.goal, id: action.goal.id || Date.now().toString() }] };

    /* ── Journal ── */
    case 'ADD_JOURNAL': {
      const existing = state.journalEntries.findIndex(e => e.date === action.entry.date);
      let journalEntries;
      if (existing >= 0) {
        journalEntries = state.journalEntries.map((e, i) => i === existing ? action.entry : e);
      } else {
        journalEntries = [action.entry, ...state.journalEntries];
      }
      return { ...state, journalEntries };
    }

    /* ── Gratitude ── */
    case 'ADD_GRATITUDE': {
      const existing = state.gratitudeEntries.findIndex(e => e.date === action.entry.date);
      let gratitudeEntries;
      if (existing >= 0) {
        gratitudeEntries = state.gratitudeEntries.map((e, i) => i === existing ? action.entry : e);
      } else {
        gratitudeEntries = [action.entry, ...state.gratitudeEntries];
      }
      return { ...state, gratitudeEntries };
    }

    /* ── Notifications ── */
    case 'MARK_NOTIFICATION_READ': {
      const notifications = state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n);
      return { ...state, notifications };
    }
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      const notifications = state.notifications.map(n => ({ ...n, read: true }));
      return { ...state, notifications };
    }

    /* ── Real-time sync ── */
    // Replaced by visibilitychange polling — see AppProvider
    case 'SYNC_ALL':
      // Merge fresh Firestore data into state (tasks, habits, events, goals, notifications)
      return {
        ...state,
        tasks:            action.data.tasks            ?? state.tasks,
        habits:           action.data.habits           ?? state.habits,
        events:           action.data.events           ?? state.events,
        goals:            action.data.goals            ?? state.goals,
        notifications:    action.data.notifications    ?? state.notifications,
        journalEntries:   action.data.journalEntries   ?? state.journalEntries,
        gratitudeEntries: action.data.gratitudeEntries ?? state.gratitudeEntries,
      };

    default:
      return state;
  }
}

/* ============================================
   CONTEXT
   ============================================ */
export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  /* ── Firebase Auth listener + visibility-based sync ─── */
  useEffect(() => {
    let currentUid = null;  // track the logged-in user's uid for re-syncs

    // ── Helper: load/reload all user data from Firestore ──
    const syncUserData = async (firebaseUser) => {
      if (!firebaseUser) return;
      try {
        const firestoreData = await loadUserData(firebaseUser.uid);
        const { user: fsUser, settings, ...data } = firestoreData;
        dispatch({ type: 'SYNC_ALL', data });
      } catch (err) {
        // Offline or network error — IndexedDB cache already serves stale data
        console.warn('[Mavia] Background sync skipped (offline):', err.message);
      }
    };

    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        currentUid = null;
        dispatch({ type: 'SET_AUTH_LOADING', value: false });
        dispatch({ type: 'LOGOUT' });
        return;
      }

      currentUid = firebaseUser.uid;

      // User is authenticated — load their Firestore data
      try {
        const firestoreData = await loadUserData(firebaseUser.uid);
        const { user: fsUser, settings, ...data } = firestoreData;

        const displayName = firebaseUser.displayName || fsUser?.name || '';
        const firstName   = displayName.split(' ')[0] || firebaseUser.email.split('@')[0];

        dispatch({
          type: 'LOGIN',
          user: {
            uid:       firebaseUser.uid,
            email:     firebaseUser.email,
            name:      displayName || firstName,
            firstName,
            photoURL:  firebaseUser.photoURL || null,
            ...fsUser,
          },
          data: {
            ...data,
            darkMode: settings?.darkMode ?? false,
          },
        });

        // ── Notifications ── wait for FCM token then reschedule all
        const _uid   = firebaseUser.uid;
        const _tasks = data.tasks || [];
        const _today = localToday();
        initFCM(_uid)
          .then(token => {
            if (token) dispatch({ type: 'SET_FCM_TOKEN', token });
            // Reschedule NOW that we have the FCM token
            rescheduleAllReminders(_tasks, _uid, token || null);
          })
          .catch(() => {
            // No FCM — still schedule local timers
            rescheduleAllReminders(_tasks, null, null);
          });
        scheduleHabitReminder(data.habits || []);
        scheduleEventReminders((data.events || []).filter(e => e.date === localToday()));

      } catch (err) {
        // Offline fallback: log in from Firebase Auth profile, data will
        // be served from IndexedDB cache that was populated on last online visit.
        console.warn('[Mavia] Firestore offline at login. Using IndexedDB cache.', err.message);

        const displayName = firebaseUser.displayName || '';
        const firstName   = displayName.split(' ')[0] || firebaseUser.email.split('@')[0];

        dispatch({
          type: 'LOGIN',
          user: { uid: firebaseUser.uid, email: firebaseUser.email,
                  name: displayName || firstName, firstName,
                  photoURL: firebaseUser.photoURL || null },
          data: {},
        });
      }
    });

    // ── Sync helper using auth.currentUser directly ──
    const runSync = () => {
      if (!currentUid) return;
      import('../lib/authService').then(({ getCurrentUser }) => {
        const user = getCurrentUser?.();
        if (user) syncUserData(user);
      }).catch(() => {});
    };

    // ── Visibility-based sync: fires immediately when returning to app ──
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') runSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ── Polling: syncs every 30s while tab is visible ──
    // Ensures data from other devices appears without needing a reload.
    const POLL_INTERVAL = 30 * 1000;
    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') runSync();
    }, POLL_INTERVAL);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollTimer);
    };
  }, []);


  /* ── Dark mode class sync ────────────────────────────────── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
    document.body.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  /* ── Firestore side-effects (optimistic: UI updates first) ─ */
  const dispatchWithSync = useCallback(async (action) => {
    // ── Ensure ADD_ actions always have a stable ID before dispatch ──
    // The reducer also generates IDs but we need the same ID for Firestore.
    const genId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let enrichedAction = action;
    if (action.type === 'ADD_HABIT' && !action.habit?.id) {
      enrichedAction = { ...action, habit: { ...action.habit, id: genId('h') } };
    } else if (action.type === 'ADD_TASK' && !action.task?.id) {
      enrichedAction = { ...action, task: { ...action.task, id: genId('t') } };
    } else if (action.type === 'ADD_EVENT' && !action.event?.id) {
      enrichedAction = { ...action, event: { ...action.event, id: genId('e') } };
    } else if (action.type === 'ADD_GOAL' && !action.goal?.id) {
      enrichedAction = { ...action, goal: { ...action.goal, id: genId('g') } };
    }

    // 1. Update UI immediately (reducer uses enrichedAction.habit.id etc.)
    dispatch(enrichedAction);

    // 2. Sync to Firestore in the background
    const uid = state.user?.uid;
    if (!uid) return;

    try {
      switch (enrichedAction.type) {

        case 'ADD_TASK':
          await saveTask(uid, enrichedAction.task);
          if (enrichedAction.task.reminder) {
            // state.fcmToken may not be set yet (initFCM is async) — fall back to localStorage cache
            const token = state.fcmToken || state.user?.fcmToken || getCachedFCMToken();
            scheduleTaskReminder(enrichedAction.task, uid, token);
          }
          break;

        case 'TOGGLE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.id);
          if (existingTask) {
            const nowCompleted = !existingTask.completed;
            await saveTask(uid, { ...existingTask, completed: nowCompleted });
            // Cancel reminder when task is marked complete
            if (nowCompleted) cancelReminder(enrichedAction.id);

            // ── Repeat logic: auto-create next occurrence ──
            if (nowCompleted && existingTask.repeat && existingTask.repeat !== 'No repetir' && existingTask.date) {
              const nextDate = (() => {
                const d = new Date(existingTask.date + 'T00:00:00');
                if (existingTask.repeat === 'Diario')   d.setDate(d.getDate() + 1);
                if (existingTask.repeat === 'Semanal')  d.setDate(d.getDate() + 7);
                if (existingTask.repeat === 'Mensual')  d.setMonth(d.getMonth() + 1);
                return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
              })();
              const nextId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
              const nextTask = {
                ...existingTask,
                id: nextId,
                date: nextDate,
                completed: false,
                createdAt: new Date().toISOString(),
              };
              dispatch({ type: 'ADD_TASK', task: nextTask });
              await saveTask(uid, nextTask);
              if (nextTask.reminder) {
                const token = state.fcmToken || state.user?.fcmToken || getCachedFCMToken();
                scheduleTaskReminder(nextTask, uid, token);
              }
            }
          }
          break;
        }

        case 'UPDATE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.task?.id);
          if (existingTask) {
            const updated = { ...existingTask, ...enrichedAction.task };
            await saveTask(uid, updated);
            // Re-schedule reminder if settings changed
            cancelReminder(updated.id);
            if (updated.reminder && !updated.completed) {
              const token = state.fcmToken || state.user?.fcmToken || getCachedFCMToken();
              scheduleTaskReminder(updated, uid, token);
            }
          }
          break;
        }

        case 'DELETE_TASK':
          await deleteTask(uid, enrichedAction.id);
          cancelReminder(enrichedAction.id); // Cancel any pending notification
          break;

        case 'ADD_HABIT':
          await saveHabit(uid, enrichedAction.habit);
          break;

        case 'TOGGLE_HABIT': {
          const todayIdx = (new Date().getDay() + 6) % 7;
          const h = state.habits.find(h => h.id === enrichedAction.id);
          if (h) {
            const newCompleted = !h.completedToday;
            const weekData = [...(h.weekData || Array(7).fill(false))];
            weekData[todayIdx] = newCompleted;
            await saveHabit(uid, { ...h, completedToday: newCompleted, streak: newCompleted ? h.streak + 1 : Math.max(0, h.streak - 1), weekData });
          }
          break;
        }

        case 'TOGGLE_HABIT_DAY': {
          const h = state.habits.find(h => h.id === enrichedAction.id);
          if (h) {
            const weekData = [...(h.weekData || Array(7).fill(false))];
            weekData[enrichedAction.dayIdx] = !weekData[enrichedAction.dayIdx];
            await saveHabit(uid, { ...h, weekData });
          }
          break;
        }

        case 'UPDATE_HABIT_WATER': {
          const h = state.habits.find(h => h.id === enrichedAction.id);
          if (h) await saveHabit(uid, { ...h, current: enrichedAction.current });
          break;
        }

        case 'ADD_EVENT': {
          const ev = enrichedAction.event;
          await saveEvent(uid, ev);

          // ── Schedule event reminder via FCM (works even with browser closed) ──
          if (ev.reminderOn !== false && ev.startTime) {
            const token = state.fcmToken || state.user?.fcmToken || getCachedFCMToken();
            const time24 = parseTimeTo24h(ev.startTime);

            if (token && uid && time24) {
              try {
                // Parse reminder offset (default: 15 min before)
                const reminderStr = ev.reminder || '15 minutos antes';
                let offsetMin = 15;
                if (reminderStr.includes('30')) offsetMin = 30;
                else if (reminderStr.includes('1 hora')) offsetMin = 60;
                else if (reminderStr.includes('1 día')) offsetMin = 60 * 24;

                const [h, m] = time24.split(':').map(Number);
                const eventDt = new Date(`${ev.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
                const notifDt = new Date(eventDt.getTime() - offsetMin * 60 * 1000);

                if (notifDt > new Date()) {
                  const notifDate = notifDt.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
                  const notifTime = notifDt.toLocaleTimeString('es-MX', {
                    timeZone: 'America/Mexico_City',
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  });

                  await createScheduledNotification({
                    uid,
                    fcmToken: token,
                    title: `${offsetMin < 60 ? `En ${offsetMin} minutos` : offsetMin === 60 ? 'En 1 hora' : 'Mañana'}: ${ev.title}`,
                    body: ev.location
                      ? `${ev.startTime} — ${ev.location}`
                      : `Tu evento comienza a las ${ev.startTime}`,
                    scheduledDate: notifDate,
                    scheduledTime: notifTime,
                    data: { eventId: ev.id, type: 'event-reminder' },
                  });
                  console.log(`[Mavia] Recordatorio FCM para "${ev.title}" a las ${notifDate} ${notifTime}`);
                }
              } catch (err) {
                console.warn('[Mavia] No se pudo programar recordatorio FCM del evento:', err.message);
                // Fallback: local setTimeout
                scheduleEventReminders([ev]);
              }
            } else {
              // No FCM token — fallback to local setTimeout
              scheduleEventReminders([ev]);
              if (!token) console.warn('[Mavia] Sin token FCM — recordatorio de evento solo local (requiere app abierta)');
            }
          }
          break;
        }

        case 'DELETE_EVENT':
          await deleteEvent(uid, enrichedAction.id);
          break;

        case 'ADD_GOAL':
          await saveGoal(uid, enrichedAction.goal);
          break;

        case 'ADD_JOURNAL':
          await saveJournalEntry(uid, enrichedAction.entry);
          break;

        case 'ADD_GRATITUDE':
          await saveGratitudeEntry(uid, enrichedAction.entry);
          break;

        case 'MARK_NOTIFICATION_READ':
          await markNotificationRead(uid, enrichedAction.id);
          break;

        case 'MARK_ALL_NOTIFICATIONS_READ':
          await markAllNotificationsRead(uid, state.notifications.map(n => n.id));
          break;

        case 'UPDATE_USER':
          await saveUserProfile(uid, enrichedAction.updates);
          break;

        case 'TOGGLE_DARK_MODE':
          await saveSettings(uid, { darkMode: !state.darkMode });
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[Mavia] Firestore sync error:', enrichedAction.type, err);
    }
  }, [state]);

  /* ── Helper functions ──────────────────────────────────────── */
  const navigate = (screen, params = null) => dispatch({ type: 'NAVIGATE', screen, params });
  const goBack   = ()                       => dispatch({ type: 'GO_BACK' });

  const showToast = (message, type = 'default') => {
    dispatch({ type: 'SHOW_TOAST', message, toastType: type });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2800);
  };

  const value = {
    state,
    dispatch: dispatchWithSync,  // replaces the raw dispatch everywhere
    navigate,
    goBack,
    showToast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
