import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import PriorityBadge from '../components/PriorityBadge';
import { formatTime12h } from '../lib/utils';

const EVENT_COLORS = {
  reunión:   { bg: '#EDE7F6', text: '#6B3FA0' },
  personal:  { bg: '#FFD6EC', text: '#8E3F6D' },
  formación: { bg: '#E8F5E4', text: '#3D6B35' },
  trabajo:   { bg: '#FDF3DC', text: '#8A5A00' },
  default:   { bg: '#F5F5F5', text: '#666' },
};

export default function AgendaScreen() {
  const { state, dispatch, navigate, showToast } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = state.events.filter(e => e.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayTasks  = state.tasks.filter(t => t.date === today && !t.completed).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const allItems = [
    ...todayEvents.map(e => ({ ...e, _type: 'event' })),
    ...todayTasks.map(t => ({ ...t, _type: 'task', startTime: t.time })),
  ].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const formattedDate = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <style>{`
        .agenda {
          padding: var(--space-5) var(--space-4) var(--space-8);
        }

        .agenda-date-header {
          font-family: var(--font-display);
          font-size: var(--text-lg);
          color: var(--color-text-muted);
          font-style: italic;
          margin-bottom: var(--space-6);
          text-transform: capitalize;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-item {
          display: flex;
          gap: var(--space-3);
          position: relative;
        }

        .timeline-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 38px;
          top: 52px;
          bottom: -8px;
          width: 2px;
          background: linear-gradient(to bottom, var(--rose-200), transparent);
        }

        .timeline-time-col {
          width: 56px;
          padding-top: var(--space-4);
          flex-shrink: 0;
        }

        .timeline-time {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-muted);
          letter-spacing: 0.03em;
          text-align: right;
        }

        .timeline-dot {
          width: 16px;
          height: 16px;
          border-radius: var(--radius-full);
          margin-top: var(--space-4);
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
          border: 2px solid var(--color-surface);
        }

        .timeline-card {
          flex: 1;
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          margin-bottom: var(--space-3);
          transition: all var(--transition-spring);
          cursor: pointer;
          box-shadow: var(--shadow-card);
        }

        .timeline-card:active { transform: scale(0.97); }

        .timeline-card-title {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--color-text-dark);
          margin-bottom: var(--space-1);
        }

        .timeline-card-meta {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .timeline-duration {
          font-size: var(--text-xs);
          font-weight: 600;
          opacity: 0.7;
        }

        .timeline-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px var(--space-2);
          border-radius: var(--radius-full);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .timeline-complete-btn {
          margin-top: var(--space-3);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid currentColor;
          background: none;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
        }

        .empty-agenda {
          text-align: center;
          padding: var(--space-12) var(--space-6);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .empty-agenda-emoji {
          font-size: 4rem;
          animation: float 3s ease-in-out infinite;
        }

        .empty-agenda-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 500;
          color: var(--color-text-dark);
        }

        .empty-agenda-sub {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          line-height: var(--leading-relaxed);
          max-width: 260px;
        }
      `}</style>

      <div className="agenda">
        <p className="agenda-date-header">{formattedDate}</p>

        {allItems.length === 0 ? (
          <div className="empty-agenda">
            <div className="empty-agenda-emoji"></div>
            <div className="empty-agenda-title">Día libre</div>
            <p className="empty-agenda-sub">Hoy tienes un espacio para respirar No hay eventos ni tareas programadas.</p>
            <button className="btn btn-primary" onClick={() => navigate('createTask')} id="agenda-create">
              + Agregar tarea
            </button>
          </div>
        ) : (
          <div className="timeline">
            {allItems.map((item, index) => {
              const isEvent = item._type === 'event';
              const colors = isEvent ? (EVENT_COLORS[item.type] || EVENT_COLORS.default) : { bg: item.color + '40', text: 'var(--color-text-dark)' };

              return (
                <div key={item.id + item._type} className="timeline-item">
                  <div className="timeline-time-col">
                    <div className="timeline-time">{formatTime12h(item.startTime, '–')}</div>
                  </div>
                  <div
                    className="timeline-dot"
                    style={{ background: isEvent ? item.color : (item.color || 'var(--rose-300)') }}
                  />
                  <div
                    className="timeline-card"
                    style={{ background: colors.bg }}
                    onClick={() => isEvent ? navigate('events') : navigate('taskDetail', { taskId: item.id })}
                  >
                    <div className="timeline-card-title" style={{ color: colors.text }}>
                      {item.title}
                    </div>
                    <div className="timeline-card-meta">
                      {isEvent ? (
                        <>
                          {item.endTime && (
                            <span className="timeline-duration">{formatTime12h(item.startTime)} – {formatTime12h(item.endTime)}</span>
                          )}
                          {item.location && <span>📍 {item.location}</span>}
                          <span
                            className="timeline-badge"
                            style={{ background: colors.text + '20', color: colors.text }}
                          >
                            {item.type}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{item.category}</span>
                          {item.priority && <PriorityBadge priority={item.priority} />}
                        </>
                      )}
                    </div>
                    {!isEvent && (
                      <button
                        className="timeline-complete-btn"
                        style={{ color: colors.text || 'var(--color-primary-dark)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'TOGGLE_TASK', id: item.id });
                          showToast('¡Tarea completada!', 'success');
                        }}
                        id={`agenda-complete-${item.id}`}
                      >
                        ✓ Completar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </>
  );
}
