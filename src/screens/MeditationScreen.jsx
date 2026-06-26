import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, SkipBack, SkipForward, Play, Pause, Square, Clock, Headphones, Wind, Sparkles } from 'lucide-react';

const CATEGORIES = ['Todas', 'Ansiedad', 'Concentración', 'Dormir', 'Gratitud', 'Energía'];

const BREATHE_PHASES    = ['Inhala', 'Sostén', 'Exhala', 'Pausa'];
const BREATHE_DURATIONS = [4, 7, 8, 1];

const PHASE_COLORS = ['#A8C5A0', '#EDE7F6', '#F8D7E8', '#FDF8EC'];

const ICON_MAP = {
  wave:    () => <Wind    size={22} strokeWidth={1.5} />,
  focus:   () => <Sparkles size={22} strokeWidth={1.5} />,
  sleep:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  flower:  () => <Heart   size={22} strokeWidth={1.5} />,
  sun:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  breathe: () => <Wind    size={22} strokeWidth={1.5} />,
};

function MedIcon({ name, size = 22, color }) {
  const Comp = ICON_MAP[name] || ICON_MAP.wave;
  return <span style={{ color, display: 'flex', alignItems: 'center' }}><Comp /></span>;
}

export default function MeditationScreen() {
  const { state } = useApp();
  const [catFilter,     setCatFilter]     = useState('Todas');
  const [activeTab,     setActiveTab]     = useState('biblioteca');
  const [playing,       setPlaying]       = useState(null);
  const [breatheActive, setBreatheActive] = useState(false);
  const [breathePhase,  setBreathePhase]  = useState(0);
  const [breatheCount,  setBreatheCount]  = useState(0);
  const [phaseTime,     setPhaseTime]     = useState(0);
  const intervalRef = useRef(null);

  const meditations = state.meditations || [];
  const filtered    = catFilter === 'Todas' ? meditations : meditations.filter(m => m.category === catFilter);

  useEffect(() => {
    if (!breatheActive) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setPhaseTime(t => {
        if (t + 1 >= BREATHE_DURATIONS[breathePhase]) {
          setBreathePhase(p => { const next = (p + 1) % 4; if (next === 0) setBreatheCount(c => c + 1); return next; });
          return 0;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [breatheActive, breathePhase]);

  const stopBreathe = () => { setBreatheActive(false); setBreathePhase(0); setPhaseTime(0); setBreatheCount(0); };

  const breatheProgress = phaseTime / BREATHE_DURATIONS[breathePhase];
  const breatheScale    = breathePhase === 0 ? 1 + breatheProgress * 0.45
    : breathePhase === 1 ? 1.45
    : breathePhase === 2 ? 1.45 - breatheProgress * 0.45
    : 1;

  return (
    <>
      <style>{`
        /* ======= MEDITATION / WELLNESS SCREEN ======= */
        .med-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Hero ── */
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

        /* ── Segmented control ── */
        .med-tabs {
          display: flex;
          gap: 0;
          background: var(--surface-container);
          border-radius: var(--radius-full);
          padding: 3px;
          margin-bottom: var(--space-xl);
          width: fit-content;
        }
        .med-tab {
          padding: 9px 24px;
          border-radius: var(--radius-full);
          border: none;
          cursor: pointer;
          font-size: var(--text-label-md);
          font-weight: 600;
          transition: all var(--transition-spring);
          background: none;
          color: var(--on-surface-variant);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .med-tab.active {
          background: var(--surface-container-lowest);
          color: var(--primary);
          box-shadow: 0 2px 10px rgba(112,87,101,0.12);
        }

        /* ── Category chips ── */
        .med-cats {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
          margin-bottom: var(--space-lg);
        }
        .med-cats::-webkit-scrollbar { display: none; }
        .med-cat {
          padding: 7px 18px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 500;
          border: none; cursor: pointer; white-space: nowrap;
          transition: all var(--transition-fast);
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
        }
        .med-cat.active {
          background: var(--primary);
          color: var(--on-primary);
        }

        /* ── Now playing banner ── */
        .med-now-playing {
          background: var(--gradient-primary);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          color: white;
          margin-bottom: var(--space-lg);
          box-shadow: 0 12px 40px rgba(112,87,101,0.22);
          position: relative;
          overflow: hidden;
        }
        .med-now-playing::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
        }
        .med-np-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.75;
          margin-bottom: 6px;
        }
        .med-np-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 400;
          margin-bottom: var(--space-md);
        }
        .med-np-prog {
          height: 4px;
          background: rgba(255,255,255,0.25);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: var(--space-md);
        }
        .med-np-prog-fill {
          height: 100%;
          width: 35%;
          background: var(--surface-container-low);
          border-radius: 4px;
          animation: progAnim 3s linear infinite;
        }
        @keyframes progAnim { 0% { width: 20%; } 100% { width: 90%; } }
        .med-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-lg);
          position: relative; z-index: 1;
        }
        .med-ctrl-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white;
          transition: all var(--transition-fast);
        }
        .med-ctrl-btn.main {
          width: 56px; height: 56px;
          background: rgba(255,255,255,0.28);
        }
        .med-ctrl-btn:hover { background: rgba(255,255,255,0.32); }
        .med-ctrl-btn:active { transform: scale(0.9); }

        /* ── Meditation list ── */
        .med-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .med-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-md) var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          cursor: pointer;
          transition: all var(--transition-spring);
        }
        .med-card:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(112,87,101,0.09); }
        .med-card.active {
          border-color: rgba(248,215,232,0.4);
          background: linear-gradient(135deg, rgba(248,215,232,0.12), rgba(237,231,246,0.1));
        }
        .med-card-icon {
          width: 50px; height: 50px;
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-spring);
        }
        .med-card-body { flex: 1; min-width: 0; }
        .med-card-title {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .med-card-meta {
          display: flex; align-items: center;
          flex-wrap: wrap; gap: 6px;
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }
        .med-card-chip {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 10px; font-weight: 700;
          background: var(--surface-container);
        }
        .med-play-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-spring);
        }
        .med-play-btn:active { transform: scale(0.88); }

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

        /* ══════════════ BREATHING ══════════════ */
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
          gap: var(--space-sm);
          color: rgba(255,255,255,0.9);
        }

        .breathe-cycles {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          color: var(--on-surface-variant);
          text-align: center;
        }
        .breathe-cycles span {
          color: var(--primary);
          font-size: 2.5rem;
          font-weight: 500;
        }

        .breathe-guide-text {
          text-align: center;
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 300px;
          line-height: var(--leading-relaxed);
          white-space: pre-line;
        }

        .breathe-start-btn {
          padding: 14px 36px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          color: white;
          font-size: var(--text-label-md);
          font-weight: 700;
          border: none; cursor: pointer;
          box-shadow: 0 8px 24px rgba(112,87,101,0.25);
          transition: all var(--transition-spring);
          letter-spacing: 0.02em;
        }
        .breathe-start-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(112,87,101,0.3); }
        .breathe-stop-btn {
          padding: 12px 28px;
          border-radius: var(--radius-full);
          background: var(--surface-container);
          color: var(--on-surface-variant);
          font-size: var(--text-label-md);
          font-weight: 600;
          border: 1.5px solid var(--outline-variant);
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all var(--transition-fast);
        }
        .breathe-stop-btn:hover { background: var(--error-container); color: var(--error); border-color: var(--error-container); }
      `}</style>

      <div className="med-screen">

        {/* ── Hero ── */}
        <h1 className="med-hero-title">Bienestar</h1>
        <p className="med-hero-sub">Cuida tu mente con sesiones de meditación y respiración.</p>

        {/* ── Segmented tabs ── */}
        <div className="med-tabs">
          <button
            className={`med-tab${activeTab === 'biblioteca' ? ' active' : ''}`}
            onClick={() => setActiveTab('biblioteca')}
            id="wellness-tab-biblioteca"
          >
            <Headphones size={15} strokeWidth={2} />
            Biblioteca
          </button>
          <button
            className={`med-tab${activeTab === 'respiración' ? ' active' : ''}`}
            onClick={() => setActiveTab('respiración')}
            id="wellness-tab-respiracion"
          >
            <Wind size={15} strokeWidth={2} />
            Respiración
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

            {/* Now playing */}
            {playing && (
              <div className="med-now-playing">
                <div className="med-np-label">Reproduciendo ahora</div>
                <div className="med-np-title">{playing.title}</div>
                <div className="med-np-prog"><div className="med-np-prog-fill" /></div>
                <div className="med-controls">
                  <button className="med-ctrl-btn" id="player-prev"><SkipBack size={18} strokeWidth={2} /></button>
                  <button className="med-ctrl-btn main" onClick={() => setPlaying(null)} id="player-pause">
                    <Pause size={22} strokeWidth={2} />
                  </button>
                  <button className="med-ctrl-btn" id="player-next"><SkipForward size={18} strokeWidth={2} /></button>
                </div>
              </div>
            )}

            {/* Section head */}
            <div className="med-section-head">
              <span className="med-section-title">
                {catFilter === 'Todas' ? 'Todas las sesiones' : catFilter} — {filtered.length}
              </span>
              <div className="med-section-line" />
            </div>

            {/* List */}
            <div className="med-list">
              {filtered.map(med => {
                const isPlaying = playing?.id === med.id;
                return (
                  <div
                    key={med.id}
                    className={`med-card${isPlaying ? ' active' : ''}`}
                    onClick={() => setPlaying(isPlaying ? null : med)}
                    id={`med-card-${med.id}`}
                  >
                    <div
                      className="med-card-icon"
                      style={{ background: isPlaying ? 'var(--gradient-primary)' : 'var(--primary-container)' }}
                    >
                      <MedIcon name={med.icon} color={isPlaying ? 'white' : 'var(--primary)'} />
                    </div>

                    <div className="med-card-body">
                      <div className="med-card-title">{med.title}</div>
                      <div className="med-card-meta">
                        <span className="med-card-chip">
                          <Clock size={10} strokeWidth={2} /> {med.duration} min
                        </span>
                        <span className="med-card-chip">{med.category}</span>
                        {med.isFavorite && (
                          <Heart size={12} color="var(--primary)" fill="var(--primary)" />
                        )}
                      </div>
                    </div>

                    <button
                      className="med-play-btn"
                      style={{
                        background: isPlaying ? 'var(--gradient-primary)' : 'var(--primary-container)',
                        color:      isPlaying ? 'white' : 'var(--primary)',
                      }}
                      id={`med-play-${med.id}`}
                    >
                      {isPlaying ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
                    </button>
                  </div>
                );
              })}
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
                Ciclos completados: <span>{breatheCount}</span>
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
