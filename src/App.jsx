import { useContext, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './styles/design-system.css';
import TestPushButton from './components/TestPushButton';

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
          <div className="sidebar-avatar">
            {user.firstName?.[0] || 'A'}
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

  const activeTab = MAIN_NAV.find(n => n.id === currentScreen)?.id || 'dashboard';
  const fabDest   = CALENDAR_SCREENS.has(currentScreen) ? 'createEvent' : 'createTask';

  // LEFT: Inicio, Bienestar  |  FAB  |  RIGHT: Tareas, Perfil
  const LEFT_ITEMS  = [MAIN_NAV[0], MAIN_NAV[3]]; // dashboard, wellness
  const RIGHT_ITEMS = [MAIN_NAV[2], MAIN_NAV[4]]; // tasks, profile

  return (
    <nav className="mobile-bottom-nav" role="navigation">
      {LEFT_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item${activeTab === item.id ? ' active' : ''}`}
          onClick={() => navigate(item.id)}
          id={`bnav-${item.id}`}
          aria-label={item.label}
        >
          <span className="material-symbols-outlined nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}

      {/* FAB center raised — contextual destination */}
      <div className="bottom-nav-fab-wrap">
        <button
          className="bottom-nav-fab"
          onClick={() => navigate(fabDest)}
          id="bnav-fab"
          aria-label="Crear"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add</span>
        </button>
      </div>

      {RIGHT_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item${activeTab === item.id ? ' active' : ''}`}
          onClick={() => navigate(item.id)}
          id={`bnav-${item.id}`}
          aria-label={item.label}
        >
          <span className="material-symbols-outlined nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ============================================
   TOAST
   ============================================ */
function Toast() {
  const { state } = useApp();
  const { toast } = state;
  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast ${toast.type || ''}`}>{toast.message}</div>
    </div>
  );
}

/* ============================================
   APP CONTENT
   ============================================ */
function AppContent() {
  const { state, navigate } = useApp();
  const { currentScreen, darkMode, authLoading } = state;

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

      {/* Main scrollable content */}
      <main className="app-main">
        <Screen />
      </main>

      {/* Mobile: bottom nav */}
      <MobileBottomNav />

      <Toast />

      {/* Test push button — diagnóstico de notificaciones */}
      <TestPushButton />
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
