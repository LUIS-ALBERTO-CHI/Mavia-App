export default function AboutSection() {
  const timeline = [
    { year: '2024', title: 'Inception', desc: 'Mavia nació con la visión de redefinir las PWAs modernas.' },
    { year: '2025', title: 'Beta Launch', desc: 'Primera versión pública con 1,000+ beta testers entusiastas.' },
    { year: '2026', title: 'v1.0 Released', desc: 'Lanzamiento oficial con soporte completo React + Astro.' },
  ];

  return (
    <section id="about" className="about-section">
      <div className="section-container">
        <div className="about-grid">
          {/* Left: Content */}
          <div className="about-content">
            <span className="section-tag">Acerca de</span>
            <h2 className="section-title">
              Construido para la
              <span className="gradient-text"> próxima generación</span>
            </h2>
            <p className="about-desc">
              Mavia es más que una aplicación — es una demostración del poder de la web moderna.
              Combinamos la velocidad de Astro, la riqueza de React y los superpoderes de las PWAs
              para entregarte una experiencia que rivaliza con cualquier app nativa.
            </p>
            <p className="about-desc">
              Nuestro enfoque de "islands architecture" significa que solo cargamos JavaScript donde
              es necesario, resultando en tiempos de carga ultrarrápidos y una experiencia excepcional.
            </p>

            {/* Tech stack */}
            <div className="tech-stack">
              {['Astro 4', 'React 18', 'Workbox', 'TypeScript', 'Vite', 'PWA'].map(tech => (
                <span key={tech} className="tech-tag">{tech}</span>
              ))}
            </div>
          </div>

          {/* Right: Timeline */}
          <div className="about-visual">
            <div className="timeline">
              {timeline.map((item, i) => (
                <div key={item.year} className="timeline-item" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="timeline-connector">
                    <div className="timeline-dot" />
                    {i < timeline.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-year">{item.year}</span>
                    <h4 className="timeline-title">{item.title}</h4>
                    <p className="timeline-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics card */}
            <div className="metrics-card">
              <div className="metric">
                <div className="metric-bar-wrap">
                  <span className="metric-label">Performance</span>
                  <span className="metric-score" style={{ color: '#34d399' }}>100</span>
                </div>
                <div className="metric-bar"><div className="metric-fill" style={{ width: '100%', background: '#34d399' }} /></div>
              </div>
              <div className="metric">
                <div className="metric-bar-wrap">
                  <span className="metric-label">Accessibility</span>
                  <span className="metric-score" style={{ color: '#60a5fa' }}>98</span>
                </div>
                <div className="metric-bar"><div className="metric-fill" style={{ width: '98%', background: '#60a5fa' }} /></div>
              </div>
              <div className="metric">
                <div className="metric-bar-wrap">
                  <span className="metric-label">Best Practices</span>
                  <span className="metric-score" style={{ color: '#fbbf24' }}>100</span>
                </div>
                <div className="metric-bar"><div className="metric-fill" style={{ width: '100%', background: '#fbbf24' }} /></div>
              </div>
              <div className="metric">
                <div className="metric-bar-wrap">
                  <span className="metric-label">SEO</span>
                  <span className="metric-score" style={{ color: '#c084fc' }}>100</span>
                </div>
                <div className="metric-bar"><div className="metric-fill" style={{ width: '100%', background: '#c084fc' }} /></div>
              </div>
              <p className="metrics-caption">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '4px' }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                Lighthouse scores
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .about-section {
          padding: 6rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .section-container { max-width: 1200px; margin: 0 auto; }
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: start;
        }
        .about-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .section-tag {
          display: inline-block;
          padding: 0.3rem 1rem;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          width: fit-content;
        }
        .section-title {
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .gradient-text {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .about-desc {
          color: rgba(240,240,255,0.55);
          font-size: 0.95rem;
          line-height: 1.75;
        }
        .tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .tech-tag {
          padding: 0.4rem 0.9rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(240,240,255,0.7);
          transition: all 0.2s ease;
        }
        .tech-tag:hover {
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.3);
          color: #a78bfa;
        }
        /* Timeline */
        .about-visual {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .timeline-item {
          display: flex;
          gap: 1rem;
        }
        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .timeline-dot {
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(139,92,246,0.5);
          flex-shrink: 0;
          margin-top: 4px;
        }
        .timeline-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.05));
          margin: 6px 0;
          min-height: 40px;
        }
        .timeline-content {
          padding-bottom: 1.75rem;
        }
        .timeline-year {
          font-size: 0.75rem;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 0.3rem;
        }
        .timeline-title {
          font-size: 1rem;
          font-weight: 700;
          color: #f0f0ff;
          margin-bottom: 0.35rem;
        }
        .timeline-desc {
          font-size: 0.85rem;
          color: rgba(240,240,255,0.45);
          line-height: 1.6;
        }
        /* Metrics */
        .metrics-card {
          padding: 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .metric { display: flex; flex-direction: column; gap: 0.4rem; }
        .metric-bar-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .metric-label { font-size: 0.8rem; color: rgba(240,240,255,0.5); }
        .metric-score { font-size: 0.85rem; font-weight: 700; font-family: 'Outfit', sans-serif; }
        .metric-bar {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
        }
        .metric-fill {
          height: 100%;
          border-radius: 999px;
          animation: growBar 1.5s ease forwards;
          transform-origin: left;
        }
        @keyframes growBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .metrics-caption {
          font-size: 0.75rem;
          color: rgba(240,240,255,0.25);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 0.25rem;
        }
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr; gap: 3rem; }
        }
      `}</style>
    </section>
  );
}
