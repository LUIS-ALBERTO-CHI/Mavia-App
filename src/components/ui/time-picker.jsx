import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEM_H    = 44;   // px per row in the drum
const VISIBLE   = 5;    // rows visible at once (selected = middle)
const DRUM_H    = ITEM_H * VISIBLE;
const PAD       = ITEM_H * Math.floor(VISIBLE / 2); // top/bottom padding so first/last can center

// Build all 5-minute slots: ["12:00 AM", "12:05 AM", ...]
function buildSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const ap  = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      slots.push(`${h12}:${String(m).padStart(2, '0')} ${ap}`);
    }
  }
  return slots;
}
const SLOTS = buildSlots();

// Duration drums
const HOURS_DRUM   = Array.from({ length: 13 }, (_, i) => i); // 0-12
const MINUTES_DRUM = Array.from({ length: 60 }, (_, i) => i); // 0-59

const PRESETS = [
  { label: '1 min',    h: 0, m: 1  },
  { label: '15 min',   h: 0, m: 15 },
  { label: '30 min',   h: 0, m: 30 },
  { label: '45 min',   h: 0, m: 45 },
  { label: '1 h',      h: 1, m: 0  },
  { label: '1 h 30 min', h: 1, m: 30 },
];

// Smaller drum constants for the duration modal
const D_ITEM_H = 40;
const D_VISIBLE = 5;
const D_DRUM_H  = D_ITEM_H * D_VISIBLE;
const D_PAD     = D_ITEM_H * Math.floor(D_VISIBLE / 2);

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Converts a stored "HH:MM" (24h) or "h:mm AM/PM" string to the nearest slot string.
 */
function valueToSlot(v) {
  if (!v || typeof v !== 'string') {
    // Default to current rounded time
    const now = new Date();
    const h   = now.getHours();
    const m   = Math.round(now.getMinutes() / 5) * 5 % 60;
    const ap  = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  }
  const upper = v.toUpperCase();
  const cleaned = v.replace(/[APM\s]/gi, '');
  const [hStr, mStr] = cleaned.split(':');
  let h = parseInt(hStr, 10) || 0;
  const mRaw = parseInt(mStr || '0', 10);
  const mSnapped = Math.min(55, Math.round(mRaw / 5) * 5);
  // Detect if it was already in 12h format
  if (!upper.includes('AM') && !upper.includes('PM')) {
    // 24h input — keep as is
  } else {
    // 12h — convert back
    if (upper.includes('PM') && h !== 12) h += 12;
    if (upper.includes('AM') && h === 12) h = 0;
  }
  const ap  = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(mSnapped).padStart(2, '0')} ${ap}`;
}

/**
 * Converts "h:mm AM/PM" display string to "HH:MM" 24h for storage.
 */
function slotTo24h(slot) {
  const parts = slot.split(' ');
  const period = parts[1];
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mStr}`;
}

// ─── Drum Scroller ────────────────────────────────────────────────────────────
function DrumScroller({ slots, value, onChange }) {
  const containerRef = useRef(null);
  const isScrolling  = useRef(false);

  const idx = slots.indexOf(value);

  // Scroll to correct position on open / value change (no animation on first mount)
  const scrollTo = useCallback((index, animate = true) => {
    const el = containerRef.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (animate) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      el.scrollTop = target;
    }
  }, []);

  useEffect(() => {
    scrollTo(Math.max(0, idx), false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollTo(Math.max(0, idx), true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // On scroll end — snap to nearest item
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    clearTimeout(isScrolling.current);
    isScrolling.current = setTimeout(() => {
      const raw     = el.scrollTop;
      const nearest = Math.round(raw / ITEM_H);
      const clamped = Math.max(0, Math.min(slots.length - 1, nearest));
      // snap back
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      onChange(slots[clamped]);
    }, 80);
  }, [slots, onChange]);

  const handleClick = useCallback((index) => {
    scrollTo(index, true);
    onChange(slots[index]);
  }, [slots, onChange, scrollTo]);

  return (
    <div style={{ position: 'relative', height: DRUM_H, overflow: 'hidden' }}>
      {/* Selection highlight pill — BEHIND the text (z-index 0) */}
      <div style={{
        position: 'absolute',
        left: 12, right: 12,
        top: PAD,
        height: ITEM_H,
        background: 'var(--primary)',
        borderRadius: 14,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Scrollable list — ABOVE the pill (z-index 1) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          paddingTop:    PAD,
          paddingBottom: PAD,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {slots.map((slot, i) => {
          const dist    = Math.abs(i - idx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : 0.25;
          const weight  = dist === 0 ? 700 : 400;
          const color   = dist === 0 ? 'var(--on-primary)' : 'var(--on-surface)';
          const size    = dist === 0 ? 17 : dist === 1 ? 15 : 13;
          return (
            <div
              key={slot}
              onClick={() => handleClick(i)}
              style={{
                height: ITEM_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size,
                fontWeight: weight,
                fontFamily: 'var(--font-display)',
                color,
                opacity,
                cursor: 'pointer',
                userSelect: 'none',
                position: 'relative',
                zIndex: dist === 0 ? 3 : 0,
                transition: 'opacity 0.15s, font-size 0.15s',
              }}
            >
              {slot}
            </div>
          );
        })}
      </div>

      {/* Fade gradient — ON TOP (z-index 2), transparent in center, pointer-events:none */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: `linear-gradient(to bottom,
          var(--surface-container-lowest) 0%,
          transparent ${100 * (PAD / DRUM_H)}%,
          transparent ${100 * ((PAD + ITEM_H) / DRUM_H)}%,
          var(--surface-container-lowest) 100%)`,
      }} />
    </div>
  );
}

// ─── Mini Drum for Duration ───────────────────────────────────────────────────
function MiniDrum({ items, value, onChange, label }) {
  const containerRef = useRef(null);
  const isScrolling  = useRef(false);
  const idx = items.indexOf(value);

  const scrollTo = useCallback((index, animate = true) => {
    const el = containerRef.current;
    if (!el) return;
    const target = index * D_ITEM_H;
    animate ? el.scrollTo({ top: target, behavior: 'smooth' }) : (el.scrollTop = target);
  }, []);

  useEffect(() => { scrollTo(Math.max(0, idx), false); }, []); // eslint-disable-line
  useEffect(() => { scrollTo(Math.max(0, idx), true);  }, [value]); // eslint-disable-line

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    clearTimeout(isScrolling.current);
    isScrolling.current = setTimeout(() => {
      const nearest = Math.round(el.scrollTop / D_ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, nearest));
      el.scrollTo({ top: clamped * D_ITEM_H, behavior: 'smooth' });
      onChange(items[clamped]);
    }, 80);
  }, [items, onChange]);

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {/* Selected highlight */}
      <div style={{
        position: 'absolute', left: 8, right: 8,
        top: D_PAD, height: D_ITEM_H,
        background: 'var(--surface-container-high)',
        borderRadius: 10, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Scroll list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: D_DRUM_H, overflowY: 'scroll', scrollbarWidth: 'none',
          paddingTop: D_PAD, paddingBottom: D_PAD,
          position: 'relative', zIndex: 1,
        }}
      >
        {items.map((item, i) => {
          const dist    = Math.abs(i - idx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2;
          const weight  = dist === 0 ? 700 : 400;
          const size    = dist === 0 ? 16 : 14;
          return (
            <div
              key={item}
              onClick={() => { onChange(item); scrollTo(i, true); }}
              style={{
                height: D_ITEM_H, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6,
                fontSize: size, fontWeight: weight,
                fontFamily: 'var(--font-display)',
                color: 'var(--on-surface)',
                opacity, cursor: 'pointer', userSelect: 'none',
                position: 'relative', zIndex: 1,
              }}
            >
              {item}
              {dist === 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: 'var(--on-surface-variant)',
                }}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Fade edges */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: `linear-gradient(to bottom,
          var(--surface-container-lowest) 0%,
          transparent ${100 * (D_PAD / D_DRUM_H)}%,
          transparent ${100 * ((D_PAD + D_ITEM_H) / D_DRUM_H)}%,
          var(--surface-container-lowest) 100%)`,
      }} />
    </div>
  );
}

// ─── Duration Modal ───────────────────────────────────────────────────────────
function DurationModal({ onClose }) {
  const [hours,   setHours]   = useState(0);
  const [minutes, setMinutes] = useState(1);

  const applyPreset = (preset) => {
    setHours(preset.h);
    setMinutes(preset.m);
  };

  const reset = () => { setHours(0); setMinutes(1); };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface-container-lowest)',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 24px',
        animation: 'durIn 0.25s var(--ease-out) both',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 99,
          background: 'var(--outline-variant)',
          margin: '12px auto 16px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 16px',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18,
            fontWeight: 700, color: 'var(--on-surface)',
          }}>Duración</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: 'none', background: 'var(--surface-container-high)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'var(--on-surface-variant)',
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Two-column drums */}
        <div style={{
          display: 'flex',
          margin: '0 16px',
          background: 'var(--surface-container-lowest)',
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(208,195,200,0.15)',
        }}>
          <MiniDrum items={HOURS_DRUM}   value={hours}   onChange={setHours}   label="horas" />
          <div style={{
            width: 1, background: 'rgba(208,195,200,0.25)', margin: '20px 0',
          }} />
          <MiniDrum items={MINUTES_DRUM} value={minutes} onChange={setMinutes} label="min" />
        </div>

        {/* Presets */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 15,
              fontWeight: 700, color: 'var(--on-surface)',
            }}>Preajustes</span>
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                color: 'var(--on-surface-variant)',
              }}
            >
              ↺ Restablecer
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map(p => {
              const isActive = hours === p.h && minutes === p.m;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px',
                    borderRadius: 99,
                    border: `1.5px solid ${isActive ? 'var(--primary)' : 'rgba(208,195,200,0.5)'}`,
                    background: isActive ? 'var(--primary-container)' : 'var(--surface-container)',
                    color: isActive ? 'var(--primary)' : 'var(--on-surface)',
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {p.label}
                  <span
                    onClick={e => { e.stopPropagation(); }}
                    style={{
                      fontSize: 10, fontWeight: 700,
                      color: isActive ? 'var(--primary)' : 'var(--outline)',
                    }}
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm */}
        <div style={{ padding: '20px 20px 0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 99,
              background: 'var(--gradient-primary)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 700,
              fontFamily: 'var(--font-body)',
            }}
          >
            Continuar — {hours > 0 ? `${hours}h ` : ''}{minutes > 0 ? `${minutes} min` : hours === 0 ? '0 min' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function TimePopover({ triggerRef, onClose, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    function place() {
      if (!triggerRef.current) return;
      const r    = triggerRef.current.getBoundingClientRect();
      const popH = 360;
      const spaceB = window.innerHeight - r.bottom - 12;
      const top    = spaceB >= popH ? r.bottom + 8 : r.top - popH - 8;
      setPos({ top, left: r.left, width: Math.max(r.width, 280) });
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
const TP_STYLES = `
  /* ── TimePicker trigger ── */
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
  .tp-icon   { color: var(--primary); flex-shrink: 0; }
  .tp-label  { flex: 1; font-family: var(--font-display); font-size: var(--text-body-md); }
  .tp-label.has-value { font-weight: 600; }
  .tp-period-badge {
    font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
    background: var(--primary-container); color: var(--primary);
    padding: 2px 8px; border-radius: 6px; flex-shrink: 0;
  }

  /* ── Panel ── */
  .tp-panel {
    background: var(--surface-container-lowest);
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(208,195,200,0.22);
    box-shadow: 0 24px 64px rgba(112,87,101,0.22), 0 4px 16px rgba(112,87,101,0.1);
    overflow: hidden;
    animation: tpIn 0.18s var(--ease-out) both;
    position: relative;
  }
  @keyframes tpIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes durIn {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* ── Panel header ── */
  .tp-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px 8px;
  }
  .tp-panel-title {
    font-family: var(--font-display); font-size: 16px;
    font-weight: 700; color: var(--on-surface);
  }
  .tp-panel-dots {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--surface-container-high);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    gap: 2px; flex-direction: row;
  }
  .tp-panel-dot {
    width: 3px; height: 3px; border-radius: 50%;
    background: var(--on-surface-variant);
  }

  /* ── Drum wrapper ── */
  .tp-drum-wrap {
    margin: 8px 16px;
    background: var(--surface-container);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  /* ── Confirm ── */
  .tp-confirm-row {
    padding: 12px 16px 16px;
  }
  .tp-confirm {
    width: 100%; padding: 14px;
    border-radius: var(--radius-full);
    background: var(--gradient-primary); color: white;
    font-size: 15px; font-weight: 700;
    border: none; cursor: pointer;
    transition: all var(--transition-spring); letter-spacing: 0.02em;
  }
  .tp-confirm:hover  { opacity: 0.9; transform: translateY(-1px); }
  .tp-confirm:active { transform: scale(0.98); }
`;

// ─── Main export ─────────────────────────────────────────────────────────────
/**
 * TimePicker — drum scroll style matching iOS design.
 * value:    "HH:MM" (24h) stored; displays as "h:mm AM/PM"
 * onChange: ("HH:MM") => void
 */
export function TimePicker({ value, onChange, placeholder = 'Seleccionar hora', id }) {
  const [open, setOpen]               = useState(false);
  const [slot, setSlot]               = useState(() => valueToSlot(value));
  const [showDuration, setShowDuration] = useState(false);
  const triggerRef                    = useRef(null);

  // Sync slot when external value changes
  useEffect(() => {
    setSlot(valueToSlot(value));
  }, [value]);

  const handleConfirm = () => {
    onChange(slotTo24h(slot));
    setOpen(false);
  };

  // Display label
  const displayLabel = value ? valueToSlot(value) : placeholder;
  const period       = value ? valueToSlot(value).split(' ')[1] : null;

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
        {period && <span className="tp-period-badge">{period}</span>}
      </button>

      {/* Popover */}
      {open && (
        <TimePopover triggerRef={triggerRef} onClose={() => setOpen(false)}>
          <div className="tp-panel">

            {/* Header */}
            <div className="tp-panel-header">
              <span className="tp-panel-title">Tiempo</span>
              <button
                className="tp-panel-dots" type="button"
                aria-label="Duración"
                onClick={() => setShowDuration(true)}
              >
                <span className="tp-panel-dot" />
                <span className="tp-panel-dot" />
                <span className="tp-panel-dot" />
              </button>
            </div>

            {/* Drum */}
            <div className="tp-drum-wrap">
              <DrumScroller
                slots={SLOTS}
                value={slot}
                onChange={setSlot}
              />
            </div>

            {/* Confirm */}
            <div className="tp-confirm-row">
              <button className="tp-confirm" type="button" onClick={handleConfirm} id="tp-confirm">
                Continuar — {slot}
              </button>
            </div>

            {/* Duration modal — slides up inside the panel */}
            {showDuration && (
              <DurationModal onClose={() => setShowDuration(false)} />
            )}

          </div>
        </TimePopover>
      )}
    </>
  );
}
