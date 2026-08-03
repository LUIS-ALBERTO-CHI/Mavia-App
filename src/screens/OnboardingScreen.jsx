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
    subtitle: 'Su agenda de trabajo compartida. Organicen tareas, eventos y clientes en un solo lugar.',
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
    id: 'calendar',
    gradient: 'linear-gradient(160deg, #F0F8F0 0%, #E0F0DA 100%)',
    accentColor: '#546347',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <rect x="38" y="46" width="124" height="114" rx="16" fill="#D5E5C2" opacity="0.55"/>
        <rect x="38" y="46" width="124" height="28" rx="14" fill="#546347" opacity="0.85"/>
        <circle cx="70" cy="40" r="6" fill="#546347"/>
        <circle cx="130" cy="40" r="6" fill="#546347"/>
        {[0,1,2].map(r => [0,1,2,3].map(c => (
          <rect key={`${r}-${c}`} x={54 + c*26} y={88 + r*22} width="16" height="16" rx="4"
            fill={r===0 && c===1 ? '#546347' : '#ffffff'} opacity={r===0 && c===1 ? 0.95 : 0.6}/>
        )))}
      </svg>
    ),
    title: 'Tu calendario compartido',
    subtitle: 'Eventos, reuniones y entregas de clientes. Todo en una vista clara del mes.',
    features: ['Eventos con hora y ubicación', 'Recordatorios automáticos', 'Vista de agenda del día'],
  },
  {
    id: 'notes',
    gradient: 'linear-gradient(160deg, #FDF5F0 0%, #FAE8DC 100%)',
    accentColor: '#695e37',
    illustration: (
      <svg viewBox="0 0 200 200" fill="none" width="180" height="180">
        <rect x="48" y="40" width="104" height="128" rx="14" fill="#F0DFAE" opacity="0.6"/>
        <rect x="48" y="40" width="104" height="128" rx="14" stroke="#695e37" strokeWidth="2" opacity="0.3" fill="none"/>
        {[0,1,2,3].map(i => (
          <rect key={i} x="66" y={70 + i*22} width={i===3 ? 40 : 68} height="8" rx="4" fill="#695e37" opacity={0.35 - i*0.05}/>
        ))}
        <circle cx="140" cy="150" r="20" fill="#695e37" opacity="0.9"/>
        <path d="M133 150 L138 155 L148 144" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Notas y objetivos',
    subtitle: 'Guarda ideas, pendientes y detalles de cada cliente. Define objetivos y sigue su avance.',
    features: ['Notas con etiquetas', 'Objetivos con progreso', 'Búsqueda al instante'],
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
    subtitle: 'Crea tu cuenta y organiza el trabajo de la agencia con claridad.',
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
          border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
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
          color: var(--on-primary);
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
