import { useEffect, useRef } from 'react';

const features = [
  {
    icon: '⚡',
    title: 'Ultra Rendimiento',
    description: 'Carga instantánea y navegación fluida gracias a la arquitectura de islas de Astro y React optimizado.',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.2)',
  },
  {
    icon: '📱',
    title: 'Instalable en Todo',
    description: 'Instala Mavia en iOS, Android, Windows, macOS o Linux. Funciona como una app nativa sin tiendas de apps.',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.2)',
  },
  {
    icon: '🌐',
    title: 'Modo Sin Conexión',
    description: 'Service Workers inteligentes con Workbox aseguran que tu app funcione perfectamente sin internet.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.2)',
  },
  {
    icon: '🎨',
    title: 'UI Premium',
    description: 'Diseño glassmorphism, animaciones fluidas y micro-interacciones que hacen cada acción memorable.',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.2)',
  },
  {
    icon: '🔒',
    title: 'Seguridad Total',
    description: 'HTTPS forzado, Content Security Policy y mejores prácticas de seguridad web integradas por defecto.',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.2)',
  },
  {
    icon: '🚀',
    title: 'DX Excepcional',
    description: 'Stack moderno con TypeScript, HMR instantáneo, y herramientas de desarrollo de primera clase.',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.2)',
  },
];

function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    };
    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={cardRef}
      className="feature-card"
      style={{
        '--accent': feature.color,
        '--glow': feature.glow,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="card-spotlight" />
      <div className="feature-icon-wrap" style={{ background: feature.glow }}>
        <span className="feature-icon">{feature.icon}</span>
      </div>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-desc">{feature.description}</p>
      <div className="feature-line" />
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Características</span>
          <h2 className="section-title">
            Todo lo que necesitas,
            <span className="gradient-text"> integrado</span>
          </h2>
          <p className="section-desc">
            Mavia combina lo mejor de la tecnología PWA con una experiencia de usuario sin igual.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        .features-section {
          padding: 6rem 1.5rem;
        }
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-header {
          text-align: center;
          margin-bottom: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
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
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
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
        .section-desc {
          color: rgba(240,240,255,0.55);
          font-size: 1.05rem;
          max-width: 520px;
          line-height: 1.7;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .feature-card {
          position: relative;
          padding: 1.75rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: default;
          overflow: hidden;
        }
        .card-spotlight {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            var(--glow, rgba(139,92,246,0.15)) 0%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          border-radius: 20px;
        }
        .feature-card:hover .card-spotlight {
          opacity: 1;
        }
        .feature-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .feature-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .feature-icon {
          font-size: 1.5rem;
          line-height: 1;
        }
        .feature-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.6rem;
          color: #f0f0ff;
        }
        .feature-desc {
          font-size: 0.88rem;
          color: rgba(240,240,255,0.5);
          line-height: 1.65;
        }
        .feature-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .feature-card:hover .feature-line {
          opacity: 1;
        }
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
