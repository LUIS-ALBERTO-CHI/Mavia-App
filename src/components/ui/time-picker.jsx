import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────
const HOURS_12 = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
const MINUTES  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseValue(v) {
  if (!v) return { hour12: '09', minute: '00', period: 'AM' };
  const upper = v.toUpperCase();
  const [hStr, mStr] = v.replace(/[APM\s]/gi, '').split(':');
  let h = parseInt(hStr, 10) || 9;
  const m = (mStr?.slice(0, 2) || '00').padStart(2, '0');
  if (!upper.includes('AM') && !upper.includes('PM')) {
    if (h === 0)     h = 12;
    else if (h > 12) h -= 12;
  }
  const hour12 = String(h).padStart(2, '0');
  const minute = MINUTES.includes(m) ? m : '00';
  return { hour12, minute, period: upper.includes('PM') ? 'PM' : (h >= 12 ? 'PM' : 'AM') };
}

// ─── Spinner column with ▲ ▼ buttons ─────────────────────────────────────────
function SpinnerColumn({ items, value, onChange, label }) {
  const idx = items.indexOf(value);

  const prev = () => onChange(items[(idx - 1 + items.length) % items.length]);
  const next = () => onChange(items[(idx + 1) % items.length]);

  // Long-press support: hold button → repeat
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  const startRepeat = (fn) => {
    fn(); // immediate first step
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(fn, 80);
    }, 350);
  };

  const stopRepeat = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  };

  // Cleanup on unmount
  useEffect(() => () => stopRepeat(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Label */}
      {label && (
        <div style={{
          fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--on-surface-variant)', marginBottom: 2,
        }}>
          {label}
        </div>
      )}

      {/* Up button */}
      <button
        type="button"
        className="tp-arrow-btn"
        onMouseDown={() => startRepeat(prev)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={e => { e.preventDefault(); startRepeat(prev); }}
        onTouchEnd={stopRepeat}
        aria-label="Anterior"
      >
        <ChevronUp size={22} strokeWidth={2.5} />
      </button>

      {/* Value display — shows prev / current / next for context */}
      <div className="tp-spinner-track">
        <div className="tp-ghost">{items[(idx - 1 + items.length) % items.length]}</div>
        <div className="tp-value">{value}</div>
        <div className="tp-ghost">{items[(idx + 1) % items.length]}</div>
      </div>

      {/* Down button */}
      <button
        type="button"
        className="tp-arrow-btn"
        onMouseDown={() => startRepeat(next)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={e => { e.preventDefault(); startRepeat(next); }}
        onTouchEnd={stopRepeat}
        aria-label="Siguiente"
      >
        <ChevronDown size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Portal popover ───────────────────────────────────────────────────────────
function TimePopover({ triggerRef, onClose, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    function place() {
      if (!triggerRef.current) return;
      const r      = triggerRef.current.getBoundingClientRect();
      const popH   = 340;
      const spaceB = window.innerHeight - r.bottom - 12;
      const top    = spaceB >= popH ? r.bottom + 8 : r.top - popH - 8;
      setPos({ top, left: r.left, width: Math.max(r.width, 300) });
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
    <div ref={panelRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}>
      {children}
    </div>,
    document.body
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TP_STYLES = `
  /* Trigger button */
  .tp-trigger {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 12px 16px;
    border-radius: var(--radius-xl);
    border: 1.5px solid var(--outline-variant);
    background: var(--surface-container-lowest);
    font-family: var(--font-body); font-size: var(--text-body-md);
    color: var(--on-surface); cursor: pointer;
    transition: all var(--transition-fast); text-align: left;
  }
  .tp-trigger.placeholder { color: var(--outline); }
  .tp-trigger:hover, .tp-trigger.open {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(112,87,101,0.1);
  }
  .tp-icon { color: var(--primary); flex-shrink: 0; }
  .tp-label { flex: 1; font-family: var(--font-display); font-size: var(--text-body-md); }
  .tp-label.has-value { font-weight: 600; font-size: 1.05rem; }
  .tp-period-badge {
    font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
    background: var(--primary-container); color: var(--primary);
    padding: 2px 8px; border-radius: 6px; flex-shrink: 0;
  }

  /* Panel */
  .tp-panel {
    background: var(--surface-container-lowest);
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(208,195,200,0.22);
    box-shadow: 0 24px 64px rgba(112,87,101,0.22), 0 4px 16px rgba(112,87,101,0.1);
    padding: 20px 16px 16px;
    animation: tpIn 0.18s var(--ease-out) both;
  }
  @keyframes tpIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  .tp-panel-title {
    font-family: var(--font-display); font-size: var(--text-headline-md);
    font-weight: 500; color: var(--on-surface); text-align: center; margin-bottom: 20px;
  }

  /* Spinner row */
  .tp-spinners {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; margin-bottom: 20px;
  }
  .tp-sep {
    font-family: var(--font-display); font-size: 2rem; font-weight: 300;
    color: var(--on-surface-variant); padding: 0 2px; margin-top: 28px;
    flex-shrink: 0;
  }

  /* Arrow buttons */
  .tp-arrow-btn {
    width: 48px; height: 40px; border-radius: var(--radius-lg);
    border: none; cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    background: var(--surface-container-high);
    color: var(--on-surface-variant);
    transition: all var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .tp-arrow-btn:hover {
    background: var(--primary-container);
    color: var(--primary);
    transform: scale(1.06);
  }
  .tp-arrow-btn:active {
    transform: scale(0.94);
    background: var(--primary);
    color: var(--on-primary);
  }

  /* Spinner value track (prev / current / next) */
  .tp-spinner-track {
    display: flex; flex-direction: column; align-items: center;
    background: var(--surface-container);
    border: 2px solid var(--primary-container);
    border-radius: var(--radius-xl);
    padding: 4px 0; width: 64px; overflow: hidden;
    gap: 0;
  }
  .tp-value {
    font-family: var(--font-display); font-size: 2rem; font-weight: 700;
    color: var(--primary); line-height: 1.1; padding: 4px 0;
    width: 100%; text-align: center;
    background: var(--primary-container);
  }
  .tp-ghost {
    font-family: var(--font-display); font-size: 0.95rem; font-weight: 400;
    color: var(--on-surface-variant); opacity: 0.5; line-height: 1;
    padding: 5px 0; width: 100%; text-align: center;
  }

  /* AM/PM toggle */
  .tp-ampm {
    display: flex; gap: 8px; margin-bottom: 16px; padding: 3px;
    background: var(--surface-container); border-radius: var(--radius-full);
  }
  .tp-ampm-btn {
    flex: 1; padding: 9px 0; border-radius: var(--radius-full);
    border: none; cursor: pointer; font-family: var(--font-body);
    font-size: var(--text-label-md); font-weight: 700; letter-spacing: 0.04em;
    transition: all var(--transition-spring);
    background: none; color: var(--on-surface-variant);
  }
  .tp-ampm-btn.active {
    background: var(--primary); color: var(--on-primary);
    box-shadow: 0 4px 14px rgba(112,87,101,0.28);
  }

  /* Confirm */
  .tp-confirm {
    width: 100%; padding: 13px; border-radius: var(--radius-full);
    background: var(--gradient-primary); color: white;
    font-size: var(--text-label-md); font-weight: 700;
    border: none; cursor: pointer;
    transition: all var(--transition-spring); letter-spacing: 0.02em;
  }
  .tp-confirm:hover { opacity: 0.9; transform: translateY(-1px); }
  .tp-confirm:active { transform: scale(0.98); }
`;

// ─── Main TimePicker ──────────────────────────────────────────────────────────
/**
 * TimePicker — 12-hour format with ▲▼ spinner buttons and AM/PM toggle
 * value:    "hh:mm AM" | "hh:mm PM"  (or 24h "HH:MM" — auto-detected)
 * onChange: ("hh:mm AM"|"hh:mm PM") => void
 */
export function TimePicker({ value, onChange, placeholder = 'Seleccionar hora', id }) {
  const parsed  = parseValue(value);
  const [open,   setOpen]   = useState(false);
  const [hour,   setHour]   = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);
  const triggerRef = useRef(null);

  // Sync when external value changes
  useEffect(() => {
    const p = parseValue(value);
    setHour(p.hour12);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const handleConfirm = () => {
    onChange(`${hour}:${minute} ${period}`);
    setOpen(false);
  };

  const displayLabel = value
    ? (value.toUpperCase().includes('AM') || value.toUpperCase().includes('PM'))
      ? value
      : `${parsed.hour12}:${parsed.minute} ${parsed.period}`
    : placeholder;

  return (
    <>
      <style>{TP_STYLES}</style>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={`tp-trigger${!value ? ' placeholder' : ''}${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        id={id}
      >
        <Clock size={17} className="tp-icon" strokeWidth={1.75} />
        <span className={`tp-label${value ? ' has-value' : ''}`}>{displayLabel}</span>
        {value && <span className="tp-period-badge">{parsed.period}</span>}
      </button>

      {/* Panel */}
      {open && (
        <TimePopover triggerRef={triggerRef} onClose={() => setOpen(false)}>
          <div className="tp-panel">
            <div className="tp-panel-title">Seleccionar hora</div>

            {/* Spinners */}
            <div className="tp-spinners">
              <SpinnerColumn items={HOURS_12} value={hour}   onChange={setHour}   label="Hora" />
              <span className="tp-sep">:</span>
              <SpinnerColumn items={MINUTES}  value={minute} onChange={setMinute} label="Min" />
            </div>

            {/* AM / PM */}
            <div className="tp-ampm">
              <button type="button" className={`tp-ampm-btn${period === 'AM' ? ' active' : ''}`} onClick={() => setPeriod('AM')} id="tp-am">AM</button>
              <button type="button" className={`tp-ampm-btn${period === 'PM' ? ' active' : ''}`} onClick={() => setPeriod('PM')} id="tp-pm">PM</button>
            </div>

            {/* Confirm */}
            <button className="tp-confirm" type="button" onClick={handleConfirm} id="tp-confirm">
              Confirmar — {hour}:{minute} {period}
            </button>
          </div>
        </TimePopover>
      )}
    </>
  );
}
