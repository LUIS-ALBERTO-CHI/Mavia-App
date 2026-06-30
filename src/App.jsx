import { useContext, useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './styles/design-system.css';

// Screens - Auth
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import SetupProfileScreen from './screens/SetupProfileScreen';

// Screens - Main
import DashboardScreen from './screens/DashboardScreen';
import AgendaScreen from './screens/AgendaScreen';
import CalendarScreen from './screens/CalendarScreen';
import TasksScreen from './screens/TasksScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';

// Screens - Wellness
import MeditationScreen from './screens/MeditationScreen';
import HabitsScreen from './screens/HabitsScreen';
import CreateHabitScreen from './screens/CreateHabitScreen';
import GoalsScreen from './screens/GoalsScreen';
import CreateGoalScreen from './screens/CreateGoalScreen';
import JournalScreen from './screens/JournalScreen';
import GratitudeScreen from './screens/GratitudeScreen';
import PhrasesScreen from './screens/PhrasesScreen';

// Screens - Management
import EventsScreen from './screens/EventsScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import RemindersScreen from './screens/RemindersScreen';

// Screens - System
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import SearchScreen from './screens/SearchScreen';

/* ============================================
   CONSTANTS
   ============================================ */
const AUTH_SCREENS = new Set(['splash', 'onboarding', 'register', 'login', 'setup-profile']);

const SCREEN_MAP = {
  splash: SplashScreen,
  onboarding: OnboardingScreen,
  register: RegisterScreen,
  login: LoginScreen,
  'setup-profile': SetupProfileScreen,
  dashboard: DashboardScreen,
  agenda: AgendaScreen,
  calendar: CalendarScreen,
  tasks: TasksScreen,
  createTask: CreateTaskScreen,
  taskDetail: TaskDetailScreen,
  wellness: MeditationScreen,
  meditation: MeditationScreen,
  habits: HabitsScreen,
  createHabit: CreateHabitScreen,
  goals: GoalsScreen,
  createGoal: CreateGoalScreen,
  journal: JournalScreen,
  gratitude: GratitudeScreen,
  phrases: PhrasesScreen,
  events: EventsScreen,
  eventDetail: EventDetailScreen,
  createEvent: CreateEventScreen,
  reminders: RemindersScreen,
  notifications: NotificationsScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
  statistics: StatisticsScreen,
  search: SearchScreen,
};

/* ============================================
   SIDEBAR NAV ITEMS
   ============================================ */
const MAIN_NAV = [
  { id: 'dashboard', label: 'Inicio',     icon: 'dashboard'          },
  { id: 'calendar',  label: 'Calendario', icon: 'calendar_today'      },
  { id: 'tasks',     label: 'Tareas',     icon: 'check_circle'        },
  { id: 'wellness',  label: 'Bienestar',  icon: 'energy_savings_leaf' },
  { id: 'profile',   label: 'Perfil',     icon: 'person'              },
];

// Screens that use the calendar FAB destination
const CALENDAR_SCREENS = new Set(['calendar', 'events', 'createEvent', 'agenda']);

// Screens that already have their own "Añadir" button — hide FAB to avoid confusion
const SCREENS_WITH_OWN_ADD = new Set([
  'habits', 'goals', 'journal', 'gratitude', 'createTask', 'createEvent',
  'createHabit', 'createGoal', 'taskDetail', 'eventDetail', 'notifications',
  'statistics', 'search', 'profile', 'settings', 'reminders',
]);

// Back-navigation screens (animate slide-back instead of slide-in)
const DETAIL_SCREENS = new Set(['taskDetail', 'eventDetail', 'createTask', 'createEvent', 'createHabit', 'createGoal']);

const SCREEN_TITLES = {
  dashboard: 'Mavia',
  agenda: 'Agenda del día',
  calendar: 'Calendario',
  tasks: 'Mis tareas',
  createTask: 'Nueva tarea',
  createEvent: 'Nuevo evento',
  taskDetail: 'Detalle de tarea',
  wellness: 'Bienestar',
  habits: 'Hábitos',
  goals: 'Objetivos',
  journal: 'Mi diario',
  gratitude: 'Gratitud',
  phrases: 'Frase del día',
  events: 'Eventos',
  reminders: 'Recordatorios',
  notifications: 'Notificaciones',
  profile: 'Mi perfil',
  settings: 'Configuración',
  statistics: 'Estadísticas',
  search: 'Buscar',
};

/* ============================================
   DESKTOP SIDEBAR
   ============================================ */
function DesktopSidebar() {
  const { state, navigate, dispatch } = useApp();
  const { currentScreen, user, notifications } = state;
  const unread = notifications.filter(n => !n.read).length;

  return (
    <aside className="desktop-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">Mavia</div>
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={user.photoURL ? { overflow: 'hidden', padding: 0 } : {}}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : (user.firstName?.[0] || 'A')}
          </div>
          <div>
            <div className="sidebar-user-name">{user.firstName || ''}</div>
            <div className="sidebar-user-sub" style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              Hoy con propósito
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {MAIN_NAV.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item${currentScreen === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.id)}
            id={`sidebar-${item.id}`}
            aria-label={item.label}
          >
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Extra items */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(208,195,200,0.2)', paddingTop: '0.75rem' }}>
          {[
            { id: 'notifications', label: 'Notificaciones', icon: 'notifications', badge: unread },
            { id: 'reminders',    label: 'Recordatorios',  icon: 'alarm'          },
            { id: 'journal',      label: 'Diario',          icon: 'book_2'         },
            { id: 'goals',        label: 'Objetivos',       icon: 'flag'           },
            { id: 'habits',       label: 'Hábitos',         icon: 'self_care'      },
            { id: 'statistics',   label: 'Estadísticas',    icon: 'bar_chart'      },
            { id: 'search',       label: 'Búsqueda',        icon: 'search'         },
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item${currentScreen === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
              id={`sidebar-extra-${item.id}`}
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '99px',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* CTA — contextual */}
      <div className="sidebar-footer">
        <button
          className="sidebar-cta"
          onClick={() => navigate(CALENDAR_SCREENS.has(currentScreen) ? 'createEvent' : 'createTask')}
          id="sidebar-cta"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          {CALENDAR_SCREENS.has(currentScreen) ? 'Nuevo Evento' : 'Nueva Tarea'}
        </button>
      </div>
    </aside>
  );
}

/* ============================================
   MOBILE TOP BAR
   ============================================ */
function MobileTopBar() {
  const { state, navigate } = useApp();
  const { currentScreen, notifications } = state;
  const unread = notifications.filter(n => !n.read).length;
  const isHome = currentScreen === 'dashboard';
  const title = SCREEN_TITLES[currentScreen] || 'Mavia';

  return (
    <header className="mobile-topbar">
      {isHome ? (
        <span className="topbar-brand">Mavia</span>
      ) : (
        <span className="topbar-brand" style={{ fontSize: 'var(--text-headline-md)', fontFamily: 'var(--font-body)' }}>
          {title}
        </span>
      )}
      <div className="topbar-actions">
        <button
          className="topbar-icon-btn"
          onClick={() => navigate('search')}
          id="topbar-search"
          aria-label="Buscar"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
        <button
          className="topbar-icon-btn"
          onClick={() => navigate('notifications')}
          id="topbar-notif"
          aria-label="Notificaciones"
          style={{ position: 'relative' }}
        >
          <span className="material-symbols-outlined">notifications</span>
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: 0,
              width: 8, height: 8,
              background: 'var(--primary)',
              borderRadius: '50%',
              border: '2px solid var(--color-bg)',
            }} />
          )}
        </button>
        <button className="topbar-icon-btn" onClick={() => navigate('settings')} id="topbar-settings" aria-label="Ajustes">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}

/* ============================================
   MOBILE BOTTOM NAV
   ============================================ */
function MobileBottomNav() {
  const { state, navigate } = useApp();
  const { currentScreen } = state;

  /* Mirror MAIN_NAV exactly so mobile matches desktop */
  const BOTTOM_NAV = [
    { id: 'dashboard', label: 'Inicio',     icon: 'dashboard'          },
    { id: 'calendar',  label: 'Calendario', icon: 'calendar_today'      },
    { id: 'tasks',     label: 'Tareas',     icon: 'check_circle'        },
    { id: 'wellness',  label: 'Bienestar',  icon: 'energy_savings_leaf' },
    { id: 'profile',   label: 'Perfil',     icon: 'person'              },
  ];

  // Map sub-screens to their parent tab
  const TAB_GROUPS = {
    dashboard: ['dashboard', 'agenda'],
    calendar:  ['calendar', 'createEvent', 'events', 'eventDetail'],
    tasks:     ['tasks', 'createTask', 'taskDetail', 'reminders'],
    wellness:  ['wellness', 'meditation', 'habits', 'createHabit', 'goals', 'createGoal', 'journal', 'gratitude', 'phrases'],
    profile:   ['profile', 'settings', 'notifications', 'statistics', 'search'],
  };

  const activeTab = Object.entries(TAB_GROUPS)
    .find(([, screens]) => screens.includes(currentScreen))?.[0] || 'dashboard';

  const fabDest = CALENDAR_SCREENS.has(currentScreen) ? 'createEvent' : 'createTask';

  return (
    <div className="mobile-bottom-nav-wrapper">
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Navegación principal">
        {BOTTOM_NAV.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`bottom-nav-item${isActive ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
              id={`bnav-${item.id}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating action button — hidden on screens with their own add button */}
      {!SCREENS_WITH_OWN_ADD.has(currentScreen) && (
        <button
          className="mobile-fab"
          onClick={() => navigate(fabDest)}
          id="bnav-fab"
          aria-label="Crear"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>add</span>
        </button>
      )}
    </div>
  );
}

/* ============================================
   TOAST
   ============================================ */
function Toast() {
  const { state } = useApp();
  const { toast } = state;
  if (!toast) return null;

  // Icon per type
  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    default: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  };

  const type = toast.type || 'default';

  return (
    <div className="toast-container">
      <div className={`toast toast-v2 ${type}`}>
        <span className="toast-icon">{icons[type] || icons.default}</span>
        <span className="toast-msg">{toast.message}</span>
      </div>
    </div>
  );
}

/* ============================================
   APP CONTENT
   ============================================ */
function AppContent() {
  const { state } = useApp();
  const { currentScreen, darkMode, authLoading } = state;
  const prevScreenRef = useRef(currentScreen);
  const [animClass, setAnimClass] = useState('screen-enter');

  useEffect(() => {
    const prev = prevScreenRef.current;
    // Decide animation direction: detail screens slide in from right, back nav slides from left
    const goingDeeper = DETAIL_SCREENS.has(currentScreen) && !DETAIL_SCREENS.has(prev);
    const goingBack   = !DETAIL_SCREENS.has(currentScreen) && DETAIL_SCREENS.has(prev);
    setAnimClass(goingBack ? 'screen-back' : 'screen-enter');
    prevScreenRef.current = currentScreen;
  }, [currentScreen]);

  // While Firebase checks the existing session, show splash
  if (authLoading) {
    return (
      <div className={darkMode ? 'dark' : ''} style={{ minHeight: '100dvh', backgroundColor: 'var(--color-bg)' }}>
        <SplashScreen />
      </div>
    );
  }

  const isAuth = AUTH_SCREENS.has(currentScreen);
  const Screen = SCREEN_MAP[currentScreen] || DashboardScreen;

  // Auth screens: full screen, no chrome
  if (isAuth) {
    return (
      <div className={darkMode ? 'dark' : ''} style={{ minHeight: '100dvh', overflowY: 'auto', backgroundColor: 'var(--color-bg)' }}>
        <Screen />
        <Toast />
      </div>
    );
  }

  return (
    <div className={`app-root${darkMode ? ' dark' : ''}`}>
      {/* Desktop: fixed sidebar */}
      <DesktopSidebar />

      {/* Mobile: fixed top bar */}
      <MobileTopBar />

      {/* Main scrollable content — keyed to trigger re-animation on screen change */}
      <main className="app-main">
        <div key={currentScreen} className={animClass}>
          <Screen />
        </div>
      </main>

      {/* Mobile: bottom nav */}
      <MobileBottomNav />

      <Toast />


    </div>
  );
}

/* ============================================
   APP ROOT
   ============================================ */
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
