import { useApp } from '../context/AppContext';
import { formatTime12h, localToday } from '../lib/utils';
import { Check, Plus } from 'lucide-react';
import Sticker from '../components/Sticker';
import Mascot from '../components/Mascot';
import { DEFAULT_COLOR, formatAmount } from '../lib/entryStyle';

export default function AgendaScreen() {
  const { state, dispatch, navigate, showToast, openEntrySheet } = useApp();
  const today = localToday();

  const csid = state.currentSpaceId || 'personal';
  const items = state.tasks
    .filter(e => e.date === today && (csid === 'all' || (e.spaceId || 'personal') === csid))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const formattedDate = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const toggle = (e, entry) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_TASK', id: entry.id });
    if (!entry.completed) showToast(entry.amount ? '¡Pagado!' : '¡Hecho!', 'success');
  };

  return (
    <>
      <style>{`
        .agenda { padding: var(--space-lg) var(--space-container) var(--space-8); max-width: 640px; margin: 0 auto; }
        .agenda-date-header {
          font-family: var(--font-display); font-size: var(--text-headline-md);
          color: var(--heading); font-weight: 700; margin-bottom: var(--space-lg);
          text-transform: capitalize;
        }
        .timeline { display: flex; flex-direction: column; }
        .timeline-item { display: flex; gap: var(--space-md); position: relative; }
        .timeline-item:not(:last-child)::after {
          content: ''; position: absolute; left: 64px; top: 40px; bottom: -4px;
          width: 2px; background: linear-gradient(to bottom, var(--outline-variant), transparent);
        }
        .timeline-time-col { width: 52px; padding-top: 14px; flex-shrink: 0; }
        .timeline-time { font-size: var(--text-label-sm); font-weight: 700; color: var(--on-surface-variant); text-align: right; line-height: 1.2; }
        .timeline-dot {
          width: 34px; height: 34px; border-radius: 11px; margin-top: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);
        }
        .timeline-card {
          flex: 1; border-radius: var(--radius-xl); padding: 12px 14px; margin-bottom: 12px;
          transition: all var(--transition-spring); cursor: pointer; box-shadow: var(--shadow-card);
          border-left: 5px solid; background: var(--surface-container-lowest);
          display: flex; align-items: center; gap: 10px;
        }
        .timeline-card:active { transform: scale(0.98); }
        .timeline-card.done { opacity: 0.65; }
        .timeline-card-title { font-size: var(--text-body-md); font-weight: 600; color: var(--on-surface); line-height: 1.3; }
        .timeline-card-title.done { text-decoration: line-through; opacity: 0.6; }
        .timeline-card-meta { font-size: var(--text-label-sm); color: var(--on-surface-variant); margin-top: 2px; }
        .agenda-check {
          width: 26px; height: 26px; border-radius: 50%; border: 2px solid; background: none;
          display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
          transition: all var(--transition-spring);
        }
        .empty-agenda {
          text-align: center; padding: var(--space-lg); min-height: 58vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
        }
        .empty-agenda-title { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 700; color: var(--heading); }
        .empty-agenda-sub { font-size: var(--text-body-md); color: var(--on-surface-variant); line-height: 1.6; max-width: 280px; }
        .agenda-add-btn {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 4px;
          padding: 11px 22px; border-radius: 99px; background: var(--gradient-primary); color: #fff;
          border: none; cursor: pointer; font-weight: 700; font-size: 14px;
        }
      `}</style>

      <div className="agenda">
        <p className="agenda-date-header">{formattedDate}</p>

        {items.length === 0 ? (
          <div className="empty-agenda">
            <Mascot size={250} />
            <div className="empty-agenda-title">Día libre</div>
            <p className="empty-agenda-sub">Hoy no tienes nada agendado. Toca ＋ para agregar algo.</p>
          </div>
        ) : (
          <div className="timeline">
            {items.map(item => {
              const color  = item.color || DEFAULT_COLOR;
              const amount = formatAmount(item.amount);
              return (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-time-col">
                    <div className="timeline-time">{item.time ? formatTime12h(item.time, '–') : 'Todo\nel día'}</div>
                  </div>
                  <div className="timeline-dot" style={{ background: color }}>
                    {item.sticker
                      ? <Sticker id={item.sticker} size={22} />
                      : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div
                    className={`timeline-card${item.completed ? ' done' : ''}`}
                    style={{ borderLeftColor: color, background: `${color}26` }}
                    onClick={() => navigate('entryDetail', { entryId: item.id })}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={`timeline-card-title${item.completed ? ' done' : ''}`}>{item.title}</div>
                      <div className="timeline-card-meta">
                        {item.time ? formatTime12h(item.time, '') : 'Todo el día'}
                        {amount && <span style={{ color, fontWeight: 700, marginLeft: 6 }}>· {amount}</span>}
                      </div>
                    </div>
                    <button
                      className="agenda-check"
                      style={item.completed ? { background: color, borderColor: color } : { borderColor: color }}
                      onClick={(e) => toggle(e, item)}
                      aria-label={item.completed ? 'Marcar pendiente' : 'Marcar hecho'}
                      id={`agenda-check-${item.id}`}
                    >
                      {item.completed && <Check size={14} strokeWidth={3} color="#fff" />}
                    </button>
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
