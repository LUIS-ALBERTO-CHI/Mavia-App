import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, Circle } from 'lucide-react';
import HabitIcon from './HabitIcon';

/* ─────────────────────────────────────────
   #14 Focus Mode — fullscreen minimal overlay
   Rendered via Portal to escape any transform/animation
   stacking context from the parent animated div.
   ───────────────────────────────────────── */
export default function FocusMode({ onClose }) {
  const { state, dispatch, showToast } = useApp();
  const { tasks, habits, darkMode } = state;
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Pick the most urgent pending task for today
  const today    = new Date().toLocaleDateString('en-CA');
  const PRIORITY = { alta: 0, media: 1, baja: 2 };
  const focusTask = [...tasks]
    .filter(t => !t.completed && t.date === today)
    .sort((a, b) => (PRIORITY[a.priority] ?? 1) - (PRIORITY[b.priority] ?? 1))[0] || null;

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 280);
  };

  const handleComplete = () => {
    if (!focusTask || done) return;
    setDone(true);
    try { navigator.vibrate?.([30, 20, 80]); } catch {}
    setTimeout(() => {
      dispatch({ type: 'TOGGLE_TASK', id: focusTask.id });
      showToast('¡Tarea completada!', 'success');
      setDone(false);
    }, 550);
  };

  const handleHabitToggle = (habit) => {
    if (habit.completedToday) return;
    dispatch({ type: 'TOGGLE_HABIT', id: habit.id });
    try { navigator.vibrate?.([30, 20, 60]); } catch {}
    showToast(`${habit.name} completado`, 'success');
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const overlay = (
    <div
      className={darkMode ? 'dark' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 28px 40px',
        animation: leaving
          ? 'focusFadeOut 0.28s ease forwards'
          : 'focusFadeIn 0.35s ease both',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes focusFadeIn  { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes focusFadeOut { from { opacity: 1; transform: scale(1); }   to { opacity: 0; transform: scale(0.97); } }

        .focus-close-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: var(--surface-container);
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
          color: var(--on-surface-variant);
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .focus-close-btn:hover  { background: var(--surface-container-high); transform: scale(1.05); }
        .focus-close-btn:active { transform: scale(0.95); }

        .focus-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 28px;
          opacity: 0.9;
        }

        .focus-task-card {
          background: var(--surface-container-low);
          border: 1.5px solid var(--outline-variant);
          border-radius: 24px;
          padding: 28px 24px;
          text-align: center;
          max-width: 380px;
          width: 100%;
          margin-bottom: 32px;
          box-shadow: 0 4px 24px rgba(112,87,101,0.07);
        }

        .focus-task-title {
          font-family: var(--font-display);
          font-size: clamp(1.3rem, 4.5vw, 1.9rem);
          font-weight: 600;
          color: var(--on-surface);
          line-height: 1.25;
          margin-bottom: 10px;
        }

        .focus-task-meta {
          font-size: 12px;
          color: var(--on-surface-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 28px;
        }

        .focus-priority-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .focus-priority-alta    { background: #ffdad6; color: #ba1a1a; }
        .focus-priority-media   { background: var(--secondary-container); color: var(--on-secondary-container); }
        .focus-priority-baja    { background: var(--surface-container); color: var(--on-surface-variant); }

        .focus-complete-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .focus-complete-btn {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: var(--secondary);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform var(--transition-spring), box-shadow var(--transition-base);
          box-shadow: 0 6px 28px rgba(84,99,71,0.38);
        }
        .focus-complete-btn:hover  { transform: scale(1.09); box-shadow: 0 10px 36px rgba(84,99,71,0.48); }
        .focus-complete-btn:active { transform: scale(0.93); }
        .focus-complete-btn.burst  { animation: completionBurst 0.5s var(--ease-spring) both; }

        .focus-complete-hint {
          font-size: 11px;
          color: var(--on-surface-variant);
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .focus-section-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .focus-divider {
          width: 100%;
          max-width: 340px;
          border: none;
          border-top: 1px solid var(--outline-variant);
          margin: 0 auto 24px;
        }

        .focus-habits-wrap {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 360px;
        }

        .focus-habit-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 16px;
          transition: opacity var(--transition-fast);
        }
        .focus-habit-btn.is-done { opacity: 0.35; cursor: default; }

        .focus-habit-ring {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 2px solid var(--outline-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-spring);
          background: var(--surface-container);
        }
        .focus-habit-btn.is-done .focus-habit-ring {
          background: var(--secondary);
          border-color: transparent;
        }

        .focus-habit-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--on-surface-variant);
          text-align: center;
          max-width: 58px;
          line-height: 1.2;
        }

        .focus-empty-msg {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--on-surface);
          text-align: center;
          max-width: 280px;
          line-height: 1.4;
          margin-bottom: 12px;
        }
        .focus-empty-sub {
          font-size: 14px;
          color: var(--on-surface-variant);
          text-align: center;
          max-width: 260px;
          line-height: 1.5;
        }
      `}</style>

      {/* Close */}
      <button className="focus-close-btn" onClick={handleClose} aria-label="Cerrar modo enfoque" id="focus-close">
        <X size={20} strokeWidth={2.5} />
      </button>

      {/* Eyebrow */}
      <p className="focus-eyebrow">Modo Enfoque</p>

      {/* Focus task */}
      {focusTask ? (
        <div className="focus-task-card">
          <h2 className="focus-task-title">{focusTask.title}</h2>
          <div className="focus-task-meta">
            <span className={`focus-priority-chip focus-priority-${focusTask.priority || 'media'}`}>
              {focusTask.priority === 'alta' ? 'Alta prioridad' : focusTask.priority === 'baja' ? 'Baja prioridad' : 'Media prioridad'}
            </span>
            {focusTask.time && <span>· {focusTask.time}</span>}
          </div>
          <div className="focus-complete-wrap">
            <button
              className={`focus-complete-btn${done ? ' burst' : ''}`}
              onClick={handleComplete}
              id="focus-complete"
              aria-label="Completar tarea"
            >
              {done
                ? <CheckCircle2 size={40} color="white" strokeWidth={2.5} />
                : <Circle      size={36} color="white" strokeWidth={2}   />
              }
            </button>
            <p className="focus-complete-hint">{done ? 'Completada' : 'Toca para completar'}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="focus-empty-msg">Todo al día por aquí</p>
          <p className="focus-empty-sub">No quedan tareas pendientes hoy.<br />¡Cuida tus hábitos o descansa!</p>
          <div style={{ marginBottom: 32 }} />
        </>
      )}

      {/* Habits */}
      {habits.length > 0 && (
        <>
          <hr className="focus-divider" />
          <p className="focus-section-title">Hábitos de hoy</p>
          <div className="focus-habits-wrap">
            {habits.map(h => (
              <button
                key={h.id}
                className={`focus-habit-btn${h.completedToday ? ' is-done' : ''}`}
                onClick={() => handleHabitToggle(h)}
                id={`focus-habit-${h.id}`}
                aria-label={h.completedToday ? `${h.name} completado` : `Completar ${h.name}`}
              >
                <div
                  className="focus-habit-ring"
                  style={!h.completedToday ? { borderColor: `${h.color}55` } : {}}
                >
                  <HabitIcon
                    id={h.icon}
                    size={22}
                    color={h.completedToday ? 'white' : h.color}
                  />
                </div>
                <span className="focus-habit-label">{h.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Portal: mount at document.body to escape any parent transform/stacking context
  return createPortal(overlay, document.body);
}
