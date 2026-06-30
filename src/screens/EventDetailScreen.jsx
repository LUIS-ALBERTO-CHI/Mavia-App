import { useApp } from '../context/AppContext';
import { ArrowLeft, Calendar, Clock, MapPin, Trash2, Edit2, Users, BookOpen, Briefcase, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatTime12h } from '../lib/utils';

const TYPE_CONFIG = {
  'reunión':  { icon: Users,    bg: 'var(--secondary-container)', color: 'var(--secondary)', label: 'Reunión'  },
  'personal': { icon: Heart,    bg: 'var(--primary-container)',   color: 'var(--primary)',   label: 'Personal' },
  'formación':{ icon: BookOpen, bg: 'var(--tertiary-container)',  color: 'var(--tertiary)',  label: 'Formación'},
  'trabajo':  { icon: Briefcase,bg: 'rgba(74,111,165,0.12)',      color: '#4a6fa5',          label: 'Trabajo'  },
};

function formatDate(dateStr) {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === today)    return 'Hoy';
  if (dateStr === tomorrow) return 'Mañana';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).replace(/^\w/, c => c.toUpperCase());
}

export default function EventDetailScreen() {
  const { state, dispatch, goBack, navigate, showToast } = useApp();

  const eventId = state.screenParams?.eventId;
  const event   = state.events.find(e => e.id === eventId);

  if (!event) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--on-surface-variant)' }}>Evento no encontrado.</p>
        <Button variant="ghost" onClick={goBack} style={{ marginTop: 16 }}>Volver</Button>
      </div>
    );
  }

  const cfg   = TYPE_CONFIG[event.type] || TYPE_CONFIG['personal'];
  const Icon  = cfg.icon;

  const handleDelete = () => {
    dispatch({ type: 'DELETE_EVENT', id: event.id });
    showToast('Evento eliminado');
    goBack();
  };

  return (
    <>
      <style>{`
        /* ======= EVENT DETAIL ======= */
        .evd-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.4s var(--ease-out) both;
          max-width: 640px;
          margin: 0 auto;
        }

        /* ── Top bar ── */
        .evd-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-xl);
        }
        .evd-topbar-left {
          display: flex; align-items: center; gap: var(--space-sm);
        }
        .evd-topbar-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--on-surface);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
        }
        .evd-topbar-right { display: flex; gap: var(--space-sm); }

        /* ── Hero card ── */
        .evd-hero {
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-lg);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .evd-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.12;
          background: var(--gradient-primary);
        }
        .evd-hero-icon {
          width: 56px; height: 56px;
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1;
        }
        .evd-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
          position: relative; z-index: 1;
          line-height: 1.3;
        }
        .evd-hero-type {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-sm);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          width: fit-content;
          position: relative; z-index: 1;
        }

        /* ── Info rows ── */
        .evd-info-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          overflow: hidden;
          margin-bottom: var(--space-lg);
        }
        .evd-info-row {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid rgba(208,195,200,0.1);
        }
        .evd-info-row:last-child { border-bottom: none; }
        .evd-info-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--surface-container);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .evd-info-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--on-surface-variant);
          margin-bottom: 2px;
        }
        .evd-info-value {
          font-size: var(--text-body-md);
          color: var(--on-surface);
        }

        /* ── Notes ── */
        .evd-notes {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
        }
        .evd-notes-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--on-surface-variant);
          margin-bottom: var(--space-md);
        }
        .evd-notes-text {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          line-height: var(--leading-relaxed);
          font-style: italic;
        }
      `}</style>

      <div className="evd-screen">

        {/* Top bar */}
        <div className="evd-topbar">
          <div className="evd-topbar-left">
            <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" id="evd-back">
              <ArrowLeft size={20} />
            </Button>
            <span className="evd-topbar-title">{event.title}</span>
          </div>
          <div className="evd-topbar-right">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate('createEvent', { eventId: event.id })}
              id="evd-edit"
            >
              <Edit2 size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleDelete}
              id="evd-delete"
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        {/* Hero card */}
        <div
          className="evd-hero"
          style={{ background: `${event.color || '#EDE7F6'}30`, borderLeft: `5px solid ${event.color || cfg.color}` }}
        >
          <div className="evd-hero-icon" style={{ background: cfg.bg }}>
            <Icon size={26} color={cfg.color} strokeWidth={1.75} />
          </div>
          <h1 className="evd-hero-title">{event.title}</h1>
          <span
            className="evd-hero-type"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <Icon size={12} strokeWidth={2} />
            {cfg.label}
          </span>
        </div>

        {/* Info rows */}
        <div className="evd-info-card">
          <div className="evd-info-row">
            <div className="evd-info-icon">
              <Calendar size={16} color="var(--primary)" strokeWidth={1.75} />
            </div>
            <div>
              <div className="evd-info-label">Fecha</div>
              <div className="evd-info-value">{formatDate(event.date)}</div>
            </div>
          </div>

          <div className="evd-info-row">
            <div className="evd-info-icon">
              <Clock size={16} color="var(--secondary)" strokeWidth={1.75} />
            </div>
            <div>
              <div className="evd-info-label">Hora</div>
              <div className="evd-info-value">
                {formatTime12h(event.startTime, 'Por definir')}
                {event.endTime ? ` — ${formatTime12h(event.endTime)}` : ''}
              </div>
            </div>
          </div>

          {event.location && (
            <div className="evd-info-row">
              <div className="evd-info-icon">
                <MapPin size={16} color="var(--tertiary)" strokeWidth={1.75} />
              </div>
              <div>
                <div className="evd-info-label">Ubicación</div>
                <div className="evd-info-value">{event.location}</div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {event.notes && (
          <div className="evd-notes">
            <div className="evd-notes-label">Notas</div>
            <p className="evd-notes-text">{event.notes}</p>
          </div>
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          className="w-full"
          style={{
            color: 'var(--error)',
            border: '1px solid var(--error-container)',
            borderRadius: 'var(--radius-2xl)',
            padding: '14px',
          }}
          onClick={handleDelete}
          id="evd-delete-main"
        >
          <Trash2 size={16} />
          Eliminar evento
        </Button>

      </div>
    </>
  );
}
