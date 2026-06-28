import { useState } from 'react';
import { useApp } from '../context/AppContext';
import LottieIcon from '../components/LottieIcon';
import { Search, Clock, MoreVertical, Check, Trash2, ChevronRight } from 'lucide-react';
import { localToday, localDateOffset } from '../lib/utils';

const FILTERS = ['Hoy', 'Mañana', 'Semana', 'Urgentes', 'Marketing', 'Personal', 'Espiritual'];

const CAT_STYLE = {
  Marketing:  { bg: 'var(--secondary-container)',  color: 'var(--on-secondary-container)',  dot: 'var(--secondary)'  },
  Personal:   { bg: 'var(--primary-container)',    color: 'var(--on-primary-container)',    dot: 'var(--primary)'    },
  Espiritual: { bg: 'var(--tertiary-container)',   color: 'var(--on-tertiary-container)',   dot: 'var(--tertiary)'   },
};

export default function TasksScreen() {
  const { state, dispatch, navigate, showToast } = useApp();
  const activeFilter = state.activeFilter || 'Hoy';
  const [search, setSearch] = useState('');

  const today    = localToday();
  const tomorrow = localDateOffset(1);
  const weekEnd  = localDateOffset(7);

  const getFiltered = () => {
    let base;
    switch (activeFilter) {
      case 'Hoy':      base = state.tasks.filter(t => t.date === today); break;
      case 'Mañana':   base = state.tasks.filter(t => t.date === tomorrow); break;
      case 'Semana':   base = state.tasks.filter(t => t.date >= today && t.date <= weekEnd); break;
      case 'Urgentes': base = state.tasks.filter(t => t.priority === 'alta' && !t.completed); break;
      default:         base = state.tasks.filter(t => t.category === activeFilter);
    }
    if (search.trim()) {
      base = base.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }
    return base;
  };

  const filtered  = getFiltered();
  const urgent    = filtered.filter(t => !t.completed && t.priority === 'alta');
  const pending   = filtered.filter(t => !t.completed && t.priority !== 'alta');
  const completed = filtered.filter(t => t.completed);

  const handleToggle = (id) => {
    const task = state.tasks.find(t => t.id === id);
    dispatch({ type: 'TOGGLE_TASK', id });
    if (!task.completed) showToast('¡Tarea completada!', 'success');
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_TASK', id });
    showToast('Tarea eliminada');
  };

  return (
    <>
      <style>{`
        /* ========= TASKS SCREEN ========= */
        .ts-screen {
          padding: var(--space-lg) var(--space-container) var(--space-8);
          max-width: 720px;
          margin: 0 auto;
          animation: screenEnter 0.5s var(--ease-out) both;
        }

        /* ---- Page header ---- */
        .ts-heading {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--on-surface);
          line-height: 1.2;
        }

        .ts-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          margin-top: 2px;
          margin-bottom: var(--space-xl);
        }

        /* ---- Search bar ---- */
        .ts-search-wrap {
          position: relative;
          margin-bottom: var(--space-lg);
        }

        .ts-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--on-surface-variant);
          pointer-events: none;
          transition: color var(--transition-fast);
        }

        .ts-search-wrap:focus-within .ts-search-icon { color: var(--primary); }

        .ts-search {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border-radius: 20px;
          background: var(--surface-container);
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: var(--text-body-md);
          color: var(--on-surface);
          transition: box-shadow var(--transition-fast);
        }

        .ts-search:focus { box-shadow: 0 0 0 3px rgba(248,215,232,0.4); }
        .ts-search::placeholder { color: var(--outline); }

        /* ---- Filter chips ---- */
        .ts-chips {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          padding-bottom: var(--space-sm);
          margin-bottom: var(--space-xl);
          scrollbar-width: none;
        }

        .ts-chips::-webkit-scrollbar { display: none; }

        .ts-chip {
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: var(--text-label-md);
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid var(--outline-variant);
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .ts-chip:hover { background: var(--surface-container); }

        .ts-chip.active {
          background: var(--primary);
          color: var(--on-primary);
          border-color: var(--primary);
          box-shadow: 0 2px 10px rgba(112,87,101,0.25);
        }

        /* ---- Section labels ---- */
        .ts-group-label {
          font-size: var(--text-label-md);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: var(--space-md);
          padding: 0 var(--space-sm);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .ts-group-label.urgent { color: var(--primary); }
        .ts-group-label.pending { color: var(--on-surface-variant); }
        .ts-group-label.done { color: var(--outline); }

        /* ---- Task groups ---- */
        .ts-group { margin-bottom: var(--space-xl); }

        /* ---- Task card ---- */
        .ts-card {
          background: var(--surface-container-low);
          border-radius: 24px;
          padding: var(--space-lg);
          margin-bottom: var(--space-md);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.05);
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          cursor: pointer;
          transition: box-shadow var(--transition-fast), transform var(--transition-fast), opacity 0.35s ease;
          position: relative;
        }

        .ts-card:hover {
          background: var(--surface-container);
          box-shadow: 0 8px 32px rgba(112,87,101,0.08);
        }

        .ts-card:active { transform: scale(0.99); }

        .ts-card.completing {
          animation: taskComplete 0.5s var(--ease-out) forwards;
        }
        @keyframes taskComplete {
          0%   { transform: scale(1);    opacity: 1; max-height: 200px; }
          30%  { transform: scale(1.02); opacity: 1; }
          70%  { transform: scale(0.97); opacity: 0.6; }
          100% { transform: scale(0.95); opacity: 0; max-height: 0; padding: 0; margin: 0; }
        }

        .ts-card.is-done {
          background: var(--surface-container-lowest);
          opacity: 0.6;
          box-shadow: none;
          border: 1px solid rgba(208,195,200,0.10);
        }

        /* Checkbox */
        .ts-check {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid var(--outline-variant);
          background: none;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          cursor: pointer;
          transition: all var(--transition-spring);
        }

        .ts-check:hover { border-color: var(--primary); }

        .ts-check.checked {
          background: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(112,87,101,0.3);
        }

        /* Body */
        .ts-card-body { flex: 1; min-width: 0; }

        .ts-card-title {
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: var(--space-sm);
          line-height: 1.35;
          transition: all var(--transition-fast);
        }

        .ts-card.is-done .ts-card-title {
          text-decoration: line-through;
          color: var(--on-surface-variant);
        }

        .ts-card-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-md);
        }

        .ts-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: var(--text-label-sm);
          font-weight: 600;
        }

        .ts-cat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ts-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }

        /* More button */
        .ts-more-btn {
          background: none;
          border: none;
          color: var(--outline-variant);
          cursor: pointer;
          padding: 2px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          opacity: 0;
          transition: opacity var(--transition-fast);
          flex-shrink: 0;
        }

        .ts-card:hover .ts-more-btn { opacity: 1; }
        .ts-more-btn:hover { color: var(--on-surface); }

        /* ---- Empty state ---- */
        .ts-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-8) var(--space-lg);
          gap: var(--space-md);
        }

        .ts-empty-circle {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(248,215,232,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-sm);
        }

        .ts-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          color: var(--on-surface);
          font-weight: 500;
        }

        .ts-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 280px;
          line-height: 1.6;
        }

        .ts-empty-btn {
          margin-top: var(--space-sm);
          padding: 0.75rem 2rem;
          background: var(--primary-container);
          color: var(--on-primary-container);
          border: none;
          border-radius: 9999px;
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .ts-empty-btn:hover { background: var(--primary); color: var(--on-primary); }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ts-screen">
        {/* ── Page header ── */}
        <h2 className="ts-heading">Mis Tareas</h2>
        <p className="ts-sub">Organiza tu día con intención y calma.</p>

        {/* ── Search ── */}
        <div className="ts-search-wrap">
          <Search size={18} className="ts-search-icon" />
          <input
            className="ts-search"
            type="text"
            placeholder="Buscar tareas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="tasks-search"
          />
        </div>

        {/* ── Filter chips ── */}
        <div className="ts-chips">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`ts-chip${activeFilter === f ? ' active' : ''}`}
              onClick={() => dispatch({ type: 'SET_FILTER', filter: f })}
              id={`tasks-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="ts-empty">
            <div className="ts-empty-circle">
              <LottieIcon name="flower" size={96} loop autoplay />
            </div>
            <div className="ts-empty-title">Todo en calma por aquí</div>
            <p className="ts-empty-sub">
              No tienes tareas pendientes en esta categoría.<br />Disfruta el momento.
            </p>
            <button
              className="ts-empty-btn"
              onClick={() => navigate('createTask')}
              id="tasks-create-empty"
            >
              Crear Tarea
            </button>
          </div>
        )}

        {/* ── Urgent group ── */}
        {urgent.length > 0 && (
          <div className="ts-group">
            <div className="ts-group-label urgent">
              Urgentes &amp; Prioritarias
            </div>
            {urgent.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onOpen={() => navigate('taskDetail', { taskId: task.id })}
              />
            ))}
          </div>
        )}

        {/* ── Pending group ── */}
        {pending.length > 0 && (
          <div className="ts-group">
            <div className="ts-group-label pending">
              Pendientes
            </div>
            {pending.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onOpen={() => navigate('taskDetail', { taskId: task.id })}
              />
            ))}
          </div>
        )}

        {/* ── Completed group ── */}
        {completed.length > 0 && (
          <div className="ts-group">
            <div className="ts-group-label done">
              Completadas
            </div>
            {completed.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onOpen={() => navigate('taskDetail', { taskId: task.id })}
              />
            ))}
          </div>
        )}
      </div>


    </>
  );
}

/* ─── Task Card Component ─── */
function TaskCard({ task, onToggle, onDelete, onOpen }) {
  const [completing, setCompleting] = useState(false);
  const catStyle = CAT_STYLE[task.category] || { bg: 'rgba(208,195,200,0.2)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' };

  const handleCheck = (e) => {
    e.stopPropagation();
    if (!task.completed) {
      setCompleting(true);
      setTimeout(() => { onToggle(task.id); setCompleting(false); }, 480);
    } else {
      onToggle(task.id);
    }
  };

  return (
    <div
      className={`ts-card${task.completed ? ' is-done' : ''}${completing ? ' completing' : ''}`}
      onClick={onOpen}
      id={`task-card-${task.id}`}
    >
      {/* Circle checkbox */}
      <button
        className={`ts-check${task.completed ? ' checked' : ''}`}
        onClick={handleCheck}
        aria-label={task.completed ? 'Desmarcar' : 'Completar'}
        id={`task-check-${task.id}`}
      >
        {task.completed && <Check size={13} color="white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="ts-card-body">
        <div className="ts-card-title">{task.title}</div>
        <div className="ts-card-meta">
          {task.category && (
            <span className="ts-cat-pill" style={{ background: catStyle.bg, color: catStyle.color }}>
              <span className="ts-cat-dot" style={{ background: catStyle.dot }} />
              {task.category}
            </span>
          )}
          {task.time && (
            <span className="ts-time">
              <Clock size={13} strokeWidth={2} />
              {task.time}
            </span>
          )}
          {task.date && (
            <span className="ts-time">
              {task.date === localToday() ? 'Hoy' : task.date}
            </span>
          )}
        </div>
      </div>

      {/* More */}
      <button
        className="ts-more-btn"
        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
        aria-label="Eliminar tarea"
        id={`task-delete-${task.id}`}
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );
}
