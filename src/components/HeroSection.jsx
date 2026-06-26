import { useState, useEffect, useRef } from 'react';

const stats = [
  { value: '10K+', label: 'Usuarios Activos' },
  { value: '99.9%', label: 'Uptime' },
  { value: '150+', label: 'Funciones' },
  { value: '4.9★', label: 'Calificación' },
];

function CountUp({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numeric));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(numeric);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  const display = target.includes('K') ? `${count}K` :
    target.includes('%') ? `${count}%` :
    target.includes('★') ? `${(count / 10).toFixed(1)}★` :
    `${count}+`;

  return <span ref={ref}>{display}</span>;
}

export default function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <section id="home" className="hero">
      {/* Orbs */}
      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }} />
      <div className="orb orb-2" style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }} />
      <div className="orb orb-3" style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.4}px)` }} />

      <div className="hero-container">
        {/* Badge */}
        <div className="hero-badge">
          <span className="badge-dot" />
          <span>PWA · React · Astro</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title">
          Bienvenido a
          <span className="gradient-text"> Mavia</span>
          <br />
          <span className="hero-subtitle-line">El futuro es ahora</span>
        </h1>

        <p className="hero-description">
          Una experiencia de aplicación web progresiva ultra moderna. 
          Instálala en cualquier dispositivo, úsala sin conexión y disfruta 
          de un rendimiento excepcional.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta">
          <a href="#features" className="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Explorar Funciones
          </a>
          <a href="#about" className="btn-outline">
            Saber más
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value">
                <CountUp target={stat.value} />
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating card */}
      <div
        className="hero-visual"
        style={{ transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)` }}
      >
        <div className="floating-card">
          <div className="card-header">
            <div className="card-dots">
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#febc2e' }} />
              <span style={{ background: '#28c840' }} />
            </div>
            <span className="card-title">mavia.app</span>
          </div>
          <div className="card-body">
            <div className="code-line"><span className="kw">const</span> <span className="fn">mavia</span> = <span className="kw">new</span> <span className="cl">PWA</span>(&#123;</div>
            <div className="code-line pl">  <span className="prop">name</span>: <span className="str">'Mavia'</span>,</div>
            <div className="code-line pl">  <span className="prop">offline</span>: <span className="bool">true</span>,</div>
            <div className="code-line pl">  <span className="prop">installable</span>: <span className="bool">true</span>,</div>
            <div className="code-line pl">  <span className="prop">performance</span>: <span className="num">100</span>,</div>
            <div className="code-line">&#125;);</div>
            <div className="code-line mt"><span className="fn">mavia</span>.<span className="method">launch</span>(); <span className="comment">// 🚀</span></div>
          </div>
          <div className="card-footer">
            <div className="status-pill">
              <span className="status-dot" />
              Live & Running
            </div>
            <div className="perf-badges">
              <span className="badge green">PWS ✓</span>
              <span className="badge purple">A11y ✓</span>
              <span className="badge cyan">SEO ✓</span>
            </div>
          </div>
        </div>

        {/* Floating chips */}
        <div className="chip chip-1">⚡ Ultra Rápido</div>
        <div className="chip chip-2">📱 Instalable</div>
        <div className="chip chip-3">🔒 Seguro</div>
      </div>

      <style>{`
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
          padding: 7rem 1.5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: -1;
          transition: transform 0.3s ease;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(139,92,246,0.2), transparent);
          top: -100px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(236,72,153,0.15), transparent);
          bottom: 100px; right: -50px;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(6,182,212,0.1), transparent);
          top: 50%; left: 50%;
        }
        .hero-container {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #a78bfa;
          width: fit-content;
          animation: fadeInUp 0.6s ease both;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          animation: fadeInUp 0.6s 0.1s ease both;
        }
        .gradient-text {
          background: linear-gradient(135deg, #8b5cf6, #ec4899, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle-line {
          font-size: 0.75em;
          font-weight: 400;
          color: rgba(240,240,255,0.5);
        }
        .hero-description {
          color: rgba(240,240,255,0.65);
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 500px;
          animation: fadeInUp 0.6s 0.2s ease both;
        }
        .hero-cta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          animation: fadeInUp 0.6s 0.3s ease both;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 999px;
          transition: all 0.25s ease;
          box-shadow: 0 8px 30px rgba(139,92,246,0.35);
          text-decoration: none;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(139,92,246,0.5);
        }
        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(240,240,255,0.85);
          font-weight: 500;
          font-size: 0.95rem;
          border-radius: 999px;
          transition: all 0.25s ease;
          background: rgba(255,255,255,0.04);
          text-decoration: none;
        }
        .btn-outline:hover {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.08);
          color: white;
          transform: translateY(-2px);
        }
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          padding: 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          animation: fadeInUp 0.6s 0.4s ease both;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: center;
        }
        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-label {
          font-size: 0.75rem;
          color: rgba(240,240,255,0.4);
          font-weight: 500;
        }
        /* Floating card */
        .hero-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        }
        .floating-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.1);
          animation: float 6s ease-in-out infinite, fadeInRight 0.8s 0.2s ease both;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .card-header {
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .card-dots { display: flex; gap: 6px; }
        .card-dots span {
          width: 12px; height: 12px;
          border-radius: 50%;
        }
        .card-title {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          margin: auto;
        }
        .card-body {
          padding: 1.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.82rem;
          line-height: 1.8;
        }
        .code-line { white-space: nowrap; }
        .code-line.pl { padding-left: 1rem; }
        .code-line.mt { margin-top: 0.5rem; }
        .kw { color: #c084fc; }
        .fn { color: #60a5fa; }
        .cl { color: #34d399; }
        .prop { color: #f9a8d4; }
        .str { color: #86efac; }
        .bool { color: #fb923c; }
        .num { color: #fbbf24; }
        .method { color: #60a5fa; }
        .comment { color: rgba(255,255,255,0.3); }
        .card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .status-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .status-dot {
          width: 6px; height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s ease infinite;
        }
        .perf-badges {
          display: flex;
          gap: 0.4rem;
        }
        .badge {
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 600;
        }
        .badge.green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
        .badge.purple { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }
        .badge.cyan { background: rgba(6,182,212,0.15); color: #22d3ee; border: 1px solid rgba(6,182,212,0.3); }
        /* Chips */
        .chip {
          position: absolute;
          padding: 0.5rem 0.9rem;
          background: rgba(15,15,26,0.85);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          white-space: nowrap;
          animation: floatChip 4s ease-in-out infinite;
        }
        @keyframes floatChip {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .chip-1 { top: -1.5rem; right: -1rem; animation-delay: 0s; color: #fbbf24; border-color: rgba(251,191,36,0.2); }
        .chip-2 { bottom: 2rem; right: -2rem; animation-delay: 1.5s; color: #60a5fa; border-color: rgba(96,165,250,0.2); }
        .chip-3 { bottom: -1rem; left: 2rem; animation-delay: 0.8s; color: #34d399; border-color: rgba(52,211,153,0.2); }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3rem;
          }
          .hero-badge { margin: 0 auto; }
          .hero-description { margin: 0 auto; }
          .hero-cta { justify-content: center; }
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
          .hero-visual { display: none; }
        }
      `}</style>
    </section>
  );
}
