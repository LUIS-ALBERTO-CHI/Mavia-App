import { useApp } from '../context/AppContext';
import { Calendar, Clock, MapPin, Plus, Users, BookOpen, Briefcase, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { localToday, localDateOffset } from '../lib/utils';

const TYPE_CONFIG = {
  'reunión':  { icon: Users,    bg: 'var(--secondary-container)', color: 'var(--secondary)' },
  'personal': { icon: Heart,    bg: 'var(--primary-container)',   color: 'var(--primary)'   },
  'formación':{ icon: BookOpen, bg: 'var(--tertiary-container)',  color: 'var(--tertiary)'  },
  'trabajo':  { icon: Briefcase,bg: 'rgba(74,111,165,0.12)',      color: '#4a6fa5'          },
};

function groupByDate(events) {
  return events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});
}

function formatGroupDate(dateStr) {
  const today    = localToday();
  const tomorrow = localDateOffset(1);
  if (dateStr === today)    return 'Hoy';
  if (dateStr === tomorrow) return 'Mañana';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).replace(/^\w/, c => c.toUpperCase());
}

export default function EventsScreen() {
  const { state, navigate } = useApp();

  const sorted = [...state.events].sort((a, b) =>
    a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );
  const grouped = groupByDate(sorted);
  const dates   = Object.keys(grouped).sort();

  const today = localToday();
  const upcoming = sorted.filter(e => e.date >= today).length;

  return (
    <>
      <style>{`
        /* ======= EVENTS SCREEN ======= */
        .evs-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 860px;
          margin: 0 auto;
        }

        .evs-hero-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        .evs-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          margin-bottom: 6px;
        }
        .evs-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
        }

        /* ── Date group ── */
        .evs-group { margin-bottom: var(--space-xl); }

        .evs-group-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }
        .evs-group-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .evs-group-label.today { color: var(--primary); }
        .evs-group-line { flex: 1; height: 1px; background: rgba(208,195,200,0.25); }

        /* ── Event card ── */
        .evs-list { display: flex; flex-direction: column; gap: var(--space-md); }

        .evs-card {
          display: flex;
          gap: var(--space-md);
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-md) var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          border-left: 4px solid transparent;
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          cursor: pointer;
          transition: all var(--transition-spring);
          align-items: flex-start;
        }
        .evs-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(112,87,101,0.09);
        }

        .evs-card-icon {
          width: 42px; height: 42px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .evs-card-body { flex: 1; min-width: 0; }
        .evs-card-title {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .evs-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }
        .evs-meta-item {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .evs-card-color {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }

        /* ── Empty ── */
        .evs-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .evs-empty-icon {
          width: 80px; height: 80px;
          border-radius: var(--radius-full);
          background: var(--secondary-container);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .evs-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
        }
        .evs-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 240px;
          line-height: var(--leading-relaxed);
        }
      `}</style>

      <div className="evs-screen">

        {/* Hero */}
        <div className="evs-hero-row">
          <div>
            <h1 className="evs-hero-title">Mis Eventos</h1>
            <p className="evs-hero-sub">
              {upcoming > 0 ? `${upcoming} evento${upcoming !== 1 ? 's' : ''} próximo${upcoming !== 1 ? 's' : ''}` : 'Sin eventos próximos'}
            </p>
          </div>
          <Button onClick={() => navigate('createEvent')} id="evs-create">
            <Plus size={16} />
            Nuevo evento
          </Button>
        </div>

        {/* Grouped events */}
        {dates.length === 0 ? (
          <div className="evs-empty">
            <div className="evs-empty-icon">
              <Calendar size={38} color="var(--secondary)" strokeWidth={1.25} />
            </div>
            <div className="evs-empty-title">Sin eventos</div>
            <p className="evs-empty-sub">Añade tu primer evento para empezar a organizar tu tiempo.</p>
            <Button variant="soft" onClick={() => navigate('createEvent')} id="evs-create-empty">
              <Plus size={15} /> Crear evento
            </Button>
          </div>
        ) : (
          dates.map(date => {
            const isToday = date === today;
            return (
              <div key={date} className="evs-group">
                <div className="evs-group-head">
                  <span className={`evs-group-label${isToday ? ' today' : ''}`}>
                    {formatGroupDate(date)}
                  </span>
                  <div className="evs-group-line" />
                </div>
                <div className="evs-list">
                  {grouped[date].map(ev => {
                    const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG['personal'];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={ev.id}
                        className="evs-card"
                        style={{ borderLeftColor: ev.color || cfg.color }}
                        onClick={() => navigate('eventDetail', { eventId: ev.id })}
                        id={`evs-card-${ev.id}`}
                      >
                        <div className="evs-card-icon" style={{ background: cfg.bg }}>
                          <Icon size={19} color={cfg.color} strokeWidth={1.75} />
                        </div>
                        <div className="evs-card-body">
                          <div className="evs-card-title">{ev.title}</div>
                          <div className="evs-card-meta">
                            <span className="evs-meta-item">
                              <Clock size={12} strokeWidth={2} />
                              {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}
                            </span>
                            {ev.location && (
                              <span className="evs-meta-item">
                                <MapPin size={12} strokeWidth={2} />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="evs-card-color" style={{ background: ev.color || cfg.color }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

      </div>
    </>
  );
}
