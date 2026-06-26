import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SetupProfileScreen() {
  const { state, dispatch, showToast } = useApp();
  const googleName = state.user?.name || '';
  const photoURL   = state.user?.photoURL || null;
  const initials   = googleName ? googleName.charAt(0).toUpperCase() : '?';

  const [name, setName] = useState(googleName);

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) { showToast('Escribe tu nombre', 'error'); return; }
    const firstName = trimmed.split(' ')[0];
    dispatch({ type: 'COMPLETE_SETUP', user: { name: trimmed, firstName } });
    showToast(`¡Bienvenida, ${firstName}! 🌸`, 'success');
  };

  const handleSkip = () => {
    const firstName = googleName.split(' ')[0] || 'tú';
    dispatch({ type: 'COMPLETE_SETUP', user: { name: googleName, firstName } });
  };

  return (
    <>
      <style>{`
        .sp-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background-color: #fbf9f7;
          background-image:
            radial-gradient(circle at 10% 15%, rgba(248,215,232,0.45) 0%, transparent 45%),
            radial-gradient(circle at 88% 85%, rgba(216,232,197,0.32) 0%, transparent 45%);
        }

        /* Card */
        .sp-card {
          width: 100%;
          max-width: 480px;
          background: var(--surface-container-lowest);
          border-radius: 32px;
          padding: 3rem 2.5rem 2.5rem;
          box-shadow: 0 24px 48px -12px rgba(112,87,101,0.08);
          border: 1px solid rgba(255,255,255,0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* Header text */
        .sp-title {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 500;
          color: var(--primary);
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }
        .sp-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          font-family: var(--font-body);
          line-height: 1.65;
          max-width: 280px;
          margin: 0 auto 2rem;
        }

        /* Avatar */
        .sp-avatar-wrap {
          position: relative;
          margin-bottom: 0.75rem;
        }
        .sp-avatar {
          width: 6.5rem;
          height: 6.5rem;
          border-radius: 9999px;
          object-fit: cover;
          border: 3px solid rgba(248,215,232,0.8);
          box-shadow: 0 8px 24px rgba(112,87,101,0.15);
        }
        .sp-avatar-fallback {
          width: 6.5rem;
          height: 6.5rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, #F8D7E8 0%, #EDE7F6 100%);
          border: 3px solid rgba(248,215,232,0.8);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 2.25rem;
          color: var(--primary);
          box-shadow: 0 8px 24px rgba(112,87,101,0.15);
        }

        /* Input section */
        .sp-field {
          width: 100%;
          margin-bottom: 1.5rem;
          text-align: left;
        }
        .sp-label {
          display: block;
          font-size: var(--text-label-md);
          font-weight: 500;
          color: var(--on-surface-variant);
          font-family: var(--font-body);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }
        .sp-input {
          width: 100%;
          padding: 0.9rem 1rem;
          background: var(--surface-container-low);
          border: 1.5px solid transparent;
          border-radius: var(--radius-xl);
          font-size: var(--text-body-md);
          color: var(--on-surface);
          font-family: var(--font-body);
          outline: none;
          transition: all 300ms;
          box-sizing: border-box;
        }
        .sp-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(248,215,232,0.5);
        }
        .sp-input::placeholder { color: var(--outline); }

        /* Buttons */
        .sp-btn {
          width: 100%;
          background: var(--primary);
          color: var(--on-primary);
          font-size: var(--text-label-md);
          font-weight: 500;
          font-family: var(--font-body);
          letter-spacing: 0.02em;
          padding: 1rem;
          border-radius: var(--radius-full);
          border: none;
          cursor: pointer;
          transition: opacity 200ms, transform 200ms;
        }
        .sp-btn:hover  { opacity: 0.9; }
        .sp-btn:active { transform: scale(0.97); }

        .sp-skip {
          margin-top: 1rem;
          font-size: var(--text-body-sm);
          color: var(--outline);
          cursor: pointer;
          font-family: var(--font-body);
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          transition: color 200ms;
          letter-spacing: 0.01em;
        }
        .sp-skip:hover { color: var(--on-surface-variant); }
      `}</style>

      <div className="sp-root">
        <div className="sp-card">
          {/* Header */}
          <h1 className="sp-title">Bienvenida a Mavia</h1>
          <p className="sp-sub">Comencemos tu camino hacia una productividad consciente.</p>

          {/* Avatar */}
          <div className="sp-avatar-wrap">
            {photoURL
              ? <img src={photoURL} alt="Tu foto" className="sp-avatar" />
              : <div className="sp-avatar-fallback">{initials}</div>
            }
          </div>

          {/* Name input */}
          <div className="sp-field" style={{ marginTop: '1.5rem' }}>
            <label className="sp-label" htmlFor="sp-name">¿Cómo te llamas?</label>
            <input
              className="sp-input"
              id="sp-name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleContinue()}
              autoFocus
              autoComplete="given-name"
            />
          </div>

          {/* CTA */}
          <button className="sp-btn" id="sp-continue" onClick={handleContinue}>
            Finalizar configuración
          </button>

          {/* Skip */}
          <button className="sp-skip" id="sp-skip" onClick={handleSkip}>
            Omitir por ahora
          </button>
        </div>
      </div>
    </>
  );
}
