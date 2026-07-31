import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Search, Check, Plus, Lock, Users, LayoutGrid } from 'lucide-react';
import { formatTime12h, localToday } from '../lib/utils';
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

export default function CalendarScreen() {
  const { state, navigate, dispatch, openEntrySheet, setCurrentSpace } = useApp();
  const now = new Date();
  const todayDS = localToday();

  const spaces         = state.spaces || [];
  const currentSpaceId = state.currentSpaceId || 'personal';
  const currentSpace   = spaces.find(s => s.id === currentSpaceId);

  const [viewYear,    setViewYear]    = useState(now.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [viewMode,    setViewMode]    = useState('month');
  const [slideDir,    setSlideDir]    = useState('');
  const [clientFilter, setClientFilter] = useState('all');

  const slide = (dir, fn) => { setSlideDir(dir); setTimeout(() => { fn(); setSlideDir(''); }, 180); };

  const selDate = new Date(viewYear, viewMonth, selectedDay);
  const selDS   = toDS(viewYear, viewMonth, selectedDay);

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
        <span className="cal-row-ico" style={{ background: color }}>
          {e.sticker ? <Sticker id={e.sticker} size={22} /> : <span className="cal-row-dot" />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`cal-row-title${e.completed ? ' done' : ''}`}>{e.title}</div>
          <div className="cal-row-meta">
            {e.time ? formatTime12h(e.time, '') : 'Todo el día'}
            {amount && <span style={{ color, fontWeight: 800, marginLeft: 6 }}>· {amount}</span>}
          </div>
        </div>
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
      <Mascot size={250} />
      <p>Nada agendado<br/><span style={{ fontSize: 13, opacity: 0.7 }}>Toca ＋ para agregar algo</span></p>
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
        .cal { max-width: 760px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-8); animation: screenEnter 0.4s var(--ease-out) both; }

        /* ── Topbar ── */
        .cal-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .cal-month-nav { display: flex; align-items: center; gap: 8px; }
        .cal-arrow { width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: var(--heading); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background var(--transition-fast); }
        .cal-arrow:hover { background: var(--surface-container); }
        .cal-arrow:active { transform: scale(0.9); }
        .cal-month { font-family: var(--font-display); font-size: 21px; font-weight: 800; color: var(--heading); letter-spacing: -0.01em; white-space: nowrap; }
        .cal-month span { color: var(--on-surface-variant); font-weight: 700; }
        .cal-top-right { display: flex; align-items: center; gap: 6px; }
        .cal-today-chip { min-width: 38px; height: 34px; padding: 0 11px; border-radius: 11px; border: 1.5px solid var(--primary); background: var(--primary-container); color: var(--on-primary-container); font-weight: 800; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: var(--font-body); transition: transform var(--transition-fast); }
        .cal-today-chip:hover { transform: scale(1.05); }
        .cal-today-chip:active { transform: scale(0.94); }
        .cal-icon-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; color: var(--primary); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cal-icon-btn:hover { background: var(--surface-container); }

        /* ── Segmented control ── */
        .cal-segs { display: flex; background: var(--surface-container); border-radius: 14px; padding: 4px; gap: 2px; margin-bottom: 12px; }

        /* Selector de espacio */
        .cal-spaces { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin-bottom: 10px; padding-bottom: 2px; }
        .cal-spaces::-webkit-scrollbar { display: none; }
        .cal-space { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 99px; border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-family: var(--font-body); font-size: 13px; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .cal-space.active { border-color: var(--primary); background: var(--primary); color: var(--on-primary); }
        /* Filtro de clientes */
        .cal-clients { display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; margin-bottom: 14px; padding-bottom: 2px; }
        .cal-clients::-webkit-scrollbar { display: none; }
        .cal-client { flex-shrink: 0; padding: 5px 12px; border-radius: 99px; border: none; background: var(--surface-container); color: var(--on-surface-variant); font-family: var(--font-body); font-size: 12px; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .cal-client.active { background: var(--secondary-container); color: var(--on-secondary-container); }
        .cal-seg { flex: 1; padding: 9px 4px; border-radius: 10px; border: none; background: transparent; cursor: pointer; font-family: var(--font-body); font-size: 13px; font-weight: 800; letter-spacing: 0.03em; color: var(--on-surface-variant); transition: all var(--transition-fast); }
        .cal-seg.active { background: var(--primary); color: var(--on-primary); box-shadow: 0 2px 8px rgba(140,150,220,0.3); }

        /* ── Slide anim ── */
        .cal-view { transition: opacity 0.18s ease, transform 0.18s ease; }
        .cal-view.slide-left  { opacity: 0; transform: translateX(-14px); }
        .cal-view.slide-right { opacity: 0; transform: translateX(14px); }

        /* ── Weekday header ── */
        .cal-dow { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
        .cal-dow div { text-align: center; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; color: var(--on-surface-variant); padding: 2px 0; }
        .cal-dow div:first-child, .cal-dow div:last-child { color: var(--secondary); }

        /* ── Month grid — enmarcado como tarjeta ── */
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid var(--cal-line); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow-card); background: var(--surface-container-lowest); }
        .cal-cell { border-right: 1px solid var(--cal-line); border-bottom: 1px solid var(--cal-line); min-height: 92px; padding: 6px 5px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; overflow: hidden; transition: background var(--transition-fast); }
        .cal-cell:nth-child(7n) { border-right: none; }
        @media (min-width: 900px) { .cal-cell { min-height: 122px; padding: 8px 7px; } }
        .cal-cell:hover { background: var(--surface-container-low); }
        .cal-cell.other { color: var(--outline); cursor: default; }
        .cal-cell.other .cal-num { color: var(--outline); opacity: 0.55; }
        .cal-cell.today, .cal-cell.sel { background: var(--lime-container); box-shadow: inset 0 0 0 2.5px var(--lime); border-radius: 8px; }
        .cal-num { font-size: 13px; font-weight: 700; color: var(--on-surface); line-height: 1; align-self: flex-start; padding: 1px 2px; }
        .cal-cell.today .cal-num { color: var(--error); font-weight: 800; }

        .cal-chips { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
        .cal-chip { display: flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 7px; font-size: 10px; font-weight: 800; line-height: 1.3; color: #3d3a4e; white-space: nowrap; overflow: hidden; }
        @media (min-width: 900px) { .cal-chip { font-size: 11.5px; padding: 3px 8px; gap: 5px; } }
        .cal-chip-t { overflow: hidden; text-overflow: ellipsis; }
        .cal-chip.done { opacity: 0.5; }
        .cal-chip.done .cal-chip-t { text-decoration: line-through; }
        .cal-chip-more { font-size: 8px; font-weight: 800; color: var(--on-surface-variant); padding-left: 3px; }
        @media (min-width: 900px) { .cal-chip-more { font-size: 10px; } }

        /* ── Rows (lista/semana/día) ── */
        .cal-list { display: flex; flex-direction: column; gap: 9px; }
        .cal-date-head { font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--heading); margin: 16px 0 8px; text-transform: capitalize; }
        .cal-date-head:first-child { margin-top: 4px; }
        .cal-row { display: flex; align-items: center; gap: 11px; background: var(--surface-container-lowest); border-radius: 16px; border-left: 5px solid; box-shadow: var(--shadow-card); padding: 11px 13px; cursor: pointer; transition: box-shadow var(--transition-fast); }
        .cal-row:hover { box-shadow: var(--shadow-md); }
        .cal-row.done { opacity: 0.62; }
        .cal-row-ico { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cal-row-dot { width: 9px; height: 9px; border-radius: 50%; background: #fff; }
        .cal-row-title { font-size: var(--text-body-md); font-weight: 700; color: var(--on-surface); line-height: 1.3; }
        .cal-row-title.done { text-decoration: line-through; opacity: 0.6; }
        .cal-row-meta { font-size: var(--text-label-sm); color: var(--on-surface-variant); margin-top: 2px; }
        .cal-check { width: 26px; height: 26px; border-radius: 50%; border: 2px solid; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all var(--transition-spring); }

        /* ── Day view ── */
        .cal-day-head { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 800; color: var(--heading); margin-bottom: 14px; text-transform: capitalize; }

        /* ── Week ── */
        .cal-week-day { margin-bottom: 6px; }
        .cal-week-label { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 8px; }
        .cal-week-label b { font-family: var(--font-display); font-size: 15px; font-weight: 800; color: var(--heading); }
        .cal-week-label.is-today b { color: var(--primary); }
        .cal-week-label span { font-size: 12px; color: var(--on-surface-variant); text-transform: capitalize; }
        .cal-week-none { font-size: 12px; color: var(--outline); padding: 2px 0 4px 2px; }

        /* ── Empty ── */
        .cal-empty { text-align: center; padding: var(--space-lg) var(--space-md); min-height: 58vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
        .cal-empty p { color: var(--on-surface-variant); font-size: var(--text-body-md); }
        .cal-empty-add { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 99px; background: var(--gradient-primary); color: #fff; border: none; cursor: pointer; font-weight: 800; font-size: 14px; }
      `}</style>

      <div className="cal" style={{ '--cal-line': 'rgba(130,120,170,0.16)' }}>
        {/* ── Topbar ── */}
        <div className="cal-top">
          <div className="cal-month-nav">
            <button className="cal-arrow" onClick={prev} aria-label="Anterior"><ChevronLeft size={20} strokeWidth={2.5} /></button>
            <span className="cal-month">{headerLabel}</span>
            <button className="cal-arrow" onClick={next} aria-label="Siguiente"><ChevronRight size={20} strokeWidth={2.5} /></button>
          </div>
          <div className="cal-top-right">
            <button className="cal-today-chip" onClick={goToday} aria-label="Ir a hoy">{now.getDate()}</button>
            <button className="cal-icon-btn" onClick={() => navigate('search')} aria-label="Buscar"><Search size={20} strokeWidth={2.2} /></button>
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
            <button className={`cal-space${currentSpaceId === 'personal' ? ' active' : ''}`} onClick={() => { setCurrentSpace('personal'); setClientFilter('all'); }}><Lock size={13} strokeWidth={2.5} /> Personal</button>
            {spaces.map(s => (
              <button key={s.id} className={`cal-space${currentSpaceId === s.id ? ' active' : ''}`} onClick={() => { setCurrentSpace(s.id); setClientFilter('all'); }}><Users size={14} strokeWidth={2.5} /> {s.name}</button>
            ))}
            <button className={`cal-space${currentSpaceId === 'all' ? ' active' : ''}`} onClick={() => { setCurrentSpace('all'); setClientFilter('all'); }}><LayoutGrid size={13} strokeWidth={2.5} /> Todos</button>
          </div>
        )}

        {/* ── Filtro por cliente (en un espacio compartido con clientes) ── */}
        {currentSpace && (currentSpace.clients || []).length > 0 && (
          <div className="cal-clients">
            <button className={`cal-client${clientFilter === 'all' ? ' active' : ''}`} onClick={() => setClientFilter('all')}>Todos los clientes</button>
            {currentSpace.clients.map(c => (
              <button key={c} className={`cal-client${clientFilter === c ? ' active' : ''}`} onClick={() => setClientFilter(c)}>{c}</button>
            ))}
          </div>
        )}

        <div className={`cal-view${slideDir ? ` slide-${slideDir}` : ''}`} {...swipe}>

          {/* ═══ MES ═══ */}
          {viewMode === 'month' && (
            <>
              <div className="cal-dow">{['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => <div key={d}>{d}</div>)}</div>
              <div className="cal-grid" id="cal-month-grid">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const cellDay     = idx - firstDay + 1;
                  const isThisMonth = cellDay >= 1 && cellDay <= daysInMonth;
                  const displayDay  = isThisMonth ? cellDay : cellDay < 1 ? prevMonthDays + cellDay : cellDay - daysInMonth;
                  const isToday     = isThisMonth && isCurrentMonth && cellDay === now.getDate();
                  const isSel       = isThisMonth && cellDay === selectedDay && !isToday;
                  const dayEntries  = isThisMonth ? entriesFor(toDS(viewYear, viewMonth, cellDay)) : [];
                  const visible     = dayEntries.slice(0, 3);
                  const overflow    = dayEntries.length - visible.length;
                  return (
                    <div key={idx}
                      className={['cal-cell', !isThisMonth ? 'other' : '', isToday ? 'today' : '', isSel ? 'sel' : ''].filter(Boolean).join(' ')}
                      onClick={() => { if (isThisMonth) { setSelectedDay(cellDay); setViewMode('day'); } }}
                      id={isThisMonth ? `cal-cell-${cellDay}` : undefined}>
                      <span className="cal-num">{displayDay}</span>
                      {visible.length > 0 && (
                        <div className="cal-chips">
                          {visible.map((e, i) => {
                            const c = e.color || DEFAULT_COLOR;
                            return (
                              <div key={e.id || i} className={`cal-chip${e.completed ? ' done' : ''}`} style={{ background: c }}>
                                {e.sticker && <Sticker id={e.sticker} size={12} />}
                                <span className="cal-chip-t">{e.title}</span>
                              </div>
                            );
                          })}
                          {overflow > 0 && <span className="cal-chip-more">+{overflow} más</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
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

          {/* ═══ DÍA ═══ */}
          {viewMode === 'day' && (
            <div>
              <div className="cal-day-head">{dateHeading(selDate)}{selDS === todayDS ? ' · Hoy' : ''}</div>
              {entriesFor(selDS).length === 0
                ? <EmptyDay ds={selDS} />
                : <div className="cal-list">{entriesFor(selDS).map(e => <EntryRow key={e.id} e={e} />)}</div>}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
