import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import LottieIcon from '../components/LottieIcon';
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Check, Calendar, AlignJustify,
         Sun, Moon, Star, Clock } from 'lucide-react';
import { formatTime12h } from '../lib/utils';

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto',
                   'Septiembre','Octubre','Noviembre','Diciembre'];

/* ── Helpers ── */
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
function pad(n)               { return String(n).padStart(2, '0'); }
function toDS(y, m, d)        { return `${y}-${pad(m + 1)}-${pad(d)}`; }

/* ── Category colours ── */
const catColor = (cat) => {
  if (!cat) return '#705765';
  const c = cat.toLowerCase();
  if (c.includes('market'))  return '#705765';
  if (c.includes('espirit') || c.includes('spirit')) return '#695e37';
  return '#546347';
};
const PRIORITY_COLOR = { alta: '#ba1a1a', media: '#695e37', baja: '#546347' };

/* ── Icon for timeline bubble ── */
const BubbleIcon = ({ item, size = 20 }) => {
  const hour = parseInt((item.startTime || item.time || '09:00').split(':')[0], 10);
  if (hour >= 6  && hour < 12) return <Sun  size={size} strokeWidth={2} />;
  if (hour >= 20 || hour < 6)  return <Moon size={size} strokeWidth={2} />;
  return <Star size={size} strokeWidth={2} />;
};

/* ── Touch-swipe hook ── */
function useTouchSwipe(onLeft, onRight, threshold = 50) {
  const startX = useRef(null);
  const onTouchStart = useCallback((e) => { startX.current = e.touches[0].clientX; }, []);
  const onTouchEnd   = useCallback((e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < threshold) return;
    dx < 0 ? onLeft() : onRight();
    startX.current = null;
  }, [onLeft, onRight, threshold]);
  return { onTouchStart, onTouchEnd };
}

/* ── 12h formatter — delegates to shared util ── */
function fmt12(t) { return formatTime12h(t, 'Todo el día'); }

/* ─────────────────────────────────────────────── */
export default function CalendarScreen() {
  const { state, navigate, dispatch } = useApp();
  const { t } = useTranslation();
  const now = new Date();

  const [viewYear,    setViewYear]    = useState(now.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [viewMode,    setViewMode]    = useState('month');
  const [slideDir,    setSlideDir]    = useState('');

  /* ── Slide helper ── */
  const slide = (dir, fn) => { setSlideDir(dir); setTimeout(() => { fn(); setSlideDir(''); }, 210); };

  /* ── Month nav ── */
  const prevMonth = () => slide('right', () => {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); } else setViewMonth(m => m-1);
    setSelectedDay(1);
  });
  const nextMonth = () => slide('left', () => {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); } else setViewMonth(m => m+1);
    setSelectedDay(1);
  });

  /* ── Week strip: 7 days starting from Sunday of the week containing selectedDay ── */
  const selDate   = new Date(viewYear, viewMonth, selectedDay);
  const weekStart = new Date(selDate);
  weekStart.setDate(selDate.getDate() - selDate.getDay()); // Sunday

  const prevWeek = () => slide('right', () => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(d.getDate());
  });
  const nextWeek = () => slide('left', () => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(d.getDate());
  });

  const goToday = () => {
    setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDay(now.getDate());
  };

  const swipe = useTouchSwipe(
    viewMode === 'month' ? nextMonth : nextWeek,
    viewMode === 'month' ? prevMonth : prevWeek,
  );

  /* ── Data helpers ── */
  const eventsFor = (ds) => state.events.filter(e => e.date === ds);
  const tasksFor  = (ds) => state.tasks.filter(t  => t.date === ds);

  /* ── Selected day data ── */
  const selDS       = toDS(viewYear, viewMonth, selectedDay);
  const selEvents   = eventsFor(selDS);
  const selTasks    = tasksFor(selDS);
  const pending     = selTasks.filter(t => !t.completed);
  const done        = selTasks.filter(t =>  t.completed);
  const totalItems  = selEvents.length + selTasks.length;
  const loadColor   = totalItems === 0 ? 'var(--secondary)' : totalItems <= 3 ? 'var(--tertiary)' : 'var(--error)';
  const loadLabel   = totalItems === 0 ? 'Día libre'
    : [pending.length > 0 && `${pending.length} tarea${pending.length !== 1 ? 's' : ''}`,
       selEvents.length > 0 && `${selEvents.length} evento${selEvents.length !== 1 ? 's' : ''}`]
      .filter(Boolean).join(' · ');

  /* ── Month grid ── */
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const daysInMonth    = getDaysInMonth(viewYear, viewMonth);
  const firstDay       = getFirstDay(viewYear, viewMonth);
  const prevMonthDays  = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  const totalCells     = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  /* ── Week strip days ── */
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return { date: d, ds: toDS(d.getFullYear(), d.getMonth(), d.getDate()) };
  });

  /* ── Timeline items for selected day: merge events + tasks, sort by time ── */
  const timelineItems = [
    ...selEvents.map(e => ({ ...e, _type: 'event' })),
    ...selTasks.map(t  => ({ ...t, _type: 'task'  })),
  ].sort((a, b) => {
    const ta = a.startTime || a.time || '99:99';
    const tb = b.startTime || b.time || '99:99';
    return ta.localeCompare(tb);
  });

  /* ── Monthly focus phrase ── */
  const focus = state.phrases?.[viewMonth % (state.phrases?.length || 1)];

  /* ── Toggle task complete ── */
  const toggleTask = (id) => dispatch({ type: 'TOGGLE_TASK', id });

  return (
    <>
      <style>{`
        /* ═══════════════ CALENDAR ═══════════════ */
        .cal-screen {
          padding: var(--space-xl) var(--space-container) var(--space-8);
          max-width: var(--content-max-w);
          margin: 0 auto;
          animation: screenEnter 0.5s var(--ease-out) both;
        }

        /* ── Header ── */
        .cal-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: var(--space-md);
          margin-bottom: var(--space-lg); flex-wrap: wrap;
        }
        .cal-heading {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg); font-weight: 500;
          color: var(--on-surface); line-height: 1.15;
        }
        .cal-heading span { color: var(--primary); }
        .cal-sub {
          font-size: var(--text-body-md); color: var(--on-surface-variant);
          margin-top: 2px; max-width: 300px;
        }
        .cal-header-right {
          display: flex; align-items: center;
          gap: var(--space-sm); flex-shrink: 0;
        }
        .cal-view-toggle {
          display: flex; background: var(--surface-container);
          border-radius: var(--radius-full); padding: 3px; gap: 2px;
        }
        .cal-view-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: var(--radius-full);
          border: none; cursor: pointer;
          font-size: var(--text-label-sm); font-weight: 600;
          font-family: var(--font-body); color: var(--on-surface-variant);
          background: transparent; transition: all var(--transition-fast);
        }
        .cal-view-btn.active {
          background: var(--surface-container-lowest); color: var(--primary);
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }
        .cal-nav-btn {
          width: 38px; height: 38px; border-radius: var(--radius-full);
          border: 1px solid var(--outline-variant); background: transparent;
          color: var(--primary); display: flex; align-items: center;
          justify-content: center; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cal-nav-btn:hover { background: var(--primary-container); }
        .cal-nav-btn:active { transform: scale(0.9); }
        .cal-today-btn {
          padding: 0.4rem 1rem; border-radius: var(--radius-full);
          border: 1px solid var(--outline-variant); background: transparent;
          font-size: var(--text-label-sm); font-weight: 600;
          font-family: var(--font-body); color: var(--on-surface);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .cal-today-btn:hover { background: var(--surface-container); }

        /* ── Body ── */
        .cal-body {
          display: flex; flex-direction: column; gap: var(--space-md);
        }
        @media (min-width: 900px) {
          .cal-body { flex-direction: row; align-items: flex-start; }
        }

        /* ═══ MONTH GRID ═══ */
        .cal-grid-wrap {
          flex: 1; min-width: 0;
          transition: opacity 0.21s ease, transform 0.21s ease;
        }
        .cal-grid-wrap.slide-left  { opacity: 0; transform: translateX(-16px); }
        .cal-grid-wrap.slide-right { opacity: 0; transform: translateX(16px);  }

        .cal-day-labels {
          display: grid; grid-template-columns: repeat(7, 1fr);
          margin-bottom: var(--space-sm); text-align: center;
        }
        .cal-day-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--outline-variant);
          padding: var(--space-xs) 0;
        }
        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 1px; background: var(--outline-variant);
          border: 1px solid var(--outline-variant);
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(112,87,101,0.06);
        }
        .cal-cell {
          background: var(--surface-container-lowest);
          aspect-ratio: 1 / 1.1; padding: 8px;
          display: flex; flex-direction: column;
          justify-content: space-between; cursor: pointer;
          transition: background 0.18s; user-select: none;
        }
        .cal-cell:hover { background: rgba(248,215,232,0.45); }
        .cal-cell.is-other-month { background: rgba(245,243,241,0.4); opacity: 0.3; cursor: default; }
        .cal-cell.is-other-month:hover { background: rgba(245,243,241,0.4); }
        .cal-cell.is-selected { background: var(--primary-container) !important; box-shadow: inset 0 0 0 2px var(--primary); }
        .cal-cell.is-today .cal-cell-num {
          background: var(--primary); color: white;
          border-radius: 50%; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .cal-cell-num { font-size: 11px; font-weight: 500; color: var(--on-surface); line-height: 1; }
        .cal-dots { display: flex; gap: 2px; flex-wrap: wrap; align-items: flex-end; }
        .cal-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .cal-dot-overflow { font-size: 8px; font-weight: 700; color: var(--on-surface-variant); line-height: 6px; }

        /* ═══ WEEK VIEW — Day strip + Timeline ═══ */
        .cal-week-container {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: var(--space-md);
          transition: opacity 0.21s ease, transform 0.21s ease;
        }
        .cal-week-container.slide-left  { opacity: 0; transform: translateX(-16px); }
        .cal-week-container.slide-right { opacity: 0; transform: translateX(16px);  }

        /* ─ Day strip ─ */
        .cal-week-strip {
          display: flex; gap: 4px;
          background: var(--surface-container-lowest);
          border-radius: 20px; padding: 10px 12px;
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.06);
        }
        .cal-strip-day {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 4px; padding: 8px 4px;
          border-radius: 14px; cursor: pointer;
          transition: background 0.18s, transform 0.12s;
        }
        .cal-strip-day:hover { background: rgba(248,215,232,0.3); }
        .cal-strip-day:active { transform: scale(0.94); }

        .cal-strip-day-name {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--outline);
        }
        .cal-strip-day-num {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600; color: var(--on-surface);
          transition: all 0.15s;
        }
        .cal-strip-day.is-today .cal-strip-day-num {
          background: var(--primary); color: white; font-weight: 700;
        }
        .cal-strip-day.is-selected:not(.is-today) .cal-strip-day-num {
          background: var(--primary-container);
          color: var(--on-primary-container); font-weight: 700;
          box-shadow: 0 0 0 2px var(--primary);
        }

        /* Activity dots row under each strip day */
        .cal-strip-dots {
          display: flex; gap: 3px; justify-content: center;
          min-height: 8px; align-items: center;
        }
        .cal-strip-dot {
          width: 5px; height: 5px; border-radius: 50%;
        }
        /* Pill-shaped dot (used for habit/event combined indicators) */
        .cal-strip-pill {
          width: 16px; height: 8px; border-radius: 99px;
          display: flex; align-items: center; justify-content: center;
        }

        /* ─ Timeline ─ */
        .cal-timeline {
          background: var(--surface-container-lowest);
          border-radius: 24px; padding: var(--space-lg) var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 24px rgba(112,87,101,0.08);
          min-height: 200px;
          position: relative;
        }

        .cal-timeline-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-xl);
        }
        .cal-timeline-date {
          font-family: var(--font-display); font-size: 18px;
          font-weight: 600; color: var(--on-surface);
        }
        .cal-timeline-date span { color: var(--primary); }
        .cal-load-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: var(--radius-full);
          font-size: 11px; font-weight: 700;
          border: 1.5px solid currentColor; flex-shrink: 0;
        }

        /* ─ Timeline track ─ */
        .cal-tl-list {
          display: flex; flex-direction: column;
          gap: 0; position: relative;
        }

        /* Vertical dashed line through the track */
        .cal-tl-list::before {
          content: '';
          position: absolute;
          left: 58px; top: 20px; bottom: 20px;
          width: 2px;
          background: repeating-linear-gradient(
            to bottom,
            var(--outline-variant) 0px,
            var(--outline-variant) 4px,
            transparent 4px,
            transparent 10px
          );
          z-index: 0;
        }

        .cal-tl-item {
          display: grid;
          grid-template-columns: 52px 36px 1fr auto;
          align-items: center;
          gap: var(--space-md);
          padding: 14px 0;
          position: relative;
          z-index: 1;
        }
        .cal-tl-item + .cal-tl-item {
          border-top: none;
        }

        /* Time label */
        .cal-tl-time {
          font-size: 11px; font-weight: 700;
          color: var(--on-surface-variant); text-align: right;
          line-height: 1.2; white-space: nowrap;
        }

        /* Bubble on the line */
        .cal-tl-bubble {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.2);
          position: relative; z-index: 2;
          transition: transform 0.15s;
        }
        .cal-tl-item:hover .cal-tl-bubble { transform: scale(1.08); }

        /* Content */
        .cal-tl-content { min-width: 0; cursor: pointer; }
        .cal-tl-label {
          font-size: 11px; color: var(--on-surface-variant);
          margin-bottom: 2px; display: flex; align-items: center; gap: 4px;
        }
        .cal-tl-title {
          font-size: var(--text-label-md); font-weight: 700;
          color: var(--on-surface); line-height: 1.3;
        }
        .cal-tl-title.done-line {
          text-decoration: line-through; opacity: 0.5;
        }
        .cal-tl-meta {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--on-surface-variant); margin-top: 3px;
        }

        /* Completion ring */
        .cal-tl-ring {
          width: 24px; height: 24px; border-radius: 50%;
          border: 2.5px solid var(--outline-variant);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: all 0.18s ease; background: transparent;
        }
        .cal-tl-ring.is-done {
          border-color: var(--secondary); background: var(--secondary);
        }
        .cal-tl-ring:hover:not(.is-done) {
          border-color: var(--primary); background: rgba(112,87,101,0.08);
        }

        /* Gap indicator between items */
        .cal-tl-gap {
          grid-column: 2 / 4;
          text-align: center;
          font-size: 12px; font-style: italic;
          color: var(--outline); padding: 4px 0;
          opacity: 0.7;
        }

        /* Empty timeline */
        .cal-tl-empty {
          display: flex; flex-direction: column;
          align-items: center; gap: var(--space-md);
          padding: var(--space-xl) var(--space-md);
          text-align: center;
        }
        .cal-tl-empty p { color: var(--on-surface-variant); font-size: var(--text-body-md); }

        /* Add buttons */
        .cal-tl-add-row {
          display: flex; gap: 8px; margin-top: var(--space-lg);
        }
        .cal-add-btn {
          flex: 1; padding: 0.65rem;
          border-radius: 14px;
          border: 2px dashed var(--outline-variant);
          background: transparent; color: var(--outline);
          font-size: var(--text-label-md); font-weight: 500;
          font-family: var(--font-body); cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: all var(--transition-fast);
        }
        .cal-add-btn:hover { border-color: var(--primary); color: var(--primary); }

        /* ═══ SIDE PANEL ═══ */
        .cal-panel {
          width: 100%; display: flex; flex-direction: column; gap: var(--space-md);
        }
        @media (min-width: 900px) { .cal-panel { width: 288px; flex-shrink: 0; } }

        .cal-detail-card {
          background: var(--surface-container-lowest);
          border-radius: 28px; padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 24px rgba(112,87,101,0.08);
        }

        .cal-detail-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: var(--space-md); gap: 8px;
        }
        .cal-detail-title {
          font-family: var(--font-body); font-size: var(--text-headline-md);
          font-weight: 700; color: var(--primary);
        }
        .cal-detail-date { font-size: var(--text-label-sm); color: var(--on-surface-variant); margin-top: 2px; }

        .cal-section-head {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--outline);
          padding: var(--space-sm) 0 var(--space-xs);
          display: flex; align-items: center; gap: var(--space-sm);
        }
        .cal-section-line { flex: 1; height: 1px; background: var(--outline-variant); opacity: 0.4; }

        .cal-event-list { display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-md); }
        .cal-event-row {
          display: flex; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
          border-radius: 14px; cursor: pointer; transition: background 0.15s; align-items: flex-start;
        }
        .cal-event-row:hover { background: rgba(248,215,232,0.2); }
        .cal-event-time { font-size: 11px; font-weight: 700; min-width: 40px; }
        .cal-event-body { flex: 1; min-width: 0; }
        .cal-event-title { font-size: var(--text-label-md); font-weight: 600; color: var(--on-surface); margin-bottom: 2px; }
        .cal-event-meta  { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--on-surface-variant); margin-top: 2px; }
        .cal-done-row { opacity: 0.5; }
        .cal-done-row .cal-event-title { text-decoration: line-through; }

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
          text-transform: uppercase; color: var(--on-primary-fixed); opacity: 0.7; margin-bottom: var(--space-sm);
        }
        .cal-focus-phrase {
          font-family: var(--font-display); font-size: 17px;
          font-style: italic; font-weight: 500;
          color: var(--on-primary-fixed); line-height: 1.45; margin-bottom: var(--space-sm);
        }
        .cal-focus-sub { font-size: 12px; color: var(--on-primary-fixed-variant); line-height: 1.6; }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="cal-screen">

        {/* ─── HEADER ─── */}
        <div className="cal-header">
          <div>
            <h2 className="cal-heading">
              {viewMode === 'week'
                ? <>{MONTHS_ES[weekStart.getMonth()]} <span>{weekStart.getFullYear()}</span></>
                : <>{MONTHS_ES[viewMonth]} <span>{viewYear}</span></>}
            </h2>
            <p className="cal-sub">
              {focus?.text ? `"${focus.text.slice(0, 55)}…"` : 'Planifica con intención.'}
            </p>
          </div>

          <div className="cal-header-right">
            <div className="cal-view-toggle" id="cal-view-toggle">
              <button className={`cal-view-btn${viewMode === 'month' ? ' active' : ''}`}
                onClick={() => setViewMode('month')} id="cal-toggle-month">
                <Calendar size={13} strokeWidth={2} /> Mes
              </button>
              <button className={`cal-view-btn${viewMode === 'week' ? ' active' : ''}`}
                onClick={() => setViewMode('week')} id="cal-toggle-week">
                <AlignJustify size={13} strokeWidth={2} /> Semana
              </button>
            </div>
            <button className="cal-nav-btn" id="cal-prev"
              onClick={viewMode === 'month' ? prevMonth : prevWeek} aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <button className="cal-today-btn" onClick={goToday} id="cal-today">Hoy</button>
            <button className="cal-nav-btn" id="cal-next"
              onClick={viewMode === 'month' ? nextMonth : nextWeek} aria-label="Siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="cal-body">

          {/* ═══ MONTH VIEW ═══ */}
          {viewMode === 'month' && (
            <div className={`cal-grid-wrap${slideDir ? ` slide-${slideDir}` : ''}`} {...swipe}>
              <div className="cal-day-labels">
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                  <div key={d} className="cal-day-label">{d}</div>
                ))}
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
                    const ds = toDS(viewYear, viewMonth, cellDay);
                    eventsFor(ds).forEach(e => dots.push(catColor(e.category)));
                    tasksFor(ds).filter(t => !t.completed)
                      .forEach(t => dots.push(PRIORITY_COLOR[t.priority] || '#705765'));
                  }
                  const vis = dots.slice(0, 3);
                  const ovf = dots.length - vis.length;

                  return (
                    <div
                      key={idx}
                      className={['cal-cell', !isThisMonth ? 'is-other-month' : '',
                        isToday ? 'is-today' : '', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}
                      onClick={() => isThisMonth && setSelectedDay(cellDay)}
                      id={isThisMonth ? `cal-cell-${cellDay}` : undefined}
                    >
                      <span className="cal-cell-num">{displayDay}</span>
                      {vis.length > 0 && (
                        <div className="cal-dots">
                          {vis.map((c, i) => <span key={i} className="cal-dot" style={{ background: c }} />)}
                          {ovf > 0 && <span className="cal-dot-overflow">+{ovf}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ WEEK VIEW ═══ */}
          {viewMode === 'week' && (
            <div className={`cal-week-container${slideDir ? ` slide-${slideDir}` : ''}`} {...swipe}>

              {/* ─ Day strip ─ */}
              <div className="cal-week-strip" id="cal-week-strip">
                {weekDays.map(({ date, ds }) => {
                  const todayDS  = toDS(now.getFullYear(), now.getMonth(), now.getDate());
                  const isToday  = ds === todayDS;
                  const isSel    = ds === selDS;
                  const evs      = eventsFor(ds);
                  const tks      = tasksFor(ds).filter(t => !t.completed);
                  const stripDots = [
                    ...evs.map(e => catColor(e.category)),
                    ...tks.map(t => PRIORITY_COLOR[t.priority] || '#705765'),
                  ].slice(0, 3);

                  return (
                    <div
                      key={ds}
                      className={`cal-strip-day${isToday ? ' is-today' : ''}${isSel ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSelectedDay(date.getDate());
                        setViewMonth(date.getMonth());
                        setViewYear(date.getFullYear());
                      }}
                      id={`cal-strip-${ds}`}
                    >
                      <span className="cal-strip-day-name">{DAYS_ES[date.getDay()]}</span>
                      <span className="cal-strip-day-num">{date.getDate()}</span>
                      <div className="cal-strip-dots">
                        {stripDots.map((c, i) => (
                          <span key={i} className="cal-strip-dot" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─ Timeline ─ */}
              <div className="cal-timeline" id="cal-timeline">
                <div className="cal-timeline-header">
                  <div className="cal-timeline-date">
                    {DAYS_FULL[new Date(viewYear, viewMonth, selectedDay).getDay()]},{' '}
                    <span>{selectedDay} de {MONTHS_ES[viewMonth]}</span>
                  </div>
                  <span className="cal-load-pill" style={{ color: loadColor }}>
                    {loadLabel}
                  </span>
                </div>

                {timelineItems.length === 0 ? (
                  <div className="cal-tl-empty">
                    <LottieIcon name="wave" size={56} loop autoplay style={{ margin: '0 auto' }} />
                    <p>Día libre — perfecto para descansar o planificar algo nuevo.</p>
                    <div className="cal-tl-add-row">
                      <button className="cal-add-btn" onClick={() => navigate('createTask')} id="cal-tl-add-task">
                        <Plus size={15} /> Tarea
                      </button>
                      <button className="cal-add-btn" onClick={() => navigate('createEvent')} id="cal-tl-add-event">
                        <Plus size={15} /> Evento
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cal-tl-list" id="cal-tl-list">
                      {timelineItems.map((item, i) => {
                        const isTask  = item._type === 'task';
                        const isDone  = item.completed;
                        const time24  = item.startTime || item.time || null;
                        const timeStr = fmt12(time24);
                        const color   = isTask
                          ? (PRIORITY_COLOR[item.priority] || '#705765')
                          : catColor(item.category);

                        /* Gap label between items */
                        const prev = timelineItems[i - 1];
                        const prevTime = prev ? (prev.startTime || prev.time) : null;
                        const currTime = time24;
                        let gapHours = 0;
                        if (prevTime && currTime) {
                          const [ph, pm] = prevTime.split(':').map(Number);
                          const [ch, cm] = currTime.split(':').map(Number);
                          gapHours = ((ch * 60 + cm) - (ph * 60 + pm)) / 60;
                        }

                        return (
                          <div key={item.id || i}>
                            {/* Gap hint */}
                            {i > 0 && gapHours >= 2 && (
                              <div className="cal-tl-item">
                                <div />
                                <div className="cal-tl-gap">
                                  {gapHours >= 3
                                    ? `${Math.round(gapHours)}h libres · ¿Qué sigue?`
                                    : 'Intervalo · respira'}
                                </div>
                              </div>
                            )}

                            <div className="cal-tl-item" id={`cal-tl-${item.id || i}`}>
                              {/* Time */}
                              <div className="cal-tl-time">
                                {timeStr.split(' ').map((part, pi) => (
                                  <div key={pi}>{part}</div>
                                ))}
                              </div>

                              {/* Bubble */}
                              <div className="cal-tl-bubble" style={{ background: color }}>
                                <BubbleIcon item={item} size={16} />
                              </div>

                              {/* Content */}
                              <div className="cal-tl-content"
                                onClick={() => isTask ? navigate('taskDetail', { taskId: item.id }) : navigate('events')}>
                                <div className="cal-tl-label">
                                  <Clock size={10} strokeWidth={2.5} />
                                  {timeStr}
                                  {isTask && item.category && (
                                    <span style={{ color, marginLeft: 2 }}>· {item.category}</span>
                                  )}
                                </div>
                                <div className={`cal-tl-title${isDone ? ' done-line' : ''}`}>
                                  {item.title}
                                </div>
                                {item.location && (
                                  <div className="cal-tl-meta">
                                    <MapPin size={10} strokeWidth={2} />
                                    {item.location}
                                  </div>
                                )}
                              </div>

                              {/* Completion ring — only for tasks */}
                              {isTask ? (
                                <button
                                  className={`cal-tl-ring${isDone ? ' is-done' : ''}`}
                                  onClick={() => toggleTask(item.id)}
                                  aria-label={isDone ? 'Marcar pendiente' : 'Marcar completada'}
                                >
                                  {isDone && <Check size={13} strokeWidth={3} color="white" />}
                                </button>
                              ) : (
                                <div style={{ width: 24 }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cal-tl-add-row">
                      <button className="cal-add-btn" onClick={() => navigate('createTask')} id="cal-tl-add-task">
                        <Plus size={15} /> Tarea
                      </button>
                      <button className="cal-add-btn" onClick={() => navigate('createEvent')} id="cal-tl-add-event">
                        <Plus size={15} /> Evento
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══ SIDE PANEL (ambas vistas) ═══ */}
          <div className="cal-panel">
            <div className="cal-detail-card">
              <div className="cal-detail-header">
                <div>
                  <div className="cal-detail-title">
                    {DAYS_FULL[new Date(viewYear, viewMonth, selectedDay).getDay()]}
                  </div>
                  <div className="cal-detail-date">
                    {selectedDay} de {MONTHS_ES[viewMonth]} {viewYear}
                  </div>
                </div>
                <span className="cal-load-pill" style={{ color: loadColor }}>{loadLabel || 'Libre'}</span>
              </div>

              {totalItems === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--on-surface-variant)' }}>
                  <LottieIcon name="wave" size={48} loop autoplay style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 'var(--text-body-md)' }}>Día libre</p>
                </div>
              )}

              {selEvents.length > 0 && (
                <>
                  <div className="cal-section-head">Eventos <span className="cal-section-line" /></div>
                  <div className="cal-event-list">
                    {selEvents.map((ev, i) => (
                      <div key={ev.id||i} className="cal-event-row" onClick={() => navigate('events')}
                        id={`cal-ev-${ev.id||i}`}>
                        <span className="cal-event-time" style={{ color: catColor(ev.category) }}>
                          {formatTime12h(ev.startTime, 'Todo el día')}
                        </span>
                        <div className="cal-event-body">
                          <div className="cal-event-title">{ev.title}</div>
                          {ev.location && (
                            <div className="cal-event-meta"><MapPin size={10} strokeWidth={2} />{ev.location}</div>
                          )}
                          {ev.link && (
                            <div className="cal-event-meta"><Video size={10} strokeWidth={2} />Unirse</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {pending.length > 0 && (
                <>
                  <div className="cal-section-head">Pendientes <span className="cal-section-line" /></div>
                  <div className="cal-event-list">
                    {pending.map((t, i) => (
                      <div key={t.id||i} className="cal-event-row"
                        onClick={() => navigate('taskDetail', { taskId: t.id })} id={`cal-task-${t.id||i}`}>
                        <span className="cal-event-time" style={{ color: PRIORITY_COLOR[t.priority]||'#705765' }}>
                          {formatTime12h(t.time, '—')}
                        </span>
                        <div className="cal-event-body">
                          <div className="cal-event-title">{t.title}</div>
                          {t.category && (
                            <div className="cal-event-meta" style={{ color: catColor(t.category) }}>{t.category}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {done.length > 0 && (
                <>
                  <div className="cal-section-head">Completadas <span className="cal-section-line" /></div>
                  <div className="cal-event-list">
                    {done.map((t, i) => (
                      <div key={t.id||i} className="cal-event-row cal-done-row"
                        onClick={() => navigate('taskDetail', { taskId: t.id })}>
                        <Check size={12} strokeWidth={2.5} color="var(--secondary)" style={{ marginTop: 3 }} />
                        <div className="cal-event-body">
                          <div className="cal-event-title">{t.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="cal-tl-add-row">
                <button className="cal-add-btn" onClick={() => navigate('createTask')} id="cal-add-task">
                  <Plus size={15} /> Tarea
                </button>
                <button className="cal-add-btn" onClick={() => navigate('createEvent')} id="cal-add-event">
                  <Plus size={15} /> Evento
                </button>
              </div>
            </div>

            {/* Focus card */}
            <div className="cal-focus-card">
              <div className="cal-focus-deco" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p className="cal-focus-eyebrow">Enfoque de {MONTHS_ES[viewMonth]}</p>
                <p className="cal-focus-phrase">{focus?.text || 'Cultivando armonía'}</p>
                <p className="cal-focus-sub">
                  {focus?.author ? `— ${focus.author}`
                    : 'Recuerda alejarte de la pantalla cada 90 min. El crecimiento ocurre en las pausas.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
