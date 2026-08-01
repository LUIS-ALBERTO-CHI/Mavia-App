import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Check, DollarSign, Bell, Repeat, X, Lock, Users, Plus } from 'lucide-react';
import { TimePicker } from './ui/time-picker';
import { localToday } from '../lib/utils';

const DAYS_FULL  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_LOW = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// Opciones rápidas de recordatorio (un toque) — franja del día
const REMINDER_PRESETS = [
  { label: 'Mañana', sub: '9:00 am', time: '09:00' },
  { label: 'Tarde',  sub: '3:00 pm', time: '15:00' },
  { label: 'Noche',  sub: '8:00 pm', time: '20:00' },
];
const PRESET_TIMES = REMINDER_PRESETS.map(p => p.time);
function formatDayLabel(ds) {
  if (!ds) return '';
  const d = new Date(ds + 'T00:00:00');
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS_LOW[d.getMonth()]}`;
}
import Sticker, { STICKERS, STICKER_CATEGORIES } from './Sticker';
import { HIGHLIGHTERS, DEFAULT_COLOR, REPEAT_OPTIONS } from '../lib/entryStyle';

/**
 * CreateEntrySheet — bottom sheet kawaii para crear/editar una "entrada".
 * Se muestra como overlay sobre la pantalla actual (state.entrySheet != null).
 */
export default function CreateEntrySheet() {
  const { state, dispatch, showToast, closeEntrySheet, addClient } = useApp();

  const params    = state.entrySheet || {};
  const entryId   = params.entryId || null;
  const editEntry = entryId ? state.tasks.find(t => t.id === entryId) : null;
  const isEdit    = !!editEntry;
  const paramDate = params.date || localToday();

  const initialSpace = editEntry?.spaceId
    || (params.spaceId)
    || (state.currentSpaceId !== 'all' ? state.currentSpaceId : 'personal')
    || 'personal';

  const [form, setForm] = useState(() => ({
    title:          editEntry?.title          || '',
    date:           editEntry?.date           || paramDate,
    time:           editEntry?.time           || '',
    allDay:         editEntry ? !editEntry.time : true,
    color:          editEntry?.color          || DEFAULT_COLOR,
    sticker:        editEntry?.sticker        || null,
    note:           editEntry?.note           || editEntry?.notes || '',
    amount:         editEntry?.amount != null ? String(editEntry.amount) : '',
    reminder:       editEntry?.reminder       || false,
    reminderTime:   editEntry?.reminderTime   || '09:00',
    reminderOffset: editEntry?.reminderOffset || 15,
    repeat:         editEntry?.repeat         || 'No repetir',
    spaceId:        initialSpace,
    client:         editEntry?.client         || '',
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stickerCat, setStickerCat] = useState(STICKER_CATEGORIES[0]?.id || null);
  const [customReminder, setCustomReminder] = useState(
    !!(editEntry?.reminder && editEntry?.reminderTime && !PRESET_TIMES.includes(editEntry.reminderTime))
  );

  const spaces      = state.spaces || [];
  const activeSpace = spaces.find(s => s.id === form.spaceId);
  const spaceClients = activeSpace?.clients || [];

  const handleSave = () => {
    if (!form.title.trim()) { showToast('Escribe un título', 'error'); return; }
    const amountNum = form.amount.trim() === '' ? null : Number(form.amount.replace(/[^0-9.]/g, ''));
    const isShared = form.spaceId && form.spaceId !== 'personal';
    const base = {
      title:  form.title.trim(),
      date:   form.date,
      time:   '',
      color:  form.color,
      sticker: form.sticker,
      note:   form.note.trim(),
      amount: amountNum != null && !isNaN(amountNum) ? amountNum : null,
      reminder: form.reminder,
      reminderTime: form.reminder ? form.reminderTime : '',
      reminderOffset: form.reminderOffset,
      repeat: form.repeat,
      spaceId: form.spaceId || 'personal',
      client: isShared ? (form.client || '') : '',
    };
    if (isEdit) {
      dispatch({ type: 'UPDATE_TASK', task: { ...editEntry, ...base } });
      showToast('Guardado', 'success');
    } else {
      dispatch({ type: 'ADD_TASK', task: { ...base, completed: false } });
      showToast('¡Agregado!', 'success');
    }
    closeEntrySheet();
  };

  return createPortal(
    <>
      <style>{`
        .es-backdrop {
          position: fixed; inset: 0; z-index: 9995;
          background: rgba(40,36,60,0.38);
          backdrop-filter: blur(6px) saturate(160%); -webkit-backdrop-filter: blur(6px) saturate(160%);
          animation: fadeIn 0.2s ease both;
        }
        .es-sheet {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 9996;
          max-height: 92dvh; display: flex; flex-direction: column;
          background: var(--surface-container-lowest);
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -8px 40px -8px rgba(40,36,60,0.28), 0 -1px 0 rgba(255,255,255,0.5) inset;
          animation: esUp 0.36s cubic-bezier(0.22,1,0.36,1) both;
          margin: 0 auto; max-width: 640px;
        }
        @keyframes esUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .es-handle { width: 38px; height: 5px; border-radius: 99px; background: rgba(120,110,150,0.4); margin: 10px auto 4px; flex-shrink: 0; }
        .es-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 20px 8px; flex-shrink: 0; }
        .es-title { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 800; color: var(--heading); }
        .es-close { width: 34px; height: 34px; border-radius: 50%; background: var(--surface-container); border: none; cursor: pointer; color: var(--on-surface-variant); display: flex; align-items: center; justify-content: center; }
        .es-scroll { overflow-y: auto; padding: 4px 20px 12px; }

        .es-card { background: var(--surface-container-low); border-radius: 20px; padding: 16px; margin-bottom: 12px; }
        .es-label { display: flex; align-items: center; gap: 6px; font-size: var(--text-label-md); font-weight: 700; color: var(--on-surface); margin-bottom: 10px; }
        .es-label .material-symbols-outlined { font-size: 18px; }

        .es-head-row { display: flex; align-items: flex-start; gap: 14px; }
        .es-sticker-pick { display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; flex-shrink: 0; padding: 0; }
        .es-sticker-btn {
          width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: var(--gradient-primary); box-shadow: var(--shadow-md); flex-shrink: 0;
          transition: transform var(--transition-fast);
        }
        .es-sticker-pick:active .es-sticker-btn { transform: scale(0.92); }
        .es-sticker-btn.has { box-shadow: var(--shadow-card); }
        .es-sticker-cap { font-family: var(--font-body); font-size: 13px; font-weight: 800; color: var(--heading); }

        /* Selector de pegatinas (modal) */
        .es-pick-backdrop { position: fixed; inset: 0; z-index: 9997; background: rgba(40,36,60,0.42); backdrop-filter: blur(8px) saturate(160%); -webkit-backdrop-filter: blur(8px) saturate(160%); animation: fadeIn 0.18s ease both; }
        .es-pick { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9998; max-height: 76dvh; display: flex; flex-direction: column; overflow-x: hidden; background: var(--surface-container-lowest); border-radius: 24px 24px 0 0; box-shadow: 0 -8px 40px -8px rgba(40,36,60,0.3), 0 -1px 0 rgba(255,255,255,0.5) inset; animation: esUp 0.34s cubic-bezier(0.22,1,0.36,1) both; margin: 0 auto; max-width: 640px; }
        .es-pick-tabs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px 20px 10px; flex-shrink: 0; }
        .es-pick-tabs::-webkit-scrollbar { display: none; }
        .es-pick-tab { flex-shrink: 0; padding: 8px 16px; border-radius: 99px; border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-family: var(--font-body); font-size: 13px; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .es-pick-tab.sel { border-color: var(--primary); background: var(--primary); color: var(--on-primary); }
        .es-pick-grid { overflow-y: auto; overflow-x: hidden; padding: 4px 20px calc(env(safe-area-inset-bottom,0px) + 20px); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
        @media (min-width: 480px) { .es-pick-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .es-pick-grid .es-sticker-cell { aspect-ratio: auto; min-height: 96px; padding: 8px; background: var(--surface-container-low); border-radius: 18px; min-width: 0; overflow: hidden; }

        .es-title-input {
          flex: 1; width: 100%; background: transparent; border: none;
          border-bottom: 2px solid var(--outline-variant);
          font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 700;
          color: var(--on-surface); padding: 6px 2px; outline: none;
        }
        .es-title-input:focus { border-bottom-color: var(--primary); }
        .es-title-input::placeholder { color: var(--outline); font-weight: 500; }

        .es-sticker-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 12px; }
        @media (max-width: 420px) { .es-sticker-grid { grid-template-columns: repeat(5, 1fr); } }
        .es-sticker-cell {
          aspect-ratio: 1; border-radius: 14px; border: 2px solid transparent; background: var(--surface-container-lowest);
          cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast);
        }
        .es-sticker-cell:hover { transform: scale(1.06); }
        .es-sticker-cell.sel { border-color: var(--primary); background: var(--primary-container); }
        .es-sticker-none { font-size: 11px; font-weight: 700; color: var(--on-surface-variant); }

        .es-colors { display: flex; gap: 10px; flex-wrap: wrap; }
        .es-color { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; display: flex; align-items: center; justify-content: center; transition: transform var(--transition-fast); }
        .es-color:hover { transform: scale(1.1); }
        .es-color.sel { border-color: var(--on-surface); }

        .es-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .es-date-fixed { font-family: var(--font-display); font-size: var(--text-body-lg); font-weight: 800; color: var(--primary); text-transform: capitalize; }
        .es-toggle { position: relative; width: 46px; height: 26px; border-radius: 99px; border: none; cursor: pointer; flex-shrink: 0; transition: background var(--transition-fast); }
        .es-toggle.on { background: var(--primary); } .es-toggle.off { background: var(--surface-variant); }
        .es-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: transform var(--transition-spring); }
        .es-toggle.on::after { transform: translateX(20px); }

        .es-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .es-pill { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 99px; cursor: pointer; font-size: 13px; font-weight: 700; font-family: var(--font-body); border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); transition: all var(--transition-fast); }
        .es-pill.sel { border-color: var(--primary); background: var(--primary-container); color: var(--on-primary-container); }

        .es-money-wrap { position: relative; }
        .es-money-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--tertiary); }
        .es-input { width: 100%; padding: 13px 16px 13px 40px; border-radius: 16px; border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface); font-size: var(--text-body-md); font-family: var(--font-body); outline: none; }
        .es-input:focus { border-color: var(--primary); }
        .es-note { width: 100%; min-height: 80px; resize: vertical; padding: 13px 16px; border-radius: 16px; border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface); font-size: var(--text-body-md); font-family: var(--font-body); outline: none; line-height: 1.5; }
        .es-note:focus { border-color: var(--primary); }

        .es-save-bar { padding: 12px 20px calc(env(safe-area-inset-bottom,0px) + 14px); border-top: 1px solid var(--outline-variant); flex-shrink: 0; background: var(--surface-container-lowest); }
        .es-save-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 99px; border: none; cursor: pointer; background: var(--gradient-primary); color: #fff; font-size: var(--text-body-md); font-weight: 800; font-family: var(--font-body); box-shadow: var(--shadow-fab); transition: transform var(--transition-fast); }
        .es-save-btn:active { transform: scale(0.98); }
      `}</style>

      <div className="es-backdrop" onClick={closeEntrySheet} />
      <div className="es-sheet" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar' : 'Agregar al calendario'}>
        <div className="es-handle" />
        <div className="es-head">
          <span className="es-title">{isEdit ? 'Editar' : 'Agregar al calendario'}</span>
          <button className="es-close" onClick={closeEntrySheet} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="es-scroll">
          {/* Sticker + título */}
          <div className="es-card">
            <div className="es-head-row">
              <input
                className="es-title-input"
                placeholder="Ej. Publicar campaña, Junta con cliente…"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                autoFocus
                id="entry-title"
              />
              <button type="button" className="es-sticker-pick" onClick={() => setPickerOpen(true)} aria-label="Elegir sticker">
                <span className={`es-sticker-btn${form.sticker ? ' has' : ''}`}
                  style={form.sticker ? { background: form.color } : {}}>
                  {form.sticker ? <Sticker id={form.sticker} size={38} /> : <Plus size={26} strokeWidth={2.5} color="#fff" />}
                </span>
                <span className="es-sticker-cap">Sticker</span>
              </button>
            </div>
          </div>

          {/* Espacio + Cliente */}
          <div className="es-card">
            <div className="es-label"><span className="material-symbols-outlined">folder_shared</span>Espacio</div>
            <div className="es-pills" style={{ marginTop: 0 }}>
              <button type="button" className={`es-pill${form.spaceId === 'personal' ? ' sel' : ''}`} onClick={() => set('spaceId', 'personal')}><Lock size={13} strokeWidth={2.5} /> Personal</button>
              {spaces.map(s => (
                <button key={s.id} type="button" className={`es-pill${form.spaceId === s.id ? ' sel' : ''}`} onClick={() => set('spaceId', s.id)}><Users size={14} strokeWidth={2.5} /> {s.name}</button>
              ))}
            </div>

            {form.spaceId && form.spaceId !== 'personal' && (
              <>
                <div className="es-label" style={{ marginTop: 16 }}><span className="material-symbols-outlined">sell</span>Cliente <span style={{ fontWeight: 500, color: 'var(--outline)' }}>· opcional</span></div>
                <div className="es-pills" style={{ marginTop: 0 }}>
                  <button type="button" className={`es-pill${!form.client ? ' sel' : ''}`} onClick={() => set('client', '')}>Sin cliente</button>
                  {spaceClients.map(c => (
                    <button key={c} type="button" className={`es-pill${form.client === c ? ' sel' : ''}`} onClick={() => set('client', c)}>{c}</button>
                  ))}
                </div>
                <input
                  className="es-input"
                  style={{ paddingLeft: 16, marginTop: 10 }}
                  placeholder="＋ Nuevo cliente y Enter"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      const name = e.target.value.trim();
                      set('client', name);
                      if (!spaceClients.includes(name)) addClient(form.spaceId, name).catch(() => {});
                      e.target.value = '';
                    }
                  }}
                  id="entry-new-client"
                />
              </>
            )}
          </div>

          {/* Color */}
          <div className="es-card">
            <div className="es-label"><span className="material-symbols-outlined">palette</span>Color</div>
            <div className="es-colors">
              {HIGHLIGHTERS.map(c => (
                <button key={c.id} type="button" className={`es-color${form.color === c.hex ? ' sel' : ''}`} style={{ background: c.hex }} onClick={() => set('color', c.hex)} aria-label={c.id}>
                  {form.color === c.hex && <Check size={18} color="#fff" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Día (fijo, viene del calendario) */}
          <div className="es-card">
            <div className="es-row">
              <div className="es-label" style={{ marginBottom: 0 }}><span className="material-symbols-outlined">event</span>Día</div>
              <span className="es-date-fixed">{formatDayLabel(form.date)}</span>
            </div>
          </div>

          {/* Monto */}
          <div className="es-card">
            <div className="es-label"><span className="material-symbols-outlined">payments</span>Monto <span style={{ fontWeight: 500, color: 'var(--outline)' }}>· opcional</span></div>
            <div className="es-money-wrap">
              <DollarSign size={17} className="es-money-icon" />
              <input className="es-input" type="text" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} id="entry-amount" />
            </div>
          </div>

          {/* Nota */}
          <div className="es-card">
            <div className="es-label"><span className="material-symbols-outlined">notes</span>Nota <span style={{ fontWeight: 500, color: 'var(--outline)' }}>· opcional</span></div>
            <textarea className="es-note" placeholder="Brief, entregables, links, notas de la reunión…" value={form.note} onChange={e => set('note', e.target.value)} id="entry-note" />
          </div>

          {/* Recordatorio */}
          <div className="es-card">
            <div className="es-row">
              <div className="es-label" style={{ marginBottom: 0 }}><Bell size={17} />Recordatorio</div>
              <button type="button" className={`es-toggle ${form.reminder ? 'on' : 'off'}`} onClick={() => set('reminder', !form.reminder)} aria-label="Recordatorio" />
            </div>
            {form.reminder && (
              <div style={{ marginTop: 14 }}>
                <div className="es-label" style={{ fontSize: 'var(--text-label-sm)', color: 'var(--on-surface-variant)' }}>¿Cuándo te aviso?</div>
                <div className="es-pills" style={{ marginTop: 0 }}>
                  {REMINDER_PRESETS.map(p => (
                    <button key={p.time} type="button"
                      className={`es-pill${!customReminder && form.reminderTime === p.time ? ' sel' : ''}`}
                      onClick={() => { setCustomReminder(false); set('reminderTime', p.time); }}>
                      {p.label} · {p.sub}
                    </button>
                  ))}
                  <button type="button" className={`es-pill${customReminder ? ' sel' : ''}`} onClick={() => setCustomReminder(true)}>
                    Otra hora…
                  </button>
                </div>
                {customReminder && (
                  <div style={{ marginTop: 12 }}>
                    <TimePicker value={form.reminderTime} onChange={t => set('reminderTime', t)} id="entry-reminder-time" defaultTime="09:00" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Repetir */}
          <div className="es-card">
            <div className="es-label"><Repeat size={17} />Repetir</div>
            <div className="es-pills" style={{ marginTop: 0 }}>
              {REPEAT_OPTIONS.map(r => (
                <button key={r} type="button" className={`es-pill${form.repeat === r ? ' sel' : ''}`} onClick={() => set('repeat', r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="es-save-bar">
          <button className="es-save-btn" onClick={handleSave} id="entry-save">
            <Check size={20} strokeWidth={3} />
            {isEdit ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Selector de pegatinas (modal) */}
      {pickerOpen && (
        <>
          <div className="es-pick-backdrop" onClick={() => setPickerOpen(false)} />
          <div className="es-pick" role="dialog" aria-modal="true" aria-label="Elegir sticker">
            <div className="es-handle" />
            <div className="es-head">
              <span className="es-title">Stickers</span>
              <button className="es-close" onClick={() => setPickerOpen(false)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            {STICKER_CATEGORIES.length > 1 && (
              <div className="es-pick-tabs">
                {STICKER_CATEGORIES.map(c => (
                  <button key={c.id} type="button" className={`es-pick-tab${stickerCat === c.id ? ' sel' : ''}`}
                    onClick={() => setStickerCat(c.id)}>{c.label}</button>
                ))}
              </div>
            )}
            <div className="es-pick-grid">
              <button type="button" className={`es-sticker-cell${!form.sticker ? ' sel' : ''}`}
                onClick={() => { set('sticker', null); setPickerOpen(false); }} aria-label="Sin sticker">
                <span className="es-sticker-none">Sin<br/>sticker</span>
              </button>
              {STICKERS.filter(s => s.category === stickerCat).map(s => (
                <button key={s.id} type="button" className={`es-sticker-cell${form.sticker === s.id ? ' sel' : ''}`}
                  onClick={() => { set('sticker', s.id); setPickerOpen(false); }} aria-label={s.label} title={s.label}>
                  <Sticker id={s.id} size={80} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
