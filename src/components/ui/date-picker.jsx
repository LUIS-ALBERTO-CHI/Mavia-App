import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

function toYMD(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = offset - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevDays - i), current: false });
  for (let d = 1; d <= daysInMonth; d++)  cells.push({ date: new Date(year, month, d), current: true });
  let n = 1;
  while (cells.length % 7 !== 0) cells.push({ date: new Date(year, month + 1, n++), current: false });
  return cells;
}

/* ── Popover positioned via portal ── */
function CalendarPopover({ triggerRef, onClose, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    function place() {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const popW = Math.max(r.width, 300);
      const spaceBelow = window.innerHeight - r.bottom - 12;
      const top = spaceBelow >= 320 ? r.bottom + 8 : r.top - 340;
      setPos({ top, left: r.left, width: popW });
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [triggerRef]);

  // Outside click — ignore clicks inside the trigger OR the panel
  useEffect(() => {
    const handler = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (panelRef.current  && panelRef.current.contains(e.target))  return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        minWidth: 300,
        zIndex: 99999,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

const DP_STYLES = `
  /* ===== DATE PICKER ===== */
  .dp-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--radius-xl);
    border: 1.5px solid var(--outline-variant);
    background: var(--surface-container-lowest);
    font-family: var(--font-body);
    font-size: var(--text-body-md);
    color: var(--on-surface);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }
  .dp-trigger.placeholder { color: var(--outline); }
  .dp-trigger:hover, .dp-trigger.open {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(112,87,101,0.1);
  }
  .dp-trigger-icon { color: var(--primary); flex-shrink: 0; }
  .dp-trigger-text { flex: 1; }
  .dp-trigger-chevron {
    color: var(--outline);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }
  .dp-trigger.open .dp-trigger-chevron { transform: rotate(90deg); }

  /* Popover panel */
  .dp-popover {
    background: var(--surface-container-lowest);
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(208,195,200,0.22);
    box-shadow: 0 24px 64px rgba(112,87,101,0.22), 0 4px 16px rgba(112,87,101,0.1);
    padding: var(--space-lg);
    animation: dpPopIn 0.18s var(--ease-out) both;
  }
  @keyframes dpPopIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }

  /* Header */
  .dp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-lg);
  }
  .dp-nav-btn {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: none;
    background: var(--surface-container);
    color: var(--on-surface-variant);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }
  .dp-nav-btn:hover { background: var(--primary-container); color: var(--primary); }
  .dp-month-label {
    font-family: var(--font-display);
    font-size: var(--text-headline-md);
    font-weight: 500;
    color: var(--on-surface);
  }

  /* Day grid */
  .dp-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .dp-day-label {
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--on-surface-variant);
    padding: 4px 0 8px;
  }
  .dp-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: var(--text-label-md);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--on-surface);
    border: none;
    background: none;
  }
  .dp-cell:not(.other):not(.disabled):hover { background: var(--primary-container); color: var(--primary); }
  .dp-cell.other    { color: var(--outline); cursor: default; pointer-events: none; }
  .dp-cell.today    { font-weight: 800; color: var(--primary); }
  .dp-cell.selected {
    background: var(--primary) !important;
    color: var(--on-primary) !important;
    box-shadow: 0 4px 14px rgba(112,87,101,0.35);
  }
  .dp-cell.disabled { opacity: 0.28; cursor: not-allowed; pointer-events: none; }
`;

/**
 * DatePicker
 * - value: "YYYY-MM-DD"
 * - onChange: (YYYY-MM-DD) => void
 * - min?: "YYYY-MM-DD"
 * - placeholder?: string
 * - id?: string
 */
export function DatePicker({ value, onChange, min, placeholder = 'Seleccionar fecha', id }) {
  const today   = toYMD(new Date());
  const initial = value ? new Date(value + 'T00:00:00') : new Date();
  const [open,  setOpen]  = useState(false);
  const [viewY, setViewY] = useState(initial.getFullYear());
  const [viewM, setViewM] = useState(initial.getMonth());
  const triggerRef = useRef(null);

  const cells    = buildCalendarDays(viewY, viewM);
  const selected = value || null;

  const prevMonth = useCallback(() => {
    if (viewM === 0) { setViewM(11); setViewY(y => y - 1); } else setViewM(m => m - 1);
  }, [viewM]);
  const nextMonth = useCallback(() => {
    if (viewM === 11) { setViewM(0); setViewY(y => y + 1); } else setViewM(m => m + 1);
  }, [viewM]);

  const handleSelect = (cell) => {
    if (!cell.current) return;
    const ymd = toYMD(cell.date);
    if (min && ymd < min) return;
    onChange(ymd);
    setOpen(false);
  };

  const displayLabel = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase())
    : placeholder;

  return (
    <>
      <style>{DP_STYLES}</style>

      <button
        ref={triggerRef}
        type="button"
        className={`dp-trigger${!value ? ' placeholder' : ''}${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        id={id}
      >
        <Calendar size={17} className="dp-trigger-icon" strokeWidth={1.75} />
        <span className="dp-trigger-text">{displayLabel}</span>
        <ChevronRight size={16} className="dp-trigger-chevron" />
      </button>

      {open && (
        <CalendarPopover triggerRef={triggerRef} onClose={() => setOpen(false)}>
          <div className="dp-popover">
            {/* Month/Year header */}
            <div className="dp-header">
              <button className="dp-nav-btn" onClick={prevMonth} type="button">
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <span className="dp-month-label">{MONTHS[viewM]} {viewY}</span>
              <button className="dp-nav-btn" onClick={nextMonth} type="button">
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Grid */}
            <div className="dp-grid">
              {DAYS.map(d => <div key={d} className="dp-day-label">{d}</div>)}
              {cells.map((cell, i) => {
                const ymd      = toYMD(cell.date);
                const isToday  = ymd === today;
                const isSel    = ymd === selected;
                const isOther  = !cell.current;
                const disabled = !!min && ymd < min;
                return (
                  <button
                    key={i}
                    type="button"
                    className={['dp-cell', isOther ? 'other' : '', isToday ? 'today' : '', isSel ? 'selected' : '', disabled ? 'disabled' : ''].filter(Boolean).join(' ')}
                    onClick={() => handleSelect(cell)}
                    tabIndex={isOther || disabled ? -1 : 0}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </CalendarPopover>
      )}
    </>
  );
}
