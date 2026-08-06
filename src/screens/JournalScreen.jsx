import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Plus, X, Check, Pin, Trash2, Sparkles } from 'lucide-react';
import Sticker, { STICKERS, STICKER_CATEGORIES } from '../components/Sticker';
import Mascot from '../components/Mascot';
import { CalendarDays } from 'lucide-react';
import { localToday } from '../lib/utils';

const MONTHS_CAP = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthLabel = (ym) => { const [y, m] = (ym || '').split('-'); return m ? `${MONTHS_CAP[+m - 1]} ${y}` : ''; };

/* Colores de post-it (papel) */
const POSTIT_COLORS = ['#FDE68A', '#BBF7D0', '#FBCFE8', '#BFDBFE', '#FED7AA', '#DDD6FE'];
const DEFAULT_POSTIT = '#FDE68A';

/* Inclinación determinista por id (para que no salte al re-renderizar) */
function tiltOf(id) {
  let h = 0;
  for (const c of String(id || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 5) - 2; // -2..2 grados
}

/* Posición de cada sticker de decoración (hasta 4 esquinas) — poco desborde para no cortarse */
const CORNERS = [
  { top: -8, left: -6 },
  { top: -8, right: -6 },
  { bottom: -8, left: -6 },
  { bottom: -8, right: -6 },
];

export default function JournalScreen() {
  const { state, dispatch, showToast, deleteWithUndo } = useApp();
  const notes = state.journalEntries || [];

  const [editing, setEditing] = useState(null);  // null | {id?, ...form}
  const [stickerCat, setStickerCat] = useState(STICKER_CATEGORIES[0]?.id || null);

  // Si llegamos desde un post-it del calendario, abrir esa nota
  useEffect(() => {
    const nid = state.screenParams?.noteId;
    if (!nid) return;
    const n = (state.journalEntries || []).find(x => x.id === nid);
    if (n) openEdit(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screenParams?.noteId]);

  const sorted = [...notes].sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
    String(b.createdAt || b.id || '').localeCompare(String(a.createdAt || a.id || ''))
  );

  const calMonth = (state.selectedDate || localToday()).slice(0, 7);
  const openNew  = () => { setStickerCat(STICKER_CATEGORIES[0]?.id || null); setEditing({ text: '', color: DEFAULT_POSTIT, done: false, pinned: false, stickers: [], cal: null }); };
  const openEdit = (n) => setEditing({ id: n.id, text: n.text ?? n.content ?? '', color: n.color || DEFAULT_POSTIT, done: !!n.done, pinned: !!n.pinned, stickers: n.stickers || [], cal: n.cal || null });

  const set = (k, v) => setEditing(e => ({ ...e, [k]: v }));
  const toggleSticker = (sid) => setEditing(e => {
    const has = e.stickers.includes(sid);
    if (has) return { ...e, stickers: e.stickers.filter(s => s !== sid) };
    if (e.stickers.length >= 4) { showToast('Máximo 4 stickers', 'default'); return e; }
    return { ...e, stickers: [...e.stickers, sid] };
  });

  const save = () => {
    if (!editing.text.trim()) { showToast('Escribe algo', 'error'); return; }
    const orig = editing.id ? notes.find(n => n.id === editing.id) : null;
    const note = {
      id: editing.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: editing.text.trim(),
      color: editing.color,
      done: editing.done,
      pinned: editing.pinned,
      stickers: editing.stickers,
      cal: editing.cal || null,
      // Firestore NO acepta undefined → siempre una fecha válida (preserva la original al editar)
      createdAt: orig?.createdAt || new Date().toISOString(),
    };
    dispatch({ type: editing.id ? 'UPDATE_NOTE' : 'ADD_NOTE', note });
    showToast(editing.id ? 'Guardado' : '¡Nota creada!', 'success');
    setEditing(null);
  };

  const remove = () => {
    if (editing?.id) deleteWithUndo('note', editing.id);   // toast "Eliminada · Deshacer"
    setEditing(null);
  };

  return (
    <>
      <style>{`
        .nt-screen { max-width: 820px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-8); animation: screenEnter 0.4s var(--ease-out) both; overflow-x: hidden; }
        .nt-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .nt-title { font-family: var(--font-display); font-size: var(--text-headline-lg); font-weight: 700; color: var(--heading); }
        .nt-sub { font-size: var(--text-body-md); color: var(--on-surface-variant); margin-top: 2px; }
        .nt-add { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 99px; border: none; cursor: pointer; background: var(--primary); color: var(--on-primary); font-family: var(--font-body); font-weight: 700; font-size: var(--text-body-size); box-shadow: var(--shadow-fab); flex-shrink: 0; }
        .nt-add:active { transform: scale(0.96); }

        /* Mural tipo mosaico */
        .nt-wall { columns: 2; column-gap: 12px; }
        @media (min-width: 640px) { .nt-wall { columns: 3; } }
        @media (min-width: 900px) { .nt-wall { columns: 4; } }

        .nt-card { break-inside: avoid; margin: 0 0 16px; position: relative; border-radius: 10px; padding: 16px 14px 18px; cursor: pointer;
          box-shadow: 0 6px 16px -6px rgba(90,80,130,0.28), 0 1px 2px rgba(90,80,130,0.12);
          transition: transform 0.16s var(--ease-spring), box-shadow 0.16s ease; }
        .nt-card:hover  { box-shadow: 0 12px 26px -8px rgba(90,80,130,0.34); }
        .nt-card:active { transform: scale(0.98) !important; }
        .nt-card-text { font-family: var(--font-body); font-size: var(--text-body-size); font-weight: 700; line-height: 1.45; color: #3d3a4e; white-space: pre-wrap; word-break: break-word; }
        .nt-card.done .nt-card-text { opacity: 0.55; text-decoration: line-through; text-decoration-color: rgba(226,85,122,0.7); }

        .nt-pin { position: absolute; top: -8px; left: 50%; transform: translateX(-50%) rotate(-8deg); color: var(--error); filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2)); }
        .nt-stamp { position: absolute; top: 6px; right: 8px; color: var(--error); transform: rotate(12deg); opacity: 0.9; }
        .nt-deco { position: absolute; z-index: 2; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.18)); pointer-events: none; }

        .nt-empty { text-align: center; padding: 40px 20px; min-height: 56vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .nt-empty-title { font-family: var(--font-display); font-size: var(--text-section-size); font-weight: 700; color: var(--heading); }
        .nt-empty-sub { font-size: var(--text-caption-size); color: var(--on-surface-variant); }
        .nt-empty .nt-add { margin-top: 6px; }

        /* ── Editor (bottom sheet) ── */
        .nte-backdrop { position: fixed; inset: 0; z-index: 9995; background: var(--overlay); backdrop-filter: blur(6px) saturate(160%); -webkit-backdrop-filter: blur(6px) saturate(160%); animation: fadeIn 0.2s ease both; }
        .nte-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9996; max-height: 92dvh; display: flex; flex-direction: column; background: var(--surface-container-lowest); border-radius: var(--radius-sheet) var(--radius-sheet) 0 0; box-shadow: 0 -8px 40px -8px rgba(40,36,60,0.28); animation: esUp 0.36s cubic-bezier(0.22,1,0.36,1) both; margin: 0 auto; max-width: 640px; }
        @keyframes esUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .nte-handle { width: 38px; height: 5px; border-radius: 99px; background: rgba(120,110,150,0.4); margin: 10px auto 4px; flex-shrink: 0; }
        .nte-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 20px 8px; flex-shrink: 0; }
        .nte-title { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 700; color: var(--heading); }
        .nte-close { width: 34px; height: 34px; border-radius: 50%; background: var(--surface-container); border: none; cursor: pointer; color: var(--on-surface-variant); display: flex; align-items: center; justify-content: center; position: relative; }
        .nte-close::after { content: ''; position: absolute; inset: -6px; }
        .nte-scroll { overflow-y: auto; padding: 4px 20px 12px; }

        .nte-paper { border-radius: 12px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 14px -6px rgba(90,80,130,0.3); }
        .nte-textarea { width: 100%; min-height: 120px; resize: vertical; background: transparent; border: none; outline: none; font-family: var(--font-body); font-size: 16px; font-weight: 700; line-height: 1.5; color: #3d3a4e; }
        .nte-textarea::placeholder { color: rgba(61,58,78,0.45); font-weight: 600; }

        .nte-label { font-size: var(--text-label-md); font-weight: 700; color: var(--on-surface); margin: 14px 0 8px; display: flex; align-items: center; gap: 6px; }
        .nte-colors { display: flex; gap: 10px; flex-wrap: wrap; }
        .nte-color { width: 36px; height: 36px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; display: flex; align-items: center; justify-content: center; transition: transform var(--transition-fast); }
        .nte-color:active { transform: scale(0.9); }
        .nte-color.sel { border-color: var(--on-surface); }

        .nte-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; }
        .nte-row-l { display: flex; align-items: center; gap: 8px; font-size: var(--text-body-md); font-weight: 700; color: var(--on-surface); }
        .nte-toggle { position: relative; width: 46px; height: 26px; border-radius: 99px; border: none; cursor: pointer; flex-shrink: 0; transition: background var(--transition-fast); }
        .nte-toggle.on { background: var(--primary); } .nte-toggle.off { background: var(--surface-variant); }
        .nte-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: transform var(--transition-spring); }
        .nte-toggle.on::after { transform: translateX(20px); }

        .nte-tabs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding-bottom: 6px; }
        .nte-tabs::-webkit-scrollbar { display: none; }
        .nte-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700; cursor: pointer; }
        .nte-tab.sel { border-color: var(--primary); background: var(--primary); color: var(--on-primary); }
        .nte-sgrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 8px; }
        .nte-scell { aspect-ratio: 1; border-radius: var(--radius-control); border: 2px solid transparent; background: var(--surface-container-low); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; }
        .nte-scell.sel { border-color: var(--primary); background: var(--primary-container); }

        .nte-bar { padding: 12px 20px calc(env(safe-area-inset-bottom,0px) + 14px); border-top: 1px solid var(--outline-variant); flex-shrink: 0; background: var(--surface-container-lowest); display: flex; gap: 10px; }
        .nte-save { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 99px; border: none; cursor: pointer; background: var(--primary); color: var(--on-primary); font-size: var(--text-body-md); font-weight: 700; font-family: var(--font-body); box-shadow: var(--shadow-fab); }
        .nte-save:active { transform: scale(0.98); }
        .nte-del { width: 52px; border-radius: 99px; border: 1px solid var(--error-container); background: var(--surface-container-lowest); color: var(--error); cursor: pointer; display: flex; align-items: center; justify-content: center; }
      `}</style>

      <div className="nt-screen">
        <div className="nt-head">
          <div>
            <div className="nt-title">Notas</div>
            <div className="nt-sub">Tus manifestaciones, ideas y recordatorios.</div>
          </div>
          <button className="nt-add" onClick={openNew} id="nt-add"><Plus size={17} strokeWidth={2} /> Nueva</button>
        </div>

        {sorted.length === 0 ? (
          <div className="nt-empty">
            <Mascot size={180} />
            <div className="nt-empty-title">Tu mural está vacío</div>
            <p className="nt-empty-sub">Las notas se pegan como post-its</p>
            <button className="nt-add" onClick={openNew} id="nt-empty-add">＋ Nueva nota</button>
          </div>
        ) : (
          <div className="nt-wall">
            {sorted.map(n => {
              const text = n.text ?? n.content ?? '';
              const decos = (n.stickers || []).slice(0, 4);
              return (
                <div key={n.id} className={`nt-card${n.done ? ' done' : ''}`}
                  style={{ background: n.color || DEFAULT_POSTIT, transform: `rotate(${tiltOf(n.id)}deg)` }}
                  onClick={() => openEdit(n)}>
                  {n.pinned && <Pin size={18} className="nt-pin" fill="currentColor" />}
                  {n.done && (
                    <svg className="nt-stamp" width="30" height="30" viewBox="0 0 30 30" fill="none">
                      <circle cx="15" cy="15" r="12" stroke="var(--error)" strokeWidth="2" />
                      <path d="M9 15 l4 4 l8 -9" stroke="var(--error)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {decos.map((sid, i) => (
                    <span key={sid} className="nt-deco" style={CORNERS[i]}><Sticker id={sid} size={30} /></span>
                  ))}
                  <div className="nt-card-text">{text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor */}
      {editing && createPortal(
        <>
          <div className="nte-backdrop" onClick={() => setEditing(null)} />
          <div className="nte-sheet" role="dialog" aria-modal="true" aria-label={editing.id ? 'Editar nota' : 'Nueva nota'}>
            <div className="nte-handle" />
            <div className="nte-head">
              <span className="nte-title">{editing.id ? 'Editar nota' : 'Nueva nota'}</span>
              <button className="nte-close hit44" onClick={() => setEditing(null)} aria-label="Cerrar"><X size={18} /></button>
            </div>

            <div className="nte-scroll">
              {/* Papel */}
              <div className="nte-paper" style={{ background: editing.color }}>
                <textarea className="nte-textarea" autoFocus placeholder="Escribe tu manifestación, idea o recordatorio…"
                  value={editing.text} onChange={e => set('text', e.target.value)} id="nte-text" />
              </div>

              {/* Color */}
              <div className="nte-label">Color</div>
              <div className="nte-colors">
                {POSTIT_COLORS.map(col => (
                  <button key={col} type="button" className={`nte-color${editing.color === col ? ' sel' : ''}`}
                    style={{ background: col }} onClick={() => set('color', col)} aria-label={`Color ${col}`}>
                    {editing.color === col && <Check size={16} color="#3d3a4e" strokeWidth={3} />}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="nte-row">
                <div className="nte-row-l"><Check size={17} color="var(--error)" /> Cumplido</div>
                <button type="button" className={`nte-toggle ${editing.done ? 'on' : 'off'}`} onClick={() => set('done', !editing.done)} aria-label="Cumplido" />
              </div>
              <div className="nte-row" style={{ paddingTop: 0 }}>
                <div className="nte-row-l"><Pin size={16} /> Fijar arriba</div>
                <button type="button" className={`nte-toggle ${editing.pinned ? 'on' : 'off'}`} onClick={() => set('pinned', !editing.pinned)} aria-label="Fijar" />
              </div>
              <div className="nte-row" style={{ paddingTop: 0 }}>
                <div className="nte-row-l"><CalendarDays size={16} /> En el calendario
                  {editing.cal && <span style={{ fontWeight: 500, color: 'var(--outline)', marginLeft: 4 }}>· {monthLabel(editing.cal.month)}</span>}
                </div>
                <button type="button" className={`nte-toggle ${editing.cal ? 'on' : 'off'}`}
                  onClick={() => set('cal', editing.cal ? null : { month: calMonth, x: 0.5, y: 0.45 })} aria-label="En el calendario" />
              </div>
              {editing.cal && <p style={{ fontSize: 12, color: 'var(--outline)', margin: '2px 0 6px' }}>Aparece en {monthLabel(editing.cal.month)}. Arrástrala en el calendario para colocarla.</p>}

              {/* Decorar con stickers */}
              <div className="nte-label"><Sparkles size={16} /> Decorar <span style={{ fontWeight: 500, color: 'var(--outline)' }}>· máx 4</span></div>
              {STICKER_CATEGORIES.length > 1 && (
                <div className="nte-tabs">
                  {STICKER_CATEGORIES.map(c => (
                    <button key={c.id} type="button" className={`nte-tab${stickerCat === c.id ? ' sel' : ''}`} onClick={() => setStickerCat(c.id)}>{c.label}</button>
                  ))}
                </div>
              )}
              <div className="nte-sgrid">
                {STICKERS.filter(s => s.category === stickerCat).map(s => (
                  <button key={s.id} type="button" className={`nte-scell${editing.stickers.includes(s.id) ? ' sel' : ''}`}
                    onClick={() => toggleSticker(s.id)} aria-label={s.label} title={s.label}>
                    <Sticker id={s.id} size={40} />
                  </button>
                ))}
              </div>
            </div>

            <div className="nte-bar">
              {editing.id && (
                <button className="nte-del" onClick={remove} aria-label="Eliminar nota"><Trash2 size={18} /></button>
              )}
              <button className="nte-save" onClick={save} id="nte-save">
                <Check size={20} strokeWidth={3} />
                {editing.id ? 'Guardar' : 'Crear nota'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
