import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Flame, CheckCircle2, Circle } from 'lucide-react';
import HabitIcon from './HabitIcon';

/* ─────────────────────────────────────────
   #14 Focus Mode — fullscreen minimal overlay
   Shows the most important pending task + pending habits
   ───────────────────────────────────────── */
export default function FocusMode({ onClose }) {
  const { state, dispatch, showToast } = useApp();
  const { tasks, habits } = state;
  const [done, setDone] = useState(false);

  // Pick the most urgent pending task for today
  const today = new Date().toLocaleDateString('en-CA');
  const PRIORITY = { alta: 0, media: 1, baja: 2 };
  const focusTask = [...tasks]
    .filter(t => !t.completed && t.date === today)
    .sort((a, b) => (PRIORITY[a.priority] ?? 1) - (PRIORITY[b.priority] ?? 1))[0] || null;

  const pendingHabits = habits.filter(h => !h.completedToday);

  const handleComplete = () => {
    if (!focusTask) return;
    setDone(true);
    try { navigator.vibrate?.([30, 20, 80]); } catch {}
    setTimeout(() => {
      dispatch({ type: 'TOGGLE_TASK', id: focusTask.id });
      showToast('¡Tarea completada!', 'success');
      setDone(false);
    }, 600);
  };

  const handleHabitToggle = (habit) => {
    dispatch({ type: 'TOGGLE_HABIT', id: habit.id });
    try { navigator.vibrate?.([30, 20, 60]); } catch {}
    showToast(`${habit.name} completado`, 'success');
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="focus-mode-overlay">
      <style>{`
        .focus-close-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: var(--surface-container);
          border: none;
          border-radius: 50%;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background var(--transition-fast);
          color: var(--on-surface-variant);
        }
        .focus-close-btn:hover { background: var(--surface-container-high); }

        .focus-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 20px;
        }

        .focus-task-title {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 5vw, 2.8rem);
          font-weight: 600;
          color: var(--on-surface);
          text-align: center;
          max-width: 520px;
          line-height: 1.2;
          margin-bottom: 12px;
        }

        .focus-task-priority {
          font-size: 13px;
          color: var(--on-surface-variant);
          margin-bottom: 40px;
        }

        .focus-complete-btn {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: var(--secondary);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform var(--transition-spring), box-shadow var(--transition-fast);
          box-shadow: 0 6px 24px rgba(84,99,71,0.35);
          margin-bottom: 48px;
        }
        .focus-complete-btn:hover { transform: scale(1.08); box-shadow: 0 10px 32px rgba(84,99,71,0.45); }
        .focus-complete-btn:active { transform: scale(0.95); }
        .focus-complete-btn.done { background: var(--secondary); transform: scale(1.2); }

        .focus-complete-label {
          font-size: 12px;
          color: var(--on-surface-variant);
          margin-top: -40px;
          margin-bottom: 48px;
        }

        .focus-divider {
          width: 100%;
          max-width: 360px;
          border: none;
          border-top: 1px solid var(--outline-variant);
          margin: 0 auto 24px;
        }

        .focus-habits-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          margin-bottom: 16px;
        }

        .focus-habits-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 480px;
        }

        .focus-habit-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          opacity: 1;
          transition: opacity var(--transition-fast);
        }
        .focus-habit-pill.done-habit { opacity: 0.45; }

        .focus-habit-circle {
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 2px solid var(--outline-variant);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-spring);
          background: var(--surface-container);
        }
        .focus-habit-circle.done-habit {
          border-color: transparent;
          background: var(--secondary);
        }
        .focus-habit-name {
          font-size: 10px;
          font-weight: 600;
          color: var(--on-surface-variant);
          text-align: center;
          max-width: 60px;
        }

        .focus-empty {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          text-align: center;
          max-width: 300px;
          line-height: 1.5;
        }
      `}</style>

      {/* Close button */}
      <button className="focus-close-btn" onClick={onClose} aria-label="Cerrar modo enfoque" id="focus-close">
        <X size={20} />
      </button>

      <p className="focus-label">Modo Enfoque</p>

      {focusTask ? (
        <>
          <h2 className="focus-task-title">{focusTask.title}</h2>
          <p className="focus-task-priority">
            {focusTask.priority === 'alta' ? 'Prioridad alta' : focusTask.priority === 'baja' ? 'Prioridad baja' : 'Prioridad media'}
            {focusTask.time ? ` · ${focusTask.time}` : ''}
          </p>

          {/* Big completion button */}
          <button
            className={`focus-complete-btn${done ? ' done' : ''}`}
            onClick={handleComplete}
            id="focus-complete"
            aria-label="Marcar como completada"
          >
            {done
              ? <CheckCircle2 size={38} color="white" strokeWidth={2.5} />
              : <Circle size={36} color="white" strokeWidth={2} />
            }
          </button>
          <p className="focus-complete-label">Toca para completar</p>
        </>
      ) : (
        <p className="focus-empty" style={{ marginBottom: 48 }}>
          ¡No hay tareas pendientes hoy!<br />
          Cuida tus hábitos o crea una nueva tarea.
        </p>
      )}

      {/* Pending habits quick-complete */}
      {habits.length > 0 && (
        <>
          <hr className="focus-divider" />
          <p className="focus-habits-title">Hábitos pendientes</p>
          <div className="focus-habits-row">
            {habits.map(h => (
              <button
                key={h.id}
                className={`focus-habit-pill${h.completedToday ? ' done-habit' : ''}`}
                onClick={() => !h.completedToday && handleHabitToggle(h)}
                id={`focus-habit-${h.id}`}
                aria-label={h.name}
              >
                <div
                  className={`focus-habit-circle${h.completedToday ? ' done-habit' : ''}`}
                  style={h.completedToday ? {} : { borderColor: `${h.color}66` }}
                >
                  <HabitIcon
                    id={h.icon}
                    size={22}
                    color={h.completedToday ? 'white' : h.color}
                  />
                </div>
                <span className="focus-habit-name">{h.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
