import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, CheckCircle2, Calendar, BookOpen, Target, Clock, MapPin, TrendingUp, X, Dumbbell, Quote, History } from 'lucide-react';
import { formatTime12h } from '../lib/utils';

const HISTORY_KEY = 'mavia_search_history';
const MAX_HISTORY = 5;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); } catch {}
}

const CATEGORIES = [
  { id: 'tasks',   label: 'Tareas',    icon: CheckCircle2, color: 'var(--primary)',   bg: 'var(--primary-container)'   },
  { id: 'events',  label: 'Eventos',   icon: Calendar,     color: 'var(--secondary)', bg: 'var(--secondary-container)' },
  { id: 'journal', label: 'Diario',    icon: BookOpen,     color: '#695e37',          bg: '#FDF8EC'                     },
  { id: 'goals',   label: 'Objetivos', icon: Target,       color: 'var(--tertiary)',  bg: 'var(--tertiary-container)'   },
  { id: 'habits',  label: 'Hábitos',   icon: Dumbbell,     color: '#546347',          bg: 'rgba(84,99,71,0.12)'         },
  { id: 'phrases', label: 'Frases',    icon: Quote,        color: '#705765',          bg: 'rgba(112,87,101,0.1)'        },
];

export default function SearchScreen() {
  const { state, navigate } = useApp();
  const [query, setQuery]         = useState('');
  const [activeCategory, setActiveCategory] = useState('tasks');
  const [history, setHistory]     = useState(loadHistory);
  const inputRef                  = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = (q) => {
    setQuery(q);
    if (q.trim().length > 1) {
      const updated = [q.trim(), ...history.filter(h => h !== q.trim())].slice(0, MAX_HISTORY);
      setHistory(updated);
      saveHistory(updated);
    }
  };

  const removeHistory = (item) => {
    const updated = history.filter(h => h !== item);
    setHistory(updated);
    saveHistory(updated);
  };

  const q = query.toLowerCase().trim();

  const results = {
    tasks:   q ? state.tasks.filter(t => t.title.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)) : [],
    events:  q ? state.events.filter(e => e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)) : [],
    journal: q ? state.journalEntries.filter(e => e.content.toLowerCase().includes(q)) : [],
    goals:   q ? state.goals.filter(g => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)) : [],
    habits:  q ? (state.habits || []).filter(h => h.name?.toLowerCase().includes(q) || h.category?.toLowerCase().includes(q)) : [],
    phrases: q ? (state.phrases || []).filter(p => p.text?.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q)) : [],
  };

  const totalResults = Object.values(results).reduce((a, r) => a + r.length, 0);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <>
      <style>{`
        /* ======= SEARCH SCREEN ======= */
        .srch-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.35s var(--ease-out) both;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .srch-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .srch-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Search bar ── */
        .srch-bar-wrap {
          position: relative;
          margin-bottom: var(--space-lg);
        }
        .srch-bar-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--outline);
          pointer-events: none;
          transition: color var(--transition-fast);
        }
        .srch-bar-wrap:focus-within .srch-bar-icon { color: var(--primary); }
        .srch-bar {
          width: 100%;
          padding: 14px 48px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--outline-variant);
          background: var(--surface-container-lowest);
          font-size: var(--text-body-md);
          font-family: var(--font-body);
          color: var(--on-surface);
          outline: none;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 20px rgba(112,87,101,0.04);
        }
        .srch-bar:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(112,87,101,0.1), 0 4px 20px rgba(112,87,101,0.06);
        }
        .srch-bar::placeholder { color: var(--outline); }
        .srch-clear {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--surface-container);
          border: none;
          cursor: pointer;
          color: var(--on-surface-variant);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }
        .srch-clear:hover { background: var(--surface-container-high); }

        /* ── Category chips ── */
        .srch-cats {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          scrollbar-width: none;
          margin-bottom: var(--space-xl);
          padding-bottom: 4px;
        }
        .srch-cat {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 500;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
          background: var(--surface-container-high);
          color: var(--on-surface-variant);
        }
        .srch-cat.active {
          color: var(--on-primary);
          background: var(--primary);
        }
        .srch-cat:not(.active):hover {
          background: var(--primary-container);
          color: var(--on-primary-container);
        }
        .srch-cat-badge {
          font-size: 10px;
          font-weight: 700;
          background: var(--surface-container);
          color: inherit;
          padding: 1px 6px;
          border-radius: 99px;
        }

        /* ── Section head ── */
        .srch-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .srch-section-title {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .srch-section-line {
          flex: 1;
          height: 1px;
          background: rgba(208,195,200,0.25);
        }

        /* ── Result cards ── */
        .srch-results {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .srch-result {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-md) var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 16px rgba(112,87,101,0.04);
          cursor: pointer;
          transition: all var(--transition-spring);
        }
        .srch-result:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(112,87,101,0.09);
        }
        .srch-result:active { transform: scale(0.99); }

        .srch-result-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .srch-result-body { flex: 1; min-width: 0; }
        .srch-result-title {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .srch-result-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }
        .srch-result-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── Empty / Idle state ── */
        .srch-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .srch-empty-icon {
          width: 88px;
          height: 88px;
          border-radius: var(--radius-full);
          background: var(--primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 3s ease-in-out infinite;
        }
        .srch-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
        }
        .srch-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 260px;
          line-height: var(--leading-relaxed);
        }
      `}</style>

      <div className="srch-screen">

        {/* ── Hero ── */}
        <h1 className="srch-hero-title">Buscar</h1>
        <p className="srch-hero-sub">Encuentra tareas, eventos, notas, hábitos, frases y objetivos al instante.</p>

        {/* ── Search bar ── */}
        <div className="srch-bar-wrap">
          <Search size={18} className="srch-bar-icon" />
          <input
            ref={inputRef}
            className="srch-bar"
            type="text"
            placeholder="¿Qué estás buscando?"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            id="search-input"
          />
          {query && (
            <button className="srch-clear" onClick={() => setQuery('')} aria-label="Limpiar">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Search history (shown when query is empty) ── */}
        {!query && history.length > 0 && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <History size={13} strokeWidth={2} />
              Recientes
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {history.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container)', borderRadius: 99, overflow: 'hidden' }}>
                  <button
                    onClick={() => setQuery(item)}
                    style={{ background: 'none', border: 'none', padding: '6px 12px 6px 14px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {item}
                  </button>
                  <button
                    onClick={() => removeHistory(item)}
                    style={{ background: 'none', border: 'none', padding: '6px 10px 6px 4px', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}
                    aria-label={`Eliminar ${item}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Category chips ── */}
        <div className="srch-cats">
          {CATEGORIES.map(c => {
            const CatIcon = c.icon;
            return (
              <button
                key={c.id}
                className={`srch-cat${activeCategory === c.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(c.id)}
                id={`search-cat-${c.id}`}
              >
                <CatIcon size={14} strokeWidth={2} />
                {c.label}
                {q && results[c.id].length > 0 && (
                  <span className="srch-cat-badge">{results[c.id].length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Idle state ── */}
        {!q && history.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 'var(--space-xl)' }}>
            <svg className="empty-state-illustration" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="55" r="32" stroke="var(--primary)" strokeWidth="4" strokeDasharray="6 4" opacity="0.4"/>
              <circle cx="60" cy="55" r="20" fill="var(--primary-container)" />
              <path d="M75 70 L90 85" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="60" cy="55" r="8" fill="var(--primary)" opacity="0.6" />
            </svg>
            <p className="empty-state-title">Busca lo que necesitas</p>
            <p className="empty-state-sub">Tareas, eventos, notas, hábitos y objetivos. Todo en un solo lugar.</p>
          </div>
        )}

        {/* ── No results ── */}
        {q && totalResults === 0 && (
          <div className="srch-empty">
            <div className="srch-empty-icon" style={{ background: 'var(--surface-container)' }}>
              <Search size={38} color="var(--outline)" strokeWidth={1.25} />
            </div>
            <div className="srch-empty-title">Sin resultados</div>
            <p className="srch-empty-sub">
              No encontramos nada para "<strong>{query}</strong>". Prueba con otra búsqueda.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {q && results[activeCategory].length > 0 && (
          <>
            <div className="srch-section-head">
              <span className="srch-section-title">
                {activeCat?.label} — {results[activeCategory].length} resultado{results[activeCategory].length !== 1 ? 's' : ''}
              </span>
              <div className="srch-section-line" />
            </div>

            <div className="srch-results">
              {results[activeCategory].map(item => {
                const cat = activeCategory;
                return (
                  <div
                    key={item.id}
                    className="srch-result"
                    onClick={() => {
                      if (cat === 'tasks')        navigate('taskDetail', { taskId: item.id });
                      else if (cat === 'events')  navigate('events');
                      else if (cat === 'journal') navigate('journal');
                      else if (cat === 'habits')  navigate('habits');
                      else if (cat === 'phrases') navigate('phrases');
                      else navigate('goals');
                    }}
                    id={`search-result-${item.id}`}
                  >
                    {/* Icon */}
                    <div className="srch-result-icon" style={{ background: activeCat?.bg }}>
                      {activeCat && <activeCat.icon size={18} color={activeCat.color} strokeWidth={1.75} />}
                    </div>

                    {/* Body */}
                    <div className="srch-result-body">
                      <div className="srch-result-title">
                        {item.title || item.name || item.content?.slice(0, 70) + '…' || item.text?.slice(0, 70)}
                      </div>
                      <div className="srch-result-meta">
                        {cat === 'tasks' && (
                          <>
                            <span className="srch-result-chip" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
                              {item.category}
                            </span>
                            <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                              <Clock size={12} /> {item.date}
                            </span>
                            {item.completed && <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>✓ Completada</span>}
                          </>
                        )}
                        {cat === 'events' && (
                          <>
                            <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                              <Clock size={12} /> {item.startTime}–{item.endTime}
                            </span>
                            {item.location && (
                              <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                                <MapPin size={12} /> {item.location}
                              </span>
                            )}
                          </>
                        )}
                        {cat === 'journal' && (
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={12} /> {item.date}
                          </span>
                        )}
                        {cat === 'goals' && (
                          <>
                            <span className="srch-result-chip" style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }}>
                              {item.category}
                            </span>
                            <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                              <TrendingUp size={12} /> {item.progress}%
                            </span>
                          </>
                        )}
                        {cat === 'habits' && (
                          <>
                            <span className="srch-result-chip" style={{ background: 'rgba(84,99,71,0.12)', color: '#546347' }}>
                              {item.category || 'Hábito'}
                            </span>
                            <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                              🔥 {item.streak || 0} días de racha
                            </span>
                          </>
                        )}
                        {cat === 'phrases' && (
                          <span style={{ fontStyle:'italic', color:'var(--on-surface-variant)', fontSize:12 }}>
                            {item.author ? `— ${item.author}` : 'Frase del día'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </>
  );
}
