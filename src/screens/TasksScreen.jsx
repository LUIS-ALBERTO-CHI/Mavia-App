import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import LottieIcon from '../components/LottieIcon';
import { Search, Clock, MoreVertical, Check, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { localToday, localDateOffset } from '../lib/utils';
import PriorityBadge from '../components/PriorityBadge';
import ChecklistConfirmModal from '../components/ChecklistConfirmModal';

const FILTERS = ['Hoy', 'Mañana', 'Semana', 'Urgentes', 'Marketing', 'Personal', 'Espiritual'];

const CAT_STYLE = {
  Marketing:  { bg: 'var(--secondary-container)',  color: 'var(--on-secondary-container)',  dot: 'var(--secondary)'  },
  Personal:   { bg: 'var(--primary-container)',    color: 'var(--on-primary-container)',    dot: 'var(--primary)'    },
  Espiritual: { bg: 'var(--tertiary-container)',   color: 'var(--on-tertiary-container)',   dot: 'var(--tertiary)'   },
};

export default function TasksScreen() {
  const { state, dispatch, navigate, showToast } = useApp();
  const activeFilter = state.activeFilter || 'Hoy';
  const [search, setSearch]       = useState('');
  const [confirmData, setConfirmData] = useState(null);

  const chipsRef = useRef(null);

  // Auto-scroll the selected chip into view
  const handleFilter = (f, e) => {
    dispatch({ type: 'SET_FILTER', filter: f });
    // Scroll the clicked button into view within the chips container
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  const today    = localToday();
  const tomorrow = localDateOffset(1);
  const weekEnd  = localDateOffset(7);

  // Sort by time: tasks with time first (ascending), then tasks without time
  const sortByTime = (arr) => [...arr].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  const getFiltered = () => {
    let base;
    switch (activeFilter) {
      case 'Hoy':      base = state.tasks.filter(t => t.date === today); break;
      case 'Mañana':   base = state.tasks.filter(t => t.date === tomorrow); break;
      case 'Semana':   base = state.tasks.filter(t => t.date >= today && t.date <= weekEnd); break;
      case 'Urgentes': base = state.tasks.filter(t =>
        (t.priority === 'alta' || t.priority === 'Alta' ||
         t.category === 'Urgente' || t.category === 'urgente') &&
        !t.completed
      ); break;
      default:         base = state.tasks.filter(t => t.category === activeFilter);
    }
    if (search.trim()) {
      base = base.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }
    return sortByTime(base);
  };

  const filtered  = getFiltered();
  const urgent    = filtered.filter(t => !t.completed && t.priority === 'alta');
  const pending   = filtered.filter(t => !t.completed && t.priority !== 'alta');
  const completed = filtered.filter(t => t.completed);


  const handleToggle = (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
      const pending = (task.checklist || []).filter(item => !item.done);
      if (pending.length > 0) {
        setConfirmData({
          taskTitle:    task.title,
          pendingCount: pending.length,
          onConfirm: () => {
            dispatch({ type: 'TOGGLE_TASK', id });
            showToast('¡Tarea completada! 🎉', 'success');
            setConfirmData(null);
          },
          onReview: () => {
            setConfirmData(null);
            navigate('taskDetail', { taskId: task.id });
          },
          onClose: () => setConfirmData(null),
        });
        return;
      }
    }

    dispatch({ type: 'TOGGLE_TASK', id });
    if (!task.completed) showToast('¡Tarea completada! 🎉', 'success');
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_TASK', id });
    showToast('Tarea eliminada');
    cancelReminder(id);
  };

  // stub so no import error — cancelReminder is optional enhancement
  const cancelReminder = (_id) => {};

  return (
    <>
      {/* Checklist confirm modal */}
      {confirmData && <ChecklistConfirmModal {...confirmData} />}
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
          /* Uses global .scroll-x-row for breakout scrolling */
          /* Extra right padding ensures last chip is never clipped */
          padding-right: calc(var(--space-container) + 16px) !important;
          margin-bottom: var(--space-xl);
        }

        .ts-chip {
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: var(--text-label-md);
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
          transition: all 0.2s ease;
          flex-shrink: 0;
          letter-spacing: 0.01em;
        }

        .ts-chip:hover {
          background: var(--surface-container-highest, #ede8ec);
          color: var(--on-surface);
        }

        .ts-chip.active {
          background: var(--primary);
          color: var(--on-primary);
          box-shadow: 0 3px 12px rgba(112,87,101,0.28);
          font-weight: 600;
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
          gap: 6px;
        }

        .ts-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: var(--text-label-sm);
          font-weight: 600;
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
        }

        .ts-cat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Time pill */
        .ts-time {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 9999px;
          font-size: var(--text-label-sm);
          font-weight: 500;
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
        }

        /* More button */
        .ts-more-btn {
          background: none;
          border: none;
          color: var(--outline-variant);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          opacity: 0.4;
          transition: all var(--transition-fast);
          flex-shrink: 0;
          position: relative;
        }

        .ts-card:hover .ts-more-btn { opacity: 1; }
        .ts-more-btn:hover { color: var(--on-surface); background: var(--surface-container-high); }
        .ts-more-btn.open { opacity: 1; color: var(--primary); background: var(--primary-container); }

        /* Context menu dropdown */
        .ts-ctx-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--surface-container-lowest);
          border: 1px solid rgba(208,195,200,0.25);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(112,87,101,0.18), 0 2px 8px rgba(0,0,0,0.06);
          z-index: 50;
          overflow: hidden;
          min-width: 160px;
          animation: ctxIn 0.18s var(--ease-spring) both;
        }

        @keyframes ctxIn {
          from { opacity: 0; transform: scale(0.92) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }

        .ts-ctx-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-body);
          color: var(--on-surface);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background var(--transition-fast);
        }

        .ts-ctx-item:hover { background: var(--surface-container); }
        .ts-ctx-item.danger { color: var(--error); }
        .ts-ctx-item.danger:hover { background: var(--error-container); }

        .ts-ctx-divider {
          height: 1px;
          background: rgba(208,195,200,0.2);
          margin: 2px 0;
        }

        /* Confirm row inside card */
        .ts-del-confirm {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
        }

        .ts-del-confirm-label {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
          color: var(--error);
          font-family: var(--font-body);
        }

        .ts-del-yes {
          padding: 5px 14px;
          background: var(--error);
          color: white;
          border: none;
          border-radius: 99px;
          font-size: 13px; font-weight: 700;
          font-family: var(--font-body);
          cursor: pointer;
        }

        .ts-del-no {
          padding: 5px 14px;
          background: var(--surface-container);
          color: var(--on-surface-variant);
          border: none;
          border-radius: 99px;
          font-size: 13px; font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
        }

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
        <div className="ts-chips scroll-x-row" ref={chipsRef}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`ts-chip${activeFilter === f ? ' active' : ''}`}
              onClick={(e) => handleFilter(f, e)}
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
                onEdit={id => navigate('createTask', { taskId: id })}
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
                onEdit={id => navigate('createTask', { taskId: id })}
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
                onEdit={id => navigate('createTask', { taskId: id })}
              />
            ))}
          </div>
        )}
      </div>


    </>
  );
}

/* ─── Task Card Component ─── */
function TaskCard({ task, onToggle, onDelete, onOpen, onEdit }) {
  const [completing, setCompleting]   = useState(false);
  const [menuOpen,   setMenuOpen]     = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const menuRef = useRef(null);
  const catStyle = CAT_STYLE[task.category] || { bg: 'rgba(208,195,200,0.2)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' };

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleCheck = (e) => {
    e.stopPropagation();
    if (!task.completed) {
      setCompleting(true);
      setTimeout(() => { onToggle(task.id); setCompleting(false); }, 480);
    } else {
      onToggle(task.id);
    }
  };

  const openMenu = (e) => {
    e.stopPropagation();
    setMenuOpen(v => !v);
    setConfirming(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    setConfirming(false);
    onDelete(task.id);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirming(false);
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
          {task.priority && <PriorityBadge priority={task.priority} />}
          {(task.time || task.date) && (
            <span className="ts-time">
              <Clock size={12} strokeWidth={2} />
              {task.date === localToday()
                ? task.time ? `Hoy, ${task.time}` : 'Hoy'
                : task.time ? `${task.date}, ${task.time}` : task.date}
            </span>
          )}
        </div>
      </div>

      {/* ── More button + dropdown menu ── */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
        <button
          className={`ts-more-btn${menuOpen ? ' open' : ''}`}
          onClick={openMenu}
          aria-label="Opciones de tarea"
          id={`task-more-${task.id}`}
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div className="ts-ctx-menu" onClick={e => e.stopPropagation()}>
            {/* Edit */}
            <button
              className="ts-ctx-item"
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(task.id); }}
              id={`task-menu-edit-${task.id}`}
            >
              <Edit2 size={15} strokeWidth={1.75} />
              Editar
            </button>

            <div className="ts-ctx-divider" />

            {/* Delete — shows confirm row first */}
            {!confirming ? (
              <button
                className="ts-ctx-item danger"
                onClick={handleDeleteClick}
                id={`task-menu-delete-${task.id}`}
              >
                <Trash2 size={15} strokeWidth={1.75} />
                Eliminar
              </button>
            ) : (
              <div className="ts-del-confirm">
                <span className="ts-del-confirm-label">¿Eliminar?</span>
                <button className="ts-del-no" onClick={handleCancelDelete}>No</button>
                <button className="ts-del-yes" onClick={handleConfirmDelete}>Sí</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
