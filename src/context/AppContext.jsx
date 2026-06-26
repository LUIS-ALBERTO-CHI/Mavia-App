import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { onAuthChange } from '../lib/authService';
import { loadUserData, saveTask, deleteTask, saveHabit, saveEvent, deleteEvent,
         saveGoal, saveJournalEntry, saveGratitudeEntry,
         markNotificationRead, markAllNotificationsRead, saveUserProfile,
         saveSettings } from '../lib/firestoreService';

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
  authLoading:       true,    // true while Firebase checks session
  isAuthenticated:   false,
  hasCompletedSetup: false,
  user:              { name: '', firstName: '', email: '', uid: null },
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

  /* ── Firebase Auth listener ──────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        // Not logged in
        dispatch({ type: 'SET_AUTH_LOADING', value: false });
        dispatch({ type: 'LOGOUT' });
        return;
      }

      // User is authenticated — load their Firestore data
      try {
        const firestoreData = await loadUserData(firebaseUser.uid);
        const { user: fsUser, settings, ...data } = firestoreData;

        // Merge Firebase Auth profile with Firestore profile
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
      } catch (err) {
        console.error('[Mavia] Error loading user data:', err);
        dispatch({ type: 'SET_AUTH_LOADING', value: false });
      }
    });

    return unsub; // unsubscribe on unmount
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
          break;

        case 'TOGGLE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.id);
          if (existingTask) await saveTask(uid, { ...existingTask, completed: !existingTask.completed });
          break;
        }

        case 'UPDATE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.task?.id);
          if (existingTask) await saveTask(uid, { ...existingTask, ...enrichedAction.task });
          break;
        }

        case 'DELETE_TASK':
          await deleteTask(uid, enrichedAction.id);
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

        case 'ADD_EVENT':
          await saveEvent(uid, enrichedAction.event);
          break;

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
