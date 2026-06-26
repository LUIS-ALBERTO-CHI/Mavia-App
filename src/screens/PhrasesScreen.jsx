import { useApp } from '../context/AppContext';
import { Share2, Sparkles, Quote, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';

export default function PhrasesScreen() {
  const { state, showToast } = useApp();
  const today  = new Date().toISOString().split('T')[0];
  const phrase = state.phrases.find(p => p.date === today) || state.phrases[0];
  const past   = state.phrases.filter(p => p.date !== today).slice(0, 6);
  const [saved, setSaved] = useState(false);

  const handleShare = () => {
    const text = `"${phrase.text}" — Mavia`;
    if (navigator.share) {
      navigator.share({ text, title: 'Frase del día en Mavia' });
    } else {
      navigator.clipboard?.writeText(text);
      showToast('Frase copiada al portapapeles');
    }
  };

  const handleSave = () => {
    setSaved(true);
    showToast('Frase guardada en tus favoritos', 'success');
  };

  return (
    <>
      <style>{`
        /* ======= PHRASES SCREEN ======= */
        .phr-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 720px;
          margin: 0 auto;
        }

        .phr-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          margin-bottom: 6px;
        }
        .phr-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Main phrase card ── */
        .phr-main {
          background: var(--gradient-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl) var(--space-xl) var(--space-lg);
          margin-bottom: var(--space-xl);
          color: white;
          text-align: center;
          box-shadow: 0 16px 48px rgba(112,87,101,0.25);
          position: relative;
          overflow: hidden;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-lg);
        }
        .phr-main::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .phr-main::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -40px;
          width: 160px; height: 160px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .phr-main-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          animation: float 4s ease-in-out infinite;
        }

        .phr-quote-mark {
          position: absolute;
          top: 16px; left: 20px;
          font-family: var(--font-display);
          font-size: 5rem;
          color: rgba(255,255,255,0.15);
          line-height: 1;
          z-index: 0;
          pointer-events: none;
        }

        .phr-main-text {
          font-family: var(--font-display);
          font-size: clamp(1.15rem, 3vw, 1.5rem);
          font-weight: 400;
          font-style: italic;
          line-height: var(--leading-relaxed);
          color: white;
          max-width: 380px;
          position: relative;
          z-index: 1;
        }

        .phr-main-author {
          font-size: var(--text-label-md);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          position: relative;
          z-index: 1;
        }

        .phr-main-actions {
          display: flex;
          gap: var(--space-md);
          position: relative;
          z-index: 1;
        }

        .phr-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all var(--transition-spring);
        }
        .phr-action-btn.primary {
          background: var(--surface-container-low);
          color: var(--primary);
        }
        .phr-action-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .phr-action-btn.ghost {
          background: rgba(255,255,255,0.15);
          color: white;
          border: 1.5px solid rgba(255,255,255,0.25);
        }
        .phr-action-btn.ghost:hover { background: rgba(255,255,255,0.25); }

        /* ── Section head ── */
        .phr-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .phr-section-title {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .phr-section-line { flex: 1; height: 1px; background: rgba(208,195,200,0.25); }

        /* ── Past phrases grid ── */
        .phr-past-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .phr-past-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          display: flex;
          gap: var(--space-md);
          align-items: flex-start;
          transition: transform var(--transition-spring);
        }
        .phr-past-card:hover { transform: translateY(-1px); }

        .phr-past-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .phr-past-body { flex: 1; }
        .phr-past-text {
          font-family: var(--font-display);
          font-style: italic;
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          line-height: var(--leading-relaxed);
          margin-bottom: 6px;
        }
        .phr-past-date {
          font-size: var(--text-label-sm);
          font-weight: 600;
          color: var(--outline);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      <div className="phr-screen">

        {/* Hero */}
        <h1 className="phr-hero-title">Frase del Día</h1>
        <p className="phr-hero-sub">Una palabra de aliento para acompañarte hoy.</p>

        {/* Main phrase */}
        {phrase && (
          <div className="phr-main">
            <span className="phr-quote-mark">"</span>

            <div className="phr-main-icon">
              <Sparkles size={26} color="white" strokeWidth={1.5} />
            </div>

            <p className="phr-main-text">"{phrase.text}"</p>
            <p className="phr-main-author">— {phrase.author}</p>

            <div className="phr-main-actions">
              <button className="phr-action-btn primary" onClick={handleShare} id="phrase-share">
                <Share2 size={15} strokeWidth={2} />
                Compartir
              </button>
              <button className={`phr-action-btn ghost`} onClick={handleSave} id="phrase-save">
                <Bookmark size={15} strokeWidth={2} fill={saved ? 'white' : 'none'} />
                {saved ? 'Guardada' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Past phrases */}
        {past.length > 0 && (
          <>
            <div className="phr-section-head">
              <span className="phr-section-title">Frases anteriores</span>
              <div className="phr-section-line" />
            </div>
            <div className="phr-past-grid">
              {past.map(p => (
                <div key={p.id} className="phr-past-card">
                  <div className="phr-past-icon">
                    <Quote size={16} color="var(--primary)" strokeWidth={1.75} />
                  </div>
                  <div className="phr-past-body">
                    <p className="phr-past-text">"{p.text}"</p>
                    <p className="phr-past-date">
                      {new Date(p.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })
                        .replace(/^\w/, c => c.toUpperCase())}
                    </p>
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
