import { useApp } from '../../context/AppContext';

const SCREEN_TITLES = {
  dashboard:     { title: 'Mavia', subtitle: null },
  agenda:        { title: 'Agenda del día', subtitle: null },
  calendar:      { title: 'Calendario', subtitle: null },
  tasks:         { title: 'Mis tareas', subtitle: null },
  createTask:    { title: 'Nueva tarea', subtitle: null },
  taskDetail:    { title: 'Detalle de tarea', subtitle: null },
  wellness:      { title: 'Bienestar', subtitle: null },
  meditation:    { title: 'Meditación', subtitle: null },
  habits:        { title: 'Hábitos', subtitle: null },
  goals:         { title: 'Objetivos', subtitle: null },
  journal:       { title: 'Mi diario', subtitle: null },
  gratitude:     { title: 'Gratitud', subtitle: null },
  phrases:       { title: 'Frase del día', subtitle: null },
  events:        { title: 'Eventos', subtitle: null },
  reminders:     { title: 'Recordatorios', subtitle: null },
  notifications: { title: 'Notificaciones', subtitle: null },
  profile:       { title: 'Mi perfil', subtitle: null },
  settings:      { title: 'Configuración', subtitle: null },
  statistics:    { title: 'Estadísticas', subtitle: null },
  search:        { title: 'Buscar', subtitle: null },
};

const BACK_SCREENS = new Set(['createTask', 'taskDetail', 'events']);
const MAIN_NAV_SCREENS = new Set(['dashboard', 'calendar', 'tasks', 'wellness', 'profile']);

export default function TopBar() {
  const { state, dispatch, navigate, goBack } = useApp();
  const { currentScreen, notifications } = state;
  const unreadCount = notifications.filter(n => !n.read).length;

  const info = SCREEN_TITLES[currentScreen] || { title: 'Mavia' };
  const showBack = BACK_SCREENS.has(currentScreen);
  const isHome = currentScreen === 'dashboard';

  return (
    <>
      <style>{`
        .top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--topbar-height);
          background: var(--color-surface);
          display: flex;
          align-items: center;
          padding: 0 var(--space-4);
          gap: var(--space-3);
          z-index: var(--z-topbar);
          border-bottom: 1px solid rgba(248, 215, 232, 0.3);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        @media (min-width: 540px) {
          .top-bar { max-width: 480px; margin: 0 auto; }
        }

        .topbar-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
          color: var(--color-text);
          background: none;
        }

        .topbar-btn:hover { background: var(--rose-50); }
        .topbar-btn:active { transform: scale(0.92); }

        .topbar-title-wrap {
          flex: 1;
          min-width: 0;
        }

        .topbar-title {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 500;
          color: var(--color-text-dark);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar-logo {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 600;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.01em;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .notif-btn {
          position: relative;
        }

        .notif-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          border: 2px solid var(--color-surface);
          font-size: 8px;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-btn-bar {
          background: var(--beige-100);
          border-radius: var(--radius-lg);
          padding: var(--space-2) var(--space-3);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
          cursor: pointer;
          border: none;
          transition: all var(--transition-fast);
        }

        .search-btn-bar:hover { background: var(--beige-200); }

        .search-placeholder {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }
      `}</style>

      <header className="top-bar" role="banner">
        {showBack ? (
          <button className="topbar-btn" onClick={goBack} aria-label="Volver" id="topbar-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        ) : (
          <button
            className="topbar-btn"
            onClick={() => dispatch({ type: 'TOGGLE_DRAWER' })}
            aria-label="Abrir menú"
            id="topbar-menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="16" y2="12"/>
              <line x1="3" y1="18" x2="12" y2="18"/>
            </svg>
          </button>
        )}

        {isHome ? (
          <>
            <div className="topbar-title-wrap">
              <span className="topbar-logo">Mavia 🌸</span>
            </div>
            <div className="topbar-actions">
              <button
                className="topbar-btn notif-btn"
                onClick={() => navigate('notifications')}
                aria-label="Notificaciones"
                id="topbar-notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount}</span>
                )}
              </button>
              <button
                className="topbar-btn"
                onClick={() => navigate('search')}
                aria-label="Buscar"
                id="topbar-search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="topbar-title-wrap">
              <h1 className="topbar-title">{info.title}</h1>
            </div>
            <div className="topbar-actions">
              {currentScreen === 'tasks' && (
                <button
                  className="topbar-btn notif-btn"
                  onClick={() => navigate('notifications')}
                  aria-label="Notificaciones"
                  id="topbar-notif-tasks"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>
              )}
            </div>
          </>
        )}
      </header>
    </>
  );
}
