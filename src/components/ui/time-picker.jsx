import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

// 12-hour wheel: 12, 01, 02, … 11
const HOURS_12 = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
const MINUTES  = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const CELL_H   = 46;

/** Parse a stored value ("09:00 AM" or "09:00") into { hour12, minute, period } */
function parseValue(v) {
  if (!v) return { hour12: '09', minute: '00', period: 'AM' };
  const upper = v.toUpperCase();
  const period = upper.includes('PM') ? 'PM' : 'AM';
  const [hStr, mStr] = v.replace(/[APM\s]/gi, '').split(':');
  let h = parseInt(hStr, 10) || 9;
  const m = mStr?.slice(0, 2) || '00';
  // If value is in 24h format (no AM/PM in original), convert
  if (!upper.includes('AM') && !upper.includes('PM')) {
    if (h === 0)       { h = 12; }
    else if (h > 12)   { h -= 12; }
  }
  const hour12 = String(h).padStart(2, '0');
  const minute  = MINUTES.includes(m) ? m : '00';
  return { hour12, minute, period: upper.includes('PM') ? 'PM' : (h >= 12 ? 'PM' : 'AM') };
}

/* ── Scroll wheel column ── */
function ScrollColumn({ items, value, onChange, label }) {
  const listRef = useRef(null);
  const idx     = items.indexOf(value);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, idx * CELL_H);
  }, []); // eslint-disable-line

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const i       = Math.round(el.scrollTop / CELL_H);
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    if (items[clamped] !== value) onChange(items[clamped]);
  }, [items, value, onChange]);

  const scrollTo = (item) => {
    const i = items.indexOf(item);
    onChange(item);
    if (listRef.current) listRef.current.scrollTo({ top: i * CELL_H, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      {label && (
        <div style={{
          fontSize: '10px', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--on-surface-variant)', marginBottom: 8,
        }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
        {/* Selection highlight */}
        <div style={{
          position: 'absolute', top: '50%', left: 4, right: 4,
          height: CELL_H, transform: 'translateY(-50%)',
          background: 'var(--primary-container)',
          borderRadius: 'var(--radius-lg)',
          pointerEvents: 'none', zIndex: 1,
        }} />
        {/* Fade top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: CELL_H * 0.8,
          background: 'linear-gradient(to bottom, var(--surface-container-lowest) 0%, transparent 100%)',
          zIndex: 2, pointerEvents: 'none',
        }} />
        {/* Fade bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: CELL_H * 0.8,
          background: 'linear-gradient(to top, var(--surface-container-lowest) 0%, transparent 100%)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{
            height: CELL_H * 3,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div style={{ height: CELL_H }} />
          {items.map(item => {
            const isSel = item === value;
            return (
              <div
                key={item}
                onClick={() => scrollTo(item)}
                style={{
                  height: CELL_H,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  scrollSnapAlign: 'start',
                  fontFamily: 'var(--font-display)',
                  fontSize: isSel ? '1.6rem' : '1rem',
                  fontWeight: isSel ? 600 : 400,
                  color: isSel ? 'var(--primary)' : 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  transition: 'font-size 0.15s ease, color 0.15s ease',
                  position: 'relative', zIndex: 3,
                  userSelect: 'none',
                }}
              >
                {item}
              </div>
            );
          })}
          <div style={{ height: CELL_H }} />
        </div>
      </div>
    </div>
  );
}

/* ── Portal popover ── */
function TimePopover({ triggerRef, onClose, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280 });

  useEffect(() => {
    function place() {
      if (!triggerRef.current) return;
      const r      = triggerRef.current.getBoundingClientRect();
      const popH   = 320;
      const spaceB = window.innerHeight - r.bottom - 12;
      const top    = spaceB >= popH ? r.bottom + 8 : r.top - popH - 8;
      setPos({ top, left: r.left, width: Math.max(r.width, 280) });
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
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}
    >
      {children}
    </div>,
    document.body
  );
}

const TP_STYLES = `
  .tp-trigger {
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
  .tp-trigger.placeholder { color: var(--outline); }
  .tp-trigger:hover, .tp-trigger.open {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(112,87,101,0.1);
  }
  .tp-icon { color: var(--primary); flex-shrink: 0; }
  .tp-label {
    flex: 1;
    font-family: var(--font-display);
    font-size: var(--text-body-md);
  }
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
    padding: 20px;
    animation: tpIn 0.18s var(--ease-out) both;
  }
  @keyframes tpIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  .tp-panel-title {
    font-family: var(--font-display);
    font-size: var(--text-headline-md);
    font-weight: 500;
    color: var(--on-surface);
    text-align: center;
    margin-bottom: 16px;
  }
  .tp-wheels {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 16px;
  }
  .tp-sep {
    font-family: var(--font-display);
    font-size: 2rem; font-weight: 300;
    color: var(--on-surface-variant);
    padding: 0 4px; margin-top: -6px; flex-shrink: 0;
  }

  /* AM / PM toggle */
  .tp-ampm {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 3px;
    background: var(--surface-container);
    border-radius: var(--radius-full);
  }
  .tp-ampm-btn {
    flex: 1;
    padding: 8px 0;
    border-radius: var(--radius-full);
    border: none; cursor: pointer;
    font-family: var(--font-body);
    font-size: var(--text-label-md);
    font-weight: 700;
    letter-spacing: 0.04em;
    transition: all var(--transition-spring);
    background: none;
    color: var(--on-surface-variant);
  }
  .tp-ampm-btn.active {
    background: var(--primary);
    color: var(--on-primary);
    box-shadow: 0 4px 14px rgba(112,87,101,0.28);
  }

  .tp-confirm {
    width: 100%;
    padding: 12px;
    border-radius: var(--radius-full);
    background: var(--gradient-primary);
    color: white;
    font-size: var(--text-label-md);
    font-weight: 700;
    border: none; cursor: pointer;
    transition: all var(--transition-spring);
    letter-spacing: 0.02em;
  }
  .tp-confirm:hover { opacity: 0.9; transform: translateY(-1px); }
  .tp-confirm:active { transform: scale(0.98); }
`;

/**
 * TimePicker — 12-hour format with AM/PM toggle
 * value: "hh:mm AM" | "hh:mm PM"  (or 24h "HH:MM" — auto-detected)
 * onChange: ("hh:mm AM"|"hh:mm PM") => void
 */
export function TimePicker({ value, onChange, placeholder = 'Seleccionar hora', id }) {
  const parsed  = parseValue(value);
  const [open,   setOpen]   = useState(false);
  const [hour,   setHour]   = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);
  const triggerRef = useRef(null);

  // Sync from external value changes
  useEffect(() => {
    const p = parseValue(value);
    setHour(p.hour12);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const handleConfirm = () => {
    const m = MINUTES.includes(minute) ? minute : '00';
    onChange(`${hour}:${m} ${period}`);
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

      {open && (
        <TimePopover triggerRef={triggerRef} onClose={() => setOpen(false)}>
          <div className="tp-panel">
            <div className="tp-panel-title">Seleccionar hora</div>

            {/* Wheels */}
            <div className="tp-wheels">
              <ScrollColumn items={HOURS_12} value={hour}   onChange={setHour}   label="Hora" />
              <span className="tp-sep">:</span>
              <ScrollColumn items={MINUTES}  value={minute} onChange={setMinute} label="Min" />
            </div>

            {/* AM / PM toggle */}
            <div className="tp-ampm">
              <button
                type="button"
                className={`tp-ampm-btn${period === 'AM' ? ' active' : ''}`}
                onClick={() => setPeriod('AM')}
                id="tp-am"
              >
                AM
              </button>
              <button
                type="button"
                className={`tp-ampm-btn${period === 'PM' ? ' active' : ''}`}
                onClick={() => setPeriod('PM')}
                id="tp-pm"
              >
                PM
              </button>
            </div>

            {/* Confirm */}
            <button className="tp-confirm" type="button" onClick={handleConfirm}>
              Confirmar — {hour}:{MINUTES.includes(minute) ? minute : '00'} {period}
            </button>
          </div>
        </TimePopover>
      )}
    </>
  );
}
