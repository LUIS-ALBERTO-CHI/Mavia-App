import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';

const navHomeIcon = (active) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    {!active && <polyline points="9,21 9,12 15,12 15,21"/>}
    {active && <path d="M9 21V12h6v9" fill="white" stroke="white" strokeWidth="1.8"/>}
  </svg>
);
const navCalendarIcon = (active) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" ry="3"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    {active && <circle cx="12" cy="15" r="2" fill="white" stroke="white"/>}
  </svg>
);
const navTasksIcon = (active) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const navWellnessIcon = (active) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
    {active && <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2"/>}
  </svg>
);
const navProfileIcon = (active) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function BottomNav() {
  const { state, navigate } = useApp();
  const { t } = useTranslation();
  const { currentScreen } = state;

  const NAV_ITEMS = [
    { id: 'dashboard', label: t('nav.home'),     icon: navHomeIcon },
    { id: 'calendar',  label: t('nav.calendar'), icon: navCalendarIcon },
    { id: 'tasks',     label: t('nav.tasks'),    icon: navTasksIcon },
    { id: 'wellness',  label: t('nav.wellness'), icon: navWellnessIcon },
    { id: 'profile',   label: t('nav.profile'),  icon: navProfileIcon },
  ];

  const activeTab = NAV_ITEMS.find(item => item.id === currentScreen)?.id || 'dashboard';

  return (
    <>
      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--bottomnav-height);
          background: var(--color-surface);
          box-shadow: var(--shadow-nav);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 var(--space-2) env(safe-area-inset-bottom, 0);
          z-index: var(--z-nav);
          border-top: 1px solid rgba(248, 215, 232, 0.4);
        }

        @media (min-width: 540px) {
          .bottom-nav {
            max-width: 480px;
            margin: 0 auto;
          }
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-lg);
          cursor: pointer;
          border: none;
          background: none;
          transition: all var(--transition-base);
          flex: 1;
          min-width: 0;
          position: relative;
        }

        .nav-item-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-spring);
        }

        .nav-item.active .nav-item-icon {
          background: var(--gradient-primary);
          color: white;
          box-shadow: 0 4px 16px rgba(212, 130, 158, 0.4);
          transform: translateY(-2px);
        }

        .nav-item:not(.active) .nav-item-icon {
          color: var(--color-text-muted);
        }

        .nav-item:not(.active):active .nav-item-icon {
          background: var(--rose-50);
          transform: scale(0.92);
        }

        .nav-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: color var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .nav-item.active .nav-label {
          color: var(--color-primary-dark);
        }

        .nav-item:not(.active) .nav-label {
          color: var(--color-text-muted);
        }

        .nav-dot {
          position: absolute;
          top: 6px;
          right: calc(50% - 16px);
          width: 6px;
          height: 6px;
          background: var(--color-primary-dark);
          border-radius: var(--radius-full);
          border: 2px solid var(--color-surface);
        }
      `}</style>

      <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              id={`nav-${item.id}`}
            >
              <span className="nav-item-icon">
                {item.icon(isActive)}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
