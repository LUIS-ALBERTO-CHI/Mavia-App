import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS_ES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_ABR  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAYS_ES     = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYMD(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns calendar cells (Sun-start) for a given year/month.
 * Weeks are Sun→Sat.
 */
function buildCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const cells = [];
  // Leading days from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), current: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  // Trailing days to complete grid
  let n = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, n++), current: false });
  }
  return cells;
}

/** Format "Lun, 29 de jun de 2026" */
function formatDisplay(ymd) {
  if (!ymd) return null;
  const d = new Date(ymd + 'T00:00:00');
  const wd = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
  const day = d.getDate();
  const mon = MONTHS_ABR[d.getMonth()];
  const yr  = d.getFullYear();
  return `${wd}, ${day} de ${mon} de ${yr}`;
}

/** "Hoy" / "Mañana" / null */
function shortLabel(ymd) {
  if (!ymd) return null;
  const todayYmd    = toYMD(new Date());
  const tomorrowYmd = toYMD(new Date(Date.now() + 86400000));
  if (ymd === todayYmd)    return 'Hoy';
  if (ymd === tomorrowYmd) return 'Mañana';
  return null;
}

// ─── Popover ─────────────────────────────────────────────────────────────────
function CalendarPopover({ triggerRef, onClose, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });

  useEffect(() => {
    function place() {
      if (!triggerRef.current) return;
      const r     = triggerRef.current.getBoundingClientRect();
      const popW  = Math.max(r.width, 320);
      const popH  = 400;
      const spaceB = window.innerHeight - r.bottom - 12;
      const top    = spaceB >= popH ? r.bottom + 8 : r.top - popH - 8;
      // Keep within viewport horizontally
      const left   = Math.min(r.left, window.innerWidth - popW - 12);
      setPos({ top, left: Math.max(8, left), width: popW });
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target))   return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  return createPortal(
    <div ref={panelRef} style={{
      position: 'fixed', top: pos.top, left: pos.left,
      width: pos.width, zIndex: 99999,
    }}>
      {children}
    </div>,
    document.body
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const DP_STYLES = `
  /* ── Trigger (row style — matches reference) ── */
  .dp-trigger {
    display: flex; align-items: center; gap: 12px;
    width: 100%; padding: 13px 16px;
    border-radius: var(--radius-xl);
    border: 1.5px solid var(--outline-variant);
    background: var(--surface-container-lowest);
    font-family: var(--font-body); font-size: var(--text-body-md);
    color: var(--on-surface); cursor: pointer;
    transition: all var(--transition-fast); text-align: left;
  }
  .dp-trigger.placeholder { color: var(--outline); }
  .dp-trigger:hover, .dp-trigger.open {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(112,87,101,0.1);
  }
  .dp-trigger-icon { color: var(--primary); flex-shrink: 0; }
  .dp-trigger-date {
    flex: 1;
    font-family: var(--font-display);
    font-size: var(--text-body-md);
    font-weight: 500;
    color: var(--on-surface);
  }
  .dp-trigger-date.placeholder { color: var(--outline); font-weight: 400; }
  .dp-trigger-today {
    font-size: var(--text-label-md);
    font-weight: 700;
    color: var(--primary);
    display: flex; align-items: center; gap: 2px;
    flex-shrink: 0;
  }

  /* ── Calendar panel ── */
  .dp-popover {
    background: var(--surface-container-lowest);
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(208,195,200,0.22);
    box-shadow: 0 24px 64px rgba(112,87,101,0.22), 0 4px 16px rgba(112,87,101,0.1);
    padding: 16px;
    animation: dpIn 0.18s var(--ease-out) both;
  }
  @keyframes dpIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }

  /* ── Month/year header ── */
  .dp-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .dp-month-label {
    font-family: var(--font-display);
    font-size: 16px; font-weight: 700;
    color: var(--on-surface);
  }
  .dp-month-label span { color: var(--primary); margin-left: 4px; }
  .dp-nav-btn {
    width: 32px; height: 32px; border-radius: 50%;
    border: none; background: var(--surface-container);
    color: var(--on-surface-variant);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-fast); flex-shrink: 0;
  }
  .dp-nav-btn:hover { background: var(--primary-container); color: var(--primary); }

  /* ── Day-of-week header ── */
  .dp-dow-row {
    display: grid; grid-template-columns: repeat(7, 1fr);
    margin-bottom: 4px;
  }
  .dp-dow {
    text-align: center;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--on-surface-variant);
    padding: 4px 0;
  }
  .dp-dow:first-child { color: var(--error, #B3261E); }

  /* ── Day grid ── */
  .dp-grid {
    display: grid; grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .dp-cell {
    aspect-ratio: 1;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--on-surface);
    border: none; background: none;
  }
  .dp-cell:not(.other):not(.disabled):not(.selected):hover {
    background: var(--primary-container);
    color: var(--primary);
  }
  .dp-cell.other    { color: var(--outline); cursor: default; pointer-events: none; opacity: 0.4; }
  .dp-cell.today    { font-weight: 800; color: var(--primary); }
  .dp-cell.today::after {
    /* Small dot under today if not selected */
  }
  .dp-cell.sunday   { color: var(--error, #B3261E); }
  .dp-cell.selected {
    background: var(--primary) !important;
    color: var(--on-primary) !important;
    box-shadow: 0 4px 14px rgba(112,87,101,0.35);
    font-weight: 700;
  }
  .dp-cell.today.selected {
    background: var(--primary) !important;
    color: var(--on-primary) !important;
  }
  .dp-cell.disabled { opacity: 0.25; cursor: not-allowed; pointer-events: none; }

  /* ── Quick shortcuts ── */
  .dp-shortcuts {
    display: flex; gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(208,195,200,0.18);
  }
  .dp-shortcut {
    flex: 1; padding: 8px 0;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--outline-variant);
    background: var(--surface-container);
    font-size: 12px; font-weight: 600;
    color: var(--on-surface-variant);
    cursor: pointer; text-align: center;
    transition: all var(--transition-fast);
    font-family: var(--font-body);
  }
  .dp-shortcut:hover { background: var(--primary-container); color: var(--primary); border-color: var(--primary); }
  .dp-shortcut.active { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
`;

// ─── Main export ─────────────────────────────────────────────────────────────
/**
 * DatePicker — iOS-inspired row trigger + calendar popover.
 * value:    "YYYY-MM-DD"
 * onChange: (YYYY-MM-DD) => void
 * min?:     "YYYY-MM-DD"
 * id?:      string
 */
export function DatePicker({ value, onChange, min, placeholder = 'Seleccionar fecha', id }) {
  const todayYmd = toYMD(new Date());
  const initial  = value ? new Date(value + 'T00:00:00') : new Date();

  const [open,  setOpen]  = useState(false);
  const [viewY, setViewY] = useState(initial.getFullYear());
  const [viewM, setViewM] = useState(initial.getMonth());
  const triggerRef = useRef(null);

  // Keep calendar view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewY(d.getFullYear());
      setViewM(d.getMonth());
    }
  }, [value]);

  const cells   = buildCalendarDays(viewY, viewM);
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

  // Shortcuts
  const shortcuts = [
    { label: 'Hoy',    ymd: todayYmd },
    { label: 'Mañana', ymd: toYMD(new Date(Date.now() + 86400000)) },
    { label: 'Pasado', ymd: toYMD(new Date(Date.now() + 2 * 86400000)) },
  ];

  const displayDate  = value ? formatDisplay(value) : null;
  const quick        = value ? shortLabel(value)  : null;

  return (
    <>
      <style>{DP_STYLES}</style>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={`dp-trigger${!value ? ' placeholder' : ''}${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        id={id}
      >
        <Calendar size={17} className="dp-trigger-icon" strokeWidth={1.75} />
        <span className={`dp-trigger-date${!value ? ' placeholder' : ''}`}>
          {displayDate || placeholder}
        </span>
        {value && (
          <span className="dp-trigger-today">
            {quick || ''}
            <ChevronRight size={15} strokeWidth={2.5} />
          </span>
        )}
        {!value && (
          <ChevronRight size={15} style={{ color: 'var(--outline)', flexShrink: 0 }} strokeWidth={2} />
        )}
      </button>

      {/* Popover */}
      {open && (
        <CalendarPopover triggerRef={triggerRef} onClose={() => setOpen(false)}>
          <div className="dp-popover">

            {/* Month/year header */}
            <div className="dp-header">
              <button className="dp-nav-btn" onClick={prevMonth} type="button" aria-label="Mes anterior">
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <span className="dp-month-label">
                {MONTHS_ES[viewM]} <span>{viewY}</span>
              </span>
              <button className="dp-nav-btn" onClick={nextMonth} type="button" aria-label="Mes siguiente">
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Day of week headers */}
            <div className="dp-dow-row">
              {DAYS_ES.map(d => <div key={d} className="dp-dow">{d}</div>)}
            </div>

            {/* Day cells */}
            <div className="dp-grid">
              {cells.map((cell, i) => {
                const ymd      = toYMD(cell.date);
                const isToday  = ymd === todayYmd;
                const isSel    = ymd === selected;
                const isOther  = !cell.current;
                const disabled = !!min && ymd < min;
                const isSunday = cell.date.getDay() === 0;
                const cls = [
                  'dp-cell',
                  isOther  ? 'other'    : '',
                  isToday  ? 'today'    : '',
                  isSel    ? 'selected' : '',
                  disabled ? 'disabled' : '',
                  isSunday && !isOther && !isSel ? 'sunday' : '',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    onClick={() => handleSelect(cell)}
                    tabIndex={isOther || disabled ? -1 : 0}
                    aria-label={ymd}
                    aria-pressed={isSel}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Quick shortcuts */}
            <div className="dp-shortcuts">
              {shortcuts.map(s => {
                const isActive = selected === s.ymd;
                const isDisabled = min && s.ymd < min;
                return (
                  <button
                    key={s.label}
                    type="button"
                    className={`dp-shortcut${isActive ? ' active' : ''}`}
                    onClick={() => { if (!isDisabled) { onChange(s.ymd); setOpen(false); } }}
                    disabled={isDisabled}
                  >
                    {s.label}
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
