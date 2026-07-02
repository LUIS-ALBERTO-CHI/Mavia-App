import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';

const DRAWER_SECTIONS = [
  {
    title: 'Gestión',
    items: [
      { id: 'reminders', label: 'Recordatorios', emoji: '🔔' },
      { id: 'events',    label: 'Eventos',        emoji: '📅' },
      { id: 'goals',     label: 'Objetivos',      emoji: '🎯' },
      { id: 'habits',    label: 'Hábitos',        emoji: '✅' },
    ],
  },
  {
    title: 'Bienestar',
    items: [
      { id: 'journal',   label: 'Diario',          emoji: '📓' },
      { id: 'gratitude', label: 'Gratitud',         emoji: '🙏' },
      { id: 'phrases',   label: 'Frases del día',   emoji: '✨' },
      { id: 'wellness',  label: 'Meditación',       emoji: '🧘‍♀️' },
    ],
  },
  {
    title: 'Analítica',
    items: [
      { id: 'statistics',    label: 'Estadísticas',   emoji: '📊' },
      { id: 'search',        label: 'Buscador',        emoji: '🔍' },
      { id: 'notifications', label: 'Notificaciones',  emoji: '🔔' },
      { id: 'agenda',        label: 'Agenda del día',  emoji: '🗓️' },
    ],
  },
];

export default function SideDrawer() {
  const { state, dispatch, navigate } = useApp();
  const { t } = useTranslation();
  const { sideDrawerOpen, user, currentScreen, notifications } = state;
  const unreadCount = notifications.filter(n => !n.read).length;

  const DRAWER_SECTIONS = [
    {
      title: t('drawer.management'),
      items: [
        { id: 'reminders', label: t('drawer.reminders'), emoji: '🔔' },
        { id: 'events',    label: t('drawer.events'),    emoji: '📅' },
        { id: 'goals',     label: t('drawer.goals'),     emoji: '🎯' },
        { id: 'habits',    label: t('drawer.habits'),    emoji: '✅' },
      ],
    },
    {
      title: t('drawer.wellbeing'),
      items: [
        { id: 'journal',   label: t('drawer.journal'),   emoji: '📓' },
        { id: 'gratitude', label: t('drawer.gratitude'), emoji: '🙏' },
        { id: 'phrases',   label: t('drawer.phrases'),   emoji: '✨' },
        { id: 'wellness',  label: t('drawer.meditation'),emoji: '🧘' },
      ],
    },
    {
      title: t('drawer.analytics'),
      items: [
        { id: 'statistics',    label: t('drawer.statistics'),    emoji: '📊' },
        { id: 'search',        label: t('drawer.search'),        emoji: '🔍' },
        { id: 'notifications', label: t('drawer.notifications'), emoji: '🔔' },
        { id: 'agenda',        label: t('drawer.agenda'),        emoji: '🗓️' },
      ],
    },
  ];

  const handleNavigate = (screen) => {
    navigate(screen);
    dispatch({ type: 'CLOSE_DRAWER' });
  };

  return (
    <>
      <style>{`
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: var(--color-overlay);
          z-index: var(--z-drawer);
          animation: fadeIn 200ms ease;
        }

        .side-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: min(80vw, 300px);
          background: var(--color-surface);
          z-index: var(--z-drawer);
          overflow-y: auto;
          animation: drawerIn 300ms var(--ease-spring);
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 40px rgba(0,0,0,0.12);
        }

        .drawer-header {
          padding: calc(var(--space-8) + env(safe-area-inset-top, 0px)) var(--space-5) var(--space-6);
          background: var(--gradient-soft);
          position: relative;
          overflow: hidden;
        }

        .drawer-header::before {
          content: '🌸';
          position: absolute;
          right: -10px;
          top: 10px;
          font-size: 5rem;
          opacity: 0.15;
          transform: rotate(15deg);
        }

        .drawer-avatar {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xl);
          font-weight: 700;
          color: white;
          margin-bottom: var(--space-3);
          box-shadow: var(--shadow-md);
        }

        .drawer-user-name {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 500;
          color: var(--color-text-dark);
          line-height: 1.2;
        }

        .drawer-user-email {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .drawer-body {
          flex: 1;
          padding: var(--space-4) var(--space-3);
          overflow-y: auto;
        }

        .drawer-section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          padding: var(--space-4) var(--space-3) var(--space-2);
        }

        .drawer-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-3);
          border-radius: var(--radius-lg);
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: all var(--transition-fast);
          position: relative;
        }

        .drawer-item:hover,
        .drawer-item.active {
          background: var(--rose-50);
        }

        .drawer-item.active {
          background: linear-gradient(135deg, var(--rose-100) 0%, var(--lavender-100) 100%);
        }

        .drawer-item-emoji {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--beige-100);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          transition: transform var(--transition-spring);
        }

        .drawer-item:hover .drawer-item-emoji,
        .drawer-item.active .drawer-item-emoji {
          transform: scale(1.1);
          background: var(--rose-100);
        }

        .drawer-item-label {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text);
          flex: 1;
        }

        .drawer-item.active .drawer-item-label {
          color: var(--color-primary-dark);
          font-weight: 600;
        }

        .drawer-badge {
          background: var(--gradient-primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          min-width: 18px;
          text-align: center;
        }

        .drawer-footer {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--beige-200);
        }

        .drawer-close {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.5);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }

        .drawer-close:hover {
          background: rgba(255,255,255,0.9);
          color: var(--color-text);
        }

        .drawer-divider {
          height: 1px;
          background: var(--beige-200);
          margin: var(--space-2) var(--space-3);
        }
      `}</style>

      {sideDrawerOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
            aria-label="Cerrar menú"
          />
          <aside className="side-drawer" role="navigation" aria-label="Menú lateral">
            {/* Header */}
            <div className="drawer-header">
              <button
                className="drawer-close"
                onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
                aria-label="Cerrar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <div className="drawer-avatar">
                {user.firstName?.[0] || 'A'}
              </div>
              <div className="drawer-user-name">{user.name}</div>
              <div className="drawer-user-email">{user.email}</div>
            </div>

            {/* Body */}
            <div className="drawer-body">
              {DRAWER_SECTIONS.map((section) => (
                <div key={section.title}>
                  <div className="drawer-section-title">{section.title}</div>
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      className={`drawer-item${currentScreen === item.id ? ' active' : ''}`}
                      onClick={() => handleNavigate(item.id)}
                      id={`drawer-${item.id}`}
                    >
                      <span className="drawer-item-emoji">{item.emoji}</span>
                      <span className="drawer-item-label">{item.label}</span>
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span className="drawer-badge">{unreadCount}</span>
                      )}
                    </button>
                  ))}
                  <div className="drawer-divider" />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="drawer-footer">
              <button
                className="drawer-item"
                onClick={() => handleNavigate('settings')}
              >
                <span className="drawer-item-emoji">⚙️</span>
                <span className="drawer-item-label">{t('drawer.settings')}</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
