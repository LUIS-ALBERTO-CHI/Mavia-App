import { useState } from 'react';
import { useApp } from '../context/AppContext';
import LottieIcon from '../components/LottieIcon';
import AppIcon from '../components/AppIcon';

const SLIDES = [
  {
    lottie: null, icon: 'check',
    title: 'Organiza tus pendientes',
    subtitle: 'Gestiona tus tareas con claridad y calma. Prioriza lo que realmente importa.',
    bg: 'linear-gradient(160deg, #FAF7F2 0%, #FDF0F7 100%)',
    accent: '#E480B0',
  },
  {
    lottie: null, icon: 'bell',
    title: 'Recordatorios inteligentes',
    subtitle: 'Eventos, reuniones y citas. Nunca olvides lo importante. Todo en un solo lugar.',
    bg: 'linear-gradient(160deg, #F8F5FF 0%, #EDE7F6 100%)',
    accent: '#8E4EC6',
  },
  {
    lottie: 'meditation', icon: null,
    title: 'Cuida tu bienestar',
    subtitle: 'Meditación, respiración y mindfulness para una mente tranquila y enfocada.',
    bg: 'linear-gradient(160deg, #E8F5E4 0%, #C8E4C0 100%)',
    accent: '#5A9A50',
  },
  {
    lottie: 'flower', icon: null,
    title: 'Todo sincronizado',
    subtitle: 'Tu vida organizada, tus hábitos en seguimiento, tu bienestar en equilibrio.',
    bg: 'linear-gradient(160deg, #FDF3DC 0%, #F0DEBB 100%)',
    accent: '#9B7A40',
  },
];

export default function OnboardingScreen() {
  const { navigate } = useApp();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('left');

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  // Mark onboarding as done so it never shows again
  const markDone = () => {
    localStorage.setItem('mavia_onboarding_done', '1');
  };

  const goNext = () => {
    if (isLast) {
      markDone();
      navigate('register');
    } else {
      setDirection('left');
      setCurrent(c => c + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setDirection('right');
      setCurrent(c => c - 1);
    }
  };

  const handleSkip = () => {
    markDone();
    navigate('register');
  };

  return (
    <>
      <style>{`
        .onboarding {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .onboarding-slide {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8) var(--space-6) var(--space-6);
          text-align: center;
          transition: background 0.5s ease;
          position: relative;
          overflow: hidden;
        }

        .ob-deco-item {
          position: absolute;
          font-size: 2rem;
          opacity: 0.12;
          pointer-events: none;
          animation: floatSlow 4s ease-in-out infinite;
        }

        .ob-emoji {
          font-size: 5.5rem;
          margin-bottom: var(--space-8);
          animation: popIn 0.5s var(--ease-spring);
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.1));
          line-height: 1;
        }

        .ob-title {
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: 500;
          color: var(--color-text-dark);
          line-height: var(--leading-tight);
          margin-bottom: var(--space-4);
          animation: screenEnter 0.5s var(--ease-out);
        }

        .ob-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          line-height: var(--leading-relaxed);
          max-width: 300px;
          animation: screenEnter 0.5s var(--ease-out) 0.1s both;
        }

        .ob-bottom {
          padding: var(--space-6);
          background: var(--color-surface);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.06);
        }

        .ob-dots {
          display: flex;
          gap: var(--space-2);
          justify-content: center;
        }

        .ob-dot {
          height: 6px;
          border-radius: var(--radius-full);
          background: var(--beige-300);
          transition: all 0.35s var(--ease-spring);
          cursor: pointer;
          border: none;
        }

        .ob-dot.active {
          width: 24px;
          background: var(--gradient-primary);
        }

        .ob-dot:not(.active) {
          width: 6px;
        }

        .ob-actions {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .ob-skip {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          font-weight: 500;
          padding: var(--space-3) var(--space-4);
          cursor: pointer;
          border: none;
          background: none;
          transition: color var(--transition-fast);
        }

        .ob-skip:hover { color: var(--color-text); }
      `}</style>

      <div className="onboarding">
        <div className="onboarding-slide" style={{ background: slide.bg }}>
          {/* Removed emoji deco — kept clean */}

          <div className="ob-emoji">
            {slide.lottie
              ? <LottieIcon name={slide.lottie} size={110} loop autoplay />
              : <AppIcon name={slide.icon || 'star'} size={80} color={slide.accent} strokeWidth={1} />}
          </div>
          <h2 className="ob-title">{slide.title}</h2>
          <p className="ob-subtitle">{slide.subtitle}</p>
        </div>

        <div className="ob-bottom">
          {/* Progress dots */}
          <div className="ob-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`ob-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                id={`ob-dot-${i}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="ob-actions">
            {current > 0 ? (
              <button className="ob-skip" onClick={goPrev} id="ob-prev">
                ← Anterior
              </button>
            ) : (
              <button className="ob-skip" onClick={handleSkip} id="ob-skip">
                Omitir
              </button>
            )}
            <button
              className="btn btn-primary flex-1"
              onClick={goNext}
              id="ob-next"
              style={{ fontSize: 'var(--text-base)' }}
            >
              {isLast ? 'Comenzar' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
