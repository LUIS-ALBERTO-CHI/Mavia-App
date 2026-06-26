import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AppIcon from '../components/AppIcon';
import LottieIcon from '../components/LottieIcon';
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Sparkles } from 'lucide-react';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CAT_COLORS = {
  Marketing:  { dot: '#705765', label: 'Marketing',  bg: 'rgba(112,87,101,0.12)' },
  Personal:   { dot: '#546347', label: 'Personal',   bg: 'rgba(84,99,71,0.12)'   },
  Espiritual: { dot: '#695e37', label: 'Espiritual', bg: 'rgba(105,94,55,0.12)'  },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}
function getPrevMonthDays(year, month) {
  return getDaysInMonth(year, month === 0 ? 11 : month - 1, 0);
}

export default function CalendarScreen() {
  const { state, navigate, dispatch, showToast } = useApp();
  const now = new Date();

  const [viewYear, setViewYear]     = useState(now.getFullYear());
  const [viewMonth, setViewMonth]   = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  /* ── Navigation ── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(1);
  };
  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  /* ── Helpers ── */
  const padDate = (n) => String(n).padStart(2, '0');
  const dateStr = (day) => `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
  const getEventsForDay = (day) => state.events.filter(e => e.date === dateStr(day));
  const getTasksForDay  = (day) => state.tasks.filter(t => t.date === dateStr(day));

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const daysInMonth    = getDaysInMonth(viewYear, viewMonth);
  const firstDay       = getFirstDay(viewYear, viewMonth);
  const prevMonthDays  = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  const totalCells     = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  /* ── Selected day data ── */
  const selDateStr   = dateStr(selectedDay);
  const selEvents    = state.events.filter(e => e.date === selDateStr);
  const selTasks     = state.tasks.filter(t => t.date === selDateStr);
  const useMock      = selEvents.length === 0 && selTasks.length === 0;
  const displayItems = useMock ? MOCK_EVENTS : [...selEvents, ...selTasks];

  /* ── Dot colors per category ── */
  const catColor = (cat) => {
    if (!cat) return '#705765';
    if (cat.toLowerCase().includes('market')) return '#705765';
    if (cat.toLowerCase().includes('espirit') || cat.toLowerCase().includes('spirit')) return '#695e37';
    return '#546347'; // personal/default
  };

  /* ── Monthly focus (use first phrase or fallback) ── */
  const focus = state.phrases?.[viewMonth % (state.phrases?.length || 1)];

  return (
    <>
      <style>{`
        /* ============ CALENDAR LAYOUT ============ */
        .cal-screen {
          padding: var(--space-xl) var(--space-container) var(--space-8);
          max-width: var(--content-max-w);
          margin: 0 auto;
          animation: screenEnter 0.6s var(--ease-out) both;
        }

        /* ---- Header ---- */
        .cal-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }

        @media (min-width: 640px) {
          .cal-header {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }
        }

        .cal-heading {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
        }

        .cal-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          margin-top: 2px;
        }

        .cal-nav-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
        }

        .cal-nav-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          border: 1px solid var(--outline-variant);
          background: transparent;
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cal-nav-btn:hover { background: var(--primary-container); }
        .cal-nav-btn:active { transform: scale(0.9); }

        .cal-today-btn {
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--outline-variant);
          background: transparent;
          font-size: var(--text-label-md);
          font-weight: 500;
          color: var(--on-surface);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .cal-today-btn:hover { background: var(--surface-container); }

        /* ---- Two-column layout ---- */
        .cal-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        @media (min-width: 900px) {
          .cal-body {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        /* ---- Grid section ---- */
        .cal-grid-wrap { flex: 1; min-width: 0; }

        .cal-day-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: var(--space-sm);
          text-align: center;
        }

        .cal-day-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--outline-variant);
          padding: var(--space-xs) 0;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--outline-variant);
          border: 1px solid var(--outline-variant);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(112,87,101,0.06);
        }

        .cal-cell {
          background: var(--surface-container-lowest);
          aspect-ratio: 1 / 1.1;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cal-cell:hover { background: rgba(248,215,232,0.45); }

        .cal-cell.is-other-month {
          background: rgba(245,243,241,0.5);
          opacity: 0.4;
          cursor: default;
        }
        .cal-cell.is-other-month:hover { background: rgba(245,243,241,0.5); }

        .cal-cell.is-selected {
          background: var(--primary-container) !important;
          box-shadow: inset 0 0 0 2px var(--primary);
        }

        .cal-cell.is-today .cal-cell-num {
          background: var(--primary);
          color: white;
          border-radius: var(--radius-full);
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .cal-cell-num {
          font-size: 11px;
          font-weight: 500;
          color: var(--on-surface);
          line-height: 1;
        }

        .cal-dots {
          display: flex;
          gap: 3px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .cal-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ---- Side panel ---- */
        .cal-panel {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        @media (min-width: 900px) {
          .cal-panel { width: 300px; flex-shrink: 0; }
        }

        .cal-detail-card {
          background: var(--surface-container-lowest);
          border-radius: 28px;
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 24px rgba(112,87,101,0.08);
        }

        .cal-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-lg);
        }

        .cal-detail-title {
          font-family: var(--font-body);
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--primary);
        }

        .cal-detail-date {
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          font-weight: 500;
        }

        /* Category legend */
        .cal-legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .cal-legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .cal-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cal-legend-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--outline);
        }

        /* Event list */
        .cal-event-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .cal-event-row {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-md);
          border-radius: 16px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .cal-event-row:hover { background: rgba(248,215,232,0.2); }
        .cal-event-row.highlighted { background: var(--secondary-container); border: 1px solid var(--secondary-container); }

        .cal-event-time-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 44px;
        }

        .cal-event-time {
          font-size: var(--text-label-sm);
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }

        .cal-event-line {
          width: 1px;
          flex: 1;
          background: rgba(208,195,200,0.4);
          margin: 4px 0;
        }

        .cal-event-body { flex: 1; min-width: 0; }

        .cal-event-title {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 3px;
        }

        .cal-event-desc {
          font-size: 12px;
          color: var(--on-surface-variant);
          line-height: 1.5;
        }

        .cal-event-meta {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-top: var(--space-sm);
          font-size: 12px;
          font-weight: 500;
        }

        /* Add task button */
        .cal-add-btn {
          width: 100%;
          padding: 0.75rem;
          border-radius: 16px;
          border: 2px dashed var(--outline-variant);
          background: transparent;
          color: var(--outline);
          font-size: var(--text-label-md);
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          transition: all var(--transition-fast);
        }
        .cal-add-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        /* Focus card */
        .cal-focus-card {
          position: relative;
          overflow: hidden;
          background: var(--primary-fixed-dim);
          border-radius: 28px;
          padding: var(--space-lg);
          box-shadow: 0 4px 16px rgba(112,87,101,0.12);
        }

        .cal-focus-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--on-primary-fixed);
          opacity: 0.7;
          margin-bottom: var(--space-sm);
        }

        .cal-focus-phrase {
          font-family: var(--font-display);
          font-size: 18px;
          font-style: italic;
          font-weight: 500;
          color: var(--on-primary-fixed);
          margin-bottom: var(--space-sm);
          line-height: 1.4;
        }

        .cal-focus-sub {
          font-size: 13px;
          color: var(--on-primary-fixed-variant);
          line-height: 1.6;
        }

        .cal-focus-deco {
          position: absolute;
          bottom: -2rem;
          right: -2rem;
          width: 8rem;
          height: 8rem;
          background: rgba(112,87,101,0.08);
          border-radius: 50%;
          filter: blur(24px);
          pointer-events: none;
        }

        /* empty day state */
        .cal-empty-day {
          text-align: center;
          padding: var(--space-xl) var(--space-md);
          color: var(--on-surface-variant);
          font-size: var(--text-body-md);
        }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="cal-screen">

        {/* === HEADER === */}
        <div className="cal-header">
          <div>
            <h2 className="cal-heading">
              {MONTHS_ES[viewMonth]} {viewYear}
            </h2>
            <p className="cal-sub">
              {focus?.text
                ? `"${focus.text.slice(0, 60)}..."`
                : 'Planifica tu mes con intención y propósito.'}
            </p>
          </div>

          <div className="cal-nav-row">
            <button className="cal-nav-btn" onClick={prevMonth} id="cal-prev" aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <button className="cal-today-btn" onClick={goToday} id="cal-today">Hoy</button>
            <button className="cal-nav-btn" onClick={nextMonth} id="cal-next" aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* === BODY (grid + panel) === */}
        <div className="cal-body">

          {/* ── Grid ── */}
          <div className="cal-grid-wrap">
            {/* Day labels */}
            <div className="cal-day-labels">
              {DAYS_ES.map(d => (
                <div key={d} className="cal-day-label">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="cal-grid">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const cellDay   = idx - firstDay + 1;
                const isThisMonth = cellDay >= 1 && cellDay <= daysInMonth;
                const displayDay  = isThisMonth
                  ? cellDay
                  : cellDay < 1
                    ? prevMonthDays + cellDay
                    : cellDay - daysInMonth;

                const isToday    = isThisMonth && isCurrentMonth && cellDay === now.getDate();
                const isSelected = isThisMonth && cellDay === selectedDay;

                let dots = [];
                if (isThisMonth) {
                  const evs   = getEventsForDay(cellDay);
                  const tasks = getTasksForDay(cellDay);
                  evs.slice(0, 2).forEach(e => dots.push(catColor(e.category)));
                  if (tasks.length > 0) dots.push('#705765');
                  dots = dots.slice(0, 3);
                }

                const classes = [
                  'cal-cell',
                  !isThisMonth ? 'is-other-month' : '',
                  isToday      ? 'is-today'       : '',
                  isSelected   ? 'is-selected'    : '',
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={idx}
                    className={classes}
                    onClick={() => isThisMonth && setSelectedDay(cellDay)}
                    id={isThisMonth ? `cal-cell-${cellDay}` : undefined}
                  >
                    <span className="cal-cell-num">{displayDay}</span>
                    {dots.length > 0 && (
                      <div className="cal-dots">
                        {dots.map((color, di) => (
                          <span key={di} className="cal-dot" style={{ background: color }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Side Panel ── */}
          <div className="cal-panel">

            {/* Detail card */}
            <div className="cal-detail-card">
              <div className="cal-detail-header">
                <span className="cal-detail-title">Detalle del Día</span>
                <span className="cal-detail-date">
                  {selectedDay} de {MONTHS_ES[viewMonth]}
                </span>
              </div>

              {/* Category legend */}
              <div className="cal-legend">
                {Object.entries(CAT_COLORS).map(([key, val]) => (
                  <div key={key} className="cal-legend-item">
                    <span className="cal-legend-dot" style={{ background: val.dot }} />
                    <span className="cal-legend-label">{val.label}</span>
                  </div>
                ))}
              </div>

              {/* Events / tasks */}
              {displayItems.length === 0 ? (
                <div className="cal-empty-day">
                  <LottieIcon name="wave" size={60} loop autoplay style={{ margin: '0 auto 12px' }} />
                  <p>Día libre — perfecto para descansar</p>
                </div>
              ) : (
                <div className="cal-event-list">
                  {displayItems.map((item, i) => {
                    const isMktg  = item.category?.toLowerCase().includes('market');
                    const isSpirt = item.category?.toLowerCase().includes('espirit') || item.category?.toLowerCase().includes('spirit');
                    const timeColor = isMktg ? 'var(--primary)' : isSpirt ? 'var(--tertiary)' : 'var(--secondary)';
                    const isAllDay  = !item.startTime && !item.time;
                    const isHighlighted = item.category?.toLowerCase().includes('person') && i % 2 === 1;

                    return (
                      <div
                        key={item.id || i}
                        className={`cal-event-row${isHighlighted ? ' highlighted' : ''}`}
                        onClick={() => navigate('events')}
                        id={`cal-ev-${item.id || i}`}
                      >
                        <div className="cal-event-time-col">
                          <span className="cal-event-time" style={{ color: timeColor }}>
                            {isAllDay ? 'Todo día' : (item.startTime || item.time || '—')}
                          </span>
                          {!isAllDay && <div className="cal-event-line" />}
                        </div>
                        <div className="cal-event-body">
                          <div className="cal-event-title">{item.title}</div>
                          {item.description && (
                            <p className="cal-event-desc">{item.description}</p>
                          )}
                          {item.location && (
                            <div className="cal-event-meta" style={{ color: timeColor }}>
                              <MapPin size={14} />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.link && (
                            <div className="cal-event-meta" style={{ color: timeColor }}>
                              <Video size={14} />
                              <span>Unirse a {item.link}</span>
                            </div>
                          )}
                          {item.duration && (
                            <div className="cal-event-meta" style={{ color: timeColor }}>
                              <Sparkles size={14} />
                              <span>Sesión {item.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick add */}
              <button
                className="cal-add-btn"
                onClick={() => navigate('createEvent')}
                id="cal-add-event"
              >
                <Plus size={18} />
                <span>Agregar tarea</span>
              </button>
            </div>

            {/* Monthly focus card */}
            <div className="cal-focus-card">
              <div className="cal-focus-deco" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p className="cal-focus-eyebrow">Enfoque de {MONTHS_ES[viewMonth]}</p>
                <p className="cal-focus-phrase">
                  {focus?.text || 'Cultivando armonía'}
                </p>
                <p className="cal-focus-sub">
                  {focus?.author
                    ? `— ${focus.author}`
                    : 'Recuerda alejarte de la pantalla cada 90 minutos. El crecimiento ocurre en las pausas.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
