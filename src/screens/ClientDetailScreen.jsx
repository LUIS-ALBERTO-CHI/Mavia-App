import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Users, Clock } from 'lucide-react';
import { localToday, formatTime12h } from '../lib/utils';
import Sticker from '../components/Sticker';
import Mascot from '../components/Mascot';
import { DEFAULT_COLOR } from '../lib/entryStyle';

const DAYS_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_CAP = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
                    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/* "Hoy" / "Viernes 8 de Agosto" a partir de 'YYYY-MM-DD' */
function dateHeading(ds, todayDS) {
  if (ds === todayDS) return 'Hoy';
  const d = new Date(ds + 'T00:00:00');
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS_CAP[d.getMonth()]}`;
}

/* Agrupa una lista ordenada de entradas por fecha, preservando el orden */
function groupByDate(list) {
  return list.reduce((acc, e) => { (acc[e.date] ||= []).push(e); return acc; }, {});
}

/**
 * ClientDetailScreen — detalle de un cliente de un espacio compartido.
 * Llega vía navigate('clientDetail', { client }) — mismo mecanismo que entryId.
 */
export default function ClientDetailScreen() {
  const { state, navigate, goBack } = useApp();

  const client = state.screenParams?.client || null;
  const [showPast, setShowPast] = useState(false);

  if (!client) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-lg)' }}>No se encontró.</p>
        <button onClick={() => navigate('calendar')} style={{ background: 'var(--primary)', color: 'var(--on-primary)', padding: '10px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
          Ir al calendario
        </button>
      </div>
    );
  }

  /* Espacio al que pertenece el cliente */
  const space = (state.spaces || []).find(s => (s.clients || []).includes(client));

  const todayDS = localToday();
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const weekEndDS = in7.toLocaleDateString('en-CA');

  const entries = state.tasks.filter(e => e.client === client);

  const pending   = entries.filter(e => !e.completed).length;
  const completed = entries.filter(e => e.completed).length;
  const thisWeek  = entries.filter(e => e.date >= todayDS && e.date < weekEndDS).length;

  const upcoming = entries
    .filter(e => e.date >= todayDS)
    .sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')));
  const past = entries
    .filter(e => e.date < todayDS)
    .sort((a, b) => (b.date + (b.time || '99:99')).localeCompare(a.date + (a.time || '99:99')));

  const upcomingByDate = groupByDate(upcoming);
  const pastByDate     = groupByDate(past);

  const EntryRow = ({ e }) => {
    const color = e.color || DEFAULT_COLOR;
    return (
      <button className={`cd-row${e.completed ? ' done' : ''}`} onClick={() => navigate('entryDetail', { entryId: e.id })} id={`cd-row-${e.id}`}>
        <span className="cd-row-bullet" style={{ background: color }} />
        <div className="cd-row-main">
          <div className={`cd-row-title${e.completed ? ' done' : ''}`}>{e.title}</div>
          {e.time && (
            <div className="cd-row-time"><Clock size={12} strokeWidth={2.2} /> {formatTime12h(e.time)}</div>
          )}
        </div>
        {e.sticker && <Sticker id={e.sticker} size={36} className="cd-row-sticker" />}
      </button>
    );
  };

  const DateGroup = ({ ds, items }) => (
    <div className="cd-group">
      <div className="cd-date-head">{dateHeading(ds, todayDS)}</div>
      <div className="cd-card">{items.map(e => <EntryRow key={e.id} e={e} />)}</div>
    </div>
  );

  return (
    <>
      <style>{`
        .cd-screen { max-width: 680px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-xxl); animation: screenEnter 0.4s var(--ease-out) both; }

        /* ── Header ── */
        .cd-topbar { display: flex; align-items: center; margin-bottom: var(--space-md); }
        .cd-back {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: var(--surface-container); border: none; cursor: pointer; color: var(--on-surface-variant);
          transition: all var(--transition-fast); position: relative;
        }
        .cd-back::after { content: ''; position: absolute; inset: -6px; }
        .cd-back:hover { background: var(--surface-container-high); }
        .cd-back:active { transform: scale(0.92); }
        .cd-head { margin-bottom: var(--space-lg); }
        .cd-name {
          font-family: var(--font-display); font-size: var(--text-headline-lg, 28px); font-weight: 700;
          color: var(--heading); line-height: 1.2; letter-spacing: -0.01em; overflow-wrap: break-word;
        }
        .cd-space-pill {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 8px;
          padding: 5px 13px; border-radius: 99px; border: none;
          background: var(--primary); color: var(--on-primary);
          font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700;
        }

        /* ── Stats ── */
        .cd-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: var(--space-lg); }
        .cd-stat {
          background: var(--surface-container-lowest); border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft); border: var(--hairline);
          padding: 14px 10px; text-align: center;
        }
        .cd-stat-num { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--heading); line-height: 1.1; }
        .cd-stat-num.accent { color: var(--primary); }
        .cd-stat-label { font-size: var(--text-label-sm); color: var(--on-surface-variant); font-weight: 600; margin-top: 3px; }

        /* ── Secciones y grupos por fecha ── */
        .cd-section-title { font-family: var(--font-display); font-size: var(--text-section-size); font-weight: 700; color: var(--heading); margin: var(--space-lg) 0 10px; }
        .cd-group { margin-bottom: var(--space-md); }
        .cd-date-head { font-family: var(--font-display); font-size: var(--text-caption-size); font-weight: 700; color: var(--on-surface-variant); margin: 0 0 7px 2px; }

        /* ── Filas ── */
        .cd-card {
          background: var(--surface-container-lowest); border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft); border: var(--hairline); overflow: hidden;
        }
        .cd-row {
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          padding: 13px 15px; background: transparent; border: none; cursor: pointer;
          font-family: var(--font-body); transition: background var(--transition-fast), transform 0.14s var(--ease-spring);
        }
        .cd-row + .cd-row { border-top: var(--hairline); }
        .cd-row:hover { background: var(--surface-container-low); }
        .cd-row:active { transform: scale(0.985); }
        .cd-row.done { opacity: 0.6; }
        .cd-row-bullet { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .cd-row-main { flex: 1; min-width: 0; }
        .cd-row-title { font-size: var(--text-body-md); font-weight: 700; color: var(--on-surface); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; }
        .cd-row-title.done { text-decoration: line-through; opacity: 0.65; }
        .cd-row-time { display: flex; align-items: center; gap: 4px; font-size: var(--text-label-sm); color: var(--on-surface-variant); margin-top: 3px; }
        .cd-row-sticker { flex-shrink: 0; }

        /* ── Anteriores (colapsable) ── */
        .cd-past-toggle {
          display: inline-flex; align-items: center; gap: 6px; margin-top: var(--space-lg);
          padding: 9px 18px; border-radius: 99px; border: var(--hairline); cursor: pointer;
          background: var(--surface-container); color: var(--on-surface-variant);
          font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700;
          transition: all var(--transition-fast);
        }
        .cd-past-toggle:hover { background: var(--surface-container-high); }
        .cd-past-toggle:active { transform: scale(0.96); }
        .cd-past { margin-top: var(--space-md); }

        /* ── Vacío ── */
        .cd-empty { text-align: center; padding: var(--space-xl) var(--space-md); display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .cd-empty p { color: var(--on-surface-variant); font-size: var(--text-body-md); }

        /* Nada próximo (pero hay anteriores) */
        .cd-none { font-size: var(--text-body-md); color: var(--on-surface-variant); padding: 4px 2px; }
      `}</style>

      <div className="cd-screen">
        {/* ── Header ── */}
        <div className="cd-topbar">
          <button className="cd-back" onClick={goBack} aria-label="Volver"><ArrowLeft size={20} /></button>
        </div>
        <div className="cd-head">
          <h1 className="cd-name">{client}</h1>
          {space && (
            <span className="cd-space-pill"><Users size={13} strokeWidth={2.2} /> {space.name}</span>
          )}
        </div>

        {entries.length === 0 ? (
          /* ── Vacío ── */
          <div className="cd-empty">
            <Mascot size={200} />
            <p>Nada para este cliente todavía</p>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="cd-stats">
              <div className="cd-stat">
                <div className="cd-stat-num accent">{pending}</div>
                <div className="cd-stat-label">Pendientes</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-num">{completed}</div>
                <div className="cd-stat-label">Completadas</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-num">{thisWeek}</div>
                <div className="cd-stat-label">Esta semana</div>
              </div>
            </div>

            {/* ── Próximas ── */}
            <div className="cd-section-title">Próximas</div>
            {upcoming.length === 0
              ? <p className="cd-none">Nada agendado próximamente.</p>
              : Object.keys(upcomingByDate).map(ds => <DateGroup key={ds} ds={ds} items={upcomingByDate[ds]} />)}

            {/* ── Anteriores ── */}
            {past.length > 0 && (
              !showPast ? (
                <button className="cd-past-toggle" onClick={() => setShowPast(true)} id="cd-show-past">
                  Ver anteriores ({past.length})
                </button>
              ) : (
                <div className="cd-past">
                  <div className="cd-section-title" style={{ marginTop: 0 }}>Anteriores</div>
                  {Object.keys(pastByDate).map(ds => <DateGroup key={ds} ds={ds} items={pastByDate[ds]} />)}
                  <button className="cd-past-toggle" style={{ marginTop: 4 }} onClick={() => setShowPast(false)}>
                    Ocultar anteriores
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </>
  );
}
