import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Clock, Edit2, Trash2, AlarmClock, Leaf, Bell, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const FILTERS = ['Todos', 'Hoy', 'Próximos', 'Vencidos'];

const CAT_COLORS = {
  Marketing:  { bg: 'var(--secondary-container)',  text: 'var(--on-secondary-container)' },
  Personal:   { bg: 'var(--primary-container)',    text: 'var(--on-primary-container)'   },
  Espiritual: { bg: 'var(--tertiary-container)',   text: 'var(--on-tertiary-container)'  },
  Trabajo:    { bg: 'rgba(74,111,165,0.15)',        text: '#2b4f8e'                       },
  Salud:      { bg: 'rgba(46,125,103,0.15)',        text: '#1b5e45'                       },
  Urgente:    { bg: 'var(--error-container)',       text: 'var(--on-error-container)'     },
};

// Pick icon per category
function ReminderIcon({ category, priority }) {
  const isUrgent = priority === 'alta';
  if (isUrgent) return <AlarmClock size={22} strokeWidth={1.75} />;
  if (category === 'Espiritual') return <Leaf size={22} strokeWidth={1.75} />;
  return <Bell size={22} strokeWidth={1.75} />;
}

// Human-readable date label
function dayLabel(dateStr) {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === today)    return 'Hoy';
  if (dateStr === tomorrow) return 'Mañana';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'long' })
    .replace(/^\w/, c => c.toUpperCase());
}

export default function RemindersScreen() {
  const { state, dispatch, navigate, showToast } = useApp();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  const todayStr    = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // All tasks with reminder flag
  const all = state.tasks.filter(t => t.reminder);

  // Filter by chip
  const byChip = (() => {
    switch (activeFilter) {
      case 'Hoy':      return all.filter(t => t.date === todayStr);
      case 'Próximos': return all.filter(t => t.date > todayStr);
      case 'Vencidos': return all.filter(t => t.date < todayStr && !t.completed);
      default:         return all;
    }
  })();

  // Filter by search
  const filtered = search.trim()
    ? byChip.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : byChip;

  // Separate today vs upcoming
  const todayItems    = filtered.filter(t => t.date === todayStr);
  const upcomingItems = filtered.filter(t => t.date !== todayStr);

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_TASK', id });
    showToast('Recordatorio eliminado');
  };

  return (
    <>
      <style>{`
        /* ======= REMINDERS SCREEN ======= */
        .rem-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .rem-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        @media (min-width: 768px) {
          .rem-hero-title { font-size: 2.6rem; }
        }
        .rem-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Search + Filters row ── */
        .rem-toolbar {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        @media (min-width: 768px) {
          .rem-toolbar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .rem-search-wrap {
          position: relative;
          width: 100%;
          max-width: 380px;
        }
        .rem-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--outline);
          pointer-events: none;
          transition: color var(--transition-fast);
        }
        .rem-search-wrap:focus-within .rem-search-icon { color: var(--primary); }
        .rem-search {
          width: 100%;
          padding: 11px 16px 11px 44px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--outline-variant);
          background: var(--surface-container-lowest);
          font-size: var(--text-label-md);
          font-family: var(--font-body);
          color: var(--on-surface);
          outline: none;
          transition: all var(--transition-fast);
        }
        .rem-search:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(112,87,101,0.12);
        }
        .rem-search::placeholder { color: var(--outline); }

        .rem-chips {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .rem-chip {
          padding: 8px 20px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
          transition: all var(--transition-fast);
        }
        .rem-chip.active {
          background: var(--primary);
          color: var(--on-primary);
        }
        .rem-chip:not(.active):hover {
          background: rgba(248,215,232,0.5);
          color: var(--primary);
        }

        /* ── Section heading ── */
        .rem-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .rem-section-title {
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--on-surface);
          white-space: nowrap;
        }
        .rem-section-line {
          flex: 1;
          height: 1px;
          background: rgba(208,195,200,0.3);
        }

        /* ── Today cards (full-width glass) ── */
        .rem-today-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .rem-card-today {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-md);
          background: var(--surface-container);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 8px 32px rgba(112,87,101,0.05);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          transition: transform var(--transition-spring);
        }
        .rem-card-today:hover { transform: scale(1.008); }

        .rem-card-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rem-card-body { flex: 1; min-width: 0; }
        .rem-card-title {
          font-weight: 600;
          font-size: var(--text-headline-md);
          color: var(--on-surface);
          margin-bottom: 6px;
        }
        .rem-card-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .rem-card-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
        }
        .rem-cat-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 12px;
          border-radius: 9999px;
          font-size: var(--text-label-sm);
          font-weight: 600;
        }
        .rem-urgent {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: var(--text-label-sm);
          font-weight: 600;
          color: var(--error);
        }

        .rem-card-actions {
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }
        .rem-card-today:hover .rem-card-actions { opacity: 1; }
        .rem-action-btn {
          padding: 8px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          background: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }
        .rem-action-edit { color: var(--on-surface-variant); }
        .rem-action-edit:hover { background: var(--surface-container); }
        .rem-action-del { color: var(--error); }
        .rem-action-del:hover { background: var(--error-container); }

        /* ── Upcoming grid cards ── */
        .rem-upcoming-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }
        @media (min-width: 640px) {
          .rem-upcoming-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .rem-card-upcoming {
          background: var(--surface-container-low);
          border: 1px solid rgba(208,195,200,0.2);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          position: relative;
          overflow: hidden;
          transition: transform var(--transition-spring);
        }
        .rem-card-upcoming:hover { transform: scale(1.02); }

        .rem-day-badge {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          padding: 3px 10px;
          background: var(--surface-container-high);
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--outline);
        }

        .rem-upcoming-title {
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: var(--space-md);
          padding-right: 80px;
        }

        .rem-upcoming-meta {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .rem-upcoming-actions {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
        }

        /* ── Empty state ── */
        .rem-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .rem-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: var(--primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rem-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
        }
        .rem-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 260px;
          line-height: var(--leading-relaxed);
        }
      `}</style>

      <div className="rem-screen">

        {/* ── Hero ── */}
        <h1 className="rem-hero-title">Mis Recordatorios</h1>
        <p className="rem-hero-sub">Gestiona tus avisos para mantener el equilibrio entre vida y trabajo.</p>

        {/* ── Toolbar ── */}
        <div className="rem-toolbar">

          {/* Search */}
          <div className="rem-search-wrap">
            <Search size={18} className="rem-search-icon" />
            <input
              className="rem-search"
              type="text"
              placeholder="Buscar recordatorios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="rem-search"
            />
          </div>

          {/* Filter chips */}
          <div className="rem-chips">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`rem-chip${activeFilter === f ? ' active' : ''}`}
                onClick={() => setActiveFilter(f)}
                id={`rem-filter-${f}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div className="rem-empty">
            <div className="rem-empty-icon">
              <Bell size={36} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <div className="rem-empty-title">Sin recordatorios</div>
            <p className="rem-empty-sub">
              No hay recordatorios en esta categoría. Activa el recordatorio al crear una tarea.
            </p>
            <Button variant="soft" onClick={() => navigate('createTask')} id="rem-create">
              Crear Tarea con Recordatorio
            </Button>
          </div>
        ) : (
          <>
            {/* ── Today section ── */}
            {todayItems.length > 0 && (
              <section style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="rem-section-head">
                  <span className="rem-section-title">Hoy</span>
                  <div className="rem-section-line" />
                </div>
                <div className="rem-today-list">
                  {todayItems.map(task => {
                    const cat = CAT_COLORS[task.category] || { bg: 'var(--surface-container)', text: 'var(--on-surface-variant)' };
                    const isUrgent = task.priority === 'alta';
                    return (
                      <div key={task.id} className="rem-card-today">
                        {/* Icon */}
                        <div
                          className="rem-card-icon"
                          style={{ background: isUrgent ? 'var(--primary-container)' : 'var(--surface-container)' }}
                        >
                          <ReminderIcon category={task.category} priority={task.priority} />
                        </div>

                        {/* Body */}
                        <div className="rem-card-body">
                          <div className="rem-card-title">{task.title}</div>
                          <div className="rem-card-meta">
                            {task.time && (
                              <span className="rem-card-time">
                                <Clock size={16} strokeWidth={1.75} />
                                {task.time}
                              </span>
                            )}
                            <span className="rem-cat-badge" style={{ background: cat.bg, color: cat.text }}>
                              {task.category}
                            </span>
                            {isUrgent && (
                              <span className="rem-urgent">
                                <AlertCircle size={14} strokeWidth={2} />
                                Alta prioridad
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="rem-card-actions">
                          <button
                            className="rem-action-btn rem-action-edit"
                            aria-label="Editar"
                            onClick={() => navigate('taskDetail', { taskId: task.id })}
                            id={`rem-edit-${task.id}`}
                          >
                            <Edit2 size={18} strokeWidth={1.75} />
                          </button>
                          <button
                            className="rem-action-btn rem-action-del"
                            aria-label="Eliminar"
                            onClick={() => handleDelete(task.id)}
                            id={`rem-del-${task.id}`}
                          >
                            <Trash2 size={18} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Upcoming section ── */}
            {upcomingItems.length > 0 && (
              <section>
                <div className="rem-section-head">
                  <span className="rem-section-title">
                    {activeFilter === 'Vencidos' ? 'Vencidos' : 'Próximos'}
                  </span>
                  <div className="rem-section-line" />
                </div>
                <div className="rem-upcoming-grid">
                  {upcomingItems.map(task => {
                    const cat = CAT_COLORS[task.category] || { bg: 'var(--surface-container)', text: 'var(--on-surface-variant)' };
                    return (
                      <div key={task.id} className="rem-card-upcoming">
                        {/* Day badge */}
                        <span className="rem-day-badge">{dayLabel(task.date)}</span>

                        {/* Title */}
                        <div className="rem-upcoming-title">{task.title}</div>

                        {/* Meta */}
                        <div className="rem-upcoming-meta">
                          {task.time && (
                            <span className="rem-card-time">
                              <Clock size={15} strokeWidth={1.75} />
                              {task.time}
                            </span>
                          )}
                          <span className="rem-cat-badge" style={{ background: cat.bg, color: cat.text }}>
                            {task.category}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="rem-upcoming-actions">
                          <button
                            className="rem-action-btn rem-action-edit"
                            aria-label="Editar"
                            onClick={() => navigate('taskDetail', { taskId: task.id })}
                            id={`rem-up-edit-${task.id}`}
                          >
                            <Edit2 size={17} strokeWidth={1.75} />
                          </button>
                          <button
                            className="rem-action-btn rem-action-del"
                            aria-label="Eliminar"
                            onClick={() => handleDelete(task.id)}
                            id={`rem-up-del-${task.id}`}
                          >
                            <Trash2 size={17} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
