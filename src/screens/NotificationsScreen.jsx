import { useApp } from '../context/AppContext';
import { Bell, CheckCheck, Dumbbell, Target, Calendar, Award, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';

const TYPE_CONFIG = {
  reminder:   { icon: Bell,      bg: 'var(--primary-container)',   color: 'var(--primary)'   },
  habit:      { icon: CheckCheck,bg: 'var(--secondary-container)', color: 'var(--secondary)' },
  goal:       { icon: Target,    bg: 'var(--tertiary-container)',  color: 'var(--tertiary)'  },
  event:      { icon: Calendar,  bg: 'var(--secondary-container)', color: 'var(--secondary)' },
  meditation: { icon: Award,     bg: 'var(--primary-container)',   color: 'var(--primary)'   },
};

function timeAgo(time) {
  if (!time) return '';
  if (time === 'Ayer') return 'Ayer';
  return time;
}

export default function NotificationsScreen() {
  const { state, dispatch } = useApp();
  const { notifications } = state;

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  const markAll = () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  const markOne = (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', id });

  return (
    <>
      <style>{`
        /* ======= NOTIFICATIONS SCREEN ======= */
        .ntf-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 720px;
          margin: 0 auto;
        }

        .ntf-hero-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: var(--space-xl);
          gap: var(--space-md);
        }
        .ntf-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 4px;
        }
        .ntf-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
        }

        /* ── Section head ── */
        .ntf-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }
        .ntf-section-title {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .ntf-badge {
          background: var(--primary);
          color: var(--on-primary);
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 99px;
        }
        .ntf-section-line { flex: 1; height: 1px; background: rgba(208,195,200,0.25); }

        /* ── List ── */
        .ntf-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
        }

        /* ── Card ── */
        .ntf-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-md) var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          cursor: pointer;
          transition: all var(--transition-spring);
          position: relative;
          overflow: hidden;
        }
        .ntf-card.unread {
          border-left: 3px solid var(--primary);
          background: rgba(248,215,232,0.08);
        }
        .ntf-card:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(112,87,101,0.08); }

        .ntf-icon {
          width: 42px; height: 42px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ntf-body { flex: 1; min-width: 0; }
        .ntf-title {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 3px;
        }
        .ntf-text {
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
          line-height: var(--leading-relaxed);
        }

        .ntf-time {
          font-size: var(--text-label-sm);
          color: var(--outline);
          flex-shrink: 0;
          padding-top: 2px;
        }

        /* ── Unread dot ── */
        .ntf-unread-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--primary);
          position: absolute;
          top: 16px; right: 14px;
        }

        /* ── Empty ── */
        .ntf-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .ntf-empty-icon {
          width: 80px; height: 80px;
          border-radius: var(--radius-full);
          background: var(--surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ntf-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
        }
        .ntf-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 240px;
          line-height: var(--leading-relaxed);
        }
      `}</style>

      <div className="ntf-screen">

        {/* Hero */}
        <div className="ntf-hero-row">
          <div>
            <h1 className="ntf-hero-title">Notificaciones</h1>
            <p className="ntf-hero-sub">
              {unread.length > 0 ? `${unread.length} sin leer` : 'Todo al día'}
            </p>
          </div>
          {unread.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} id="ntf-mark-all">
              Marcar todas leídas
            </Button>
          )}
        </div>

        {/* Unread */}
        {unread.length > 0 && (
          <>
            <div className="ntf-section-head">
              <span className="ntf-section-title">Sin leer</span>
              <span className="ntf-badge">{unread.length}</span>
              <div className="ntf-section-line" />
            </div>
            <div className="ntf-list">
              {unread.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.reminder;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className="ntf-card unread"
                    onClick={() => markOne(n.id)}
                    id={`ntf-${n.id}`}
                  >
                    <div className="ntf-icon" style={{ background: cfg.bg }}>
                      <Icon size={19} color={cfg.color} strokeWidth={1.75} />
                    </div>
                    <div className="ntf-body">
                      <div className="ntf-title">{n.title}</div>
                      <div className="ntf-text">{n.text}</div>
                    </div>
                    <span className="ntf-time">{timeAgo(n.time)}</span>
                    <div className="ntf-unread-dot" />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Read */}
        {read.length > 0 && (
          <>
            <div className="ntf-section-head">
              <span className="ntf-section-title">Anteriores</span>
              <div className="ntf-section-line" />
            </div>
            <div className="ntf-list">
              {read.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.reminder;
                const Icon = cfg.icon;
                return (
                  <div key={n.id} className="ntf-card" id={`ntf-${n.id}`} style={{ opacity: 0.7 }}>
                    <div className="ntf-icon" style={{ background: 'var(--surface-container)' }}>
                      <Icon size={19} color="var(--outline)" strokeWidth={1.75} />
                    </div>
                    <div className="ntf-body">
                      <div className="ntf-title">{n.title}</div>
                      <div className="ntf-text">{n.text}</div>
                    </div>
                    <span className="ntf-time">{timeAgo(n.time)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty */}
        {notifications.length === 0 && (
          <div className="ntf-empty">
            <div className="ntf-empty-icon">
              <Bell size={36} color="var(--outline)" strokeWidth={1.25} />
            </div>
            <div className="ntf-empty-title">Sin notificaciones</div>
            <p className="ntf-empty-sub">Aquí aparecerán tus recordatorios, hábitos y logros.</p>
          </div>
        )}

      </div>
    </>
  );
}
