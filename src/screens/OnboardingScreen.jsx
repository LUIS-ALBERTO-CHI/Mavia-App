import { useState } from 'react';
import { useApp } from '../context/AppContext';
import LottieIcon from '../components/LottieIcon';

/* ─────────────────────────────────────────
   #15 ONBOARDING MEJORADO
   5 slides con previews de funcionalidades reales
   ───────────────────────────────────────── */

const SLIDES = [
  {
    id: 'welcome',
    gradient: 'linear-gradient(160deg, #FAF0F6 0%, #FDE8F3 100%)',
    accentColor: '#705765',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <circle cx="100" cy="100" r="80" fill="#F8D7E8" opacity="0.6"/>
        <circle cx="100" cy="100" r="55" fill="#F0C0D8" opacity="0.5"/>
        <path d="M65 100 L88 123 L138 73" stroke="#705765" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="140" cy="55" r="12" fill="#D5E5C2" opacity="0.8"/>
        <circle cx="58" cy="145" r="8"  fill="#F0DFAE" opacity="0.8"/>
        <circle cx="148" cy="148" r="6" fill="#705765" opacity="0.25"/>
      </svg>
    ),
    title: 'Bienvenida a Mavia',
    subtitle: 'Tu compañera de bienestar y productividad. Organiza, cuida y crece — todo en un solo lugar.',
    features: null,
  },
  {
    id: 'tasks',
    gradient: 'linear-gradient(160deg, #F5F8FF 0%, #EBF0FF 100%)',
    accentColor: '#4a6fa5',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <rect x="30" y="50" width="140" height="110" rx="18" fill="#EBF0FF" opacity="0.8"/>
        {[70, 96, 122].map((y, i) => (
          <g key={i}>
            <rect x="52" y={y-10} width="22" height="22" rx="6" fill={i === 0 ? '#4a6fa5' : 'white'} stroke="#4a6fa5" strokeWidth="1.5" opacity={i===0?1:0.5}/>
            {i===0 && <path d={`M56 ${y+1} L61 ${y+6} L69 ${y-3}`} stroke="white" strokeWidth="2" strokeLinecap="round"/>}
            <rect x="84" y={y-6} width={i===0?62:i===1?48:70} height="8" rx="4" fill="#4a6fa5" opacity={i===0?0.4:0.2}/>
          </g>
        ))}
      </svg>
    ),
    title: 'Tareas con propósito',
    subtitle: 'Gestiona todo lo que importa. Prioridades, recordatorios y categorías para no perder el hilo.',
    features: ['Prioridad alta, media y baja', 'Recordatorios inteligentes', 'Categorías: Marketing, Personal, Espiritual'],
  },
  {
    id: 'habits',
    gradient: 'linear-gradient(160deg, #F0F8F0 0%, #E0F0DA 100%)',
    accentColor: '#546347',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <circle cx="100" cy="100" r="70" fill="#D5E5C2" opacity="0.5"/>
        <g transform="translate(52, 58)">
          {[0,1,2,3,4,5,6].map(i => (
            <rect key={i} x={i*14} y={i < 4 ? 0 : 14} width="10" height="10" rx="3"
              fill={i < 5 ? '#546347' : '#D5E5C2'} opacity={i < 5 ? 0.9 : 0.5}/>
          ))}
        </g>
        <circle cx="100" cy="130" r="26" fill="#546347" opacity="0.15"/>
        <path d="M87 130 L96 139 L114 121" stroke="#546347" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="148" cy="65" r="8" fill="#F0DFAE" opacity="0.8"/>
      </svg>
    ),
    title: 'Hábitos que duran',
    subtitle: 'Construye rutinas sólidas. Rastrea tu progreso día a día y mantén tu racha.',
    features: ['Racha de días consecutivos', 'Seguimiento semanal visual', 'Recordatorios personalizados por hábito'],
  },
  {
    id: 'wellness',
    gradient: 'linear-gradient(160deg, #FDF5F0 0%, #FAE8DC 100%)',
    accentColor: '#695e37',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <circle cx="100" cy="100" r="75" fill="#F0DFAE" opacity="0.45"/>
        <path d="M60 100 Q80 65 100 100 Q120 135 140 100" stroke="#695e37" strokeWidth="3" fill="none" opacity="0.4"/>
        <circle cx="100" cy="78" r="32" fill="#F0DFAE" opacity="0.7"/>
        <circle cx="100" cy="78" r="18" fill="#695e37" opacity="0.2"/>
        <path d="M93 78 L100 85 L110 70" stroke="#695e37" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <circle cx="58"  cy="140" r="9" fill="#D5E5C2" opacity="0.7"/>
        <circle cx="142" cy="135" r="7" fill="#F8D7E8" opacity="0.7"/>
      </svg>
    ),
    title: 'Cuida tu bienestar',
    subtitle: 'Meditación guiada, diario de gratitud y reflexión. Tu mente merece atención.',
    features: ['Meditaciones en audio', 'Diario de emociones', 'Frases motivacionales diarias'],
  },
  {
    id: 'ready',
    gradient: 'linear-gradient(160deg, #FFF8FF 0%, #F5E8FF 100%)',
    accentColor: '#705765',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <circle cx="100" cy="100" r="78" fill="#F8D7E8" opacity="0.4"/>
        <circle cx="100" cy="100" r="52" fill="#F8D7E8" opacity="0.5"/>
        <text x="100" y="118" textAnchor="middle" fontSize="52" fontFamily="serif">🌸</text>
        <circle cx="155" cy="58" r="10" fill="#D5E5C2" opacity="0.9"/>
        <circle cx="45"  cy="70" r="7"  fill="#F0DFAE" opacity="0.9"/>
        <circle cx="48"  cy="145" r="9" fill="#F8D7E8" opacity="0.7"/>
        <circle cx="158" cy="140" r="6" fill="#D5E5C2" opacity="0.7"/>
      </svg>
    ),
    title: '¡Todo listo para empezar!',
    subtitle: 'Crea tu cuenta y descubre una nueva forma de vivir con claridad, intención y calma.',
    features: null,
    cta: 'Crear mi cuenta',
  },
];

export default function OnboardingScreen() {
  const { navigate } = useApp();
  const [current, setCurrent]   = useState(0);
  const [animKey, setAnimKey]   = useState(0);

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const markDone = () => localStorage.setItem('mavia_onboarding_done', '1');

  const goNext = () => {
    if (isLast) { markDone(); navigate('register'); }
    else { setAnimKey(k => k + 1); setCurrent(c => c + 1); }
  };

  const goPrev = () => {
    if (current > 0) { setAnimKey(k => k + 1); setCurrent(c => c - 1); }
  };

  const handleSkip = () => { markDone(); navigate('register'); };

  return (
    <>
      <style>{`
        .onboarding {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: var(--font-body);
        }

        .ob-slide {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px 24px;
          text-align: center;
          transition: background 0.55s ease;
          position: relative;
          overflow: hidden;
        }

        .ob-illustration {
          margin-bottom: 28px;
          animation: popIn 0.55s var(--ease-spring) both;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.08));
        }

        .ob-title {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 5vw, 2rem);
          font-weight: 600;
          color: var(--on-surface);
          line-height: 1.2;
          margin-bottom: 12px;
          animation: screenEnter 0.4s var(--ease-out) 0.1s both;
        }

        .ob-subtitle {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          line-height: 1.6;
          max-width: 320px;
          margin-bottom: 20px;
          animation: screenEnter 0.4s var(--ease-out) 0.18s both;
        }

        .ob-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          max-width: 280px;
          animation: screenEnter 0.4s var(--ease-out) 0.26s both;
        }

        .ob-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--on-surface);
          font-weight: 500;
        }

        .ob-feature-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ob-bottom {
          padding: 20px 28px 32px;
          background: var(--surface);
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.05);
        }

        .ob-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .ob-dot {
          height: 5px;
          border-radius: 99px;
          transition: all 0.35s var(--ease-spring);
          cursor: pointer;
          border: none;
          background: var(--outline-variant);
        }
        .ob-dot.active { width: 28px; background: var(--primary); }
        .ob-dot:not(.active) { width: 5px; }

        .ob-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ob-skip {
          font-size: 13px;
          color: var(--on-surface-variant);
          font-weight: 500;
          padding: 10px 14px;
          cursor: pointer;
          border: none;
          background: none;
          transition: color var(--transition-fast);
          font-family: var(--font-body);
          border-radius: 99px;
        }
        .ob-skip:hover { color: var(--on-surface); background: var(--surface-container); }

        .ob-primary-btn {
          flex: 1;
          padding: 14px 24px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 99px;
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-body);
          cursor: pointer;
          transition: transform var(--transition-spring), opacity var(--transition-fast);
          box-shadow: 0 4px 18px rgba(112,87,101,0.35);
        }
        .ob-primary-btn:hover { opacity: 0.92; transform: scale(1.02); }
        .ob-primary-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="onboarding">
        {/* Slide content */}
        <div className="ob-slide" style={{ background: slide.gradient }}>
          <div key={`ill-${animKey}`} className="ob-illustration">
            {slide.illustration}
          </div>

          <h2 key={`title-${animKey}`} className="ob-title">{slide.title}</h2>
          <p  key={`sub-${animKey}`}   className="ob-subtitle">{slide.subtitle}</p>

          {slide.features && (
            <div key={`feat-${animKey}`} className="ob-features">
              {slide.features.map((f, i) => (
                <div key={i} className="ob-feature-item">
                  <div className="ob-feature-dot" style={{ background: slide.accentColor }} />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="ob-bottom">
          <div className="ob-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`ob-dot${i === current ? ' active' : ''}`}
                onClick={() => { setAnimKey(k => k + 1); setCurrent(i); }}
                aria-label={`Slide ${i + 1}`}
                id={`ob-dot-${i}`}
              />
            ))}
          </div>

          <div className="ob-actions">
            {current > 0 ? (
              <button className="ob-skip" onClick={goPrev} id="ob-prev">← Atrás</button>
            ) : (
              <button className="ob-skip" onClick={handleSkip} id="ob-skip">Omitir</button>
            )}
            <button className="ob-primary-btn" onClick={goNext} id="ob-next">
              {isLast ? (slide.cta || 'Comenzar') : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
