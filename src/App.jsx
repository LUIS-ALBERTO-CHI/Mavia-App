import { useContext, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

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
import NotFoundScreen from './screens/NotFoundScreen';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';

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
   CONNECTION STATUS HOOK
   ============================================ */
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/* Connection dot — green or amber, pulses when offline */
function ConnDot() {
  const online = useOnlineStatus();
  return (
    <span
      title={online ? 'Online' : 'Sin conexión'}
      style={{
        display: 'inline-block',
        width: 7, height: 7,
        borderRadius: '50%',
        background: online ? '#4ade80' : '#fb923c',
        flexShrink: 0,
        boxShadow: online
          ? '0 0 0 2px rgba(74,222,128,0.25)'
          : '0 0 0 2px rgba(251,146,60,0.3)',
        animation: online ? 'none' : 'connPulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

/* ============================================
   DESKTOP SIDEBAR
   ============================================ */
function DesktopSidebar() {
  const { state, navigate, dispatch } = useApp();
  const { currentScreen, user, notifications } = state;
  const unread = notifications.filter(n => !n.read).length;
  const online = useOnlineStatus();

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
            <div className="sidebar-user-sub" style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <ConnDot />
              <span>{online ? 'Online' : 'Sin conexión'}</span>
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
   MOBILE SIDE DRAWER  (hamburger → slide-from-left)
   ============================================ */
const DRAWER_ITEMS = [
  { id: 'habits',     label: 'Hábitos',       icon: 'self_care',    section: 'Bienestar',  color: '#546347' },
  { id: 'goals',      label: 'Objetivos',     icon: 'flag',         section: 'Bienestar',  color: '#695e37' },
  { id: 'journal',    label: 'Diario',        icon: 'book_2',       section: 'Bienestar',  color: '#705765' },
  { id: 'gratitude',  label: 'Gratitud',      icon: 'favorite',     section: 'Bienestar',  color: '#8c5f7a' },
  { id: 'phrases',    label: 'Frases',        icon: 'format_quote', section: 'Bienestar',  color: '#546347' },
  { id: 'reminders',  label: 'Recordatorios', icon: 'alarm',        section: 'Tareas',     color: '#705765' },
  { id: 'events',     label: 'Eventos',       icon: 'event',        section: 'Calendario', color: '#695e37' },
  { id: 'statistics', label: 'Estadísticas',  icon: 'bar_chart',    section: 'General',    color: '#546347' },
  { id: 'search',     label: 'Buscar',        icon: 'search',       section: 'General',    color: '#705765' },
];

const SECTION_ORDER = ['Bienestar', 'Tareas', 'Calendario', 'General'];

function MobileSideDrawer({ open, onClose }) {
  const { state, navigate, dispatch } = useApp();
  const { currentScreen, user } = state;
  const online = useOnlineStatus();

  const go = (id) => { onClose(); navigate(id); };
  const handleLogout = () => { onClose(); dispatch({ type: 'LOGOUT' }); };

  // Group items by section preserving SECTION_ORDER
  const sections = {};
  DRAWER_ITEMS.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  if (!open) return null;

  const initials = [user.firstName, user.lastName]
    .filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'M';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(18,12,16,0.5)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease both',
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de secciones"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 'min(82vw, 310px)',
          zIndex: 9991,
          background: 'var(--surface)',
          display: 'flex', flexDirection: 'column',
          animation: 'drawerIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
          boxShadow: '8px 0 48px rgba(18,12,16,0.22)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          position: 'relative',
          padding: '56px 22px 24px',
          background: 'linear-gradient(160deg, #705765 0%, #57404d 55%, #3d2d38 100%)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: 60,
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>

          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '2.5px solid rgba(255,255,255,0.35)',
            boxShadow: '0 0 0 5px rgba(255,255,255,0.08)',
            overflow: 'hidden',
            marginBottom: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700,
            color: 'white',
            fontFamily: 'var(--font-display)',
          }}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : initials
            }
          </div>

          {/* Name */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20, fontWeight: 400,
            color: 'white', lineHeight: 1.25,
            letterSpacing: '-0.01em',
            marginBottom: 2,
          }}>
            {user.firstName} {user.lastName || ''}
          </div>

          {/* Email */}
          {user.email && (
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.6)',
              marginBottom: 10,
              fontFamily: 'var(--font-body)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.email}
            </div>
          )}

          {/* Online badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 99,
            padding: '3px 10px',
          }}>
            <ConnDot />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              {online ? 'Online' : 'Sin conexión'}
            </span>
          </div>
        </div>

        {/* ── Nav sections ── */}
        <nav style={{ flex: 1, padding: '8px 0 12px', overflowY: 'auto' }}>
          {SECTION_ORDER.filter(s => sections[s]).map((sectionName, sIdx) => (
            <div key={sectionName}>
              {/* Section label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                margin: sIdx === 0 ? '14px 16px 6px' : '18px 16px 6px',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--on-surface-variant)', opacity: 0.55,
                  fontFamily: 'var(--font-body)',
                }}>{sectionName}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)', opacity: 0.5 }} />
              </div>

              {/* Items */}
              {sections[sectionName].map(item => {
                const isAct = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    id={`drawer-${item.id}`}
                    aria-current={isAct ? 'page' : undefined}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 13,
                      padding: '8px 16px 8px 14px',
                      margin: '1px 0',
                      background: isAct
                        ? 'linear-gradient(90deg, var(--primary-container), transparent)'
                        : 'transparent',
                      border: 'none', cursor: 'pointer',
                      borderLeft: isAct ? `3px solid ${item.color}` : '3px solid transparent',
                      textAlign: 'left',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {/* Icon pill */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: isAct ? item.color : 'var(--surface-container)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s ease',
                      boxShadow: isAct ? `0 3px 10px ${item.color}40` : 'none',
                    }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 19,
                          color: isAct ? 'white' : 'var(--on-surface-variant)',
                        }}
                      >
                        {item.icon}
                      </span>
                    </div>

                    <span style={{
                      fontSize: 14,
                      fontWeight: isAct ? 700 : 500,
                      color: isAct ? item.color : 'var(--on-surface)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: isAct ? '-0.01em' : 0,
                    }}>
                      {item.label}
                    </span>

                    {isAct && (
                      <span className="material-symbols-outlined" style={{
                        fontSize: 16, color: item.color, marginLeft: 'auto', opacity: 0.7,
                      }}>chevron_right</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid var(--outline-variant)',
          padding: '12px 14px calc(env(safe-area-inset-bottom,0px) + 16px)',
          display: 'flex', gap: 8,
          flexShrink: 0,
        }}>
          <button
            onClick={() => go('settings')}
            id="drawer-settings"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 8px',
              background: 'var(--surface-container)',
              border: 'none', borderRadius: 14, cursor: 'pointer',
              color: 'var(--on-surface-variant)',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              transition: 'background 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
            Ajustes
          </button>

          <button
            onClick={handleLogout}
            id="drawer-logout"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 8px',
              background: 'var(--error-container, #fce8e8)',
              border: 'none', borderRadius: 14, cursor: 'pointer',
              color: 'var(--error, #c0392b)',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              transition: 'background 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Salir
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}




/* ============================================
   MOBILE TOP BAR
   ============================================ */
function MobileTopBar({ onMenuOpen }) {
  const { state, navigate } = useApp();
  const { currentScreen, notifications } = state;
  const unread  = notifications.filter(n => !n.read).length;
  const isHome  = currentScreen === 'dashboard';
  const title   = SCREEN_TITLES[currentScreen] || 'Mavia';

  return (
    <header className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Hamburger — opens side drawer */}
        <button
          className="topbar-icon-btn"
          onClick={onMenuOpen}
          id="topbar-menu"
          aria-label="Abrir menú"
          style={{ marginLeft: -6 }}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {isHome ? (
          <span className="topbar-brand">Mavia</span>
        ) : (
          <span className="topbar-brand" style={{ fontSize: 'var(--text-headline-md)', fontFamily: 'var(--font-body)' }}>
            {title}
          </span>
        )}
        <ConnDot />
      </div>
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
      </div>
    </header>
  );
}

/* ============================================
   MOBILE BOTTOM NAV  — clean 5 tabs
   ============================================ */
function MobileBottomNav() {
  const { state, navigate } = useApp();
  const { currentScreen } = state;

  const BOTTOM_NAV = [
    { id: 'dashboard', label: 'Inicio',     icon: 'home'               },
    { id: 'calendar',  label: 'Calendario', icon: 'calendar_today'      },
    { id: 'tasks',     label: 'Tareas',     icon: 'check_circle'        },
    { id: 'wellness',  label: 'Bienestar',  icon: 'energy_savings_leaf' },
    { id: 'profile',   label: 'Perfil',     icon: 'person'              },
  ];

  const TAB_GROUPS = {
    dashboard: ['dashboard', 'agenda'],
    calendar:  ['calendar', 'createEvent', 'events', 'eventDetail'],
    tasks:     ['tasks', 'createTask', 'taskDetail', 'reminders'],
    wellness:  ['wellness', 'meditation', 'habits', 'createHabit', 'goals',
                'createGoal', 'journal', 'gratitude', 'phrases'],
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

      {/* FAB */}
      {!SCREENS_WITH_OWN_ADD.has(currentScreen) && (
        <button className="mobile-fab" onClick={() => navigate(fabDest)} id="bnav-fab" aria-label="Crear">
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const prev = prevScreenRef.current;
    const goingBack = !DETAIL_SCREENS.has(currentScreen) && DETAIL_SCREENS.has(prev);
    setAnimClass(goingBack ? 'screen-back' : 'screen-enter');
    prevScreenRef.current = currentScreen;
    // Close drawer on screen change
    setDrawerOpen(false);
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
  const Screen = SCREEN_MAP[currentScreen] ?? NotFoundScreen;

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

      {/* Mobile: fixed top bar with hamburger */}
      <MobileTopBar onMenuOpen={() => setDrawerOpen(true)} />

      {/* Mobile: side drawer (hamburger menu) */}
      <MobileSideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main scrollable content — keyed to trigger re-animation on screen change */}
      <main className="app-main">
        <div key={currentScreen} className={animClass}>
          <ErrorBoundary onReset={() => state.navigate?.('dashboard')}>
            <Screen />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile: bottom nav */}
      <MobileBottomNav />

      <Toast />

      {/* Offline/online status banner — floats above everything via Portal */}
      <OfflineBanner />

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
