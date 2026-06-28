import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function SplashScreen() {
  const { navigate } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => navigate('onboarding'), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        .splash {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #FAF7F2 0%, #FDF0F7 45%, #F2EEF8 100%);
          gap: var(--space-6);
          animation: fadeIn 0.6s ease forwards;
          z-index: 999;
        }

        .splash-icon {
          width: 96px;
          height: 96px;
          border-radius: 26px;
          animation: floatSlow 3s ease-in-out infinite, scaleIn 0.7s var(--ease-spring) both;
          box-shadow: 0 12px 40px rgba(107,69,88,0.35), 0 4px 16px rgba(212,130,158,0.3);
        }

        .splash-logo {
          font-family: var(--font-display);
          font-size: 3.5rem;
          font-weight: 500;
          background: linear-gradient(135deg, #E480B0 0%, #B5608A 50%, #8E3F6D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          line-height: 1;
          animation: scaleIn 0.8s var(--ease-spring) 0.3s both;
        }

        .splash-tagline {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          font-style: italic;
          font-family: var(--font-display);
          font-weight: 400;
          letter-spacing: 0.01em;
          animation: fadeIn 0.8s ease 0.8s both;
          text-align: center;
          max-width: 240px;
          line-height: var(--leading-relaxed);
        }

        .splash-loader {
          display: flex;
          gap: 6px;
          animation: fadeIn 0.5s ease 1.2s both;
        }

        .splash-dot {
          width: 7px;
          height: 7px;
          border-radius: var(--radius-full);
          background: var(--rose-300);
        }

        .splash-dot:nth-child(1) { animation: pulse 1.2s ease 0s infinite; }
        .splash-dot:nth-child(2) { animation: pulse 1.2s ease 0.2s infinite; }
        .splash-dot:nth-child(3) { animation: pulse 1.2s ease 0.4s infinite; }

        .splash-deco {
          position: absolute;
          font-size: 2rem;
          opacity: 0.15;
          pointer-events: none;
        }
      `}</style>

      <div className="splash">

        <img
          src="/favicon.svg"
          className="splash-icon"
          alt="Mavia logo"
          width="96"
          height="96"
        />
        <div className="splash-logo">Mavia</div>
        <p className="splash-tagline">Organiza tu día,<br/>cuida tu mente.</p>
        <div className="splash-loader">
          <div className="splash-dot" />
          <div className="splash-dot" />
          <div className="splash-dot" />
        </div>
      </div>
    </>
  );
}
