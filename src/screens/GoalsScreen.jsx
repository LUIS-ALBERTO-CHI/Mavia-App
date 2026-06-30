import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Target, Calendar, CheckCircle2, Circle, TrendingUp, Plus } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const CAT_STYLE = {
  Marketing:  { bg: '#EDE7F6', text: '#5E4A8E', bar: 'secondary', badge: 'secondary'  },
  Personal:   { bg: '#FDF0F7', text: '#8E3F6D', bar: 'primary',   badge: 'primary'    },
  Espiritual: { bg: '#FDF8EC', text: '#8A5A00', bar: 'tertiary',  badge: 'tertiary'   },
  Trabajo:    { bg: '#EDF3FE', text: '#2b4f8e', bar: 'secondary', badge: 'outline'    },
};

const FILTERS = ['Todos', 'En progreso', 'Completados'];

function CircleProgress({ value, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (value / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

export default function GoalsScreen() {
  const { state, navigate, dispatch, showToast } = useApp();
  const { goals } = state;
  const [filter, setFilter] = useState('Todos');

  const avgProgress = goals.length
    ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
    : 0;

  const completed = goals.filter(g => g.progress >= 100).length;
  const inProgress = goals.filter(g => g.progress < 100).length;

  const filtered = goals.filter(g => {
    if (filter === 'Completados') return g.progress >= 100;
    if (filter === 'En progreso') return g.progress < 100;
    return true;
  });

  return (
    <>
      <style>{`
        /* ======= GOALS SCREEN ======= */
        .gls-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 920px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .gls-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .gls-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Overview banner ── */
        .gls-overview {
          background: var(--gradient-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          color: white;
          box-shadow: 0 12px 40px rgba(112,87,101,0.25);
          position: relative;
          overflow: hidden;
        }

        .gls-overview::before {
          content: '';
          position: absolute;
          right: -40px;
          top: -40px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }

        .gls-ring-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gls-ring-num {
          position: absolute;
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 600;
          color: white;
          line-height: 1;
        }

        .gls-overview-body { flex: 1; }

        .gls-overview-title {
          font-size: var(--text-body-lg);
          font-weight: 700;
          margin-bottom: 4px;
        }
        .gls-overview-sub {
          font-size: var(--text-label-md);
          opacity: 0.8;
          margin-bottom: var(--space-md);
        }

        .gls-overview-stats {
          display: flex;
          gap: var(--space-xl);
        }

        .gls-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .gls-stat-num {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 500;
          line-height: 1;
        }
        .gls-stat-label {
          font-size: var(--text-label-sm);
          opacity: 0.75;
        }

        /* ── Filter chips ── */
        .gls-chips {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .gls-chip {
          padding: 8px 20px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 500;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
          transition: all var(--transition-fast);
        }
        .gls-chip.active {
          background: var(--primary);
          color: var(--on-primary);
        }
        .gls-chip:not(.active):hover {
          background: var(--primary-container);
          color: var(--on-primary-container);
        }

        /* ── Goal cards ── */
        .gls-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .gls-card {
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          box-shadow: 0 4px 20px rgba(112,87,101,0.05);
          border: 1px solid rgba(208,195,200,0.15);
          transition: transform var(--transition-spring), box-shadow var(--transition-spring);
          cursor: pointer;
        }
        .gls-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(112,87,101,0.10);
        }

        .gls-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
          gap: var(--space-md);
        }

        .gls-card-left { flex: 1; }

        .gls-card-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--on-surface);
          line-height: var(--leading-snug);
          margin-bottom: var(--space-sm);
        }

        .gls-card-pct {
          font-family: var(--font-display);
          font-size: 2.4rem;
          font-weight: 500;
          line-height: 1;
        }

        .gls-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          margin-bottom: var(--space-md);
        }

        .gls-deadline {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── Task checklist inside card ── */
        .gls-tasks {
          margin-top: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: var(--space-md);
          border-top: 1px solid rgba(0,0,0,0.06);
        }

        .gls-task {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          transition: opacity var(--transition-fast);
        }

        .gls-task.done { opacity: 0.55; }
        .gls-task.done span { text-decoration: line-through; }

        /* ── Progress slider — inline update ── */
        .gls-slider-wrap {
          margin-top: var(--space-sm);
          padding-top: var(--space-sm);
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .gls-slider-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--outline);
          margin-bottom: 6px;
        }
        .gls-slider {
          -webkit-appearance: none;
          width: 100%; height: 6px;
          border-radius: 99px;
          outline: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .gls-slider:hover { opacity: 0.9; }
        .gls-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          border: 2px solid currentColor;
        }
        .gls-slider::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          border: 2px solid currentColor;
        }

        /* ── Empty ── */
        .gls-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .gls-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: var(--primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gls-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
        }
        .gls-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 260px;
          line-height: var(--leading-relaxed);
        }
        .dark .gls-overview::before { display: none; }
      `}</style>

      <div className="gls-screen">

        {/* ── Hero ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
          <div>
            <h1 className="gls-hero-title">Mis Objetivos</h1>
            <p className="gls-hero-sub">Visualiza y avanza en lo que más importa.</p>
          </div>
          <Button variant="soft" onClick={() => navigate('createGoal')} id="gls-add">
            <Plus size={15} /> Nuevo
          </Button>
        </div>

        {/* ── Overview Banner ── */}
        <div className="gls-overview">
          <div className="gls-ring-wrap">
            <CircleProgress value={avgProgress} size={80} />
            <span className="gls-ring-num">{avgProgress}%</span>
          </div>

          <div className="gls-overview-body">
            <div className="gls-overview-title">Progreso promedio</div>
            <div className="gls-overview-sub">{goals.length} objetivos activos este mes</div>
            <div className="gls-overview-stats">
              <div className="gls-stat">
                <span className="gls-stat-num">{inProgress}</span>
                <span className="gls-stat-label">En progreso</span>
              </div>
              <div className="gls-stat">
                <span className="gls-stat-num">{completed}</span>
                <span className="gls-stat-label">Completados</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div className="gls-chips">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`gls-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              id={`gls-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Goal cards ── */}
        {filtered.length === 0 ? (
          <div className="gls-empty">
            <div className="gls-empty-icon">
              <Target size={38} color="var(--primary)" strokeWidth={1.25} />
            </div>
            <div className="gls-empty-title">Sin objetivos aquí</div>
            <p className="gls-empty-sub">
              No hay objetivos en esta categoría todavía.
            </p>
          </div>
        ) : (
          <div className="gls-grid">
            {filtered.map(goal => {
              const style = CAT_STYLE[goal.category] || CAT_STYLE.Personal;
              const isComplete = goal.progress >= 100;

              return (
                <div
                  key={goal.id}
                  className="gls-card"
                  style={{ background: style.bg }}
                  id={`gls-card-${goal.id}`}
                >
                  {/* Header */}
                  <div className="gls-card-header">
                    <div className="gls-card-left">
                      <div className="gls-card-title">{goal.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Badge variant={style.badge}>{goal.category}</Badge>
                        {isComplete && (
                          <Badge variant="secondary" dot>Completado</Badge>
                        )}
                      </div>
                    </div>
                    <div className="gls-card-pct" style={{ color: style.text }}>
                      {goal.progress}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <Progress value={goal.progress} color={style.bar} className="mb-3" />

                  {/* Inline progress slider */}
                  <div className="gls-slider-wrap" onClick={e => e.stopPropagation()}>
                    <div className="gls-slider-label">Desliza para actualizar — {goal.progress}%</div>
                    <input
                      type="range"
                      min="0" max="100" step="5"
                      value={goal.progress}
                      className="gls-slider"
                      style={{
                        background: `linear-gradient(to right, ${style.text} ${goal.progress}%, var(--surface-container-high) ${goal.progress}%)`,
                        color: style.text,
                      }}
                      onChange={e => {
                        const val = Number(e.target.value);
                        dispatch({ type: 'UPDATE_GOAL_PROGRESS', id: goal.id, progress: val });
                        if (val === 100) showToast('¡Objetivo completado! 🎉');
                      }}
                      id={`gls-slider-${goal.id}`}
                      aria-label={`Progreso de ${goal.title}`}
                    />
                  </div>

                  {/* Meta */}
                  <div className="gls-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={14} strokeWidth={2} />
                      {goal.completedTasks} de {goal.tasks.length} tareas
                    </span>
                    <span className="gls-deadline">
                      <Calendar size={13} strokeWidth={2} />
                      {new Date(goal.deadline).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Task list */}
                  <div className="gls-tasks">
                    {goal.tasks.map((t, i) => {
                      const done = i < goal.completedTasks;
                      return (
                        <div key={i} className={`gls-task${done ? ' done' : ''}`}>
                          {done
                            ? <CheckCircle2 size={16} color="var(--secondary)" strokeWidth={2} style={{ flexShrink: 0 }} />
                            : <Circle size={16} color="var(--outline)" strokeWidth={1.75} style={{ flexShrink: 0 }} />
                          }
                          <span>{t}</span>
                        </div>
                      );
                    })}
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
