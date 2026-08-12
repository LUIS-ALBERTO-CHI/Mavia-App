import { useContext, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays, NotebookPen, CircleUserRound, AlarmClock, Flag, Bell, Search,
  Plus, X, ChevronRight, Settings, LogOut, Menu, Palette,
} from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext';
import './styles/design-system.css';

// Screens - Auth
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import SetupProfileScreen from './screens/SetupProfileScreen';

// Screens - Main
import CalendarScreen from './screens/CalendarScreen';
import EntryDetailScreen from './screens/EntryDetailScreen';

// Screens - Planning
import GoalsScreen from './screens/GoalsScreen';
import CreateGoalScreen from './screens/CreateGoalScreen';
import JournalScreen from './screens/JournalScreen';
import SpacesScreen from './screens/SpacesScreen';
import ThemesScreen from './screens/ThemesScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import { applyTheme, getSavedTheme } from './lib/themes';

// Screens - Management
import RemindersScreen from './screens/RemindersScreen';

// Screens - System
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import SearchScreen from './screens/SearchScreen';
import NotFoundScreen from './screens/NotFoundScreen';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import CreateEntrySheet from './components/CreateEntrySheet';
import UpdatePrompt from './components/UpdatePrompt';
import AppSkeleton from './components/AppSkeleton';

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
  calendar: CalendarScreen,
  // Detalle de entrada (crear/editar es un bottom sheet, no una pantalla)
  entryDetail: EntryDetailScreen,
  taskDetail: EntryDetailScreen,
  eventDetail: EntryDetailScreen,
  goals: GoalsScreen,
  createGoal: CreateGoalScreen,
  notes: JournalScreen,
  journal: JournalScreen,
  spaces: SpacesScreen,
  reminders: RemindersScreen,
  notifications: NotificationsScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
  search: SearchScreen,
  themes: ThemesScreen,
  client: ClientDetailScreen,
};

/* ============================================
   SIDEBAR NAV ITEMS
   ============================================ */
const MAIN_NAV = [
  { id: 'calendar',  label: 'Calendario', icon: CalendarDays    },
  { id: 'notes',     label: 'Notas',      icon: NotebookPen     },
  { id: 'profile',   label: 'Perfil',     icon: CircleUserRound },
];

// Screens that already have their own "Añadir" button — hide FAB to avoid confusion
const SCREENS_WITH_OWN_ADD = new Set([
  'goals', 'notes', 'journal', 'createGoal', 'entryDetail', 'taskDetail',
  'eventDetail', 'notifications', 'search', 'profile', 'settings', 'reminders', 'spaces',
]);

// Back-navigation screens (animate slide-back instead of slide-in)
const DETAIL_SCREENS = new Set(['entryDetail', 'taskDetail', 'eventDetail', 'createGoal']);

const SCREEN_TITLES = {
  calendar: 'Calendario',
  entryDetail: 'Detalle',
  goals: 'Objetivos',
  notes: 'Notas',
  journal: 'Notas',
  spaces: 'Espacios',
  reminders: 'Recordatorios',
  notifications: 'Notificaciones',
  profile: 'Mi perfil',
  settings: 'Configuración',
  search: 'Buscar',
  themes: 'Temas',
  client: 'Cliente',
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
        background: online ? 'var(--success)' : 'var(--warning)',
        flexShrink: 0,
        boxShadow: online
          ? '0 0 0 2px color-mix(in srgb, var(--success) 25%, transparent)'
          : '0 0 0 2px color-mix(in srgb, var(--warning) 30%, transparent)',
        animation: online ? 'none' : 'connPulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

/* ============================================
   DESKTOP SIDEBAR
   ============================================ */
function DesktopSidebar() {
  const { state, navigate, dispatch, openEntrySheet } = useApp();
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
            <item.icon size={20} strokeWidth={2} className="nav-icon" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Extra items */}
        <div style={{ marginTop: '1rem', borderTop: 'var(--hairline)', paddingTop: '0.75rem' }}>
          {[
            { id: 'reminders',     label: 'Recordatorios',   icon: AlarmClock },
            { id: 'goals',         label: 'Objetivos',       icon: Flag       },
            { id: 'notifications', label: 'Notificaciones',  icon: Bell, badge: unread },
            { id: 'search',        label: 'Búsqueda',        icon: Search     },
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item${currentScreen === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
              id={`sidebar-extra-${item.id}`}
            >
              <item.icon size={20} strokeWidth={2} className="nav-icon" />
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
          onClick={() => openEntrySheet()}
          id="sidebar-cta"
        >
          <Plus size={20} strokeWidth={2} />
          Agregar
        </button>
      </div>
    </aside>
  );
}

/* ============================================
   MOBILE SIDE DRAWER  (hamburger → slide-from-left)
   ============================================ */
const DRAWER_ITEMS = [
  { id: 'reminders',  label: 'Recordatorios',  icon: AlarmClock,  section: 'Agenda',    color: '#e0a72e' },
  { id: 'notes',      label: 'Notas',          icon: NotebookPen, section: 'Trabajo',   color: '#ec4b8b' },
  { id: 'goals',      label: 'Objetivos',      icon: Flag,        section: 'Trabajo',   color: '#8a63d2' },
  { id: 'search',     label: 'Buscar',         icon: Search,      section: 'General',   color: '#3fa96b' },
];

const SECTION_ORDER = ['Agenda', 'Trabajo', 'General'];

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
          background: 'var(--overlay)',
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
          /* Sólido --primary: --on-primary está calibrado contra él (los
             gradientes de los temas tienen paradas casi blancas → ilegible) */
          background: 'var(--primary)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 130, height: 130, borderRadius: '50%',
            background: 'color-mix(in srgb, var(--on-primary, #fff) 6%, transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: 60,
            width: 90, height: 90, borderRadius: '50%',
            background: 'color-mix(in srgb, var(--on-primary, #fff) 4%, transparent)',
            pointerEvents: 'none',
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              background: 'color-mix(in srgb, var(--on-primary, #fff) 12%, transparent)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'color-mix(in srgb, var(--on-primary, #fff) 80%, transparent)',
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>

          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '2.5px solid color-mix(in srgb, var(--on-primary, #fff) 35%, transparent)',
            boxShadow: '0 0 0 5px color-mix(in srgb, var(--on-primary, #fff) 8%, transparent)',
            overflow: 'hidden',
            marginBottom: 14,
            background: 'color-mix(in srgb, var(--on-primary, #fff) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700,
            color: 'var(--on-primary, #fff)',
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
            color: 'var(--on-primary, #fff)', lineHeight: 1.25,
            letterSpacing: '-0.01em',
            marginBottom: 2,
          }}>
            {user.firstName} {user.lastName || ''}
          </div>

          {/* Email */}
          {user.email && (
            <div style={{
              fontSize: 12, color: 'color-mix(in srgb, var(--on-primary, #fff) 60%, transparent)',
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
            background: 'color-mix(in srgb, var(--on-primary, #fff) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--on-primary, #fff) 15%, transparent)',
            borderRadius: 99,
            padding: '3px 10px',
          }}>
            <ConnDot />
            <span style={{ fontSize: 11, color: 'color-mix(in srgb, var(--on-primary, #fff) 85%, transparent)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
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
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
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
                      width: 36, height: 36, borderRadius: 'var(--radius-control)',
                      background: isAct ? item.color : 'var(--surface-container)',
                      color: isAct ? 'white' : 'var(--on-surface-variant)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s ease',
                      boxShadow: isAct ? `0 3px 10px ${item.color}40` : 'none',
                    }}>
                      <item.icon size={19} strokeWidth={2} />
                    </div>

                    <span style={{
                      fontSize: 'var(--text-body-size)',
                      fontWeight: isAct ? 700 : 500,
                      color: isAct ? item.color : 'var(--on-surface)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: isAct ? '-0.01em' : 0,
                    }}>
                      {item.label}
                    </span>

                    {isAct && (
                      <ChevronRight size={16} strokeWidth={2} style={{
                        color: item.color, marginLeft: 'auto', opacity: 0.7, flexShrink: 0,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          borderTop: 'var(--hairline)',
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
              border: 'none', borderRadius: 'var(--radius-control)', cursor: 'pointer',
              color: 'var(--on-surface-variant)',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              transition: 'background 0.15s ease',
            }}
          >
            <Settings size={18} strokeWidth={2} />
            Ajustes
          </button>

          <button
            onClick={handleLogout}
            id="drawer-logout"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 8px',
              background: 'var(--error-container, #fce8e8)',
              border: 'none', borderRadius: 'var(--radius-control)', cursor: 'pointer',
              color: 'var(--error, #c0392b)',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              transition: 'background 0.15s ease',
            }}
          >
            <LogOut size={18} strokeWidth={2} />
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
          <Menu size={20} strokeWidth={2} />
        </button>

        <span className="topbar-brand" style={{ fontSize: 'var(--text-headline-md)', fontFamily: 'var(--font-body)' }}>
          {title}
        </span>
        <ConnDot />
      </div>
      <div className="topbar-actions">
        <button
          className="topbar-icon-btn"
          onClick={() => navigate('themes')}
          id="topbar-themes"
          aria-label="Temas"
        >
          <Palette size={20} strokeWidth={2} />
        </button>
        <button
          className="topbar-icon-btn"
          onClick={() => navigate('search')}
          id="topbar-search"
          aria-label="Buscar"
        >
          <Search size={20} strokeWidth={2} />
        </button>
        <button
          className="topbar-icon-btn"
          onClick={() => navigate('notifications')}
          id="topbar-notif"
          aria-label="Notificaciones"
          style={{ position: 'relative' }}
        >
          <Bell size={20} strokeWidth={2} />
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
  const { state, navigate, openEntrySheet } = useApp();
  const { currentScreen } = state;

  const BOTTOM_NAV = [
    { id: 'calendar',  label: 'Calendario', icon: CalendarDays    },
    { id: 'notes',     label: 'Notas',      icon: NotebookPen     },
    { id: 'goals',     label: 'Objetivos',  icon: Flag            },
    { id: 'profile',   label: 'Perfil',     icon: CircleUserRound },
  ];

  const TAB_GROUPS = {
    calendar:  ['calendar', 'entryDetail', 'taskDetail', 'eventDetail', 'reminders', 'client'],
    notes:     ['notes', 'journal'],
    goals:     ['goals', 'createGoal'],
    profile:   ['profile', 'settings', 'notifications', 'search', 'spaces', 'themes'],
  };

  const activeTab = Object.entries(TAB_GROUPS)
    .find(([, screens]) => screens.includes(currentScreen))?.[0] || 'calendar';

  /* ── Burbuja líquida: un solo glass que viaja al tab activo ── */
  const navEl    = useRef(null);
  const bubbleEl = useRef(null);
  const firstPlace = useRef(true);
  useEffect(() => {
    const place = () => {
      const nav = navEl.current, b = bubbleEl.current;
      if (!nav || !b) return;
      const btn = nav.querySelector(`#bnav-${activeTab}`);
      if (!btn) { b.style.opacity = '0'; return; }
      const nr = nav.getBoundingClientRect();
      const r  = btn.getBoundingClientRect();
      if (firstPlace.current) { b.style.transition = 'none'; }
      b.style.opacity = '1';
      b.style.left   = `${r.left - nr.left}px`;
      b.style.top    = `${r.top - nr.top}px`;
      b.style.width  = `${r.width}px`;
      b.style.height = `${r.height}px`;
      if (firstPlace.current) {
        requestAnimationFrame(() => { b.style.transition = ''; });
        firstPlace.current = false;
      } else {
        b.classList.remove('squish');
        void b.offsetWidth;   // reinicia la animación líquida
        b.classList.add('squish');
      }
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [activeTab]);

  return (
    <div className="mobile-bottom-nav-wrapper">
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Navegación principal" ref={navEl}>
        <span ref={bubbleEl} className="bn-bubble" aria-hidden="true"><span className="bn-bubble-glass" /></span>
        <div className="bn-group">
          {BOTTOM_NAV.slice(0, 2).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} className={`bottom-nav-item${isActive ? ' active' : ''}`}
                onClick={() => navigate(item.id)} id={`bnav-${item.id}`}
                aria-label={item.label} aria-current={isActive ? 'page' : undefined}>
                <item.icon size={30} strokeWidth={2} className="nav-icon" />
                <span className="bottom-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAB centrado — siempre agrega una entrada */}
        <button className="mobile-fab" onClick={() => openEntrySheet()} id="bnav-fab" aria-label="Agregar">
          <Plus size={26} strokeWidth={2} />
        </button>

        <div className="bn-group">
          {BOTTOM_NAV.slice(2).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} className={`bottom-nav-item${isActive ? ' active' : ''}`}
                onClick={() => navigate(item.id)} id={`bnav-${item.id}`}
                aria-label={item.label} aria-current={isActive ? 'page' : undefined}>
                <item.icon size={30} strokeWidth={2} className="nav-icon" />
                <span className="bottom-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    default: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        {toast.action && (
          <button className="toast-action" onClick={toast.action.run} id="toast-action">
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================
   APP CONTENT
   ============================================ */
function AppContent() {
  const { state, navigate, openEntrySheet, closeEntrySheet } = useApp();
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

  /* ── Atajos de teclado (desktop): N nueva entrada · / buscar · ←→ navegar mes · Esc cierra ── */
  const kbRef = useRef({});
  kbRef.current = { currentScreen, entryOpen: !!state.entrySheet, authed: !AUTH_SCREENS.has(currentScreen) };
  useEffect(() => {
    const onKey = (e) => {
      const k = kbRef.current;
      if (!k.authed) return;
      if (e.key === 'Escape') { if (k.entryOpen) closeEntrySheet(); return; }
      const el = document.activeElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey || k.entryOpen) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openEntrySheet(); }
      else if (e.key === '/') { e.preventDefault(); navigate('search'); }
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && k.currentScreen === 'calendar') {
        window.dispatchEvent(new CustomEvent('mavia:cal-nav', { detail: e.key === 'ArrowLeft' ? -1 : 1 }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Pull-to-refresh (móvil): confirma que todo está sincronizado ── */
  const mainRef = useRef(null);
  const ptrRef  = useRef({ y: 0, on: false });
  const [ptrPull, setPtrPull] = useState(0);
  const [ptrBusy, setPtrBusy] = useState(false);
  const onPtrStart = (e) => {
    if ((mainRef.current?.scrollTop || 0) <= 0 && !ptrBusy) ptrRef.current = { y: e.touches[0].clientY, on: true };
  };
  const onPtrMove = (e) => {
    const p = ptrRef.current;
    if (!p.on) return;
    const dy = e.touches[0].clientY - p.y;
    if (dy > 6 && (mainRef.current?.scrollTop || 0) <= 0) setPtrPull(Math.min(84, dy * 0.45));
    else if (dy < 0) { p.on = false; setPtrPull(0); }
  };
  const onPtrEnd = async () => {
    const pulled = ptrPull;
    ptrRef.current.on = false;
    if (pulled > 60) {
      setPtrBusy(true);
      const { haptic } = await import('./lib/haptics');
      haptic(10);
      setPtrPull(46);
      // El sync es realtime (onSnapshot): el gesto confirma que estás al día
      setTimeout(() => { setPtrBusy(false); setPtrPull(0); }, 700);
    } else {
      setPtrPull(0);
    }
  };

  /* ── Shortcuts del PWA: /?action=new-entry | new-note (long-press del icono) ── */
  const pwaActionDone = useRef(false);
  useEffect(() => {
    if (authLoading || pwaActionDone.current || AUTH_SCREENS.has(currentScreen)) return;
    const action = new URLSearchParams(window.location.search).get('action');
    pwaActionDone.current = true;
    if (!action) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (action === 'new-entry') openEntrySheet();
    else if (action === 'new-note') navigate('notes');
  }, [authLoading, currentScreen]);

  // While Firebase checks the existing session:
  //  · usuario recurrente → skeleton del calendario (percepción de carga instantánea)
  //  · primera visita     → splash de marca
  if (authLoading) {
    let returning = false;
    try { returning = localStorage.getItem('mavia_seen') === '1'; } catch {}
    return (
      <div className={darkMode ? 'dark' : ''} style={{ minHeight: '100dvh', backgroundColor: 'var(--color-bg)' }}>
        {returning ? <AppSkeleton /> : <SplashScreen />}
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
      <main className="app-main" ref={mainRef}
        onTouchStart={onPtrStart} onTouchMove={onPtrMove} onTouchEnd={onPtrEnd}>
        {ptrPull > 0 && (
          <div className="ptr-spin" style={{ height: ptrPull, opacity: Math.min(1, ptrPull / 60) }}>
            <span className={`ptr-icon${ptrPull > 60 ? ' go' : ''}${ptrBusy ? ' spin' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" />
              </svg>
            </span>
          </div>
        )}
        <div key={currentScreen} className={animClass}>
          <ErrorBoundary onReset={() => state.navigate?.('calendar')}>
            <Screen />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile: bottom nav */}
      <MobileBottomNav />

      <Toast />

      {/* Bottom sheet: crear/editar entrada (overlay sobre la pantalla actual) */}
      {state.entrySheet && <CreateEntrySheet />}

      {/* Offline/online status banner — floats above everything via Portal */}
      <OfflineBanner />

      {/* Aviso de versión nueva (deploy) → recargar */}
      <UpdatePrompt />

    </div>
  );
}

/* ============================================
   APP ROOT
   ============================================ */
export default function App() {
  // Aplica el tema guardado (paleta) al cargar
  useEffect(() => { applyTheme(getSavedTheme()); }, []);
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
