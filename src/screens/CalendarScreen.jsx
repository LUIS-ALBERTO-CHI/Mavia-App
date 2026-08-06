import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Search, Check, Plus, Lock, Users, LayoutGrid } from 'lucide-react';
import { localToday } from '../lib/utils';
import Sticker from '../components/Sticker';
import Mascot from '../components/Mascot';
import { DEFAULT_COLOR, formatAmount } from '../lib/entryStyle';

const DAYS_ES   = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO',
                   'SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const MONTHS_CAP = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto',
                    'Septiembre','Octubre','Noviembre','Diciembre'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
function pad(n)               { return String(n).padStart(2, '0'); }
function toDS(y, m, d)        { return `${y}-${pad(m + 1)}-${pad(d)}`; }

const SEGMENTS = [
  { id: 'month', label: 'MES' },
  { id: 'list',  label: 'LISTA' },
  { id: 'week',  label: 'SEMANA' },
  { id: 'day',   label: 'DÍA' },
];

function useTouchSwipe(onLeft, onRight, threshold = 50) {
  const startX = useRef(null);
  const onTouchStart = useCallback((e) => { startX.current = e.touches[0].clientX; }, []);
  const onTouchEnd   = useCallback((e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < threshold) return;
    dx < 0 ? onLeft() : onRight();
    startX.current = null;
  }, [onLeft, onRight, threshold]);
  return { onTouchStart, onTouchEnd };
}

/* Inclinación determinista por id (post-it) */
function tiltOf(id) {
  let h = 0;
  for (const c of String(id || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 5) - 2;
}

/* Post-it arrastrable sobre el calendario */
function CalendarPostit({ note, wrapRef, onCommit, onTap }) {
  const [pos, setPos] = useState({ x: note.cal?.x ?? 0.5, y: note.cal?.y ?? 0.45 });
  const drag = useRef(null);
  useEffect(() => { setPos({ x: note.cal?.x ?? 0.5, y: note.cal?.y ?? 0.45 }); }, [note.cal?.x, note.cal?.y]);

  const onDown = (e) => {
    e.stopPropagation();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { rect, moved: 0, lastX: e.clientX, lastY: e.clientY, x: pos.x, y: pos.y };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    d.moved += Math.abs(e.clientX - d.lastX) + Math.abs(e.clientY - d.lastY);
    d.lastX = e.clientX; d.lastY = e.clientY;
    d.x = Math.min(0.98, Math.max(0.02, (e.clientX - d.rect.left) / d.rect.width));
    d.y = Math.min(0.98, Math.max(0.02, (e.clientY - d.rect.top) / d.rect.height));
    setPos({ x: d.x, y: d.y });
  };
  const onUp = () => {
    const d = drag.current; if (!d) return; drag.current = null;
    if (d.moved < 6) onTap(note);
    else onCommit(note, d.x, d.y);
  };

  const text  = note.text ?? note.content ?? '';
  const decos = (note.stickers || []).slice(0, 4);
  const POS = [{ top: -8, left: -6 }, { top: -8, right: -6 }, { bottom: -8, left: -6 }, { bottom: -8, right: -6 }];
  return (
    <div className={`cal-postit${note.done ? ' done' : ''}`}
      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, background: note.color || '#FDE68A', transform: `translate(-50%,-50%) rotate(${tiltOf(note.id)}deg)` }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {note.done && (
        <svg className="cal-postit-stamp" width="22" height="22" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="12" stroke="var(--error)" strokeWidth="2" />
          <path d="M9 15 l4 4 l8 -9" stroke="var(--error)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {decos.map((sid, i) => (
        <span key={sid} className="cal-postit-deco" style={POS[i]}><Sticker id={sid} size={24} /></span>
      ))}
      <div className="cal-postit-text">{text}</div>
    </div>
  );
}

export default function CalendarScreen() {
  const { state, navigate, dispatch, openEntrySheet, setCurrentSpace, setSelectedDate, updateEntry, showToast } = useApp();
  const now = new Date();
  const todayDS = localToday();

  const spaces         = state.spaces || [];
  const currentSpaceId = state.currentSpaceId || 'personal';
  const currentSpace   = spaces.find(s => s.id === currentSpaceId);
  const showAll        = currentSpaceId === 'all';   // vista "Todos": marcar por espacio

  // Identidad visual por espacio (color elegido o automático por orden) + nombre
  const SPACE_PALETTE = ['#8478c8', '#e888b6', '#6bbd8e', '#7cb8e0', '#e0a72e', '#c9a9e0'];
  const spaceIndex = new Map(spaces.map((s, i) => [s.id, i]));
  const spaceColor = (sid) => {
    if (!sid || sid === 'personal') return '#918da3';
    const sp = spaces.find(s => s.id === sid);
    return sp?.color || SPACE_PALETTE[(spaceIndex.get(sid) ?? 0) % SPACE_PALETTE.length];
  };
  const spaceName  = (sid) => (sid && sid !== 'personal')
    ? (spaces.find(s => s.id === sid)?.name || 'Espacio')
    : 'Personal';

  const [viewYear,    setViewYear]    = useState(now.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [viewMode,    setViewMode]    = useState('month');
  const [slideDir,    setSlideDir]    = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [addDay,      setAddDay]      = useState(null);   // día con el botón ＋ visible (tras tocarlo)
  const [jumpOpen,    setJumpOpen]    = useState(false);  // popover "ir a fecha"
  const [jumpYear,    setJumpYear]    = useState(now.getFullYear());
  const [dragOverDay, setDragOverDay] = useState(null);   // celda destino durante drag (desktop)

  // El ＋ desaparece al cambiar de mes
  useEffect(() => { setAddDay(null); }, [viewMonth, viewYear]);

  // Desktop: layout de dos paneles (calendario + agenda del día)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1080px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1080px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const slide = (dir, fn) => { setSlideDir(dir); setTimeout(() => { fn(); setSlideDir(''); }, 180); };

  const selDate = new Date(viewYear, viewMonth, selectedDay);
  const selDS   = toDS(viewYear, viewMonth, selectedDay);

  /* El día activo alimenta el ＋ global (agenda de papel: agrega en el día seleccionado) */
  useEffect(() => { setSelectedDate(selDS); }, [selDS]);

  /* Post-its del mural fijados en este mes (arrastrables sobre el grid) */
  const gridWrapRef = useRef(null);
  const monthStr    = `${viewYear}-${pad(viewMonth + 1)}`;
  const monthNotes  = (state.journalEntries || []).filter(n => n.cal?.month === monthStr);
  const commitPostit = (note, x, y) => dispatch({ type: 'UPDATE_NOTE', note: { ...note, cal: { ...note.cal, x, y } } });

  /* ── Navegación por unidad de la vista ── */
  const prevMonth = () => slide('right', () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1);
    setSelectedDay(1);
  });
  const nextMonth = () => slide('left', () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1);
    setSelectedDay(1);
  });
  const shiftDay = (delta) => slide(delta < 0 ? 'right' : 'left', () => {
    const d = new Date(selDate); d.setDate(d.getDate() + delta);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(d.getDate());
  });
  const prev = () => (viewMode === 'day') ? shiftDay(-1) : (viewMode === 'week') ? shiftDay(-7) : prevMonth();
  const next = () => (viewMode === 'day') ? shiftDay(1)  : (viewMode === 'week') ? shiftDay(7)  : nextMonth();

  /* Atajos ←→ del teclado (evento global desde App) */
  const navFns = useRef({});
  navFns.current = { prev, next };
  useEffect(() => {
    const h = (e) => (e.detail < 0 ? navFns.current.prev() : navFns.current.next());
    window.addEventListener('mavia:cal-nav', h);
    return () => window.removeEventListener('mavia:cal-nav', h);
  }, []);

  const goToday = () => {
    setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDay(now.getDate());
  };

  const swipe = useTouchSwipe(next, prev);

  const spaceMatch  = (e) => currentSpaceId === 'all' ? true : (e.spaceId || 'personal') === currentSpaceId;
  const clientMatch = (e) => clientFilter === 'all' ? true : e.client === clientFilter;
  const entriesFor = (ds) => state.tasks
    .filter(e => e.date === ds && spaceMatch(e) && clientMatch(e))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  /* ── Month grid math ── */
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const daysInMonth    = getDaysInMonth(viewYear, viewMonth);
  const firstDay       = getFirstDay(viewYear, viewMonth);
  const prevMonthDays  = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  const totalCells     = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  /* ── Week days ── */
  const weekStart = new Date(selDate);
  weekStart.setDate(selDate.getDate() - selDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return { date: d, ds: toDS(d.getFullYear(), d.getMonth(), d.getDate()) };
  });

  const toggle = (id) => dispatch({ type: 'TOGGLE_TASK', id });

  /* Header label per view */
  const headerLabel = (viewMode === 'day')
    ? <>{selectedDay} <span>{MONTHS_CAP[viewMonth]}</span></>
    : <>{MONTHS_ES[viewMonth]} <span>{viewYear}</span></>;

  /* ── Reusable entry row ── */
  const EntryRow = ({ e }) => {
    const color  = e.color || DEFAULT_COLOR;
    const amount = formatAmount(e.amount);
    return (
      <div className={`cal-row${e.completed ? ' done' : ''}`} style={{ borderLeftColor: color, background: `${color}26` }}
        onClick={() => navigate('entryDetail', { entryId: e.id })} id={`cal-row-${e.id}`}>
        <span className="cal-row-bullet" style={{ background: color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`cal-row-title${e.completed ? ' done' : ''}`}>{e.title}</div>
          {(showAll || amount) && (
            <div className="cal-row-meta">
              {showAll && (
                <span className="cal-space-tag" style={{ background: `${spaceColor(e.spaceId)}22`, color: spaceColor(e.spaceId) }}>
                  {spaceName(e.spaceId)}
                </span>
              )}
              {amount && <span style={{ color, fontWeight: 700 }}>{amount}</span>}
            </div>
          )}
        </div>
        {e.sticker && <Sticker id={e.sticker} size={42} className="cal-card-sticker" />}
        <button className={`cal-check${e.completed ? ' on' : ''}`}
          style={e.completed ? { background: color, borderColor: color } : { borderColor: color }}
          onClick={(ev) => { ev.stopPropagation(); toggle(e.id); }}
          aria-label={e.completed ? 'Marcar pendiente' : 'Marcar hecho'}>
          {e.completed && <Check size={13} strokeWidth={3} color="#fff" />}
        </button>
      </div>
    );
  };

  const EmptyDay = ({ ds }) => (
    <div className="cal-empty">
      <Mascot size={200} />
      <p className="cal-empty-t">Nada agendado</p>
      <p className="cal-empty-s">Toca ＋ para agregar algo</p>
    </div>
  );

  const dateHeading = (d) =>
    `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS_CAP[d.getMonth()]}`;

  /* upcoming for LISTA */
  const upcoming = [...state.tasks]
    .filter(e => e.date >= todayDS && spaceMatch(e) && clientMatch(e))
    .sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')));
  const upcomingByDate = upcoming.reduce((acc, e) => { (acc[e.date] ||= []).push(e); return acc; }, {});

  return (
    <>
      <style>{`
        .cal { max-width: 760px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-8); animation: screenEnter 0.4s var(--ease-out) both; box-sizing: border-box; display: flex; flex-direction: column; min-height: 100%; }

        /* ── Topbar ── */
        .cal-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .cal-month-nav { display: flex; align-items: center; gap: 8px; position: relative; }
        /* ── Ir a fecha (popover mes/año al tocar el título) ── */
        .cal-jump-veil { position: fixed; inset: 0; z-index: 29; background: transparent; }
        .cal-jump { position: absolute; top: calc(100% + 8px); left: 0; z-index: 30; width: 252px; padding: 12px;
          background: var(--surface-container-lowest); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-lg); }
        .cal-jump-year { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .cal-jump-year b { font-family: var(--font-display); font-size: var(--text-body-size); color: var(--heading); }
        .cal-jump-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .cal-jump-m { padding: 9px 4px; border: none; border-radius: var(--radius-control); background: var(--surface-container); color: var(--on-surface); font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .cal-jump-m:hover { background: var(--primary-container); }
        .cal-jump-m.today { box-shadow: inset 0 0 0 1.5px var(--primary); }
        .cal-jump-m.cur { background: var(--primary); color: var(--on-primary); }
        .cal-arrow { width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: var(--heading); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background var(--transition-fast); }
        .cal-arrow:hover { background: var(--surface-container); }
        .cal-arrow:active { transform: scale(0.9); }
        .cal-month { font-family: var(--font-display); font-size: 21px; font-weight: 700; color: var(--heading); letter-spacing: -0.01em; white-space: nowrap; background: none; border: none; padding: 0; cursor: pointer; }
        .cal-month span { color: var(--on-surface-variant); font-weight: 700; }
        .cal-top-right { display: flex; align-items: center; gap: 6px; }
        .cal-today-chip { min-width: 38px; height: 34px; padding: 0 11px; border-radius: var(--radius-control); border: 1px solid var(--primary); background: var(--primary-container); color: var(--on-primary-container); font-weight: 700; font-size: var(--text-body-size); cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: var(--font-body); transition: transform var(--transition-fast); }
        .cal-today-chip:hover { transform: scale(1.05); }
        .cal-today-chip:active { transform: scale(0.94); }
        .cal-icon-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; color: var(--primary); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cal-icon-btn:hover { background: var(--surface-container); }

        /* ── Segmented control ── */
        .cal-segs { display: flex; background: var(--surface-container); border-radius: calc(var(--radius-control) + 3px); padding: 3px; gap: 2px; margin-bottom: 12px; box-shadow: inset 0 1px 3px rgba(90,80,130,0.07); }

        /* Selector de espacio */
        .cal-spaces { display: flex; flex-wrap: nowrap; gap: 8px; margin-bottom: 10px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; margin-left: calc(-1 * var(--space-container)); margin-right: calc(-1 * var(--space-container)); padding: 0 var(--space-container) 2px; }
        .cal-spaces::-webkit-scrollbar { display: none; }
        .cal-space { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 99px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .cal-space.active { border-color: var(--primary); background: var(--primary); color: var(--on-primary); box-shadow: 0 2px 8px -2px rgba(140,150,220,0.5); }
        /* Filtro de clientes */
        .cal-clients { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 14px; }
        .cal-client { flex-shrink: 0; padding: 5px 12px; border-radius: 99px; border: none; background: var(--surface-container); color: var(--on-surface-variant); font-family: var(--font-body); font-size: 12px; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .cal-client.active { background: var(--secondary-container); color: var(--on-secondary-container); }
        .cal-seg { flex: 1; padding: 9px 4px; border-radius: var(--radius-control); border: none; background: transparent; cursor: pointer; font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700; letter-spacing: 0.03em; color: var(--on-surface-variant); transition: all var(--transition-fast); }
        .cal-seg.active { background: var(--primary); color: var(--on-primary); box-shadow: 0 1px 2px rgba(90,80,130,0.14), 0 3px 8px -2px rgba(140,150,220,0.4); }

        /* ── Slide anim ── */
        .cal-view { transition: opacity 0.18s ease, transform 0.18s ease; }
        .cal-view.slide-left  { opacity: 0; transform: translateX(-14px); }
        .cal-view.slide-right { opacity: 0; transform: translateX(14px); }
        /* Mes: se ajusta al alto disponible (nunca queda tras la nav) y nunca colapsa vacío */
        .cal-view.is-month { flex: 1; min-height: 0; display: flex; flex-direction: column; }
        .cal-view.is-month .cal-grid-wrap { flex: 1; min-height: 0; display: flex; }
        .cal-view.is-month .cal-grid { flex: 1; min-height: 0; grid-auto-rows: minmax(72px, 1fr); }
        @media (min-width: 768px) { .cal-view.is-month .cal-grid { grid-auto-rows: minmax(104px, 1fr); } }

        /* Post-its arrastrables sobre el calendario */
        .cal-grid-wrap { position: relative; }
        .cal-postit-layer { position: absolute; inset: 0; pointer-events: none; z-index: 6; }
        .cal-postit { position: absolute; pointer-events: auto; width: 42%; max-width: 230px; padding: 9px 11px 11px; border-radius: 9px;
          box-shadow: 0 6px 16px -6px rgba(90,80,130,0.42), 0 1px 2px rgba(90,80,130,0.18);
          cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
        .cal-postit:active { cursor: grabbing; }
        .cal-postit-text { font-family: var(--font-body); font-size: var(--text-caption-size); font-weight: 700; line-height: 1.35; color: #3d3a4e; white-space: pre-wrap; word-break: break-word; max-height: 5.4em; overflow: hidden; }
        /* Tinta sobre papel de contenido (pastel fijo): NO sigue el tema/dark */
        .cal-postit.done .cal-postit-text { opacity: 0.55; text-decoration: line-through; text-decoration-color: rgba(226,85,122,0.7); }
        .cal-postit-stamp { position: absolute; top: 4px; right: 5px; transform: rotate(10deg); }
        .cal-postit-deco { position: absolute; z-index: 2; pointer-events: none; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.18)); }

        /* ── Weekday header ── */
        .cal-dow { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
        .cal-dow div { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; color: var(--on-surface-variant); padding: 2px 0; }
        .cal-dow div:first-child, .cal-dow div:last-child { color: var(--secondary); }

        /* ── Month grid — enmarcado como tarjeta ── */
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid var(--cal-line); border-radius: var(--radius-card); overflow: hidden; box-shadow: var(--shadow-card); background: var(--surface-container-lowest); }
        .cal-cell { position: relative; border-right: 1px solid var(--cal-line); border-bottom: 1px solid var(--cal-line); min-height: 0; padding: 6px 5px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; overflow: hidden; transition: background var(--transition-fast); }
        .cal-cell:nth-child(7n) { border-right: none; }
        @media (min-width: 768px) { .cal-cell { padding: 8px 7px; } }
        .cal-cell:hover { background: var(--surface-container-low); }
        .cal-cell.other { color: var(--outline); cursor: default; }
        .cal-cell.other .cal-num { color: var(--outline); opacity: 0.55; }
        .cal-cell.today, .cal-cell.sel { background: var(--lime-container); box-shadow: inset 0 0 0 2.5px var(--lime); border-radius: var(--radius-control); }
        .cal-num { font-size: var(--text-caption-size); font-weight: 700; color: var(--on-surface); line-height: 1; align-self: flex-start; padding: 1px 2px; }
        .cal-cell.today .cal-num { color: var(--error); font-weight: 700; }

        .cal-chips { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
        .cal-chip { display: flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 7px; font-size: 10px; font-weight: 700; line-height: 1.3; color: #3d3a4e; white-space: nowrap; overflow: hidden; }
        @media (min-width: 768px) { .cal-chip { font-size: 11.5px; padding: 3px 8px; gap: 5px; } }
        .cal-chip-t { overflow: hidden; text-overflow: ellipsis; }
        .cal-chip.done { opacity: 0.5; }
        .cal-chip.done .cal-chip-t { text-decoration: line-through; }
        .cal-chip-more { font-size: 8px; font-weight: 700; color: var(--on-surface-variant); padding-left: 3px; }
        @media (min-width: 768px) { .cal-chip-more { font-size: 10px; } }

        /* Stickers agrupados al fondo de la casilla (máx 3) */
        .cal-stickers { margin-top: auto; display: flex; align-items: flex-end; justify-content: center; gap: 0; padding-top: 2px; }
        .cal-stickers > * { flex-shrink: 0; }
        .cal-stickers > * + * { margin-left: -5px; }   /* cluster: 3 caben en la celda angosta */
        @media (min-width: 768px) { .cal-stickers { gap: 4px; } .cal-stickers > * + * { margin-left: 0; } }

        /* ── Rows (lista/semana/día) ── */
        .cal-list { display: flex; flex-direction: column; gap: 9px; }
        .cal-date-head { font-family: var(--font-display); font-size: var(--text-body-size); font-weight: 700; color: var(--heading); margin: 16px 0 8px; text-transform: capitalize; }
        .cal-date-head:first-child { margin-top: 4px; }
        .cal-row { display: flex; align-items: center; gap: 11px; background: var(--surface-container-lowest); border-radius: var(--radius-card); border-left: 5px solid; box-shadow: var(--shadow-card); padding: 11px 13px; cursor: pointer; transition: box-shadow var(--transition-fast); }
        .cal-row:hover { box-shadow: var(--shadow-md); }
        .cal-row { transition: box-shadow var(--transition-fast), transform 0.14s var(--ease-spring); }
        .cal-row:active { transform: scale(0.985); }
        .cal-cell { transition: background var(--transition-fast), transform 0.1s ease; }
        .cal-cell:active:not(.other) { background: var(--surface-container); }
        .cal-row.done { opacity: 0.62; }
        .cal-row-bullet { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .cal-card-sticker { flex-shrink: 0; margin-left: 4px; }
        .cal-row-title { font-size: var(--text-body-md); font-weight: 700; color: var(--on-surface); line-height: 1.3; }
        .cal-row-title.done { text-decoration: line-through; opacity: 0.6; }
        .cal-row-meta { font-size: var(--text-label-sm); color: var(--on-surface-variant); margin-top: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .cal-space-tag { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 10.5px; font-weight: 700; line-height: 1.4; }
        .cal-check { width: 26px; height: 26px; border-radius: 50%; border: 2px solid; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all var(--transition-spring); position: relative; }
        /* Área táctil ≥44px sin cambiar el tamaño visual */
        .cal-check::after { content: ''; position: absolute; inset: -9px; }
        .cal-arrow { position: relative; }
        .cal-arrow::after, .cal-icon-btn::after, .cal-today-chip::after { content: ''; position: absolute; inset: -6px; }
        .cal-icon-btn, .cal-today-chip { position: relative; }

        /* ── Day view ── */
        .cal-day-head { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 700; color: var(--heading); margin-bottom: 14px; text-transform: capitalize; }

        /* ── Week ── */
        .cal-week-day { margin-bottom: 6px; }
        .cal-week-label { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 8px; }
        .cal-week-label b { font-family: var(--font-display); font-size: var(--text-body-size); font-weight: 700; color: var(--heading); }
        .cal-week-label.is-today b { color: var(--primary); }
        .cal-week-label span { font-size: 12px; color: var(--on-surface-variant); text-transform: capitalize; }
        .cal-week-none { font-size: 12px; color: var(--outline); padding: 2px 0 4px 2px; }

        /* ── Timeline del día ── */
        .cal-allday { margin-bottom: 14px; }
        .cal-allday-h { font-size: 11.5px; font-weight: 700; letter-spacing: 0.03em; color: var(--on-surface-variant); margin-bottom: 6px; text-transform: uppercase; }
        .cal-tl { position: relative; margin-top: 10px; }
        .cal-tl-hour { position: absolute; left: 0; right: 0; border-top: var(--hairline); }
        .cal-tl-label { position: absolute; top: -7px; left: 0; width: 48px; font-size: 10.5px; font-weight: 700; color: var(--outline); background: var(--background); padding-right: 4px; }
        .cal-tl-item { position: absolute; right: 4px; min-height: 42px; display: flex; align-items: center; gap: 8px; padding: 7px 12px;
          border-radius: var(--radius-control); border-left: 4px solid; cursor: pointer; overflow: hidden; box-shadow: var(--shadow-soft); }
        .cal-tl-item.done { opacity: 0.5; }
        .cal-tl-item.done .cal-tl-title { text-decoration: line-through; }
        .cal-tl-time { font-size: 11px; font-weight: 700; color: var(--on-surface-variant); flex-shrink: 0; font-variant-numeric: tabular-nums; }
        .cal-tl-title { font-size: var(--text-caption-size); font-weight: 700; color: var(--on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-tl-now { position: absolute; left: 44px; right: 0; height: 2px; background: var(--error); z-index: 8; border-radius: 2px; pointer-events: none; }
        .cal-tl-now span { position: absolute; left: -5px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--error); }

        /* ── Empty ── */
        .cal-empty { text-align: center; padding: 40px 20px; min-height: 58vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .cal-empty-t { font-family: var(--font-display); font-size: var(--text-section-size); font-weight: 700; color: var(--heading); }
        .cal-empty-s { font-size: var(--text-caption-size); color: var(--on-surface-variant); }
        .cal-empty-add { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 99px; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; font-weight: 700; font-size: var(--text-body-size); }

        /* ── ＋ para agregar en el día tocado (con onda) — paleta Mavia ── */
        .cal-cell.adding { background: var(--primary-container, #e6e1f7); box-shadow: inset 0 0 0 2px var(--primary, #8478c8); border-radius: var(--radius-control); }
        .cal-cell.drop { background: var(--primary-container); box-shadow: inset 0 0 0 2px var(--primary); border-radius: var(--radius-control); }
        @media (hover: hover) and (pointer: fine) { .cal-chip[draggable="true"] { cursor: grab; } .cal-chip[draggable="true"]:active { cursor: grabbing; } }
        .cal-add-fab { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; z-index: 4;
          background: var(--primary); color: var(--on-primary); display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 16px -4px rgba(140,150,220,0.55), 0 2px 4px rgba(90,80,130,0.28);
          animation: calFabPop 0.3s var(--ease-spring, cubic-bezier(0.22,1,0.36,1)) both; }
        .cal-add-fab:active { transform: translate(-50%,-50%) scale(0.9); }
        @keyframes calFabPop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.3); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .cal-add-ripple { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; border-radius: 50%; z-index: 3; pointer-events: none;
          background: color-mix(in srgb, var(--primary, #8478c8) 40%, transparent); transform: translate(-50%,-50%) scale(0.5);
          animation: calRipple 0.6s ease-out forwards; }
        @keyframes calRipple { from { opacity: 0.5; transform: translate(-50%,-50%) scale(0.5); } to { opacity: 0; transform: translate(-50%,-50%) scale(3.4); } }
        @media (prefers-reduced-motion: reduce) { .cal-add-fab, .cal-add-ripple { animation: none; } .cal-add-ripple { display: none; } }

        /* ── Desktop: dos paneles (calendario ancho + agenda del día) ── */
        .cal-body { display: contents; }
        .cal-rail { display: none; }
        @media (min-width: 1080px) {
          .cal { max-width: 1200px; }
          .cal-body { display: flex; flex-direction: row; align-items: stretch; gap: 22px; flex: 1; min-height: 0; }
          .cal-body > .cal-view { flex: 1; min-width: 0; }
          .cal-rail { display: flex; flex-direction: column; width: 336px; flex-shrink: 0; align-self: stretch; overflow-y: auto;
            background: var(--surface-container-lowest); border: 1px solid var(--cal-line); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 18px 16px; }
          .cal-rail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
          .cal-rail-date { font-family: var(--font-display); font-size: var(--text-section-size); font-weight: 700; color: var(--heading); line-height: 1.2; }
          .cal-rail-add { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 99px; border: none; cursor: pointer;
            background: var(--primary); color: var(--on-primary); font-family: var(--font-body); font-weight: 700; font-size: var(--text-caption-size); white-space: nowrap; flex-shrink: 0; transition: transform var(--transition-fast); }
          .cal-rail-add:hover { transform: scale(1.04); }
          .cal-rail-add:active { transform: scale(0.95); }
          .cal-rail .cal-list { display: flex; flex-direction: column; gap: 9px; }
          .cal-rail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; color: var(--on-surface-variant); padding: 14px 0 6px; }
          .cal-rail-empty p { font-size: var(--text-caption-size); }
          .cal-rail-next { margin-top: 16px; border-top: 1px solid var(--cal-line); padding-top: 12px; display: flex; flex-direction: column; gap: 4px; }
          .cal-rail-next-h { font-family: var(--font-display); font-size: var(--text-caption-size); font-weight: 700; color: var(--heading); }
          .cal-rail-next-date { font-size: 11.5px; font-weight: 700; color: var(--on-surface-variant); margin: 7px 0 5px; }
        }
      `}</style>

      <div className="cal" style={{ '--cal-line': 'var(--hairline-color)' }}>
        {/* ── Topbar ── */}
        <div className="cal-top">
          <div className="cal-month-nav">
            <button className="cal-arrow hit44" onClick={prev} aria-label="Anterior"><ChevronLeft size={20} strokeWidth={2} /></button>
            <button className="cal-month" onClick={() => { setJumpYear(viewYear); setJumpOpen(o => !o); }} aria-label="Ir a fecha" aria-expanded={jumpOpen} id="cal-jump-toggle">
              {headerLabel}
            </button>
            <button className="cal-arrow hit44" onClick={next} aria-label="Siguiente"><ChevronRight size={20} strokeWidth={2} /></button>
            {jumpOpen && (
              <>
                <div className="cal-jump-veil" onClick={() => setJumpOpen(false)} />
                <div className="cal-jump" role="dialog" aria-label="Ir a fecha">
                  <div className="cal-jump-year">
                    <button className="cal-arrow hit44" onClick={() => setJumpYear(y => y - 1)} aria-label="Año anterior"><ChevronLeft size={16} strokeWidth={2} /></button>
                    <b>{jumpYear}</b>
                    <button className="cal-arrow hit44" onClick={() => setJumpYear(y => y + 1)} aria-label="Año siguiente"><ChevronRight size={16} strokeWidth={2} /></button>
                  </div>
                  <div className="cal-jump-grid">
                    {MONTHS_CAP.map((m, i) => (
                      <button key={m}
                        className={`cal-jump-m${jumpYear === viewYear && i === viewMonth ? ' cur' : ''}${jumpYear === now.getFullYear() && i === now.getMonth() ? ' today' : ''}`}
                        onClick={() => { setViewYear(jumpYear); setViewMonth(i); setSelectedDay(1); setJumpOpen(false); }}>
                        {m.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="cal-top-right">
            <button className="cal-today-chip" onClick={goToday} aria-label="Ir a hoy">{now.getDate()}</button>
            <button className="cal-icon-btn hit44" onClick={() => navigate('search')} aria-label="Buscar"><Search size={20} strokeWidth={2.2} /></button>
          </div>
        </div>

        {/* ── Segmented ── */}
        <div className="cal-segs">
          {SEGMENTS.map(s => (
            <button key={s.id} className={`cal-seg${viewMode === s.id ? ' active' : ''}`} onClick={() => setViewMode(s.id)} id={`cal-seg-${s.id}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Selector de espacio (solo si hay espacios compartidos) ── */}
        {spaces.length > 0 && (
          <div className="cal-spaces">
            <button className={`cal-space${currentSpaceId === 'personal' ? ' active' : ''}`} onClick={() => { setCurrentSpace('personal'); setClientFilter('all'); }}><Lock size={13} strokeWidth={2} /> Personal</button>
            {spaces.map(s => (
              <button key={s.id} className={`cal-space${currentSpaceId === s.id ? ' active' : ''}`} onClick={() => { setCurrentSpace(s.id); setClientFilter('all'); }}><Users size={14} strokeWidth={2} /> {s.name}</button>
            ))}
            <button className={`cal-space${currentSpaceId === 'all' ? ' active' : ''}`} onClick={() => { setCurrentSpace('all'); setClientFilter('all'); }}><LayoutGrid size={13} strokeWidth={2} /> Todos</button>
          </div>
        )}

        {/* ── Filtro por cliente (en un espacio compartido con clientes) ── */}
        {currentSpace && (currentSpace.clients || []).length > 0 && (
          <div className="cal-clients">
            <button className={`cal-client${clientFilter === 'all' ? ' active' : ''}`} onClick={() => setClientFilter('all')}>Todos los clientes</button>
            {currentSpace.clients.map(c => (
              <button key={c} className={`cal-client${clientFilter === c ? ' active' : ''}`}
                onClick={() => clientFilter === c ? navigate('client', { client: c }) : setClientFilter(c)}
                title={clientFilter === c ? 'Ver cliente' : `Filtrar por ${c}`}>
                {c}{clientFilter === c ? ' ›' : ''}
              </button>
            ))}
          </div>
        )}

        <div className="cal-body">
        <div className={`cal-view${slideDir ? ` slide-${slideDir}` : ''}${viewMode === 'month' ? ' is-month' : ''}`} {...swipe}>

          {/* ═══ MES ═══ */}
          {viewMode === 'month' && (
            <>
              <div className="cal-dow">{['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => <div key={d}>{d}</div>)}</div>
              <div className="cal-grid-wrap" ref={gridWrapRef}>
              <div className="cal-grid" id="cal-month-grid">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const cellDay     = idx - firstDay + 1;
                  const isThisMonth = cellDay >= 1 && cellDay <= daysInMonth;
                  const displayDay  = isThisMonth ? cellDay : cellDay < 1 ? prevMonthDays + cellDay : cellDay - daysInMonth;
                  const isToday     = isThisMonth && isCurrentMonth && cellDay === now.getDate();
                  const isSel       = isThisMonth && cellDay === selectedDay && !isToday;
                  const dayEntries  = isThisMonth ? entriesFor(toDS(viewYear, viewMonth, cellDay)) : [];
                  const visible     = dayEntries.slice(0, 2);
                  const overflow    = dayEntries.length - visible.length;
                  const stickers    = dayEntries.filter(e => e.sticker).slice(-3);   // máx 3, el nuevo reemplaza al anterior
                  return (
                    <div key={idx}
                      className={['cal-cell', !isThisMonth ? 'other' : '', isToday ? 'today' : '', isSel ? 'sel' : '', addDay === cellDay ? 'adding' : '', isThisMonth && dragOverDay === cellDay ? 'drop' : ''].filter(Boolean).join(' ')}
                      onClick={() => {
                        if (!isThisMonth) return;
                        if (isDesktop) {                                          // desktop → solo seleccionar; el rail muestra el día
                          setSelectedDay(cellDay); setAddDay(null);
                        } else if (dayEntries.length > 0) {                       // móvil, día con datos → a la lista
                          setSelectedDay(cellDay); setAddDay(null); setViewMode('day');
                        } else if (addDay === cellDay) {                          // móvil, día vacío, 2º toque → agregar
                          openEntrySheet({ date: toDS(viewYear, viewMonth, cellDay) });
                        } else {                                                 // móvil, día vacío, 1er toque → ＋ con onda
                          setSelectedDay(cellDay); setAddDay(cellDay);
                        }
                      }}
                      onDragOver={isDesktop && isThisMonth ? (ev) => { if (ev.dataTransfer.types.includes('text/mavia-entry')) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; if (dragOverDay !== cellDay) setDragOverDay(cellDay); } } : undefined}
                      onDragLeave={isDesktop && isThisMonth ? () => setDragOverDay(d => (d === cellDay ? null : d)) : undefined}
                      onDrop={isDesktop && isThisMonth ? (ev) => {
                        ev.preventDefault();
                        setDragOverDay(null);
                        const id = ev.dataTransfer.getData('text/mavia-entry');
                        const t = id && state.tasks.find(x => x.id === id);
                        const ds = toDS(viewYear, viewMonth, cellDay);
                        if (t && t.date !== ds) { updateEntry(t, { date: ds }); showToast(`Movida al ${cellDay}`, 'success'); }
                      } : undefined}
                      id={isThisMonth ? `cal-cell-${cellDay}` : undefined}>
                      <span className="cal-num">{displayDay}</span>
                      {isThisMonth && dayEntries.length === 0 && addDay === cellDay && (
                        <>
                          <span className="cal-add-ripple" />
                          <button className="cal-add-fab" aria-label="Agregar en este día"
                            onClick={(ev) => { ev.stopPropagation(); openEntrySheet({ date: toDS(viewYear, viewMonth, cellDay) }); }}>
                            <Plus size={20} strokeWidth={2} />
                          </button>
                        </>
                      )}
                      {visible.length > 0 && (
                        <div className="cal-chips">
                          {visible.map((e, i) => {
                            const c = e.color || DEFAULT_COLOR;
                            const accent = showAll ? { borderLeft: `3px solid ${spaceColor(e.spaceId)}` } : null;
                            return (
                              <div key={e.id || i} className={`cal-chip${e.completed ? ' done' : ''}`} style={{ background: c, ...accent }}
                                draggable={isDesktop || undefined}
                                onDragStart={isDesktop ? (ev) => { ev.stopPropagation(); ev.dataTransfer.setData('text/mavia-entry', e.id); ev.dataTransfer.effectAllowed = 'move'; } : undefined}
                                title={isDesktop ? 'Arrastra para mover de día' : undefined}>
                                <span className="cal-chip-t">{e.title}</span>
                              </div>
                            );
                          })}
                          {overflow > 0 && <span className="cal-chip-more">+{overflow} más</span>}
                        </div>
                      )}
                      {stickers.length > 0 && (
                        <div className="cal-stickers">
                          {stickers.map((e, i) => <Sticker key={e.id || i} id={e.sticker} size={18} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {monthNotes.length > 0 && (
                <div className="cal-postit-layer">
                  {monthNotes.map(n => (
                    <CalendarPostit key={n.id} note={n} wrapRef={gridWrapRef}
                      onCommit={commitPostit} onTap={(nn) => navigate('journal', { noteId: nn.id })} />
                  ))}
                </div>
              )}
              </div>
            </>
          )}

          {/* ═══ LISTA ═══ */}
          {viewMode === 'list' && (
            upcoming.length === 0 ? <EmptyDay /> : (
              <div>
                {Object.keys(upcomingByDate).map(ds => {
                  const d = new Date(ds + 'T00:00:00');
                  return (
                    <div key={ds}>
                      <div className="cal-date-head">{ds === todayDS ? 'Hoy' : dateHeading(d)}</div>
                      <div className="cal-list">{upcomingByDate[ds].map(e => <EntryRow key={e.id} e={e} />)}</div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ═══ SEMANA ═══ */}
          {viewMode === 'week' && (
            <div>
              {weekDays.map(({ date, ds }) => {
                const items = entriesFor(ds);
                const isToday = ds === todayDS;
                return (
                  <div key={ds} className="cal-week-day">
                    <div className={`cal-week-label${isToday ? ' is-today' : ''}`}>
                      <b>{date.getDate()}</b>
                      <span>{DAYS_FULL[date.getDay()]}{isToday ? ' · Hoy' : ''}</span>
                    </div>
                    {items.length === 0
                      ? <div className="cal-week-none">—</div>
                      : <div className="cal-list">{items.map(e => <EntryRow key={e.id} e={e} />)}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ DÍA — timeline con línea de "ahora" ═══ */}
          {viewMode === 'day' && (() => {
            const items  = entriesFor(selDS);
            const allDay = items.filter(e => !e.time);
            const timed  = items.filter(e => e.time).sort((a, b) => a.time.localeCompare(b.time));
            let start = 7, end = 22;
            timed.forEach(e => { const h = parseInt(e.time, 10); if (h < start) start = h; if (h + 1 > end) end = Math.min(23, h + 1); });
            const isToday = selDS === todayDS;
            if (isToday) { const h = now.getHours(); if (h < start) start = h; if (h + 1 > end) end = Math.min(23, h + 1); }
            const HOUR_H = 54;
            const hours = []; for (let h = start; h <= end; h++) hours.push(h);
            const fmtH = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'a.m.' : 'p.m.'}`;
            const nowMin = now.getHours() * 60 + now.getMinutes();
            const collide = {};
            return (
              <div>
                <div className="cal-day-head">{dateHeading(selDate)}{isToday ? ' · Hoy' : ''}</div>
                {items.length === 0 ? <EmptyDay ds={selDS} /> : (
                  <>
                    {allDay.length > 0 && (
                      <div className="cal-allday">
                        <div className="cal-allday-h">Sin hora</div>
                        <div className="cal-list">{allDay.map(e => <EntryRow key={e.id} e={e} />)}</div>
                      </div>
                    )}
                    {timed.length > 0 && (
                      <div className="cal-tl" style={{ height: hours.length * HOUR_H + 20 }}>
                        {hours.map((h, i) => (
                          <div key={h} className="cal-tl-hour" style={{ top: i * HOUR_H }}>
                            <span className="cal-tl-label">{fmtH(h)}</span>
                          </div>
                        ))}
                        {isToday && nowMin >= start * 60 && nowMin <= (end + 1) * 60 && (
                          <div className="cal-tl-now" style={{ top: ((nowMin - start * 60) / 60) * HOUR_H }}><span /></div>
                        )}
                        {timed.map(e => {
                          const [hh, mm] = e.time.split(':').map(Number);
                          const top = (((hh * 60 + (mm || 0)) - start * 60) / 60) * HOUR_H;
                          const idx = (collide[e.time] = (collide[e.time] || 0) + 1) - 1;
                          const c = e.color || DEFAULT_COLOR;
                          return (
                            <div key={e.id} className={`cal-tl-item${e.completed ? ' done' : ''}`}
                              style={{ top: top + idx * 8, left: 56 + idx * 14, borderLeftColor: c, background: `${c}26`, zIndex: 3 + idx }}
                              onClick={() => navigate('entryDetail', { entryId: e.id })} id={`cal-tl-${e.id}`}>
                              <span className="cal-tl-time">{e.time}</span>
                              <span className="cal-tl-title">{e.title}</span>
                              {e.sticker && <Sticker id={e.sticker} size={22} />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

        </div>

        {/* ── Panel de agenda del día (solo desktop, en vista Mes) ── */}
        {viewMode === 'month' && (
          <aside className="cal-rail">
            <div className="cal-rail-head">
              <div className="cal-rail-date">{dateHeading(selDate)}{selDS === todayDS ? ' · Hoy' : ''}</div>
              <button className="cal-rail-add" onClick={() => openEntrySheet({ date: selDS })}>
                <Plus size={15} strokeWidth={2} /> Agregar
              </button>
            </div>
            {entriesFor(selDS).length === 0
              ? <div className="cal-rail-empty"><Mascot size={110} /><p>Nada agendado este día</p></div>
              : <div className="cal-list">{entriesFor(selDS).map(e => <EntryRow key={e.id} e={e} />)}</div>}
            {(() => {
              const nextUp = upcoming.filter(e => e.date > selDS).slice(0, 6);
              if (!nextUp.length) return null;
              const byDate = nextUp.reduce((acc, e) => { (acc[e.date] ||= []).push(e); return acc; }, {});
              return (
                <div className="cal-rail-next">
                  <div className="cal-rail-next-h">Próximos</div>
                  {Object.entries(byDate).map(([ds, items]) => (
                    <div key={ds}>
                      <div className="cal-rail-next-date">{ds === todayDS ? 'Hoy' : dateHeading(new Date(ds + 'T00:00:00'))}</div>
                      <div className="cal-list">{items.map(e => <EntryRow key={e.id} e={e} />)}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </aside>
        )}
        </div>
      </div>
    </>
  );
}
