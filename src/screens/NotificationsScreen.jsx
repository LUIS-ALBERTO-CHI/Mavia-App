import { useState, useCallback } from 'react';
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

// ─── Animated Card ────────────────────────────────────────────────────────────
// Holds its own "exiting" state so it can animate out before the parent removes it
function NotifCard({ n, isUnread, onMarkRead, onDelete, forceExit }) {
  const [selfExiting, setSelfExiting] = useState(false);
  const exiting = selfExiting || forceExit;
  const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.reminder;
  const Icon = cfg.icon;

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    setSelfExiting(true);
    // Let animation finish (~340ms) then actually remove from state
    setTimeout(() => onDelete(n.id), 320);
  }, [n.id, onDelete]);

  const handleClick = useCallback(() => {
    if (isUnread) onMarkRead(n.id);
  }, [isUnread, n.id, onMarkRead]);

  return (
    <div
      className={`ntf-card${isUnread ? ' unread' : ''}${exiting ? ' exiting' : ''}`}
      onClick={handleClick}
      id={`ntf-${n.id}`}
      style={!isUnread ? { opacity: 0.65 } : undefined}
    >
      <div
        className="ntf-icon"
        style={{ background: isUnread ? cfg.bg : 'var(--surface-container)' }}
      >
        <Icon
          size={19}
          color={isUnread ? cfg.color : 'var(--outline)'}
          strokeWidth={1.75}
        />
      </div>
      <div className="ntf-body">
        <div className="ntf-title">{n.title}</div>
        <div className="ntf-text">{n.text}</div>
      </div>
      <span className="ntf-time">{timeAgo(n.time)}</span>
      <button
        className="ntf-delete-btn"
        onClick={handleDelete}
        aria-label="Eliminar notificación"
        id={`ntf-del-${n.id}`}
      >
        <Trash2 size={14} strokeWidth={2} />
      </button>
      {isUnread && <div className="ntf-unread-dot" />}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const { state, dispatch } = useApp();
  const { notifications } = state;

  // Track IDs being animated out (bulk clear)
  const [exitingIds, setExitingIds] = useState(new Set());

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  const markAll  = () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  const markOne  = (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', id });

  // Single delete — handled inside NotifCard (animated)
  const deleteOne = useCallback((id) => {
    dispatch({ type: 'DELETE_NOTIFICATION', id });
  }, [dispatch]);

  // Bulk animated clear: first mark all exiting, then dispatch after animation
  const animatedClearRead = useCallback(() => {
    const readIds = new Set(notifications.filter(n => n.read).map(n => n.id));
    setExitingIds(readIds);
    setTimeout(() => {
      dispatch({ type: 'CLEAR_READ_NOTIFICATIONS' });
      setExitingIds(new Set());
    }, 340);
  }, [notifications, dispatch]);

  const animatedClearAll = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id));
    setExitingIds(allIds);
    setTimeout(() => {
      dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
      setTimeout(() => {
        dispatch({ type: 'CLEAR_READ_NOTIFICATIONS' });
        setExitingIds(new Set());
      }, 50);
    }, 340);
  }, [notifications, dispatch]);

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
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-xl);
          gap: var(--space-md);
          flex-wrap: wrap;
        }
        .ntf-actions-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
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
          /* Entry animation */
          animation: ntfCardIn 0.3s var(--ease-out) both;
          /* Exit transition — triggered by .exiting class */
          transition:
            opacity 0.28s ease,
            transform 0.28s cubic-bezier(0.4, 0, 1, 1),
            max-height 0.32s ease 0.05s,
            margin-bottom 0.32s ease 0.05s,
            padding 0.28s ease 0.05s;
          max-height: 200px;
          overflow: hidden;
          position: relative;
        }
        @keyframes ntfCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ntf-card.exiting {
          opacity: 0 !important;
          transform: translateX(60px) scale(0.94) !important;
          max-height: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          margin-bottom: 0 !important;
          pointer-events: none;
        }
        .ntf-card.unread {
          border-left: 3px solid var(--primary);
          background: rgba(248,215,232,0.08);
        }
        .ntf-card:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(112,87,101,0.08); }
        .ntf-card.exiting:hover { transform: translateX(60px) scale(0.94) !important; }

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

        /* ── Delete btn (shows on card hover) ── */
        .ntf-delete-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: none; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--outline);
          opacity: 0; transition: opacity var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
          flex-shrink: 0;
        }
        .ntf-card:hover .ntf-delete-btn { opacity: 1; }
        .ntf-delete-btn:hover { background: var(--error-container); color: var(--error); }

        .ntf-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          animation: ntfCardIn 0.4s var(--ease-out) both;
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
          {(unread.length > 0 || read.length > 0) && (
            <div className="ntf-actions-group">
              {unread.length > 0 && (
                <Button variant="ghost" size="sm" onClick={markAll} id="ntf-mark-all"
                  style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                  Marcar todas leídas
                </Button>
              )}
              {read.length > 0 && (
                <Button variant="ghost" size="sm" onClick={animatedClearRead} id="ntf-clear-read"
                  style={{ color: 'var(--error)', opacity: 0.8, fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                  Limpiar leídas
                </Button>
              )}
              {(unread.length + read.length) > 10 && (
                <Button variant="ghost" size="sm"
                  onClick={animatedClearAll}
                  id="ntf-clear-all"
                  style={{ color: 'var(--error)', fontWeight: 700, fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                  Borrar todas ({unread.length + read.length})
                </Button>
              )}
            </div>
          )}
        </div>{/* /ntf-hero-row */}

        {/* Unread */}
        {unread.length > 0 && (
          <>
            <div className="ntf-section-head">
              <span className="ntf-section-title">Sin leer</span>
              <span className="ntf-badge">{unread.length}</span>
              <div className="ntf-section-line" />
            </div>
            <div className="ntf-list">
              {unread.map(n => (
                <NotifCard
                  key={n.id}
                  n={n}
                  isUnread
                  onMarkRead={markOne}
                  onDelete={deleteOne}
                  forceExit={exitingIds.has(n.id)}
                />
              ))}
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
              {read.map(n => (
                <NotifCard
                  key={n.id}
                  n={n}
                  isUnread={false}
                  onMarkRead={markOne}
                  onDelete={deleteOne}
                  forceExit={exitingIds.has(n.id)}
                />
              ))}
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
