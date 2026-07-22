import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import LottieIcon from '../components/LottieIcon';
import { ChevronLeft, ChevronRight, Plus, Check, Calendar, AlignJustify, Clock, CalendarDays } from 'lucide-react';
import { formatTime12h } from '../lib/utils';
import Sticker from '../components/Sticker';
import { DEFAULT_COLOR, formatAmount } from '../lib/entryStyle';

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto',
                   'Septiembre','Octubre','Noviembre','Diciembre'];

/* ── Helpers ── */
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
function pad(n)               { return String(n).padStart(2, '0'); }
function toDS(y, m, d)        { return `${y}-${pad(m + 1)}-${pad(d)}`; }

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

  /* ── Data helpers (todo es una "entrada" en state.tasks) ── */
  const entriesFor = (ds) => state.tasks.filter(e => e.date === ds);

  /* ── Selected day data ── */
  const selDS       = toDS(viewYear, viewMonth, selectedDay);
  const selEntries  = entriesFor(selDS);
  const pending     = selEntries.filter(e => !e.completed);
  const done        = selEntries.filter(e =>  e.completed);
  const totalItems  = selEntries.length;
  const loadColor   = totalItems === 0 ? 'var(--secondary)' : totalItems <= 3 ? 'var(--tertiary)' : 'var(--error)';
  const loadLabel   = totalItems === 0 ? 'Día libre'
    : `${totalItems} ${totalItems === 1 ? 'entrada' : 'entradas'}${done.length ? ` · ${done.length} hechas` : ''}`;

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

  /* ── Timeline items for selected day: entradas ordenadas por hora ── */
  const timelineItems = [...selEntries].sort((a, b) => {
    const ta = a.time || '99:99';
    const tb = b.time || '99:99';
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
          font-size: var(--text-headline-lg); font-weight: 700;
          color: var(--heading); line-height: 1.15;
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
          text-transform: uppercase; color: var(--on-surface-variant);
          padding: var(--space-xs) 0;
        }
        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 1px; background: var(--outline-variant);
          border: 1px solid var(--outline-variant);
          border-radius: 20px; overflow: hidden;
          box-shadow: var(--shadow-card);
        }
        .cal-cell {
          background: var(--surface-container-lowest);
          min-height: 84px; padding: 5px 4px;
          display: flex; flex-direction: column; gap: 3px;
          cursor: pointer; transition: background 0.18s; user-select: none;
          overflow: hidden;
        }
        @media (min-width: 900px) { .cal-cell { min-height: 116px; padding: 7px 6px; } }
        .cal-cell:hover { background: var(--surface-container-low); }
        .cal-cell.is-other-month { background: var(--surface-container-low); opacity: 0.45; cursor: default; }
        .cal-cell.is-selected { box-shadow: inset 0 0 0 2px var(--lime); }
        .cal-cell-num {
          font-size: 11px; font-weight: 700; color: var(--on-surface);
          line-height: 1; align-self: flex-start;
        }
        .cal-cell.is-today .cal-cell-num {
          background: var(--lime); color: var(--on-lime);
          border-radius: 50%; width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
        }
        /* Chips = las "cajitas" que ella escribe en cada día */
        .cal-chips { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .cal-chip {
          display: flex; align-items: center; gap: 3px;
          padding: 1px 4px 1px 3px; border-radius: 5px;
          font-size: 9px; font-weight: 700; line-height: 1.3;
          color: var(--on-surface); white-space: nowrap; overflow: hidden;
          border-left: 3px solid;
        }
        @media (min-width: 900px) { .cal-chip { font-size: 11px; padding: 2px 6px 2px 5px; gap: 5px; } }
        .cal-chip-title { overflow: hidden; text-overflow: ellipsis; }
        .cal-chip.done { opacity: 0.5; }
        .cal-chip.done .cal-chip-title { text-decoration: line-through; }
        .cal-chip-more { font-size: 8px; font-weight: 700; color: var(--on-surface-variant); padding-left: 3px; }
        @media (min-width: 900px) { .cal-chip-more { font-size: 10px; } }

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
          font-family: var(--font-display); font-size: var(--text-headline-md);
          font-weight: 700; color: var(--heading);
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

                  const dayEntries = isThisMonth ? entriesFor(toDS(viewYear, viewMonth, cellDay)) : [];
                  const visible  = dayEntries.slice(0, 3);
                  const overflow = dayEntries.length - visible.length;

                  return (
                    <div
                      key={idx}
                      className={['cal-cell', !isThisMonth ? 'is-other-month' : '',
                        isToday ? 'is-today' : '', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}
                      onClick={() => isThisMonth && setSelectedDay(cellDay)}
                      id={isThisMonth ? `cal-cell-${cellDay}` : undefined}
                    >
                      <span className="cal-cell-num">{displayDay}</span>
                      {visible.length > 0 && (
                        <div className="cal-chips">
                          {visible.map((e, i) => {
                            const c = e.color || DEFAULT_COLOR;
                            return (
                              <div
                                key={e.id || i}
                                className={`cal-chip${e.completed ? ' done' : ''}`}
                                style={{ background: `${c}2e`, borderLeftColor: c }}
                              >
                                {e.sticker && <Sticker id={e.sticker} size={12} />}
                                <span className="cal-chip-title">{e.title}</span>
                              </div>
                            );
                          })}
                          {overflow > 0 && <span className="cal-chip-more">+{overflow} más</span>}
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
                  const stripDots = entriesFor(ds).map(e => e.color || DEFAULT_COLOR).slice(0, 3);

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
                      <button className="cal-add-btn" onClick={() => navigate('createEntry', { date: selDS })} id="cal-tl-add">
                        <Plus size={15} /> Nueva entrada
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cal-tl-list" id="cal-tl-list">
                      {timelineItems.map((item, i) => {
                        const isDone  = item.completed;
                        const timeStr = item.time ? fmt12(item.time) : 'Todo el día';
                        const color   = item.color || DEFAULT_COLOR;
                        const amount  = formatAmount(item.amount);

                        return (
                          <div key={item.id || i}>
                            <div className="cal-tl-item" id={`cal-tl-${item.id || i}`}>
                              {/* Time */}
                              <div className="cal-tl-time">
                                {item.time
                                  ? timeStr.split(' ').map((part, pi) => (<div key={pi}>{part}</div>))
                                  : <div style={{ fontSize: 10 }}>Todo<br/>el día</div>}
                              </div>

                              {/* Bubble con sticker */}
                              <div className="cal-tl-bubble" style={{ background: color }}>
                                {item.sticker
                                  ? <Sticker id={item.sticker} size={20} />
                                  : <CalendarDays size={15} strokeWidth={2} color="#fff" />}
                              </div>

                              {/* Content */}
                              <div className="cal-tl-content"
                                onClick={() => navigate('entryDetail', { entryId: item.id })}>
                                <div className={`cal-tl-title${isDone ? ' done-line' : ''}`}>
                                  {item.title}
                                </div>
                                {amount && (
                                  <div className="cal-tl-meta" style={{ color, fontWeight: 700 }}>{amount}</div>
                                )}
                              </div>

                              {/* Checkbox hecho/pagado (todas las entradas) */}
                              <button
                                className={`cal-tl-ring${isDone ? ' is-done' : ''}`}
                                onClick={() => toggleTask(item.id)}
                                aria-label={isDone ? 'Marcar pendiente' : 'Marcar hecho'}
                              >
                                {isDone && <Check size={13} strokeWidth={3} color="white" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cal-tl-add-row">
                      <button className="cal-add-btn" onClick={() => navigate('createEntry', { date: selDS })} id="cal-tl-add">
                        <Plus size={15} /> Nueva entrada
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

              {selEntries.length > 0 && (
                <div className="cal-event-list">
                  {[...selEntries].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')).map((e, i) => {
                    const color  = e.color || DEFAULT_COLOR;
                    const amount = formatAmount(e.amount);
                    return (
                      <div key={e.id||i} className={`cal-event-row${e.completed ? ' cal-done-row' : ''}`}
                        onClick={() => navigate('entryDetail', { entryId: e.id })} id={`cal-entry-${e.id||i}`}>
                        <span style={{
                          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: e.sticker ? `${color}22` : color,
                        }}>
                          {e.sticker
                            ? <Sticker id={e.sticker} size={20} />
                            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                        </span>
                        <div className="cal-event-body">
                          <div className="cal-event-title" style={e.completed ? { textDecoration: 'line-through', opacity: 0.55 } : {}}>{e.title}</div>
                          <div className="cal-event-meta">
                            {e.time ? formatTime12h(e.time, '') : 'Todo el día'}
                            {amount && <span style={{ color, fontWeight: 700, marginLeft: 6 }}>· {amount}</span>}
                          </div>
                        </div>
                        <button
                          className={`cal-tl-ring${e.completed ? ' is-done' : ''}`}
                          onClick={(ev) => { ev.stopPropagation(); toggleTask(e.id); }}
                          aria-label={e.completed ? 'Marcar pendiente' : 'Marcar hecho'}
                        >
                          {e.completed && <Check size={12} strokeWidth={3} color="white" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="cal-tl-add-row">
                <button className="cal-add-btn" onClick={() => navigate('createEntry', { date: selDS })} id="cal-add-entry">
                  <Plus size={15} /> Nueva entrada
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
