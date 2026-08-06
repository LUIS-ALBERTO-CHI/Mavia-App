import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Target, Calendar, TrendingUp, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { progressOf, goalCountLabel } from '../lib/goalUtils';

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
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" opacity="0.25" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

export default function GoalsScreen() {
  const { state, navigate, dispatch, showToast, deleteWithUndo } = useApp();
  const { t } = useTranslation();
  const { goals } = state;
  const [filter, setFilter] = useState('Todos');

  const avgProgress = goals.length
    ? Math.round(goals.reduce((a, g) => a + progressOf(g), 0) / goals.length)
    : 0;

  const completed = goals.filter(g => progressOf(g) >= 100).length;
  const inProgress = goals.filter(g => progressOf(g) < 100).length;

  const filtered = goals.filter(g => {
    const p = progressOf(g);
    if (filter === 'Completados') return p >= 100;
    if (filter === 'En progreso') return p < 100;
    return true;
  });

  // + / − al contador (tipo cantidad)
  const bump = (goal, delta) => {
    const target = Number(goal.target) || 0;
    const cur = Number(goal.current) || 0;
    const next = Math.max(0, target > 0 ? Math.min(cur + delta, target) : cur + delta);
    if (next === cur) return;
    dispatch({ type: 'UPDATE_GOAL', goal: { ...goal, current: next } });
    if (target > 0 && next >= target) showToast('¡Objetivo completado! 🎉', 'success');
  };
  // Marcar un paso (tipo pasos)
  const toggleStep = (goal, i) => {
    const steps = (goal.steps || []).map((s, idx) => idx === i ? { ...s, done: !s.done } : s);
    dispatch({ type: 'UPDATE_GOAL', goal: { ...goal, steps } });
    if (steps.length && steps.every(s => s.done)) showToast('¡Objetivo completado! 🎉', 'success');
  };
  // Cumplido/pendiente (tipo sí/no)
  const toggleSimple = (goal) => {
    const done = !goal.done;
    dispatch({ type: 'UPDATE_GOAL', goal: { ...goal, done } });
    if (done) showToast('¡Objetivo completado! 🎉', 'success');
  };

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
          font-weight: 700;
          color: var(--heading);
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
          background: var(--primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          color: var(--on-primary);
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
          background: color-mix(in srgb, var(--on-primary, #fff) 6%, transparent);
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
          color: var(--on-primary);
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
        /* Desktop: lista vertical → grid de 2-3 columnas */
        @media (min-width: 768px) {
          .gls-grid { display: grid; grid-template-columns: repeat(2, 1fr); align-items: start; }
          .gls-chip { padding: 5px 14px; font-size: 12.5px; }  /* chips 32 → 28px */
        }
        @media (min-width: 1100px) {
          .gls-grid { grid-template-columns: repeat(3, 1fr); }
        }
        /* Puntero fino: editar/eliminar aparecen al hover de la card */
        @media (hover: hover) and (pointer: fine) {
          .gls-act { opacity: 0 !important; transition: opacity 0.15s ease; }
          .gls-card:hover .gls-act, .gls-act:focus-visible { opacity: 0.75 !important; }
        }

        .gls-card {
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          box-shadow: var(--shadow-soft);
          border: var(--hairline);
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
          border-top: var(--hairline);
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

        /* ── Contador + / − ── */
        .gls-counter {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-top: var(--space-sm); padding-top: var(--space-sm);
          border-top: var(--hairline);
        }
        .gls-count-label { font-family: var(--font-display); font-size: 17px; font-weight: 700; }
        .gls-step {
          width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.12);
          background: rgba(255,255,255,0.7); color: var(--on-surface);
          font-size: 22px; font-weight: 700; line-height: 1; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: transform var(--transition-fast);
        }
        .gls-step:active { transform: scale(0.9); }
        .gls-step-plus { border: none; color: #fff; box-shadow: var(--shadow-sm); }
        /* Pasos (checklist) */
        .gls-steps { margin-top: var(--space-sm); padding-top: var(--space-sm); border-top: var(--hairline); display: flex; flex-direction: column; gap: 2px; }
        .gls-stepitem { display: flex; align-items: center; gap: 9px; padding: 7px 4px; background: none; border: none; cursor: pointer; text-align: left; font-family: var(--font-body); font-size: var(--text-label-md); color: var(--on-surface); }
        .gls-stepitem.done { opacity: 0.6; }
        .gls-stepitem.done span:last-child { text-decoration: line-through; }
        .gls-stepcheck { width: 20px; height: 20px; border-radius: 6px; border: 2px solid rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all var(--transition-fast); }
        /* Sí / No */
        .gls-simple { margin-top: var(--space-sm); width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 11px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.14); background: rgba(255,255,255,0.6); color: var(--on-surface); font-family: var(--font-body); font-weight: 700; font-size: 14px; cursor: pointer; }
        .gls-simple:active { transform: scale(0.98); }

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
            <h1 className="gls-hero-title">{t('goals.title')}</h1>
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
              const style = CAT_STYLE[goal.category] || { bg: goal.color || '#F1EEF9', text: 'var(--heading)', bar: 'primary', badge: 'outline' };
              const pct = progressOf(goal);
              const isComplete = pct >= 100;
              const hasTarget = (Number(goal.target) || 0) > 0;

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div className="gls-card-pct" style={{ color: style.text }}>
                        {pct}%
                      </div>
                      {/* Edit button */}
                      <button
                        className="gls-act"
                        onClick={e => { e.stopPropagation(); navigate('createGoal', { goalId: goal.id }); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: style.text, opacity: 0.7, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s' }}
                        aria-label="Editar objetivo"
                        id={`gls-edit-${goal.id}`}
                        title="Editar"
                      >
                        <Edit2 size={15} strokeWidth={1.75} />
                      </button>
                      {/* Delete button — directo, con Deshacer en el toast */}
                      <button
                        className="gls-act"
                        onClick={e => { e.stopPropagation(); deleteWithUndo('goal', goal.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--error)', opacity: 0.6, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s' }}
                        aria-label="Eliminar objetivo"
                        id={`gls-del-${goal.id}`}
                        title="Eliminar"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar (calculada) */}
                  <Progress value={pct} color={style.bar} className="mb-3" />

                  {/* Interacción según el tipo */}
                  {goal.type === 'steps' ? (
                    <div className="gls-steps" onClick={e => e.stopPropagation()}>
                      {(goal.steps || []).map((s, i) => (
                        <button key={i} className={`gls-stepitem${s.done ? ' done' : ''}`} onClick={() => toggleStep(goal, i)}>
                          <span className="gls-stepcheck" style={s.done ? { background: style.text, borderColor: style.text } : {}}>
                            {s.done && <Check size={12} strokeWidth={3} color="#fff" />}
                          </span>
                          <span>{s.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : goal.type === 'simple' ? (
                    <button className="gls-simple" onClick={e => { e.stopPropagation(); toggleSimple(goal); }}
                      style={goal.done ? { background: style.text, color: '#fff', borderColor: style.text } : {}}
                      id={`gls-simple-${goal.id}`}>
                      {goal.done ? <><Check size={15} strokeWidth={3} /> Cumplido</> : 'Marcar cumplido'}
                    </button>
                  ) : hasTarget ? (
                    <div className="gls-counter" onClick={e => e.stopPropagation()}>
                      <button className="gls-step" onClick={() => bump(goal, -1)} aria-label="Restar uno" id={`gls-minus-${goal.id}`}>−</button>
                      <div className="gls-count-label" style={{ color: style.text }}>{goalCountLabel(goal)}</div>
                      <button className="gls-step gls-step-plus" style={{ background: style.text }} onClick={() => bump(goal, 1)} aria-label="Sumar uno" id={`gls-plus-${goal.id}`}>+</button>
                    </div>
                  ) : null}

                  {/* Meta */}
                  <div className="gls-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={14} strokeWidth={2} />
                      {goalCountLabel(goal)}
                    </span>
                    <span className="gls-deadline">
                      <Calendar size={13} strokeWidth={2} />
                      {goal.deadline
                        ? new Date(goal.deadline + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Sin fecha'}
                    </span>
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
