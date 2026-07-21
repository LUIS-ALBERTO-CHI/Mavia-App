import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { localToday, formatTime12h } from '../lib/utils';
import { Clock, CalendarDays, StickyNote, Target } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import ChecklistConfirmModal from '../components/ChecklistConfirmModal';
import { useState } from 'react';

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t('auth.goodMorning');
  if (h < 18) return t('auth.goodAfternoon');
  return t('auth.goodEvening');
}

function getMotivationalMessage(completedToday, totalToday) {
  const h = new Date().getHours();
  const allTasksDone = totalToday > 0 && completedToday === totalToday;
  const noTasks = totalToday === 0;

  if (allTasksDone) return 'Todo listo por hoy. Buen trabajo.';
  if (noTasks && h < 10) return 'Empieza el día con intención. ¿Qué quieres lograr?';
  if (noTasks) return 'No tienes tareas para hoy. Planifica lo que viene.';
  if (completedToday === 0 && h > 16) return 'La tarde es tuya. Termina fuerte.';
  if (completedToday === 0) return 'Cada gran logro empieza con el primer paso.';
  const pct = Math.round((completedToday / totalToday) * 100);
  if (pct >= 75) return `${pct}% logrado. Ya casi terminas, no pares.`;
  if (pct >= 50) return 'Mitad del camino. Mantén el ritmo.';
  return `${completedToday} de ${totalToday} listo. Sigue avanzando.`;
}

const CAT_DOTS = {
  Marketing:  '#546347',
  Personal:   '#705675',
  Espiritual: '#c4a25a',
  Urgente:    '#ba1a1a',
  Trabajo:    '#4a6fa5',
  Salud:      '#5a9e7a',
};

const QUICK_LINKS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarDays, color: 'var(--secondary)', bg: 'var(--secondary-container)' },
  { id: 'notes',    label: 'Notas',      icon: StickyNote,   color: 'var(--primary)',   bg: 'var(--primary-container)'   },
  { id: 'goals',    label: 'Objetivos',  icon: Target,       color: 'var(--tertiary)',  bg: 'var(--tertiary-container)'  },
];

export default function DashboardScreen() {
  const { state, navigate, dispatch, showToast } = useApp();
  const { t } = useTranslation();
  const { user, tasks, events } = state;

  const [confirmData, setConfirmData] = useState(null);

  const today = localToday();
  // Sort: Alta first, then Media, then Baja — within same priority, sort by time
  const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 };
  const sortPending = (arr) => [...arr].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  const sortByTime = (arr) => [...arr].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  const todayTasks     = sortByTime(tasks.filter(t => t.date === today));
  const completedToday = todayTasks.filter(t => t.completed).length;
  const pendingCount   = todayTasks.filter(t => !t.completed).length;
  const todayEvents    = events.filter(e => e.date === today).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const handleToggle = (taskId, e) => {
    if (e) e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      const pending = (task.checklist || []).filter(item => !item.done);
      if (pending.length > 0) {
        setConfirmData({
          taskTitle:    task.title,
          pendingCount: pending.length,
          onConfirm: () => {
            dispatch({ type: 'TOGGLE_TASK', id: taskId });
            showToast('¡Tarea completada!', 'success');
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

    dispatch({ type: 'TOGGLE_TASK', id: taskId });
    if (!task.completed) showToast('¡Tarea completada!', 'success');
  };

  return (
    <>
      {/* Checklist confirm modal */}
      {confirmData && <ChecklistConfirmModal {...confirmData} />}
      <style>{`
        /* === DASHBOARD STYLES === */
        .dash-content {
          max-width: var(--content-max-w);
          margin: 0 auto;
          padding: var(--space-xl) var(--space-container);
          animation: screenEnter 0.7s var(--ease-back) both;
        }

        /* ---- Greeting section ---- */
        .dash-greeting-row {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        @media (min-width: 768px) {
          .dash-greeting-row {
            flex-direction: row;
            align-items: flex-end;
          }
        }

        .dash-greeting-h {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--primary);
          margin-bottom: var(--space-xs);
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .dash-greeting-h {
            font-size: var(--text-headline-lg);
          }
        }

        .dash-greeting-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          line-height: 1.6;
        }

        .dash-tasks-badge {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: var(--secondary-container);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        .dash-tasks-badge-text {
          font-size: var(--text-label-md);
          color: var(--on-secondary-container);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* ---- Quick links ---- */
        .dash-quick {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .dash-quick-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg) var(--space-sm);
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-glow);
          border: none;
          cursor: pointer;
          transition: transform var(--transition-spring), box-shadow var(--transition-base);
        }
        .dash-quick-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .dash-quick-card:active { transform: scale(0.98); }

        .dash-quick-icon {
          width: 46px;
          height: 46px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash-quick-label {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
        }

        /* ---- Secondary grid ---- */
        .secondary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-xl);
        }

        @media (min-width: 768px) {
          .secondary-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-md);
        }

        .section-h {
          font-family: var(--font-body);
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--primary);
          letter-spacing: -0.01em;
        }

        /* ---- Events ---- */
        .event-row {
          background: var(--surface-container-lowest);
          padding: var(--space-md);
          border-radius: 1rem;
          box-shadow: var(--shadow-glow);
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
          border-left: 4px solid;
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .event-row:hover { box-shadow: var(--shadow-md); }

        .event-time-box {
          padding: var(--space-sm);
          border-radius: var(--radius-sm);
          text-align: center;
          min-width: 50px;
          flex-shrink: 0;
        }

        .event-time-h {
          font-size: var(--text-label-sm);
          font-weight: 700;
          line-height: 1.2;
        }

        .event-time-ampm {
          font-size: 10px;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .event-info-title {
          font-size: var(--text-body-md);
          font-weight: 700;
          color: var(--on-surface);
          margin-bottom: 2px;
        }

        .event-info-sub {
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.02em;
        }

        /* ---- Task list ---- */
        .task-list-card {
          background: var(--surface-container-lowest);
          border-radius: 1rem;
          box-shadow: var(--shadow-glow);
          padding: var(--space-sm);
        }

        .task-list-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          padding: var(--space-md);
          border-bottom: 1px solid rgba(208, 195, 200, 0.10);
          transition: opacity var(--transition-fast);
          cursor: pointer;
        }
        .task-list-item:last-child { border-bottom: none; }

        .task-check-btn {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-full);
          border: 2px solid var(--outline);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: none;
          transition: all var(--transition-spring);
          flex-shrink: 0;
        }

        .task-check-btn:hover {
          border-color: var(--primary);
        }

        .task-check-btn.checked {
          background: var(--primary-container);
          border-color: var(--primary);
        }

        .task-check-icon {
          font-size: 16px;
          color: var(--primary);
          opacity: 0;
          transition: opacity var(--transition-fast);
          font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24;
        }

        .task-check-btn:hover .task-check-icon,
        .task-check-btn.checked .task-check-icon {
          opacity: 1;
        }

        .task-item-text {
          font-size: var(--text-body-md);
          color: var(--on-surface);
          line-height: 1.4;
          transition: all var(--transition-fast);
          margin-bottom: 5px;
        }

        .task-item-text.done {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .task-item-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          align-items: center;
        }

        /* Shared pill style for home badges */
        .ti-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .ti-cat   { background: var(--surface-container-high); color: var(--on-surface-variant); }
        .ti-time  { background: var(--surface-container-high); color: var(--on-surface-variant); }
        .ti-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      `}</style>

      <div className="dash-content">
        {/* === GREETING === */}
        <section style={{ marginBottom: 'var(--space-xl)', animation: 'screenEnter 0.7s var(--ease-back) both' }}>
          <div className="dash-greeting-row">
            <div>
              <h2 className="dash-greeting-h">
                {getGreeting(t)}, {user.firstName}
              </h2>
              <p className="dash-greeting-sub">
                {getMotivationalMessage(completedToday, todayTasks.length)}
              </p>
            </div>
            <div className="dash-tasks-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--on-secondary-container)' }}>task_alt</span>
              <span className="dash-tasks-badge-text">{pendingCount} {t('dashboard.tasksToday')}</span>
            </div>
          </div>

          {/* === QUICK LINKS === */}
          <div className="dash-quick">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  className="dash-quick-card"
                  onClick={() => navigate(link.id)}
                  id={`dash-quick-${link.id}`}
                >
                  <span className="dash-quick-icon" style={{ background: link.bg }}>
                    <Icon size={22} color={link.color} strokeWidth={1.9} />
                  </span>
                  <span className="dash-quick-label">{link.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* === SECONDARY SECTIONS === */}
        <div className="secondary-grid">
          {/* Events */}
          <section>
            <div className="section-header-row">
              <h4 className="section-h">Eventos de hoy</h4>
              <button className="btn-ghost btn btn-sm" onClick={() => navigate('events')} id="dash-events-all">Ver todo</button>
            </div>
            <div>
              {todayEvents.length > 0 && (
                todayEvents.slice(0, 3).map((ev, i) => {
                  const isPrimary = i % 2 === 0;
                  const fullTime  = formatTime12h(ev.startTime, 'Todo el día');
                  // Split into "8:30" and "AM" for the two-line display box
                  const timeParts = fullTime.split(' ');
                  const timeNum   = timeParts[0] || '—';
                  const ampm      = timeParts[1] || '';

                  return (
                    <div
                      key={ev.id}
                      className="event-row"
                      style={{ borderLeftColor: isPrimary ? 'var(--primary)' : 'var(--secondary)' }}
                      onClick={() => navigate('events')}
                      id={`dash-ev-${ev.id}`}
                    >
                      <div
                        className="event-time-box"
                        style={{ background: isPrimary ? 'var(--primary-container)' : 'var(--secondary-container)' }}
                      >
                        <span className="event-time-h" style={{ color: isPrimary ? 'var(--on-primary-container)' : 'var(--on-secondary-container)' }}>
                          {timeNum}
                        </span>
                        <span className="event-time-ampm" style={{ color: isPrimary ? 'var(--on-primary-container)' : 'var(--on-secondary-container)' }}>
                          {ampm}
                        </span>
                      </div>
                      <div>
                        <div className="event-info-title">{ev.title}</div>
                        <div className="event-info-sub">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {ev.location ? 'location_on' : 'videocam'}
                          </span>
                          {ev.location || ev.type || 'Online'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Empty state when no events today */}
              {todayEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg) var(--space-md)', color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.35 }}>event</span>
                  <span style={{ fontSize: '13px', opacity: 0.6 }}>Sin eventos hoy</span>
                  <button
                    onClick={() => navigate('createEvent')}
                    id="dash-empty-add-event"
                    style={{ marginTop: '4px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'var(--primary-container)', color: 'var(--on-primary-container)', border: 'none', cursor: 'pointer' }}
                  >
                    + Nuevo evento
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Tasks */}
          <section>
            <div className="section-header-row">
              <h4 className="section-h">Tareas pendientes</h4>
              <button className="btn-ghost btn btn-sm" onClick={() => navigate('tasks')} id="dash-tasks-all">Ver lista</button>
            </div>
            <div className="task-list-card">
              {todayTasks.filter(t => !t.completed).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg) var(--space-md)', color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.35 }}>check_circle</span>
                  <span style={{ fontSize: '13px', opacity: 0.6 }}>Sin tareas pendientes hoy</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => navigate('createTask')}
                    id="dash-empty-add-task"
                    style={{ marginTop: '4px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'var(--primary-container)', color: 'var(--on-primary-container)', border: 'none', cursor: 'pointer' }}
                  >
                    + Nueva tarea
                  </button>
                </div>
              ) : (
                <div>
                  {sortPending(todayTasks.filter(t => !t.completed)).slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className={`task-list-item priority-${task.priority || 'media'}`}
                      onClick={() => navigate('taskDetail', { taskId: task.id })}
                      style={{ cursor: 'pointer' }}
                    >
                      <button
                        className={`task-check-btn${task.completed ? ' checked' : ''}`}
                        onClick={e => handleToggle(task.id, e)}
                        id={`dash-check-${task.id}`}
                        aria-label={task.completed ? 'Desmarcar' : 'Completar'}
                        style={{ marginTop: '2px', flexShrink: 0 }}
                      >
                        <span className="material-symbols-outlined task-check-icon">check</span>
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={`task-item-text${task.completed ? ' done' : ''}`}>
                          {task.title}
                        </div>
                        <div className="task-item-badges">
                          {/* Category */}
                          {task.category && (
                            <span className="ti-pill ti-cat">
                              <span className="ti-dot" style={{ background: CAT_DOTS[task.category] || 'var(--outline)' }} />
                              {task.category}
                            </span>
                          )}
                          {/* Priority via shared component */}
                          {task.priority && <PriorityBadge priority={task.priority} />}
                          {/* Time */}
                          {(task.time || task.date) && (
                            <span className="ti-pill ti-time">
                              <Clock size={10} strokeWidth={2} />
                              {task.date === today
                                ? task.time ? `Hoy, ${task.time}` : 'Hoy'
                                : task.time ? `${task.date}, ${task.time}` : task.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
