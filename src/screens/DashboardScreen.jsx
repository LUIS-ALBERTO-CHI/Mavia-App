import { useApp } from '../context/AppContext';
import AppIcon from '../components/AppIcon';
import LottieIcon from '../components/LottieIcon';
import { localToday } from '../lib/utils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

const CAT_DOTS = {
  Marketing:  '#546347',
  Personal:   '#705675',
  Espiritual: '#c4a25a',
  Urgente:    '#ba1a1a',
  Trabajo:    '#4a6fa5',
  Salud:      '#5a9e7a',
};

export default function DashboardScreen() {
  const { state, navigate, dispatch, showToast } = useApp();
  const { user, tasks, events, habits, phrases, darkMode } = state;

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
  const todayEvents    = events.filter(e => e.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayPhrase    = phrases[new Date().getDay() % phrases.length];

  const handleToggle = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    dispatch({ type: 'TOGGLE_TASK', id: taskId });
    if (!task.completed) showToast('Tarea completada', 'success');
  };

  return (
    <>
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

        /* ---- Bento Grid ---- */
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        @media (min-width: 768px) {
          .bento-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        /* Meditation hero card */
        .meditation-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          box-shadow: var(--shadow-glow);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .meditation-card:hover .med-deco { opacity: 0.18; }
        .meditation-card:hover .med-play-btn { transform: scale(1.05); }
        .meditation-card:active { transform: scale(0.99); }

        .med-eyebrow {
          font-size: var(--text-label-sm);
          color: var(--secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          margin-bottom: var(--space-sm);
          display: block;
        }

        .med-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--primary);
          margin-bottom: var(--space-md);
          line-height: 1.4;
        }

        .med-desc {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          margin-bottom: var(--space-lg);
          max-width: 28rem;
          line-height: 1.6;
        }

        .med-play-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 0.625rem var(--space-lg);
          background: var(--primary);
          color: var(--on-primary);
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 500;
          letter-spacing: 0.02em;
          border: none;
          cursor: pointer;
          transition: transform var(--transition-spring);
        }

        .med-deco {
          position: absolute;
          right: -1rem;
          bottom: -1rem;
          opacity: 0.08;
          transition: opacity var(--transition-base);
          font-size: 11.25rem;   /* text-[180px] */
          line-height: 1;
          color: var(--primary);
          font-variation-settings: 'FILL' 0, 'wght' 100;
          pointer-events: none;
          user-select: none;
        }

        /* Phrase card */
        .phrase-card {
          background: rgba(240, 223, 174, 0.30); /* tertiary-container/30 */
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          min-height: 180px;
        }

        .phrase-card-img {
          width: 6rem;
          height: 6rem;
          object-fit: contain;
          margin-bottom: var(--space-md);
        }

        .phrase-card-text {
          font-family: var(--font-display);
          font-style: italic;
          color: var(--on-tertiary-container);
          font-size: 1rem;
          line-height: 1.5;
          padding: 0 var(--space-sm);
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
        .ti-alta  { background: rgba(186,26,26,0.10);  color: #ba1a1a; font-weight: 700; }
        .ti-media { background: rgba(120,100,60,0.10); color: #7a6234; font-weight: 700; }
        .ti-baja  { background: rgba(84,99,71,0.12);  color: var(--secondary); font-weight: 700; }
        .ti-time  { background: var(--surface-container-high); color: var(--on-surface-variant); }
        .ti-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ---- Habits strip ---- */
        .habits-strip {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: var(--space-sm);
          margin-bottom: var(--space-xl);
        }

        .habits-strip::-webkit-scrollbar { display: none; }

        .habit-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xs);
          min-width: 56px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }

        .habit-pill-circle {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          border: 2px solid var(--outline-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          transition: all var(--transition-spring);
          background: var(--surface-container-lowest);
        }

        .habit-pill-circle.done {
          border-color: transparent;
          box-shadow: var(--shadow-sm);
        }

        .habit-pill-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--on-surface-variant);
          text-align: center;
          max-width: 56px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---- Gratitude card ---- */
        .dash-gratitude-card {
          background: linear-gradient(135deg, #FDF8EC 0%, #F2E2B1 100%);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          cursor: pointer;
          border: 1px solid rgba(208,195,200,0.15);
          box-shadow: var(--shadow-card);
          transition: transform var(--transition-spring);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .dark .dash-gratitude-card {
          background: linear-gradient(135deg, rgba(80,70,34,0.35) 0%, rgba(80,70,34,0.15) 100%);
          border-color: rgba(77,68,73,0.3);
        }
        .dark .phrase-card {
          background: rgba(80,70,34,0.18) !important;
          border: 1px solid rgba(77,68,73,0.2);
        }
      `}</style>

      <div className="dash-content">
        {/* === GREETING === */}
        <section style={{ marginBottom: 'var(--space-xl)', animation: 'screenEnter 0.7s var(--ease-back) both' }}>
          <div className="dash-greeting-row">
            <div>
              <h2 className="dash-greeting-h">
                {getGreeting()}, {user.firstName}
              </h2>
              <p className="dash-greeting-sub">
                Hoy es un buen día para avanzar con propósito.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <div className="dash-tasks-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--on-secondary-container)' }}>task_alt</span>
                <span className="dash-tasks-badge-text">{pendingCount} Tareas hoy</span>
              </div>
            </div>
          </div>

          {/* === BENTO GRID === */}
          <div className="bento-grid">
            {/* Meditation card */}
            <div className="meditation-card" onClick={() => navigate('wellness')}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span className="med-eyebrow">Bienestar</span>
                <h3 className="med-title">Meditación de Enfoque Creativo</h3>
                <p className="med-desc">
                  Prepárate para tu jornada con 10 minutos de claridad mental.
                </p>
                <button className="med-play-btn" id="dash-med-play">
                  <span className="material-symbols-outlined ms-filled" style={{ fontSize: '20px' }}>play_arrow</span>
                  Comenzar ahora
                </button>
              </div>
              {/* Decorative icon */}
              <span className="material-symbols-outlined med-deco">self_care</span>
            </div>

            {/* Phrase card */}
            <div className="phrase-card" onClick={() => navigate('phrases')}>
              <div style={{ width: '6rem', height: '6rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LottieIcon name="flower" size={80} loop autoplay />
              </div>
              <p className="phrase-card-text">
                "{todayPhrase?.text || 'Donde pones tu atención, florece tu energía.'}"
              </p>
            </div>

            {/* Gratitude card */}
            <div
              onClick={() => navigate('gratitude')}
              id="dash-gratitude"
              className="dash-gratitude-card"
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '2rem' }}>🌿</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-headline-md)', fontWeight: 500, color: darkMode ? 'var(--tertiary)' : '#695e37' }}>
                Gratitud
              </div>
              <p style={{ fontSize: 'var(--text-label-md)', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                Escribe 3 cosas por las que estás agradecida hoy.
              </p>
            </div>
          </div>
        </section>

        {/* === SECONDARY SECTIONS === */}
        <div className="secondary-grid">
          {/* Events */}
          <section>
            <div className="section-header-row">
              <h4 className="section-h">Próximos Eventos</h4>
              <button className="btn-ghost btn btn-sm" onClick={() => navigate('events')} id="dash-events-all">Ver todo</button>
            </div>
            <div>
              {todayEvents.length === 0 ? (
                <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--on-surface-variant)', fontFamily: 'var(--font-display)', fontStyle: 'italic', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <AppIcon name="leaf" size={16} color="var(--secondary)" /> Sin eventos hoy
                </div>
              ) : (
                todayEvents.slice(0, 3).map((ev, i) => {
                  const isPrimary = i % 2 === 0;
                  const timeParts = ev.startTime?.split(':') || ['10', '30'];
                  const hour = parseInt(timeParts[0], 10);
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  const displayHour = hour > 12 ? hour - 12 : hour;
                  const timeStr = `${String(displayHour).padStart(2,'0')}:${timeParts[1] || '00'}`;

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
                          {timeStr}
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
              <h4 className="section-h">Tareas Pendientes</h4>
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
                        onClick={e => { e.stopPropagation(); handleToggle(task.id); }}
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
                          {/* Priority */}
                          {task.priority === 'alta' && <span className="ti-pill ti-alta"><i style={{ fontStyle:'normal' }}>!</i> Alta</span>}
                          {task.priority === 'media' && <span className="ti-pill ti-media"><i style={{ fontStyle:'normal' }}>=</i> Media</span>}
                          {task.priority === 'baja' && <span className="ti-pill ti-baja"><i style={{ fontStyle:'normal' }}>⇓</i> Baja</span>}
                          {/* Time */}
                          {(task.time || task.date) && (
                            <span className="ti-pill ti-time">
                              🕐 {task.date === today
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

        {/* === HABITS QUICK ROW === */}
        <section style={{ marginTop: 'var(--space-xl)' }}>
          <div className="section-header-row">
            <h4 className="section-h">Hábitos de hoy</h4>
            <button className="btn-ghost btn btn-sm" onClick={() => navigate('habits')} id="dash-habits-all">Ver todos</button>
          </div>
          <div className="habits-strip">
            {habits.map(habit => (
              <button
                key={habit.id}
                className="habit-pill"
                onClick={() => {
                  dispatch({ type: 'TOGGLE_HABIT', id: habit.id });
                  if (!habit.completedToday) showToast(`${habit.name} completado`, 'success');
                }}
                id={`dash-habit-${habit.id}`}
              >
                <div
                  className={`habit-pill-circle${habit.completedToday ? ' done' : ''}`}
                  style={habit.completedToday ? {
                    background: `linear-gradient(135deg, ${habit.color}BB 0%, ${habit.color} 100%)`,
                  } : {}}
                >
                  <AppIcon
                    name={habit.icon || 'star'}
                    size={20}
                    color={habit.completedToday ? 'white' : 'var(--color-primary-dark)'}
                    strokeWidth={1.75}
                  />
                </div>
                <span className="habit-pill-label">{habit.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
