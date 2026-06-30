import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import LottieIcon from '../components/LottieIcon';
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Check, Calendar, AlignJustify } from 'lucide-react';

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ── Helpers ── */
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(year, month)    { return new Date(year, month, 1).getDay(); }
function padDate(n)                  { return String(n).padStart(2, '0'); }
function toDateStr(year, month, day) { return `${year}-${padDate(month + 1)}-${padDate(day)}`; }

const catColor = (cat) => {
  if (!cat) return '#705765';
  const c = cat.toLowerCase();
  if (c.includes('market')) return '#705765';
  if (c.includes('espirit') || c.includes('spirit')) return '#695e37';
  return '#546347';
};

/* ── Touch-swipe hook ── */
function useTouchSwipe(onLeft, onRight, threshold = 50) {
  const startX = useRef(null);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < threshold) return;
    if (dx < 0) onLeft();
    else         onRight();
    startX.current = null;
  }, [onLeft, onRight, threshold]);

  return { onTouchStart, onTouchEnd };
}

/* ── Priority badge ── */
const PRIORITY_DOT = { alta: '#ba1a1a', media: '#695e37', baja: '#546347' };

/* ── Hours shown in week view ── */
const WEEK_HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am–10pm

export default function CalendarScreen() {
  const { state, navigate } = useApp();
  const now = new Date();

  const [viewYear,    setViewYear]    = useState(now.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [viewMode,    setViewMode]    = useState('month'); // 'month' | 'week'
  const [slideDir,    setSlideDir]    = useState('');      // 'left' | 'right' | ''

  /* ── Slide animation helper ── */
  const triggerSlide = (dir, fn) => {
    setSlideDir(dir);
    setTimeout(() => { fn(); setSlideDir(''); }, 220);
  };

  /* ── Month navigation ── */
  const prevMonth = () => triggerSlide('right', () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(1);
  });
  const nextMonth = () => triggerSlide('left', () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(1);
  });

  /* ── Week navigation ── */
  // Current week start = Monday of the week containing selectedDay
  const selDate        = new Date(viewYear, viewMonth, selectedDay);
  const selDow         = selDate.getDay(); // 0=Sun
  const weekStart      = new Date(selDate);
  weekStart.setDate(selDate.getDate() - selDow); // start at Sunday

  const prevWeek = () => triggerSlide('right', () => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(d.getDate());
  });
  const nextWeek = () => triggerSlide('left', () => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(d.getDate());
  });

  const goToday = () => {
    setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDay(now.getDate());
  };

  /* ── Swipe handlers ── */
  const swipe = useTouchSwipe(
    viewMode === 'month' ? nextMonth : nextWeek,
    viewMode === 'month' ? prevMonth : prevWeek,
  );

  /* ── Data helpers ── */
  const getEventsForDate = (ds) => state.events.filter(e => e.date === ds);
  const getTasksForDate  = (ds) => state.tasks.filter(t => t.date === ds);

  /* ── Selected day data ── */
  const selDateStr  = toDateStr(viewYear, viewMonth, selectedDay);
  const selEvents   = getEventsForDate(selDateStr);
  const selTasks    = getTasksForDate(selDateStr);
  const pending     = selTasks.filter(t => !t.completed);
  const done        = selTasks.filter(t => t.completed);
  const totalItems  = selEvents.length + selTasks.length;

  /* ── Load indicator ── */
  const loadColor = totalItems === 0 ? 'var(--secondary)' : totalItems <= 3 ? 'var(--tertiary)' : 'var(--error)';
  const loadLabel = totalItems === 0 ? 'Día libre'
    : `${pending.length > 0 ? `${pending.length} tarea${pending.length !== 1 ? 's' : ''}` : ''}${pending.length > 0 && selEvents.length > 0 ? ' · ' : ''}${selEvents.length > 0 ? `${selEvents.length} evento${selEvents.length !== 1 ? 's' : ''}` : ''}`;

  /* ── Month grid ── */
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const daysInMonth    = getDaysInMonth(viewYear, viewMonth);
  const firstDay       = getFirstDay(viewYear, viewMonth);
  const prevMonthDays  = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  const totalCells     = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  /* ── Week grid data ── */
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return { date: d, ds: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()) };
  });

  /* ── Monthly focus phrase ── */
  const focus = state.phrases?.[viewMonth % (state.phrases?.length || 1)];

  const handleItemClick = (item) => {
    if (item.startTime !== undefined || item.location !== undefined || item.link !== undefined) {
      // It's an event
      navigate('events');
    } else {
      // It's a task
      navigate('taskDetail', { taskId: item.id });
    }
  };

  return (
    <>
      <style>{`
        /* ============ CALENDAR ============ */
        .cal-screen {
          padding: var(--space-xl) var(--space-container) var(--space-8);
          max-width: var(--content-max-w);
          margin: 0 auto;
          animation: screenEnter 0.6s var(--ease-out) both;
        }

        /* ---- Header ---- */
        .cal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
          flex-wrap: wrap;
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
          max-width: 320px;
        }

        .cal-header-right {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
        }

        /* View toggle */
        .cal-view-toggle {
          display: flex;
          background: var(--surface-container);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 2px;
        }
        .cal-view-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          border: none; cursor: pointer;
          font-size: var(--text-label-sm);
          font-weight: 600;
          font-family: var(--font-body);
          color: var(--on-surface-variant);
          background: transparent;
          transition: all var(--transition-fast);
        }
        .cal-view-btn.active {
          background: var(--surface-container-lowest);
          color: var(--primary);
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }

        .cal-nav-btn {
          width: 38px; height: 38px;
          border-radius: var(--radius-full);
          border: 1px solid var(--outline-variant);
          background: transparent; color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cal-nav-btn:hover { background: var(--primary-container); }
        .cal-nav-btn:active { transform: scale(0.9); }

        .cal-today-btn {
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--outline-variant);
          background: transparent;
          font-size: var(--text-label-sm);
          font-weight: 600;
          font-family: var(--font-body);
          color: var(--on-surface);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cal-today-btn:hover { background: var(--surface-container); }

        /* ---- Body layout ---- */
        .cal-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        @media (min-width: 900px) {
          .cal-body { flex-direction: row; align-items: flex-start; }
        }

        /* ══ MONTH GRID ══ */
        .cal-grid-wrap {
          flex: 1; min-width: 0;
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .cal-grid-wrap.slide-left  { opacity: 0; transform: translateX(-18px); }
        .cal-grid-wrap.slide-right { opacity: 0; transform: translateX(18px);  }

        .cal-day-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: var(--space-sm);
          text-align: center;
        }
        .cal-day-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--outline-variant); padding: var(--space-xs) 0;
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
          padding: 8px;
          display: flex; flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.18s ease;
          user-select: none;
        }
        .cal-cell:hover { background: rgba(248,215,232,0.45); }
        .cal-cell.is-other-month { background: rgba(245,243,241,0.4); opacity: 0.35; cursor: default; }
        .cal-cell.is-other-month:hover { background: rgba(245,243,241,0.4); }
        .cal-cell.is-selected { background: var(--primary-container) !important; box-shadow: inset 0 0 0 2px var(--primary); }
        .cal-cell.is-today .cal-cell-num {
          background: var(--primary); color: white;
          border-radius: var(--radius-full);
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }

        .cal-cell-num { font-size: 11px; font-weight: 500; color: var(--on-surface); line-height: 1; }

        .cal-dots { display: flex; gap: 2px; flex-wrap: wrap; align-items: flex-end; }
        .cal-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .cal-dot-overflow {
          font-size: 8px; font-weight: 700;
          color: var(--on-surface-variant); line-height: 6px;
        }

        /* ══ WEEK VIEW ══ */
        .cal-week-wrap {
          flex: 1; min-width: 0;
          transition: opacity 0.22s ease, transform 0.22s ease;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid var(--outline-variant);
          background: var(--surface-container-lowest);
          box-shadow: 0 8px 32px rgba(112,87,101,0.06);
        }
        .cal-week-wrap.slide-left  { opacity: 0; transform: translateX(-18px); }
        .cal-week-wrap.slide-right { opacity: 0; transform: translateX(18px);  }

        /* Day header row */
        .cal-week-header {
          display: grid;
          grid-template-columns: 44px repeat(7, 1fr);
          border-bottom: 1px solid var(--outline-variant);
          background: var(--surface-container);
          position: sticky; top: 0; z-index: 2;
        }
        .cal-week-header-gutter { /* time gutter */ }
        .cal-week-day-head {
          padding: 10px 4px 8px;
          text-align: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cal-week-day-head:hover { background: rgba(248,215,232,0.3); }
        .cal-week-day-head.is-today .cal-week-day-num {
          background: var(--primary); color: white;
          border-radius: 50%;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
          font-weight: 700;
        }
        .cal-week-day-head.is-selected .cal-week-day-num {
          background: var(--primary-container);
          color: var(--on-primary-container);
          border-radius: 50%;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
        }
        .cal-week-day-name { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--outline); }
        .cal-week-day-num  { font-size: 16px; font-weight: 600; color: var(--on-surface); margin: 0 auto; }
        .cal-week-dot-row  { display: flex; justify-content: center; gap: 2px; margin-top: 3px; min-height: 6px; }
        .cal-week-dot      { width: 5px; height: 5px; border-radius: 50%; }

        /* Timeline body */
        .cal-week-timeline {
          display: grid;
          grid-template-columns: 44px repeat(7, 1fr);
          overflow-y: auto;
          max-height: 480px;
          position: relative;
        }

        /* Hour rows */
        .cal-week-hour-label {
          padding: 0 8px;
          font-size: 10px;
          font-weight: 600;
          color: var(--outline);
          text-align: right;
          height: 48px;
          display: flex;
          align-items: flex-start;
          padding-top: 4px;
          border-right: 1px solid var(--outline-variant);
          white-space: nowrap;
        }
        .cal-week-col {
          border-right: 1px solid rgba(208,195,200,0.15);
          position: relative;
        }
        .cal-week-col:last-child { border-right: none; }
        .cal-week-hour-slot {
          height: 48px;
          border-top: 1px solid rgba(208,195,200,0.12);
        }

        /* Event block in week view */
        .cal-week-event {
          position: absolute;
          left: 2px; right: 2px;
          border-radius: 6px;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 600;
          overflow: hidden;
          cursor: pointer;
          transition: opacity 0.15s;
          z-index: 1;
          line-height: 1.3;
        }
        .cal-week-event:hover { opacity: 0.85; }

        /* Current time line */
        .cal-week-now-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: var(--error);
          z-index: 3;
        }
        .cal-week-now-dot {
          position: absolute;
          left: -4px; top: -3px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--error);
        }

        /* ══ PANEL ══ */
        .cal-panel {
          width: 100%;
          display: flex; flex-direction: column;
          gap: var(--space-md);
        }
        @media (min-width: 900px) { .cal-panel { width: 300px; flex-shrink: 0; } }

        .cal-detail-card {
          background: var(--surface-container-lowest);
          border-radius: 28px; padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 24px rgba(112,87,101,0.08);
        }

        .cal-detail-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-md);
          gap: var(--space-sm);
        }

        .cal-detail-title {
          font-family: var(--font-body);
          font-size: var(--text-headline-md);
          font-weight: 700;
          color: var(--primary);
        }
        .cal-detail-date {
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
          margin-top: 2px;
        }

        /* Load pill */
        .cal-load-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-size: 11px; font-weight: 700;
          border: 1.5px solid currentColor;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Section heads */
        .cal-section-head {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--outline);
          padding: var(--space-sm) 0 var(--space-xs);
          display: flex; align-items: center; gap: var(--space-sm);
        }
        .cal-section-line { flex: 1; height: 1px; background: var(--outline-variant); opacity: 0.4; }

        /* Event/task rows */
        .cal-event-list { display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-md); }

        .cal-event-row {
          display: flex; gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.15s;
          align-items: flex-start;
        }
        .cal-event-row:hover { background: rgba(248,215,232,0.2); }

        .cal-event-time-col { min-width: 40px; }
        .cal-event-time {
          font-size: 11px; font-weight: 700; line-height: 1.3;
          white-space: nowrap;
        }

        .cal-event-body { flex: 1; min-width: 0; }
        .cal-event-title { font-size: var(--text-label-md); font-weight: 600; color: var(--on-surface); margin-bottom: 2px; }
        .cal-event-meta  {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--on-surface-variant); margin-top: 2px;
        }

        /* Completed tasks */
        .cal-done-row { opacity: 0.55; }
        .cal-done-row .cal-event-title { text-decoration: line-through; }

        /* Add button */
        .cal-add-btn {
          width: 100%; padding: 0.7rem;
          border-radius: 14px;
          border: 2px dashed var(--outline-variant);
          background: transparent;
          color: var(--outline);
          font-size: var(--text-label-md); font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: var(--space-sm);
          transition: all var(--transition-fast);
          margin-top: var(--space-sm);
        }
        .cal-add-btn:hover { border-color: var(--primary); color: var(--primary); }

        /* Focus card */
        .cal-focus-card {
          position: relative; overflow: hidden;
          background: var(--primary-fixed-dim);
          border-radius: 28px; padding: var(--space-lg);
          box-shadow: 0 4px 16px rgba(112,87,101,0.12);
        }
        .cal-focus-deco {
          position: absolute; bottom: -2rem; right: -2rem;
          width: 8rem; height: 8rem;
          background: rgba(112,87,101,0.1); border-radius: 50%;
          filter: blur(24px); pointer-events: none;
        }
        .cal-focus-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--on-primary-fixed); opacity: 0.7;
          margin-bottom: var(--space-sm);
        }
        .cal-focus-phrase {
          font-family: var(--font-display);
          font-size: 17px; font-style: italic; font-weight: 500;
          color: var(--on-primary-fixed); line-height: 1.45; margin-bottom: var(--space-sm);
        }
        .cal-focus-sub { font-size: 12px; color: var(--on-primary-fixed-variant); line-height: 1.6; }

        /* Empty state */
        .cal-empty-day { text-align: center; padding: var(--space-xl) var(--space-md); color: var(--on-surface-variant); font-size: var(--text-body-md); }

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
              {viewMode === 'week'
                ? `${MONTHS_ES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
                : `${MONTHS_ES[viewMonth]} ${viewYear}`}
            </h2>
            <p className="cal-sub">
              {focus?.text ? `"${focus.text.slice(0, 55)}…"` : 'Planifica tu mes con intención.'}
            </p>
          </div>

          <div className="cal-header-right">
            {/* View toggle */}
            <div className="cal-view-toggle" id="cal-view-toggle">
              <button
                className={`cal-view-btn${viewMode === 'month' ? ' active' : ''}`}
                onClick={() => setViewMode('month')} id="cal-toggle-month"
              >
                <Calendar size={13} strokeWidth={2} />
                Mes
              </button>
              <button
                className={`cal-view-btn${viewMode === 'week' ? ' active' : ''}`}
                onClick={() => setViewMode('week')} id="cal-toggle-week"
              >
                <AlignJustify size={13} strokeWidth={2} />
                Semana
              </button>
            </div>

            {/* Navigation */}
            <button className="cal-nav-btn" onClick={viewMode === 'month' ? prevMonth : prevWeek} id="cal-prev" aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <button className="cal-today-btn" onClick={goToday} id="cal-today">Hoy</button>
            <button className="cal-nav-btn" onClick={viewMode === 'month' ? nextMonth : nextWeek} id="cal-next" aria-label="Siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* === BODY === */}
        <div className="cal-body">

          {/* ══ MONTH VIEW ══ */}
          {viewMode === 'month' && (
            <div
              className={`cal-grid-wrap${slideDir ? ` slide-${slideDir}` : ''}`}
              {...swipe}
            >
              <div className="cal-day-labels">
                {DAYS_ES.map(d => <div key={d} className="cal-day-label">{d}</div>)}
              </div>

              <div className="cal-grid" id="cal-month-grid">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const cellDay     = idx - firstDay + 1;
                  const isThisMonth = cellDay >= 1 && cellDay <= daysInMonth;
                  const displayDay  = isThisMonth ? cellDay
                    : cellDay < 1 ? prevMonthDays + cellDay : cellDay - daysInMonth;

                  const isToday    = isThisMonth && isCurrentMonth && cellDay === now.getDate();
                  const isSelected = isThisMonth && cellDay === selectedDay;

                  let dots = [];
                  if (isThisMonth) {
                    const evs   = getEventsForDate(toDateStr(viewYear, viewMonth, cellDay));
                    const tasks = getTasksForDate(toDateStr(viewYear, viewMonth, cellDay));
                    evs.forEach(e   => dots.push(catColor(e.category)));
                    tasks.filter(t => !t.completed).forEach(t =>
                      dots.push(PRIORITY_DOT[t.priority] || '#705765')
                    );
                  }
                  const visibleDots   = dots.slice(0, 3);
                  const overflowCount = dots.length - visibleDots.length;

                  const cls = ['cal-cell',
                    !isThisMonth ? 'is-other-month' : '',
                    isToday      ? 'is-today'       : '',
                    isSelected   ? 'is-selected'    : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <div
                      key={idx}
                      className={cls}
                      onClick={() => isThisMonth && setSelectedDay(cellDay)}
                      id={isThisMonth ? `cal-cell-${cellDay}` : undefined}
                    >
                      <span className="cal-cell-num">{displayDay}</span>
                      {visibleDots.length > 0 && (
                        <div className="cal-dots">
                          {visibleDots.map((color, di) => (
                            <span key={di} className="cal-dot" style={{ background: color }} />
                          ))}
                          {overflowCount > 0 && (
                            <span className="cal-dot-overflow">+{overflowCount}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ WEEK VIEW ══ */}
          {viewMode === 'week' && (
            <div
              className={`cal-week-wrap${slideDir ? ` slide-${slideDir}` : ''}`}
              {...swipe}
              id="cal-week-grid"
            >
              {/* Day header */}
              <div className="cal-week-header">
                <div className="cal-week-header-gutter" />
                {weekDays.map(({ date, ds }) => {
                  const isToday    = ds === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
                  const isSel      = ds === selDateStr;
                  const dayEvents  = getEventsForDate(ds);
                  const dayTasks   = getTasksForDate(ds).filter(t => !t.completed);
                  const allDots    = [
                    ...dayEvents.map(e => catColor(e.category)),
                    ...dayTasks.map(t => PRIORITY_DOT[t.priority] || '#705765'),
                  ].slice(0, 3);

                  return (
                    <div
                      key={ds}
                      className={`cal-week-day-head${isToday ? ' is-today' : ''}${isSel ? ' is-selected' : ''}`}
                      onClick={() => { setSelectedDay(date.getDate()); setViewMonth(date.getMonth()); setViewYear(date.getFullYear()); }}
                      id={`cal-week-day-${ds}`}
                    >
                      <div className="cal-week-day-name">{DAYS_ES[date.getDay()]}</div>
                      <div className="cal-week-day-num">{date.getDate()}</div>
                      <div className="cal-week-dot-row">
                        {allDots.map((c, i) => (
                          <span key={i} className="cal-week-dot" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="cal-week-timeline">
                {/* Hour labels column */}
                {WEEK_HOURS.map(h => (
                  <div key={h} className="cal-week-hour-label" style={{ gridColumn: 1, gridRow: h - 6 }}>
                    {h === 12 ? '12pm' : h > 12 ? `${h-12}pm` : `${h}am`}
                  </div>
                ))}

                {/* Day columns */}
                {weekDays.map(({ date, ds }, colIdx) => {
                  const isToday   = ds === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
                  const dayEvents = getEventsForDate(ds);
                  const dayTasks  = getTasksForDate(ds).filter(t => t.time);
                  const nowMinutes = now.getHours() * 60 + now.getMinutes();
                  const nowOffset  = (nowMinutes - 7 * 60) / 60 * 48; // px from top

                  return (
                    <div
                      key={ds}
                      className="cal-week-col"
                      style={{ gridColumn: colIdx + 2, gridRow: '1 / -1', position: 'relative' }}
                    >
                      {/* Hour slots for background lines */}
                      {WEEK_HOURS.map(h => (
                        <div key={h} className="cal-week-hour-slot" />
                      ))}

                      {/* Current time line */}
                      {isToday && nowOffset >= 0 && nowOffset <= WEEK_HOURS.length * 48 && (
                        <div className="cal-week-now-line" style={{ top: nowOffset }}>
                          <div className="cal-week-now-dot" />
                        </div>
                      )}

                      {/* Events */}
                      {dayEvents.filter(e => e.startTime).map(e => {
                        const [h, m] = (e.startTime || '08:00').split(':').map(Number);
                        const top    = ((h * 60 + m) - 7 * 60) / 60 * 48;
                        const height = 40; // fixed for events without duration
                        return (
                          <div
                            key={e.id}
                            className="cal-week-event"
                            style={{
                              top: Math.max(0, top),
                              height,
                              background: catColor(e.category) + '22',
                              color: catColor(e.category),
                              borderLeft: `3px solid ${catColor(e.category)}`,
                            }}
                            onClick={() => navigate('events')}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        );
                      })}

                      {/* Tasks with time */}
                      {dayTasks.map(t => {
                        const [h, m] = (t.time || '09:00').split(':').map(Number);
                        const top    = ((h * 60 + m) - 7 * 60) / 60 * 48;
                        const color  = PRIORITY_DOT[t.priority] || '#705765';
                        return (
                          <div
                            key={t.id}
                            className="cal-week-event"
                            style={{
                              top: Math.max(0, top),
                              height: 32,
                              background: color + '18',
                              color,
                              borderLeft: `3px solid ${color}`,
                            }}
                            onClick={() => navigate('taskDetail', { taskId: t.id })}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ SIDE PANEL ══ */}
          <div className="cal-panel">
            <div className="cal-detail-card">

              {/* Panel header */}
              <div className="cal-detail-header">
                <div>
                  <div className="cal-detail-title">
                    {DAYS_FULL[new Date(viewYear, viewMonth, selectedDay).getDay()]}
                  </div>
                  <div className="cal-detail-date">
                    {selectedDay} de {MONTHS_ES[viewMonth]} {viewYear}
                  </div>
                </div>
                {/* Load pill */}
                <span className="cal-load-pill" style={{ color: loadColor }}>
                  {loadLabel || 'Libre'}
                </span>
              </div>

              {/* No items */}
              {selEvents.length === 0 && selTasks.length === 0 && (
                <div className="cal-empty-day">
                  <LottieIcon name="wave" size={56} loop autoplay style={{ margin: '0 auto 12px' }} />
                  <p>Día libre — perfecto para descansar</p>
                </div>
              )}

              {/* Events */}
              {selEvents.length > 0 && (
                <>
                  <div className="cal-section-head">
                    Eventos <span className="cal-section-line" />
                  </div>
                  <div className="cal-event-list">
                    {selEvents.map((ev, i) => (
                      <div
                        key={ev.id || i}
                        className="cal-event-row"
                        onClick={() => navigate('events')}
                        id={`cal-ev-${ev.id || i}`}
                      >
                        <div className="cal-event-time-col">
                          <span className="cal-event-time" style={{ color: catColor(ev.category) }}>
                            {ev.startTime || 'Todo el día'}
                          </span>
                        </div>
                        <div className="cal-event-body">
                          <div className="cal-event-title">{ev.title}</div>
                          {ev.location && (
                            <div className="cal-event-meta">
                              <MapPin size={11} strokeWidth={2} />
                              <span>{ev.location}</span>
                            </div>
                          )}
                          {ev.link && (
                            <div className="cal-event-meta">
                              <Video size={11} strokeWidth={2} />
                              <span>Unirse al evento</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pending tasks */}
              {pending.length > 0 && (
                <>
                  <div className="cal-section-head">
                    Tareas pendientes <span className="cal-section-line" />
                  </div>
                  <div className="cal-event-list">
                    {pending.map((t, i) => (
                      <div
                        key={t.id || i}
                        className="cal-event-row"
                        onClick={() => navigate('taskDetail', { taskId: t.id })}
                        id={`cal-task-${t.id || i}`}
                      >
                        <div className="cal-event-time-col">
                          <span className="cal-event-time" style={{ color: PRIORITY_DOT[t.priority] || '#705765' }}>
                            {t.time || '—'}
                          </span>
                        </div>
                        <div className="cal-event-body">
                          <div className="cal-event-title">{t.title}</div>
                          {t.category && (
                            <div className="cal-event-meta">
                              <span style={{ color: catColor(t.category) }}>{t.category}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Done tasks */}
              {done.length > 0 && (
                <>
                  <div className="cal-section-head">
                    Completadas <span className="cal-section-line" />
                  </div>
                  <div className="cal-event-list">
                    {done.map((t, i) => (
                      <div
                        key={t.id || i}
                        className="cal-event-row cal-done-row"
                        onClick={() => navigate('taskDetail', { taskId: t.id })}
                      >
                        <div className="cal-event-time-col">
                          <Check size={13} strokeWidth={2.5} color="var(--secondary)" />
                        </div>
                        <div className="cal-event-body">
                          <div className="cal-event-title">{t.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Quick add buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="cal-add-btn"
                  onClick={() => navigate('createTask')}
                  id="cal-add-task"
                >
                  <Plus size={16} />
                  <span>Tarea</span>
                </button>
                <button
                  className="cal-add-btn"
                  onClick={() => navigate('createEvent')}
                  id="cal-add-event"
                >
                  <Plus size={16} />
                  <span>Evento</span>
                </button>
              </div>
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
                  {focus?.author ? `— ${focus.author}` : 'Recuerda alejarte de la pantalla cada 90 minutos. El crecimiento ocurre en las pausas.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
