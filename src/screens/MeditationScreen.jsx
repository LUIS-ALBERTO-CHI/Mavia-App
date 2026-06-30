import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Heart, Play, Pause, Square, Clock, Headphones, Wind,
  Sparkles, Moon, X, ExternalLink,
} from 'lucide-react';

/* YouTube icon — not available in this lucide-react version */
const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   CURATED MEDITATION LIBRARY
   Free YouTube videos — no API key needed (IFrame embed).
   Sources: The Honest Guys, Goodful, Great Meditation, Jason Stephenson
───────────────────────────────────────────────────────────── */
const LIBRARY = [
  // Ansiedad
  {
    id: 'yt-anxiety-1',
    youtubeId: 'ZToicYcHIOU',
    title: 'Meditación para calmar la ansiedad',
    instructor: 'Great Meditation',
    duration: 10,
    category: 'Ansiedad',
    icon: 'wave',
    description: 'Guía de 10 minutos para calmar el sistema nervioso.',
  },
  {
    id: 'yt-anxiety-2',
    youtubeId: 'inpok4MKVLM',
    title: 'Meditación relajante profunda',
    instructor: 'The Honest Guys',
    duration: 10,
    category: 'Ansiedad',
    icon: 'wave',
    description: 'Relajación guiada para liberar tensión y ansiedad.',
  },

  // Concentración
  {
    id: 'yt-focus-1',
    youtubeId: 'rnDiXEhkBd8',
    title: 'Meditación para el enfoque y la productividad',
    instructor: 'Goodful',
    duration: 10,
    category: 'Concentración',
    icon: 'focus',
    description: 'Claridad mental y estado de flow en 10 minutos.',
  },
  {
    id: 'yt-focus-2',
    youtubeId: 'Jyy0ra2WcQQ',
    title: 'Meditación de concentración profunda',
    instructor: 'Calm',
    duration: 15,
    category: 'Concentración',
    icon: 'focus',
    description: 'Entrena la atención plena para un trabajo más eficaz.',
  },

  // Dormir
  {
    id: 'yt-sleep-1',
    youtubeId: 'aEqlQvczMJQ',
    title: 'Meditación para dormir profundo',
    instructor: 'Jason Stephenson',
    duration: 30,
    category: 'Dormir',
    icon: 'sleep',
    description: 'Música y guía para un sueño reparador.',
  },
  {
    id: 'yt-sleep-2',
    youtubeId: 'vd6CsM6p3r4',
    title: 'Relajación para conciliar el sueño',
    instructor: 'The Honest Guys',
    duration: 20,
    category: 'Dormir',
    icon: 'sleep',
    description: 'Visualización guiada para relajar cuerpo y mente.',
  },

  // Gratitud
  {
    id: 'yt-gratitude-1',
    youtubeId: 'AhWEGPpOwNs',
    title: 'Meditación de gratitud y abundancia',
    instructor: 'Great Meditation',
    duration: 10,
    category: 'Gratitud',
    icon: 'flower',
    description: 'Cultiva un corazón agradecido con esta práctica matutina.',
  },

  // Energía
  {
    id: 'yt-energy-1',
    youtubeId: 'nmFUDkj1Aq0',
    title: 'Meditación energizante matutina',
    instructor: 'Goodful',
    duration: 10,
    category: 'Energía',
    icon: 'sun',
    description: 'Activa tu energía positiva para comenzar el día.',
  },
  {
    id: 'yt-energy-2',
    youtubeId: 'VpHlmHRMDB4',
    title: 'Meditación de energía y motivación',
    instructor: 'Great Meditation',
    duration: 12,
    category: 'Energía',
    icon: 'sun',
    description: 'Despierta el poder interior y la motivación.',
  },

  // Respiración (técnicas guiadas)
  {
    id: 'yt-breathe-1',
    youtubeId: 'wfDTp2GogaQ',
    title: 'Técnica de respiración 4-7-8',
    instructor: 'Goodful',
    duration: 5,
    category: 'Respiración',
    icon: 'breathe',
    description: 'La técnica de respiración anti-ansiedad más efectiva.',
  },
];

const CATEGORIES = ['Todas', 'Ansiedad', 'Concentración', 'Dormir', 'Gratitud', 'Energía', 'Respiración'];

const BREATHE_PHASES    = ['Inhala', 'Sostén', 'Exhala', 'Pausa'];
const BREATHE_DURATIONS = [4, 7, 8, 1];
const PHASE_COLORS      = ['#A8C5A0', '#EDE7F6', '#F8D7E8', '#FDF8EC'];

/* ─── icon mapping ─── */
const ICON_MAP = {
  wave:    () => <Wind     size={22} strokeWidth={1.5} />,
  focus:   () => <Sparkles size={22} strokeWidth={1.5} />,
  sleep:   () => <Moon     size={22} strokeWidth={1.5} />,
  flower:  () => <Heart    size={22} strokeWidth={1.5} />,
  sun:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  breathe: () => <Wind     size={22} strokeWidth={1.5} />,
};
const MedIcon = ({ name, color }) => {
  const Comp = ICON_MAP[name] || ICON_MAP.wave;
  return <span style={{ color, display: 'flex', alignItems: 'center' }}><Comp /></span>;
};

/* ─── YouTube embed modal ─── */
function YoutubeModal({ video, onClose }) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="yt-overlay" onClick={onClose} id="yt-modal-backdrop">
      <div className="yt-modal" onClick={e => e.stopPropagation()} id="yt-modal">
        {/* Header */}
        <div className="yt-modal-header">
          <div>
            <div className="yt-modal-title">{video.title}</div>
            <div className="yt-modal-sub">{video.instructor} · {video.duration} min</div>
          </div>
          <button className="yt-close" onClick={onClose} id="yt-close" aria-label="Cerrar">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* YouTube embed */}
        <div className="yt-frame-wrap">
          <iframe
            id="yt-iframe"
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Description */}
        <p className="yt-modal-desc">{video.description}</p>

        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-open-link"
          id="yt-open-youtube"
        >
          <YoutubeIcon />
          Abrir en YouTube
          <ExternalLink size={14} strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function MeditationScreen() {
  const [catFilter,     setCatFilter]     = useState('Todas');
  const [activeTab,     setActiveTab]     = useState('biblioteca');
  const [playing,       setPlaying]       = useState(null);   // youtube video object
  const [breatheActive, setBreatheActive] = useState(false);
  const [breathePhase,  setBreathePhase]  = useState(0);
  const [breatheCount,  setBreatheCount]  = useState(0);
  const [phaseTime,     setPhaseTime]     = useState(0);
  const intervalRef = useRef(null);

  const filtered = catFilter === 'Todas'
    ? LIBRARY
    : LIBRARY.filter(m => m.category === catFilter);

  /* ── Breathe timer ── */
  useEffect(() => {
    if (!breatheActive) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setPhaseTime(t => {
        if (t + 1 >= BREATHE_DURATIONS[breathePhase]) {
          setBreathePhase(p => {
            const next = (p + 1) % 4;
            if (next === 0) setBreatheCount(c => c + 1);
            return next;
          });
          return 0;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [breatheActive, breathePhase]);

  const stopBreathe = () => {
    setBreatheActive(false);
    setBreathePhase(0);
    setPhaseTime(0);
    setBreatheCount(0);
  };

  const breatheProgress = phaseTime / BREATHE_DURATIONS[breathePhase];
  const breatheScale    = breathePhase === 0 ? 1 + breatheProgress * 0.45
    : breathePhase === 1 ? 1.45
    : breathePhase === 2 ? 1.45 - breatheProgress * 0.45
    : 1;

  return (
    <>
      <style>{`
        .med-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 860px;
          margin: 0 auto;
        }
        .med-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          margin-bottom: 6px;
        }
        .med-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Tabs ── */
        .med-tabs {
          display: flex; gap: 0;
          background: var(--surface-container);
          border-radius: var(--radius-full);
          padding: 3px;
          margin-bottom: var(--space-xl);
          width: fit-content;
        }
        .med-tab {
          padding: 9px 24px;
          border-radius: var(--radius-full);
          border: none; cursor: pointer;
          font-size: var(--text-label-md);
          font-weight: 600;
          transition: all var(--transition-spring);
          background: none;
          color: var(--on-surface-variant);
          display: flex; align-items: center; gap: 6px;
          font-family: var(--font-body);
        }
        .med-tab.active {
          background: var(--surface-container-lowest);
          color: var(--primary);
          box-shadow: 0 2px 10px rgba(112,87,101,0.12);
        }

        /* ── Category chips ── */
        .med-cats {
          display: flex; gap: var(--space-sm);
          overflow-x: auto; scrollbar-width: none;
          padding-bottom: 4px;
          margin-bottom: var(--space-lg);
        }
        .med-cats::-webkit-scrollbar { display: none; }
        .med-cat {
          padding: 7px 18px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md); font-weight: 500;
          border: none; cursor: pointer; white-space: nowrap;
          transition: all var(--transition-fast);
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
          font-family: var(--font-body);
        }
        .med-cat.active {
          background: var(--primary);
          color: var(--on-primary);
        }

        /* ── Section head ── */
        .med-section-head {
          display: flex; align-items: center; gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .med-section-title {
          font-size: var(--text-label-sm); font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--on-surface-variant); white-space: nowrap;
        }
        .med-section-line { flex: 1; height: 1px; background: rgba(208,195,200,0.25); }

        /* ── Cards ── */
        .med-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }
        @media (min-width: 640px) {
          .med-list { grid-template-columns: 1fr 1fr; }
        }

        .med-card {
          display: flex; align-items: center; gap: var(--space-md);
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-md) var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: var(--shadow-card);
          cursor: pointer;
          transition: all var(--transition-spring);
        }
        .med-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: rgba(248,215,232,0.35);
        }
        .med-card-icon {
          width: 52px; height: 52px;
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-spring);
        }
        .med-card-body { flex: 1; min-width: 0; }
        .med-card-title {
          font-size: var(--text-label-md); font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .med-card-instructor {
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
          margin-bottom: 6px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .med-card-meta {
          display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
          font-size: var(--text-label-sm); color: var(--on-surface-variant);
        }
        .med-card-chip {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 8px;
          border-radius: 6px; font-size: 10px; font-weight: 700;
          background: var(--surface-container);
        }
        .med-play-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-spring);
          background: var(--primary-container);
          color: var(--on-primary-container);
        }
        .med-play-btn:hover {
          background: var(--primary);
          color: var(--on-primary);
          transform: scale(1.08);
        }
        .med-play-btn:active { transform: scale(0.9); }

        /* ══ YouTube Modal ══ */
        .yt-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease both;
        }
        .yt-modal {
          background: var(--surface);
          border-radius: 24px;
          width: 100%;
          max-width: 720px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.25);
          animation: slideUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both;
          overflow: hidden;
        }
        .yt-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-md);
          padding: var(--space-lg) var(--space-lg) var(--space-md);
        }
        .yt-modal-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--on-surface);
          line-height: 1.3;
        }
        .yt-modal-sub {
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          margin-top: 4px;
        }
        .yt-close {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--surface-container);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--on-surface-variant);
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .yt-close:hover { background: var(--error-container); color: var(--error); }

        .yt-frame-wrap {
          position: relative;
          padding-top: 56.25%; /* 16:9 */
          background: #000;
        }
        .yt-frame-wrap iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .yt-modal-desc {
          padding: var(--space-md) var(--space-lg);
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          line-height: 1.6;
        }

        .yt-open-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0 var(--space-lg) var(--space-lg);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background: var(--surface-container);
          color: var(--on-surface-variant);
          font-size: var(--text-label-md);
          font-weight: 500;
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .yt-open-link:hover {
          background: var(--primary-container);
          color: var(--on-primary-container);
        }

        /* ══ Breathing ══ */
        .breathe-wrap {
          display: flex; flex-direction: column; align-items: center;
          padding: var(--space-xl) 0 var(--space-xxl);
          gap: var(--space-xl);
          min-height: 60vh;
          justify-content: center;
        }
        .breathe-phase-label {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 400;
          color: var(--on-surface);
          transition: color 1s ease;
          text-align: center;
          min-height: 3rem;
        }
        .breathe-circle-wrap {
          position: relative;
          width: 240px; height: 240px;
          display: flex; align-items: center; justify-content: center;
        }
        .breathe-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid var(--primary-container);
          animation: ripple 2.5s ease-out infinite;
          opacity: 0;
        }
        .breathe-ring:nth-child(2) { animation-delay: 0.6s; }
        .breathe-ring:nth-child(3) { animation-delay: 1.2s; }
        .breathe-orb {
          width: 150px; height: 150px;
          border-radius: 50%;
          background: var(--gradient-primary);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          box-shadow: 0 16px 50px rgba(112,87,101,0.25);
          transition: transform 1s cubic-bezier(.4,0,.2,1), background 1s ease;
          position: relative; z-index: 2;
        }
        .breathe-num {
          font-family: var(--font-display);
          font-size: 3rem; font-weight: 500;
          color: white; line-height: 1;
        }
        .breathe-unit {
          font-size: var(--text-label-sm);
          color: rgba(255,255,255,0.75);
          font-weight: 600; letter-spacing: 0.05em;
        }
        .breathe-idle-icon {
          display: flex; flex-direction: column; align-items: center;
          gap: var(--space-sm); color: rgba(255,255,255,0.9);
        }
        .breathe-cycles {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          color: var(--on-surface-variant);
          text-align: center;
        }
        .breathe-cycles span {
          color: var(--primary);
          font-size: 2.5rem; font-weight: 500;
        }
        .breathe-guide-text {
          text-align: center;
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 300px;
          line-height: 1.6;
          white-space: pre-line;
        }
        .breathe-start-btn {
          padding: 14px 36px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          color: white; font-size: var(--text-label-md); font-weight: 700;
          border: none; cursor: pointer;
          box-shadow: 0 8px 24px rgba(112,87,101,0.25);
          transition: all var(--transition-spring);
          letter-spacing: 0.02em;
          font-family: var(--font-body);
        }
        .breathe-start-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(112,87,101,0.3); }
        .breathe-stop-btn {
          padding: 12px 28px;
          border-radius: var(--radius-full);
          background: var(--surface-container);
          color: var(--on-surface-variant);
          font-size: var(--text-label-md); font-weight: 600;
          border: 1.5px solid var(--outline-variant);
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }
        .breathe-stop-btn:hover { background: var(--error-container); color: var(--error); border-color: var(--error-container); }

        @keyframes ripple {
          0%   { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0) scale(1);       opacity: 1; }
        }
      `}</style>

      {/* YouTube modal */}
      {playing && <YoutubeModal video={playing} onClose={() => setPlaying(null)} />}

      <div className="med-screen">
        <h1 className="med-hero-title">Bienestar</h1>
        <p className="med-hero-sub">Meditaciones guiadas y técnicas de respiración para tu mente.</p>

        {/* Tabs */}
        <div className="med-tabs">
          <button
            className={`med-tab${activeTab === 'biblioteca' ? ' active' : ''}`}
            onClick={() => setActiveTab('biblioteca')}
            id="wellness-tab-biblioteca"
          >
            <Headphones size={15} strokeWidth={2} /> Biblioteca
          </button>
          <button
            className={`med-tab${activeTab === 'respiración' ? ' active' : ''}`}
            onClick={() => setActiveTab('respiración')}
            id="wellness-tab-respiracion"
          >
            <Wind size={15} strokeWidth={2} /> Respiración
          </button>
        </div>

        {activeTab === 'biblioteca' ? (
          <>
            {/* Category filter */}
            <div className="med-cats">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`med-cat${catFilter === c ? ' active' : ''}`}
                  onClick={() => setCatFilter(c)}
                  id={`med-cat-${c}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Section head */}
            <div className="med-section-head">
              <span className="med-section-title">
                {catFilter === 'Todas' ? 'Todas las sesiones' : catFilter} — {filtered.length}
              </span>
              <div className="med-section-line" />
            </div>

            {/* Grid of meditation cards */}
            <div className="med-list">
              {filtered.map(med => (
                <div
                  key={med.id}
                  className="med-card"
                  onClick={() => setPlaying(med)}
                  id={`med-card-${med.id}`}
                >
                  <div
                    className="med-card-icon"
                    style={{ background: 'var(--primary-container)' }}
                  >
                    <MedIcon name={med.icon} color="var(--primary)" />
                  </div>

                  <div className="med-card-body">
                    <div className="med-card-title">{med.title}</div>
                    <div className="med-card-instructor">{med.instructor}</div>
                    <div className="med-card-meta">
                      <span className="med-card-chip">
                        <Clock size={10} strokeWidth={2} /> {med.duration} min
                      </span>
                      <span className="med-card-chip">{med.category}</span>
                    </div>
                  </div>

                  <button
                    className="med-play-btn"
                    onClick={e => { e.stopPropagation(); setPlaying(med); }}
                    id={`med-play-${med.id}`}
                    aria-label={`Reproducir ${med.title}`}
                  >
                    <Play size={18} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ── Breathing tab ── */
          <div className="breathe-wrap">
            <div
              className="breathe-phase-label"
              style={{ color: breatheActive ? PHASE_COLORS[breathePhase] : 'var(--on-surface)' }}
            >
              {breatheActive ? BREATHE_PHASES[breathePhase] : 'Respiración 4-7-8'}
            </div>

            <div className="breathe-circle-wrap">
              {breatheActive && (
                <>
                  <div className="breathe-ring" style={{ width: 186, height: 186 }} />
                  <div className="breathe-ring" style={{ width: 210, height: 210 }} />
                  <div className="breathe-ring" style={{ width: 236, height: 236 }} />
                </>
              )}
              <div
                className="breathe-orb"
                style={{
                  transform: breatheActive ? `scale(${breatheScale})` : 'scale(1)',
                  background: breatheActive
                    ? `radial-gradient(circle at 35% 35%, ${PHASE_COLORS[breathePhase]}, var(--primary))`
                    : 'var(--gradient-primary)',
                }}
              >
                {breatheActive ? (
                  <>
                    <span className="breathe-num">{BREATHE_DURATIONS[breathePhase] - phaseTime}</span>
                    <span className="breathe-unit">seg</span>
                  </>
                ) : (
                  <div className="breathe-idle-icon">
                    <Wind size={40} strokeWidth={1.25} color="white" />
                  </div>
                )}
              </div>
            </div>

            {breatheActive && (
              <div className="breathe-cycles">
                Ciclos: <span>{breatheCount}</span>
              </div>
            )}

            <p className="breathe-guide-text">
              {breatheActive
                ? `Fase: ${BREATHE_PHASES[breathePhase]}\n${BREATHE_DURATIONS[breathePhase]} segundos`
                : `Inhala 4s · Sostén 7s · Exhala 8s\nTécnica 4-7-8 para calmar el sistema nervioso.`}
            </p>

            {breatheActive ? (
              <button className="breathe-stop-btn" onClick={stopBreathe} id="breathe-stop">
                <Square size={14} strokeWidth={2} />
                Detener
              </button>
            ) : (
              <button className="breathe-start-btn" onClick={() => setBreatheActive(true)} id="breathe-start">
                Comenzar respiración
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
