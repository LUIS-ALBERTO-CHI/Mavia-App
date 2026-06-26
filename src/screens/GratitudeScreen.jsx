import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Plus, X, Leaf, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const today = new Date().toISOString().split('T')[0];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const todayD = new Date(today + 'T00:00:00');
  const diff = Math.round((todayD - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })
    .replace(/^\w/, c => c.toUpperCase());
}

export default function GratitudeScreen() {
  const { state, dispatch, showToast } = useApp();
  const { gratitudeEntries } = state;

  const todayEntry = gratitudeEntries.find(e => e.date === today);
  const [items, setItems]     = useState(todayEntry?.items || ['', '', '']);
  const [saved,  setSaved]    = useState(!!todayEntry);

  const update = (i, val) => {
    const next = [...items];
    next[i] = val;
    setItems(next);
    setSaved(false);
  };

  const addItem = () => setItems(l => [...l, '']);
  const removeItem = (i) => setItems(l => l.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const filled = items.filter(i => i.trim());
    if (filled.length === 0) return;
    dispatch({ type: 'ADD_GRATITUDE', entry: { id: Date.now().toString(), date: today, items: filled } });
    showToast('Gratitud registrada', 'success');
    setSaved(true);
  };

  return (
    <>
      <style>{`
        /* ======= GRATITUDE SCREEN ======= */
        .grt-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 720px;
          margin: 0 auto;
        }

        .grt-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .grt-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Today card ── */
        .grt-today-card {
          background: linear-gradient(135deg, #FDF8EC 0%, #F2E2B1 100%);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          border: 1px solid rgba(201,169,110,0.2);
          box-shadow: 0 8px 32px rgba(112,87,101,0.06);
        }

        .grt-today-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .grt-today-icon {
          width: 44px; height: 44px;
          border-radius: var(--radius-xl);
          background: var(--surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .grt-today-label {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: #695e37;
        }
        .grt-today-date {
          font-size: var(--text-label-sm);
          color: rgba(105,94,55,0.7);
          margin-top: 2px;
        }

        /* ── Item inputs ── */
        .grt-items {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .grt-item-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .grt-item-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(201,169,110,0.3);
          color: #695e37;
          font-size: var(--text-label-sm);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .grt-item-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: var(--radius-xl);
          border: 1.5px solid rgba(201,169,110,0.3);
          background: var(--surface-container-low);
          font-size: var(--text-label-md);
          font-family: var(--font-display);
          font-style: italic;
          color: #695e37;
          outline: none;
          transition: all var(--transition-fast);
        }
        .grt-item-input:focus {
          border-color: rgba(201,169,110,0.7);
          background: var(--surface-container-high);
          box-shadow: 0 0 0 3px rgba(201,169,110,0.15);
        }
        .grt-item-input::placeholder { color: rgba(105,94,55,0.45); }

        .grt-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(105,94,55,0.5);
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          transition: all var(--transition-fast);
        }
        .grt-remove-btn:hover { color: var(--error); background: var(--error-container); }

        /* ── Section head ── */
        .grt-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .grt-section-title {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .grt-section-line {
          flex: 1; height: 1px;
          background: rgba(208,195,200,0.25);
        }

        /* ── History cards ── */
        .grt-history {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .grt-hist-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
        }

        .grt-hist-date {
          font-size: var(--text-label-sm);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--on-surface-variant);
          margin-bottom: var(--space-md);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .grt-hist-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .grt-hist-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          font-family: var(--font-display);
          font-style: italic;
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          line-height: var(--leading-relaxed);
        }
        .grt-hist-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--tertiary);
          flex-shrink: 0;
          margin-top: 8px;
        }
      `}</style>

      <div className="grt-screen">

        {/* Hero */}
        <h1 className="grt-hero-title">Gratitud</h1>
        <p className="grt-hero-sub">Reconocer lo bueno cambia tu perspectiva del mundo.</p>

        {/* Today's card */}
        <div className="grt-today-card">
          <div className="grt-today-header">
            <div className="grt-today-icon">
              <Leaf size={22} color="#695e37" strokeWidth={1.75} />
            </div>
            <div>
              <div className="grt-today-label">Hoy estoy agradecida por…</div>
              <div className="grt-today-date">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                  .replace(/^\w/, c => c.toUpperCase())}
              </div>
            </div>
          </div>

          <div className="grt-items">
            {items.map((item, i) => (
              <div key={i} className="grt-item-row">
                <div className="grt-item-num">{i + 1}</div>
                <input
                  className="grt-item-input"
                  placeholder={`Algo que agradezco…`}
                  value={item}
                  onChange={e => update(i, e.target.value)}
                  id={`grt-item-${i}`}
                />
                {items.length > 1 && (
                  <button className="grt-remove-btn" onClick={() => removeItem(i)} aria-label="Eliminar">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              onClick={addItem}
              id="grt-add-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px dashed rgba(201,169,110,0.5)',
                background: 'none',
                color: '#695e37',
                fontSize: 'var(--text-label-md)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Plus size={14} /> Añadir más
            </button>
            <div style={{ flex: 1 }} />
            <Button
              onClick={handleSave}
              id="grt-save"
              disabled={items.every(i => !i.trim())}
              style={{
                background: saved ? 'var(--secondary)' : 'rgba(105,94,55,0.85)',
                color: 'white',
              }}
            >
              <Heart size={15} />
              {saved ? 'Guardado' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* History */}
        {gratitudeEntries.length > 0 && (
          <>
            <div className="grt-section-head">
              <span className="grt-section-title">Días anteriores</span>
              <div className="grt-section-line" />
            </div>
            <div className="grt-history">
              {[...gratitudeEntries].reverse().map(entry => (
                <div key={entry.id} className="grt-hist-card">
                  <div className="grt-hist-date">
                    <Calendar size={13} strokeWidth={2} />
                    {formatDate(entry.date)}
                  </div>
                  <div className="grt-hist-items">
                    {entry.items.map((item, i) => (
                      <div key={i} className="grt-hist-item">
                        <div className="grt-hist-dot" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </>
  );
}
