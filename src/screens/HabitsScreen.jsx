import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Flame, CheckCircle2, Circle, Plus, Droplets, Trash2, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import HabitIcon from '../components/HabitIcon';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const FREQ_LABEL = {
  daily:    'Todos los días',
  weekdays: 'Lun – Vie',
  weekend:  'Fin de semana',
  custom:   'Personalizado',
};

export default function HabitsScreen() {
  const { state, dispatch, showToast, navigate } = useApp();
  const { habits } = state;
  const [showAll, setShowAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const totalDone   = habits.filter(h => h.completedToday).length;
  const pct         = habits.length ? Math.round((totalDone / habits.length) * 100) : 0;
  const maxStreak   = habits.length ? Math.max(...habits.map(h => Number(h.streak) || 0)) : 0;
  const todayDotIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  const handleToggle = (habit) => {
    dispatch({ type: 'TOGGLE_HABIT', id: habit.id });
    if (!habit.completedToday) showToast(`¡${habit.name} completado!`, 'success');
  };

  const handleToggleDay = (habit, dayIdx) => {
    dispatch({ type: 'TOGGLE_HABIT_DAY', id: habit.id, dayIdx });
  };

  return (
    <>
      <style>{`
        /* ======= HABITS SCREEN ======= */
        .hbt-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .hbt-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .hbt-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Summary banner ── */
        .hbt-banner {
          background: var(--gradient-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          color: white;
          box-shadow: 0 12px 40px rgba(112,87,101,0.22);
          position: relative;
          overflow: hidden;
        }
        .hbt-banner::before {
          content: '';
          position: absolute;
          right: -30px; top: -30px;
          width: 160px; height: 160px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
        }

        .hbt-banner-ring {
          position: relative;
          width: 72px; height: 72px;
          flex-shrink: 0;
        }
        .hbt-banner-pct {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
        }

        .hbt-banner-body { flex: 1; }
        .hbt-banner-title {
          font-size: var(--text-body-lg);
          font-weight: 700;
          margin-bottom: 4px;
        }
        .hbt-banner-sub { font-size: var(--text-label-md); opacity: 0.8; margin-bottom: var(--space-md); }

        .hbt-banner-stats {
          display: flex;
          gap: var(--space-xl);
        }
        .hbt-stat { display: flex; flex-direction: column; gap: 1px; }
        .hbt-stat-num {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 500;
          line-height: 1;
        }
        .hbt-stat-label { font-size: var(--text-label-sm); opacity: 0.75; }

        /* ── Section head ── */
        .hbt-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-lg);
        }
        .hbt-section-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--on-surface);
        }

        /* ── Habit cards ── */
        .hbt-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .hbt-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.04);
          transition: all var(--transition-spring);
        }
        .hbt-card:hover {
          box-shadow: 0 8px 30px rgba(112,87,101,0.09);
          transform: translateY(-1px);
        }
        .hbt-card.done {
          border-color: rgba(168,197,160,0.3);
        }

        .hbt-card-top {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .hbt-card-icon {
          width: 46px; height: 46px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hbt-card-body { flex: 1; min-width: 0; }
        .hbt-card-name {
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 3px;
        }
        .hbt-card-streak {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-label-md);
          font-weight: 600;
          color: #E56B4E;
        }

        .hbt-toggle-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 2px solid var(--outline-variant);
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-spring);
          flex-shrink: 0;
        }
        .hbt-toggle-btn:hover { border-color: var(--secondary); background: var(--secondary-container); }
        .hbt-toggle-btn.done {
          border-color: transparent;
          background: var(--secondary);
        }

        /* ── Week dots ── */
        .hbt-week {
          display: flex;
          gap: 6px;
        }
        .hbt-dot-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .hbt-dot {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          background: rgba(0,0,0,0.06);
          transition: all var(--transition-base);
          max-width: 36px;
          border: 1.5px solid transparent;
          position: relative;
        }
        /* Done — solid habit color */
        .hbt-dot.done {
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        /* Today — NOT done: dashed outline + faint color tint to signal it’s pending */
        .hbt-dot.today-dot:not(.done) {
          border: 1.5px dashed var(--outline);
          background: rgba(0,0,0,0.03);
        }
        /* Today — done: glowing ring */
        .hbt-dot.today-dot.done {
          box-shadow: 0 0 0 2.5px white, 0 0 0 4px var(--outline-variant), 0 4px 10px rgba(0,0,0,0.18);
        }
        .hbt-dot-label {
          font-size: 9px;
          font-weight: 700;
          color: var(--on-surface-variant);
          letter-spacing: 0.05em;
          opacity: 0.7;
        }
        .hbt-dot-label.today-label {
          color: var(--primary);
          font-weight: 800;
          opacity: 1;
        }
        /* Dark mode dot overrides */
        .dark .hbt-dot { background: rgba(255,255,255,0.08) !important; }
        .dark .hbt-dot.done { background: unset !important; } /* let inline style win */
        .dark .hbt-dot.today-dot:not(.done) {
          background: rgba(255,255,255,0.04) !important;
          border-color: var(--outline) !important;
        }
        .dark .hbt-dot.today-dot.done {
          box-shadow: 0 0 0 2px var(--surface-container-high), 0 0 0 3.5px var(--outline-variant), 0 4px 10px rgba(0,0,0,0.3) !important;
        }

        /* ── Water tracker ── */
        .hbt-water-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-top: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid rgba(208,195,200,0.12);
        }
        .hbt-water-label { font-size: var(--text-label-sm); color: var(--on-surface-variant); }
        .hbt-water-drops {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        .hbt-drop {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: var(--surface-container);
          border: 1.5px solid var(--outline-variant);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hbt-drop.filled {
          background: #A8C5A0;
          border-color: transparent;
        }
        .dark .hbt-banner::before { display: none; }
        /* ── Dark mode overrides ── */
        .dark .hbt-card {
          background: var(--surface-container) !important;
          border-color: rgba(255,255,255,0.07) !important;
        }
        /* Empty dot: clearly muted in dark */
        .dark .hbt-dot:not(.done) {
          background: rgba(255,255,255,0.08) !important;
        }
        /* Done dot: let the inline habit.color shine through (no override) */
        .dark .hbt-water-row {
          border-top-color: rgba(255,255,255,0.06) !important;
        }
      `}</style>

      <div className="hbt-screen">

        {/* ── Hero ── */}
        <h1 className="hbt-hero-title">Mis Hábitos</h1>
        <p className="hbt-hero-sub">Pequeños pasos diarios que crean grandes cambios.</p>

        {/* ── Summary banner ── */}
        <div className="hbt-banner">
          {/* Ring */}
          <div className="hbt-banner-ring">
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
              <circle
                cx="36" cy="36" r="28"
                fill="none" stroke="white" strokeWidth="7"
                strokeDasharray={`${(2 * Math.PI * 28) * pct / 100} ${2 * Math.PI * 28}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="hbt-banner-pct">{pct}%</div>
          </div>

          <div className="hbt-banner-body">
            <div className="hbt-banner-title">Progreso de hoy</div>
            <div className="hbt-banner-sub">{totalDone} de {habits.length} hábitos completados</div>
            <div className="hbt-banner-stats">
              <div className="hbt-stat">
                <span className="hbt-stat-num">{maxStreak}</span>
                <span className="hbt-stat-label">Racha máx.</span>
              </div>
              <div className="hbt-stat">
                <span className="hbt-stat-num">{habits.length}</span>
                <span className="hbt-stat-label">Hábitos activos</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── List ── */}
        <div className="hbt-section-head">
          <span className="hbt-section-title">Hábitos de hoy</span>
          <Button variant="soft" size="sm" onClick={() => navigate('createHabit')} id="hbt-add">
            <Plus size={15} /> Añadir
          </Button>
        </div>

        <div className="hbt-list">
          {habits.map(habit => {
            const iconColor = habit.completedToday ? 'white' : habit.color;
            return (
              <div key={habit.id} className={`hbt-card${habit.completedToday ? ' done' : ''}`} id={`hbt-card-${habit.id}`}>

                  {/* Top row */}
                <div className="hbt-card-top">
                  <div
                    className="hbt-card-icon"
                    style={{
                      background: habit.completedToday ? habit.color : `${habit.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <HabitIcon
                      id={habit.icon}
                      size={22}
                      color={habit.completedToday ? '#fff' : habit.color}
                    />
                  </div>

                  <div className="hbt-card-body">
                    <div className="hbt-card-name">{habit.name}</div>
                    <div className="hbt-card-streak">
                      <Flame size={13} strokeWidth={2} />
                      {Number(habit.streak) || 0} días &nbsp;·&nbsp;
                      <span style={{ fontWeight: 400, opacity: 0.75 }}>
                        {FREQ_LABEL[habit.frequency] || 'Todos los días'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Edit button */}
                    <button
                      onClick={() => navigate('createHabit', { habitId: habit.id })}
                      id={`hbt-edit-${habit.id}`}
                      aria-label="Editar hábito"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--outline)', padding: 4,
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--outline)'}
                    >
                      <Edit2 size={15} strokeWidth={1.75} />
                    </button>

                    {/* Toggle done */}
                    <button
                      className={`hbt-toggle-btn${habit.completedToday ? ' done' : ''}`}
                      onClick={() => handleToggle(habit)}
                      id={`hbt-toggle-${habit.id}`}
                      aria-label={habit.completedToday ? 'Marcar pendiente' : 'Completar'}
                    >
                      {habit.completedToday
                        ? <CheckCircle2 size={22} color="#fff" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.25))' }} />
                        : <Circle size={22} color="var(--outline)" strokeWidth={1.75} />
                      }
                    </button>

                    {/* Delete with inline confirmation */}
                    {confirmDeleteId === habit.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', whiteSpace: 'nowrap' }}>¿Eliminar?</span>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ border: 'none', background: 'var(--surface-container)', borderRadius: 99, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--on-surface-variant)' }}>No</button>
                        <button onClick={() => { dispatch({ type: 'DELETE_HABIT', id: habit.id }); showToast('Hábito eliminado'); setConfirmDeleteId(null); }} style={{ border: 'none', background: 'var(--error)', color: 'white', borderRadius: 99, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Sí</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(habit.id)}
                        id={`hbt-delete-${habit.id}`}
                        aria-label="Eliminar hábito"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--outline)', padding: 4,
                          transition: 'color var(--transition-fast)',
                        }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--error)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--outline)'}
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Week tracker — visual only, no click */}
                <div className="hbt-week">
                  {DAYS.map((day, i) => {
                    const done    = habit.weekData?.[i] ?? false;
                    const isToday = i === todayDotIdx;
                    return (
                      <div key={day} className="hbt-dot-col">
                        <div
                          className={`hbt-dot${done ? ' done' : ''}${isToday ? ' today-dot' : ''}`}
                          style={done ? { background: habit.color } : {}}
                          aria-label={`${day}: ${done ? 'completado' : 'pendiente'}`}
                        />
                        <span className={`hbt-dot-label${isToday ? ' today-label' : ''}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Water tracker (if applicable) */}
                {habit.target && (
                  <div className="hbt-water-row">
                    <Droplets size={16} color={habit.color} strokeWidth={1.75} />
                    <span className="hbt-water-label">{habit.current || 0}/{habit.target} vasos</span>
                    <div className="hbt-water-drops">
                      {Array.from({ length: habit.target }).map((_, i) => (
                        <div
                          key={i}
                          className={`hbt-drop${i < (habit.current || 0) ? ' filled' : ''}`}
                          onClick={() => dispatch({ type: 'UPDATE_HABIT_WATER', id: habit.id, current: i < (habit.current || 0) ? i : i + 1 })}
                          id={`hbt-drop-${habit.id}-${i}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}
