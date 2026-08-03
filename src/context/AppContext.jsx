import { createContext, useContext, useReducer, useEffect, useLayoutEffect, useCallback } from 'react';
import { onAuthChange, getCurrentUser } from '../lib/authService';
import { loadUserData, saveTask, deleteTask,
         saveGoal, saveJournalEntry, deleteJournalEntry,
         markNotificationRead, markAllNotificationsRead, saveUserProfile,
         deleteNotification, deleteReadNotifications, saveNotification,
         saveSettings,
         subscribePersonalTasks, subscribeUserSpaces, subscribeSpaceTasks,
         getPendingInvites, createSpace, inviteToSpace, joinSpace, leaveSpace,
         addSpaceClient, removeSpaceClient, setSpaceColor, saveSpaceTask, deleteSpaceTask } from '../lib/firestoreService';
import {
  initFCM,
  scheduleTaskReminder,
  rescheduleAllReminders,
  cancelReminder,
  getCachedFCMToken,
} from '../lib/notificationService';
import { expandRepeatDates } from '../lib/entryStyle';
import { applyTheme, getSavedTheme } from '../lib/themes';

/* ============================================
   SEED DATA — only profile is created for new users.
   All user-content collections start empty.
   ============================================ */
export const SEED_DATA = {
  tasks:            [],   // "tasks" = entradas unificadas de la agenda
  goals:            [],
  journalEntries:   [],
  notifications:    [],
  // Phrases are system content — kept in app code, not per-user Firestore
  phrases:          [],
};

/* ============================================
   SYSTEM CONTENT (same for all users, not stored in Firestore)
   ============================================ */
export const SYSTEM_PHRASES = [
  { id: 'p1', text: 'La calma es tu superpoder. Úsala todos los días.',          author: 'Mavia', emoji: '' },
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
  tasks:            [],   // "tasks" = entradas unificadas de la agenda
  goals:            [],
  journalEntries:   [],
  phrases:          [],
  notifications:    [],
};

/* ── Modo de color: claro | oscuro | sistema ── */
function _prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
}
function resolveDark(mode) {
  if (mode === 'dark') return true;
  if (mode === 'system') return _prefersDark();
  return false;
}
function initialColorMode() {
  try { return localStorage.getItem('mavia_colormode') || 'light'; } catch { return 'light'; }
}

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
  colorMode:         initialColorMode(),          // 'light' | 'dark' | 'system'
  darkMode:          resolveDark(initialColorMode()),
  language:          'es',  // 'es' | 'en' | 'fr'
  sideDrawerOpen:    false,
  activeFilter:      'Hoy',
  toast:             null,
  entrySheet:        null,   // null | { entryId?, date? } → bottom sheet crear/editar entrada
  selectedDate:      null,   // yyyy-mm-dd → día activo del calendario (lo usa el ＋ al agregar)
  // Espacios (agenda personal + compartidos)
  spaces:            [],     // espacios compartidos donde el usuario es miembro
  currentSpaceId:    (typeof localStorage !== 'undefined' && localStorage.getItem('mavia_space')) || 'personal',
  pendingInvites:    [],     // espacios donde el email fue invitado y aún no es miembro
  // Data — user content starts empty; system content pre-loaded from constants
  ...emptyDataState,
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
        currentScreen:   'calendar',
        screenHistory:   [],
        user: {
          ...state.user,
          ...action.user,
          firstName: action.user.firstName || action.user.name?.split(' ')[0] || '',
        },
        ...action.data,  // Firestore user data
        // Always keep system content (not stored in Firestore)
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
        currentScreen:     'calendar',
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
      return { ...state, isAuthenticated: action.value, currentScreen: action.value ? 'calendar' : 'login' };

    case 'SET_FCM_TOKEN':
      return { ...state, fcmToken: action.token };

    /* ── Navigation ── */
    case 'NAVIGATE':
      if (action.replace) {
        // Replace current screen without adding to history
        return {
          ...state,
          currentScreen:  action.screen,
          screenParams:   action.params || null,
          sideDrawerOpen: false,
        };
      }
      return {
        ...state,
        currentScreen:  action.screen,
        screenParams:   action.params || null,
        // Store {screen, params} pairs so GO_BACK can restore params
        screenHistory:  [...state.screenHistory.slice(-10), { screen: state.currentScreen, params: state.screenParams }],
        sideDrawerOpen: false,
      };
    case 'GO_BACK': {
      const history = [...state.screenHistory];
      const prev = history.pop();
      if (!prev) return { ...state, currentScreen: 'calendar', screenHistory: [], screenParams: null };
      // Support both legacy string entries and new {screen, params} pairs
      const prevScreen = typeof prev === 'string' ? prev : prev.screen;
      const prevParams = typeof prev === 'string' ? null : (prev.params || null);
      return { ...state, currentScreen: prevScreen, screenHistory: history, screenParams: prevParams };
    }

    /* ── UI ── */
    case 'TOGGLE_DRAWER':   return { ...state, sideDrawerOpen: !state.sideDrawerOpen };
    case 'CLOSE_DRAWER':    return { ...state, sideDrawerOpen: false };
    case 'TOGGLE_DARK_MODE': {
      const mode = state.darkMode ? 'light' : 'dark';
      try { localStorage.setItem('mavia_colormode', mode); } catch {}
      return { ...state, darkMode: !state.darkMode, colorMode: mode };
    }
    case 'SET_COLOR_MODE': {
      try { localStorage.setItem('mavia_colormode', action.mode); } catch {}
      return { ...state, colorMode: action.mode, darkMode: resolveDark(action.mode) };
    }
    case 'SET_LANGUAGE':    return { ...state, language: action.language || 'es' };
    case 'SET_FILTER':      return { ...state, activeFilter: action.filter };
    case 'SHOW_TOAST':      return { ...state, toast: { message: action.message, type: action.toastType || 'default' } };
    case 'HIDE_TOAST':      return { ...state, toast: null };
    case 'OPEN_ENTRY_SHEET':return { ...state, entrySheet: action.params || {} };
    case 'CLOSE_ENTRY_SHEET':return { ...state, entrySheet: null };
    case 'SET_SELECTED_DATE':return { ...state, selectedDate: action.date };

    /* ── Espacios ── */
    case 'SET_SPACES':          return { ...state, spaces: action.spaces };
    case 'SET_PENDING_INVITES': return { ...state, pendingInvites: action.invites };
    case 'SET_CURRENT_SPACE':   return { ...state, currentSpaceId: action.spaceId };
    case 'SYNC_PERSONAL_TASKS': {
      // Reemplaza solo las entradas personales; conserva las de espacios
      const others = state.tasks.filter(t => (t.spaceId || 'personal') !== 'personal');
      return { ...state, tasks: [...others, ...action.tasks] };
    }
    case 'SYNC_SPACE_TASKS': {
      // Reemplaza las entradas de un espacio concreto
      const others = state.tasks.filter(t => t.spaceId !== action.spaceId);
      return { ...state, tasks: [...others, ...action.tasks] };
    }
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

    /* ── Import (from JSON backup) ── */
    case 'IMPORT_TASKS': {
      const existing = new Set(state.tasks.map(t => t.id));
      const merged   = [...state.tasks, ...action.tasks.filter(t => !existing.has(t.id))];
      return { ...state, tasks: merged };
    }
    case 'IMPORT_GOALS': {
      const existing = new Set(state.goals.map(g => g.id));
      const merged   = [...state.goals, ...action.goals.filter(g => !existing.has(g.id))];
      return { ...state, goals: merged };
    }
    case 'IMPORT_JOURNAL': {
      const existing = new Set(state.journalEntries.map(e => e.id));
      const merged   = [...state.journalEntries, ...action.entries.filter(e => !existing.has(e.id))];
      return { ...state, journalEntries: merged };
    }

    /* ── Goals ── */
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { ...action.goal, id: action.goal.id || Date.now().toString() }] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.goal.id ? { ...g, ...action.goal } : g) };
    case 'UPDATE_GOAL_PROGRESS': {
      const goals = state.goals.map(g =>
        g.id === action.id ? { ...g, progress: Math.min(100, Math.max(0, action.progress)) } : g
      );
      return { ...state, goals };
    }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) };

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

    /* ── Notas (post-its) — CRUD por id ── */
    case 'ADD_NOTE':
      return { ...state, journalEntries: [action.note, ...state.journalEntries] };
    case 'UPDATE_NOTE':
      return { ...state, journalEntries: state.journalEntries.map(n => n.id === action.note.id ? { ...n, ...action.note } : n) };
    case 'DELETE_NOTE':
      return { ...state, journalEntries: state.journalEntries.filter(n => n.id !== action.id) };

    /* ── Notifications ── */
    case 'ADD_NOTIFICATION': {
      if (state.notifications.some(n => n.id === action.notification.id)) return state;
      return { ...state, notifications: [action.notification, ...state.notifications] };
    }
    case 'MARK_NOTIFICATION_READ': {
      const notifications = state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n);
      return { ...state, notifications };
    }
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      const notifications = state.notifications.map(n => ({ ...n, read: true }));
      return { ...state, notifications };
    }
    case 'DELETE_NOTIFICATION': {
      const notifications = state.notifications.filter(n => n.id !== action.id);
      return { ...state, notifications };
    }
    case 'CLEAR_READ_NOTIFICATIONS': {
      const notifications = state.notifications.filter(n => !n.read);
      return { ...state, notifications };
    }

    /* ── Real-time sync ── */
    // Replaced by visibilitychange polling — see AppProvider
    case 'SYNC_ALL': {
      // Merge fresh Firestore data. Las tareas del backup son personales:
      // reemplaza solo las personales y conserva las de espacios compartidos.
      const spaceTasks = state.tasks.filter(t => (t.spaceId || 'personal') !== 'personal');
      const personalTasks = action.data.tasks
        ? action.data.tasks.map(t => ({ ...t, spaceId: 'personal' }))
        : state.tasks.filter(t => (t.spaceId || 'personal') === 'personal');
      return {
        ...state,
        tasks:            [...personalTasks, ...spaceTasks],
        goals:            action.data.goals            ?? state.goals,
        notifications:    action.data.notifications    ?? state.notifications,
        journalEntries:   action.data.journalEntries   ?? state.journalEntries,
      };
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

  /* ── Firebase Auth listener + visibility-based sync ─── */
  useEffect(() => {
    let currentUid = null;  // track the logged-in user's uid for re-syncs

    // ── Realtime: tareas personales + espacios compartidos (sync en vivo) ──
    const rt = { personal: null, spaces: null, tasks: {} };
    const teardownRealtime = () => {
      try { rt.personal?.(); } catch {}
      try { rt.spaces?.(); } catch {}
      Object.values(rt.tasks).forEach(fn => { try { fn(); } catch {} });
      rt.personal = null; rt.spaces = null; rt.tasks = {};
    };
    const setupRealtime = (fbUser) => {
      const uid = fbUser.uid;
      // Tareas personales
      rt.personal = subscribePersonalTasks(uid, (tasks) => dispatch({ type: 'SYNC_PERSONAL_TASKS', tasks }));
      // Espacios del usuario + tareas de cada espacio
      rt.spaces = subscribeUserSpaces(uid, (spaces) => {
        dispatch({ type: 'SET_SPACES', spaces });
        const ids = new Set(spaces.map(s => s.id));
        Object.keys(rt.tasks).forEach(id => {
          if (!ids.has(id)) {
            try { rt.tasks[id](); } catch {}
            delete rt.tasks[id];
            dispatch({ type: 'SYNC_SPACE_TASKS', spaceId: id, tasks: [] });
          }
        });
        spaces.forEach(s => {
          if (!rt.tasks[s.id]) {
            rt.tasks[s.id] = subscribeSpaceTasks(s.id, (tasks) => dispatch({ type: 'SYNC_SPACE_TASKS', spaceId: s.id, tasks }));
          }
        });
      });
      // Invitaciones pendientes por correo (una vez)
      if (fbUser.email) {
        getPendingInvites(fbUser.email).then(list => {
          const pending = list.filter(sp => !(sp.memberUids || []).includes(uid));
          dispatch({ type: 'SET_PENDING_INVITES', invites: pending });
        }).catch(() => {});
      }
    };

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
        teardownRealtime();
        dispatch({ type: 'SET_AUTH_LOADING', value: false });
        dispatch({ type: 'LOGOUT' });
        return;
      }

      currentUid = firebaseUser.uid;

      // User is authenticated — load their Firestore data
      try {
        const firestoreData = await loadUserData(firebaseUser.uid);
        const { user: fsUser, settings, ...data } = firestoreData;
        data.tasks = (data.tasks || []).map(t => ({ ...t, spaceId: 'personal' }));

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
            darkMode: resolveDark(initialColorMode()),   // modo de color local (claro/oscuro/sistema)
            language: settings?.language ?? 'es',
          },
        });

        // ── Espacios + realtime (sync en vivo con la novia) ──
        setupRealtime(firebaseUser);

        // ── Notifications ── wait for FCM token then reschedule all
        const _uid   = firebaseUser.uid;
        const _tasks = data.tasks || [];
        initFCM(_uid)
          .then(token => {
            if (token) dispatch({ type: 'SET_FCM_TOKEN', token });
            rescheduleAllReminders(_tasks, _uid, token || null);

            // ── Foreground push → add to in-app notifications list ──
            import('firebase/messaging').then(({ onMessage }) => {
              import('../lib/firebase').then(({ getMessagingInstance }) => {
                getMessagingInstance().then(msg => {
                  if (!msg) return;
                  onMessage(msg, (payload) => {
                    const d = payload.data || {};
                    const notif = {
                      id:    `fcm_${Date.now()}`,
                      title: d.title || 'Recordatorio',
                      text:  d.body  || '',
                      type:  'reminder',
                      read:  false,
                      time:  new Intl.DateTimeFormat('es-MX', {
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      }).format(new Date()),
                    };
                    dispatch({ type: 'ADD_NOTIFICATION', notification: notif });
                    // #2 Also show a native browser notification so user sees it even on other tab
                    if (Notification.permission === 'granted') {
                      const n = new Notification(notif.title, {
                        body:  notif.text,
                        icon:  '/pwa-192x192.png',
                        badge: '/favicon.ico',
                        tag:   `mavia-fg-${notif.id}`,
                        silent: false,
                      });
                      setTimeout(() => n.close(), 8000);
                      n.onclick = () => { window.focus(); n.close(); };
                    }
                  });
                });
              });
            });
          })
          .catch(() => {
            rescheduleAllReminders(_tasks, null, null);
          });

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
        // Realtime igual funciona desde caché IndexedDB
        setupRealtime(firebaseUser);
      }
    });

    // ── Sync helper using auth.currentUser directly ──
    const runSync = () => {
      if (!currentUid) return;
      const user = getCurrentUser?.();
      if (user) syncUserData(user);
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
      teardownRealtime();
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollTimer);
    };
  }, []);


  /* ── Dark mode class sync + re-aplicar paleta según el modo ──
     useLayoutEffect: la clase en html debe estar ANTES del primer paint,
     si no los tokens (--hairline, etc.) pintan 1 frame con valores claros */
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
    document.body.classList.toggle('dark', state.darkMode);
    applyTheme(getSavedTheme());   // el acento del tema se ajusta a claro/oscuro
  }, [state.darkMode]);

  /* ── Modo "sistema": seguir el cambio del sistema operativo ── */
  useEffect(() => {
    if (state.colorMode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => dispatch({ type: 'SET_COLOR_MODE', mode: 'system' });
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange); };
  }, [state.colorMode]);

  /* ── Firestore side-effects (optimistic: UI updates first) ─ */
  const dispatchWithSync = useCallback(async (action) => {
    // ── Ensure ADD_ actions always have a stable ID before dispatch ──
    // The reducer also generates IDs but we need the same ID for Firestore.
    const genId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let enrichedAction = action;
    if (action.type === 'ADD_TASK' && !action.task?.id) {
      enrichedAction = { ...action, task: { ...action.task, id: genId('t') } };
    } else if (action.type === 'ADD_GOAL' && !action.goal?.id) {
      enrichedAction = { ...action, goal: { ...action.goal, id: genId('g') } };
    }

    // 1. Update UI immediately (reducer uses enrichedAction.habit.id etc.)
    dispatch(enrichedAction);

    // 2. Sync to Firestore in the background
    const uid = state.user?.uid;
    if (!uid) return;

    // ── Ruteo por espacio: personal (users/{uid}/tasks) vs compartido (spaces/{id}/tasks) ──
    const isSpaceEntry = (t) => !!(t && t.spaceId && t.spaceId !== 'personal');
    const persistTask  = (t) => isSpaceEntry(t) ? saveSpaceTask(t.spaceId, t) : saveTask(uid, t);
    const removeTask   = (t) => isSpaceEntry(t) ? deleteSpaceTask(t.spaceId, t.id) : deleteTask(uid, t.id);

    try {
      switch (enrichedAction.type) {

        case 'ADD_TASK': {
          const task = enrichedAction.task;
          await persistTask(task);
          // Recordatorio también para entradas de espacio (avisa a quien lo configura)
          if (task.reminder) {
            const token = state.fcmToken || state.user?.fcmToken || getCachedFCMToken();
            scheduleTaskReminder(task, uid, token);
          }
          break;
        }

        case 'TOGGLE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.id);
          if (existingTask) {
            const nowCompleted = !existingTask.completed;
            await persistTask({ ...existingTask, completed: nowCompleted });
            if (nowCompleted) cancelReminder(enrichedAction.id, uid);
            // Las series ahora se generan por adelantado (ver createEntry); no se regenera al completar.
          }
          break;
        }

        case 'UPDATE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.task?.id);
          if (existingTask) {
            const updated = { ...existingTask, ...enrichedAction.task };
            // Si cambió de espacio, borra la copia del espacio anterior
            if ((existingTask.spaceId || 'personal') !== (updated.spaceId || 'personal')) {
              await removeTask(existingTask);
            }
            await persistTask(updated);
            if (updated.reminder && !updated.completed) {
              // Reprogramar: el upsert (docId determinista) sobreescribe el aviso anterior.
              const token = state.fcmToken || state.user?.fcmToken || getCachedFCMToken();
              scheduleTaskReminder(updated, uid, token);
            } else {
              // Recordatorio apagado/completado → borrar el aviso programado.
              cancelReminder(updated.id, uid);
            }
          }
          break;
        }

        case 'DELETE_TASK': {
          const existingTask = state.tasks.find(t => t.id === enrichedAction.id);
          if (existingTask) await removeTask(existingTask);
          else await deleteTask(uid, enrichedAction.id);
          cancelReminder(enrichedAction.id, uid);
          break;
        }

        case 'ADD_GOAL':
          await saveGoal(uid, enrichedAction.goal);
          break;

        case 'UPDATE_GOAL':
          await saveGoal(uid, enrichedAction.goal);
          break;

        case 'UPDATE_GOAL_PROGRESS': {
          const g = state.goals.find(g => g.id === enrichedAction.id);
          if (g) await saveGoal(uid, { ...g, progress: Math.min(100, Math.max(0, enrichedAction.progress)) });
          break;
        }

        case 'DELETE_GOAL': {
          try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            await deleteDoc(doc(db, 'users', uid, 'goals', enrichedAction.id));
          } catch (e) {
            console.warn('[Mavia] DELETE_GOAL Firestore error:', e.message);
          }
          break;
        }

        case 'ADD_JOURNAL':
          await saveJournalEntry(uid, enrichedAction.entry);
          break;

        case 'ADD_NOTE':
        case 'UPDATE_NOTE':
          await saveJournalEntry(uid, enrichedAction.note);
          break;

        case 'DELETE_NOTE':
          await deleteJournalEntry(uid, enrichedAction.id);
          break;

        case 'ADD_NOTIFICATION': {
          // Persist foreground FCM notification to Firestore so it survives reload
          const notif = enrichedAction.notification;
          if (notif?.id) await saveNotification(uid, notif).catch(() => {});
          break;
        }

        case 'MARK_NOTIFICATION_READ':
          await markNotificationRead(uid, enrichedAction.id);
          break;

        case 'MARK_ALL_NOTIFICATIONS_READ':
          await markAllNotificationsRead(uid, state.notifications.map(n => n.id));
          break;

        case 'DELETE_NOTIFICATION':
          // Delete from Firestore so it doesn't come back on reload
          await deleteNotification(uid, enrichedAction.id).catch(() => {});
          break;

        case 'CLEAR_READ_NOTIFICATIONS': {
          // Batch-delete all read notifications from Firestore
          const readIds = state.notifications.filter(n => n.read).map(n => n.id);
          await deleteReadNotifications(uid, readIds).catch(() => {});
          break;
        }

        case 'UPDATE_USER':
          await saveUserProfile(uid, enrichedAction.updates);
          break;

        case 'TOGGLE_DARK_MODE':
          await saveSettings(uid, { darkMode: !state.darkMode });
          break;

        case 'SET_LANGUAGE':
          await saveSettings(uid, { language: enrichedAction.language });
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[Mavia] Firestore sync error:', enrichedAction.type, err);
    }
  }, [state]);

  /* ── Helper functions ──────────────────────────────────────── */
  const navigate = (screen, params = null, replace = false) =>
    dispatch({ type: 'NAVIGATE', screen, params, replace });
  const goBack   = ()                       => dispatch({ type: 'GO_BACK' });

  const showToast = (message, type = 'default') => {
    dispatch({ type: 'SHOW_TOAST', message, toastType: type });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2800);
  };

  // Al agregar, el día por defecto es el seleccionado en el calendario (agenda de papel)
  const openEntrySheet  = (params = {}) => dispatch({ type: 'OPEN_ENTRY_SHEET', params: { date: state.selectedDate || undefined, ...params } });
  const closeEntrySheet = ()            => dispatch({ type: 'CLOSE_ENTRY_SHEET' });
  const setSelectedDate = (date)        => dispatch({ type: 'SET_SELECTED_DATE', date });
  const setColorMode    = (mode)        => dispatch({ type: 'SET_COLOR_MODE', mode });

  /* ── Entradas con series que se repiten ── */
  // Crea una entrada. Si repite, genera las ocurrencias futuras con un seriesId común.
  const createEntry = (base) => {
    const rep = base.repeat;
    if (rep && rep !== 'No repetir') {
      const seriesId = `series_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      expandRepeatDates(base.date, rep).forEach(date => {
        dispatchWithSync({ type: 'ADD_TASK', task: { ...base, date, seriesId, completed: false } });
      });
    } else {
      dispatchWithSync({ type: 'ADD_TASK', task: { ...base, completed: false } });
    }
  };
  // Edita una entrada. scope 'series' aplica los cambios a esta y las futuras de la misma serie.
  const updateEntry = (original, changes, scope = 'one') => {
    if (scope === 'series' && original.seriesId) {
      const affected = state.tasks.filter(t => t.seriesId === original.seriesId && t.date >= original.date);
      affected.forEach(t => dispatchWithSync({ type: 'UPDATE_TASK', task: { ...t, ...changes, date: t.date } }));
    } else {
      dispatchWithSync({ type: 'UPDATE_TASK', task: { ...original, ...changes } });
    }
  };
  // Elimina una entrada. scope 'series' borra esta y las futuras de la misma serie.
  const deleteEntry = (original, scope = 'one') => {
    if (scope === 'series' && original.seriesId) {
      const affected = state.tasks.filter(t => t.seriesId === original.seriesId && t.date >= original.date);
      affected.forEach(t => dispatchWithSync({ type: 'DELETE_TASK', id: t.id }));
    } else {
      dispatchWithSync({ type: 'DELETE_TASK', id: original.id });
    }
  };

  /* ── Espacios compartidos ── */
  const setCurrentSpace = (spaceId) => {
    try { localStorage.setItem('mavia_space', spaceId); } catch {}
    dispatch({ type: 'SET_CURRENT_SPACE', spaceId });
  };
  const createSharedSpace = async (name) => {
    const uid = state.user?.uid;
    if (!uid) return null;
    const space = await createSpace(uid, { name, ownerName: state.user?.firstName || state.user?.name || '' });
    setCurrentSpace(space.id);  // realtime lo agregará a state.spaces
    return space;
  };
  const inviteEmail = async (spaceId, email) => {
    await inviteToSpace(spaceId, email);
  };
  const acceptInvite = async (space) => {
    const uid = state.user?.uid;
    const email = state.user?.email;
    if (!uid) return;
    await joinSpace(space.id, uid, email);
    dispatch({ type: 'SET_PENDING_INVITES', invites: state.pendingInvites.filter(s => s.id !== space.id) });
    setCurrentSpace(space.id);  // realtime cargará sus entradas
  };
  const leaveSharedSpace = async (spaceId) => {
    const uid = state.user?.uid;
    if (!uid) return;
    await leaveSpace(spaceId, uid);
    if (state.currentSpaceId === spaceId) setCurrentSpace('personal');
  };
  const addClient    = async (spaceId, name) => { await addSpaceClient(spaceId, name); };
  const removeClient = async (spaceId, name) => { await removeSpaceClient(spaceId, name); };
  const setSpaceColorFn = async (spaceId, color) => { await setSpaceColor(spaceId, color); };

  const value = {
    state,
    dispatch: dispatchWithSync,  // replaces the raw dispatch everywhere
    navigate,
    goBack,
    showToast,
    openEntrySheet,
    closeEntrySheet,
    setSelectedDate,
    setColorMode,
    createEntry,
    updateEntry,
    deleteEntry,
    setCurrentSpace,
    createSharedSpace,
    inviteEmail,
    acceptInvite,
    leaveSharedSpace,
    addClient,
    removeClient,
    setSpaceColor: setSpaceColorFn,
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
