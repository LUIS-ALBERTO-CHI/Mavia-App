import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { localToday, formatTime12h } from '../lib/utils';
import { CalendarDays, StickyNote, Target, Check, Plus } from 'lucide-react';
import Sticker from '../components/Sticker';
import { DEFAULT_COLOR, formatAmount } from '../lib/entryStyle';

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t('auth.goodMorning');
  if (h < 18) return t('auth.goodAfternoon');
  return t('auth.goodEvening');
}

function getMotivationalMessage(done, total) {
  const h = new Date().getHours();
  if (total > 0 && done === total) return '¡Todo listo por hoy! Increíble.';
  if (total === 0 && h < 10) return 'Empieza el día con intención. ¿Qué anotas hoy?';
  if (total === 0) return 'Nada agendado hoy. Toca + para añadir algo.';
  if (done === 0 && h > 16) return 'La tarde es tuya. Termina fuerte.';
  if (done === 0) return 'Cada gran día empieza con el primer paso.';
  const pct = Math.round((done / total) * 100);
  if (pct >= 75) return `${pct}% listo. Ya casi terminas.`;
  if (pct >= 50) return 'Mitad del camino. Sigue así.';
  return `${done} de ${total} listo. Sigue avanzando.`;
}

const QUICK_LINKS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarDays, color: 'var(--secondary)', bg: 'var(--secondary-container)' },
  { id: 'notes',    label: 'Notas',      icon: StickyNote,   color: 'var(--primary)',   bg: 'var(--primary-container)'   },
  { id: 'goals',    label: 'Objetivos',  icon: Target,       color: 'var(--tertiary)',  bg: 'var(--tertiary-container)'  },
];

export default function DashboardScreen() {
  const { state, navigate, dispatch, showToast } = useApp();
  const { t } = useTranslation();
  const { user, tasks } = state;

  const today = localToday();

  const sortByTime = (arr) => [...arr].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const todayEntries = sortByTime(tasks.filter(e => e.date === today));
  const pending      = todayEntries.filter(e => !e.completed);
  const done         = todayEntries.filter(e => e.completed);
  const completedNum = done.length;

  const toggle = (id, ev) => {
    if (ev) ev.stopPropagation();
    const entry = tasks.find(e => e.id === id);
    dispatch({ type: 'TOGGLE_TASK', id });
    if (entry && !entry.completed) showToast(entry.amount ? '¡Pagado!' : '¡Hecho!', 'success');
  };

  const EntryRow = ({ e }) => {
    const color  = e.color || DEFAULT_COLOR;
    const amount = formatAmount(e.amount);
    return (
      <div
        className={`dash-entry${e.completed ? ' done' : ''}`}
        style={{ borderLeftColor: color }}
        onClick={() => navigate('entryDetail', { entryId: e.id })}
        id={`dash-entry-${e.id}`}
      >
        <button
          className={`dash-check${e.completed ? ' checked' : ''}`}
          style={e.completed ? { background: color, borderColor: color } : { borderColor: color }}
          onClick={(ev) => toggle(e.id, ev)}
          aria-label={e.completed ? 'Marcar pendiente' : 'Marcar hecho'}
        >
          {e.completed && <Check size={14} strokeWidth={3} color="#fff" />}
        </button>

        <span className="dash-entry-sticker" style={{ background: `${color}22` }}>
          {e.sticker ? <Sticker id={e.sticker} size={24} /> : <CalendarDays size={18} color={color} />}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`dash-entry-title${e.completed ? ' done' : ''}`}>{e.title}</div>
          <div className="dash-entry-meta">
            {e.time ? formatTime12h(e.time, '') : 'Todo el día'}
            {amount && <span style={{ color, fontWeight: 700, marginLeft: 6 }}>· {amount}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .dash-content {
          max-width: var(--content-max-w); margin: 0 auto;
          padding: var(--space-xl) var(--space-container);
          animation: screenEnter 0.6s var(--ease-back) both;
        }
        .dash-greeting-row {
          display: flex; flex-direction: column; gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        @media (min-width: 768px) { .dash-greeting-row { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
        .dash-greeting-h {
          font-family: var(--font-display); font-size: var(--text-headline-lg-mobile);
          font-weight: 700; color: var(--heading); margin-bottom: var(--space-xs); line-height: 1.2;
        }
        @media (min-width: 768px) { .dash-greeting-h { font-size: var(--text-headline-lg); } }
        .dash-greeting-sub { font-size: var(--text-body-md); color: var(--on-surface-variant); line-height: 1.6; }
        .dash-tasks-badge {
          display: inline-flex; align-items: center; gap: var(--space-sm);
          background: var(--secondary-container); padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-full); flex-shrink: 0;
        }
        .dash-tasks-badge-text { font-size: var(--text-label-md); color: var(--on-secondary-container); font-weight: 600; }

        .dash-quick { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); margin-bottom: var(--space-xl); }
        .dash-quick-card {
          display: flex; flex-direction: column; align-items: center; gap: var(--space-sm);
          padding: var(--space-lg) var(--space-sm); background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl); box-shadow: var(--shadow-glow); border: none; cursor: pointer;
          transition: transform var(--transition-spring), box-shadow var(--transition-base);
        }
        .dash-quick-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .dash-quick-card:active { transform: scale(0.98); }
        .dash-quick-icon { width: 46px; height: 46px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; }
        .dash-quick-label { font-size: var(--text-label-md); font-weight: 600; color: var(--on-surface); }

        .section-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); }
        .section-h { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 700; color: var(--heading); }

        .dash-entry-list { display: flex; flex-direction: column; gap: 10px; }
        .dash-entry {
          display: flex; align-items: center; gap: 12px;
          background: var(--surface-container-lowest); border-radius: var(--radius-xl);
          border-left: 5px solid; box-shadow: var(--shadow-glow);
          padding: 12px 14px; cursor: pointer; transition: box-shadow var(--transition-fast);
        }
        .dash-entry:hover { box-shadow: var(--shadow-md); }
        .dash-entry.done { opacity: 0.7; }
        .dash-check {
          width: 26px; height: 26px; border-radius: 50%; border: 2px solid; background: none;
          display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
          transition: all var(--transition-spring);
        }
        .dash-entry-sticker { width: 40px; height: 40px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dash-entry-title { font-size: var(--text-body-md); font-weight: 600; color: var(--on-surface); line-height: 1.3; }
        .dash-entry-title.done { text-decoration: line-through; opacity: 0.6; }
        .dash-entry-meta { font-size: var(--text-label-sm); color: var(--on-surface-variant); margin-top: 2px; }

        .dash-empty {
          text-align: center; padding: var(--space-xl) var(--space-md); color: var(--on-surface-variant);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: var(--surface-container-lowest); border-radius: var(--radius-2xl); box-shadow: var(--shadow-glow);
        }
        .dash-add-btn {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 4px;
          font-size: 13px; padding: 9px 18px; border-radius: 99px;
          background: var(--gradient-primary); color: #fff; border: none; cursor: pointer; font-weight: 700;
        }
        .dash-done-label { font-size: var(--text-label-sm); font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.06em; margin: var(--space-lg) 0 8px; }
      `}</style>

      <div className="dash-content">
        {/* Greeting */}
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="dash-greeting-row">
            <div>
              <h2 className="dash-greeting-h">{getGreeting(t)}, {user.firstName}</h2>
              <p className="dash-greeting-sub">{getMotivationalMessage(completedNum, todayEntries.length)}</p>
            </div>
            <div className="dash-tasks-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--on-secondary-container)' }}>task_alt</span>
              <span className="dash-tasks-badge-text">{pending.length} para hoy</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="dash-quick">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <button key={link.id} className="dash-quick-card" onClick={() => navigate(link.id)} id={`dash-quick-${link.id}`}>
                  <span className="dash-quick-icon" style={{ background: link.bg }}>
                    <Icon size={22} color={link.color} strokeWidth={1.9} />
                  </span>
                  <span className="dash-quick-label">{link.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Hoy */}
        <section>
          <div className="section-header-row">
            <h4 className="section-h">Hoy</h4>
            <button className="btn-ghost btn btn-sm" onClick={() => navigate('agenda')} id="dash-agenda">Ver agenda</button>
          </div>

          {todayEntries.length === 0 ? (
            <div className="dash-empty">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.35 }}>event_available</span>
              <span style={{ fontSize: '13px', opacity: 0.7 }}>Nada agendado para hoy</span>
              <button className="dash-add-btn" onClick={() => navigate('createEntry')} id="dash-add-entry">
                <Plus size={16} /> Nueva entrada
              </button>
            </div>
          ) : (
            <>
              <div className="dash-entry-list">
                {pending.map(e => <EntryRow key={e.id} e={e} />)}
              </div>
              {done.length > 0 && (
                <>
                  <div className="dash-done-label">Hechas ({done.length})</div>
                  <div className="dash-entry-list">
                    {done.map(e => <EntryRow key={e.id} e={e} />)}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
