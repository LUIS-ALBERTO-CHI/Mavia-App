export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="fLogoGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
              <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" fill="url(#fLogoGrad)" opacity="0.9"/>
              <circle cx="14" cy="14" r="3" fill="white"/>
            </svg>
            <span>Mavia</span>
          </div>
          <p>El futuro de las aplicaciones web progresivas.</p>
        </div>

        <div className="footer-links-group">
          <span className="footer-group-title">Producto</span>
          <a href="#features">Características</a>
          <a href="#about">Acerca de</a>
          <a href="#contact">Contacto</a>
        </div>

        <div className="footer-links-group">
          <span className="footer-group-title">Tecnología</span>
          <a href="https://astro.build" target="_blank" rel="noopener">Astro</a>
          <a href="https://react.dev" target="_blank" rel="noopener">React</a>
          <a href="https://vite-pwa-org.netlify.app" target="_blank" rel="noopener">Vite PWA</a>
        </div>

        <div className="footer-links-group">
          <span className="footer-group-title">Comunidad</span>
          <a href="#">GitHub</a>
          <a href="#">Discord</a>
          <a href="#">Twitter / X</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} Mavia. Construido con ❤️ y tecnología de vanguardia.</p>
        <div className="footer-badges">
          <span>PWA Ready</span>
          <span>Open Source</span>
        </div>
      </div>

      <style>{`
        .footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 4rem 1.5rem 2rem;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .footer-brand p {
          font-size: 0.85rem;
          color: rgba(240,240,255,0.35);
          line-height: 1.6;
          max-width: 220px;
        }
        .footer-links-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .footer-group-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(240,240,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.4rem;
        }
        .footer-links-group a {
          font-size: 0.88rem;
          color: rgba(240,240,255,0.55);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-links-group a:hover { color: #a78bfa; }
        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .footer-bottom p {
          font-size: 0.82rem;
          color: rgba(240,240,255,0.25);
        }
        .footer-badges {
          display: flex;
          gap: 0.5rem;
        }
        .footer-badges span {
          padding: 0.25rem 0.7rem;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 999px;
          font-size: 0.72rem;
          color: #a78bfa;
          font-weight: 500;
        }
        @media (max-width: 900px) {
          .footer-container { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .footer-container { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  );
}
