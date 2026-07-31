import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Check, DollarSign, Bell, Repeat, Clock, X, Lock, Users } from 'lucide-react';
import { DatePicker } from './ui/date-picker';
import { TimePicker } from './ui/time-picker';
import { localToday } from '../lib/utils';
import Sticker, { STICKERS } from './Sticker';
import { HIGHLIGHTERS, DEFAULT_COLOR, REPEAT_OPTIONS, REMINDER_OFFSETS } from '../lib/entryStyle';

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
    reminderOffset: editEntry?.reminderOffset || 15,
    repeat:         editEntry?.repeat         || 'No repetir',
    spaceId:        initialSpace,
    client:         editEntry?.client         || '',
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      time:   form.allDay ? '' : form.time,
      color:  form.color,
      sticker: form.sticker,
      note:   form.note.trim(),
      amount: amountNum != null && !isNaN(amountNum) ? amountNum : null,
      reminder: form.reminder,
      reminderOffset: form.reminderOffset,
      repeat: form.repeat,
      spaceId: form.spaceId || 'personal',
      client: isShared ? (form.client || '') : '',
    };
    if (isEdit) {
      dispatch({ type: 'UPDATE_TASK', task: { ...editEntry, ...base } });
      showToast('Entrada actualizada', 'success');
    } else {
      dispatch({ type: 'ADD_TASK', task: { ...base, completed: false } });
      showToast('¡Entrada creada!', 'success');
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

        .es-head-row { display: flex; align-items: center; gap: 14px; }
        .es-sticker-btn {
          width: 62px; height: 62px; border-radius: 20px; display: flex; align-items: center; justify-content: center;
          border: 2px dashed var(--outline-variant); background: var(--surface-container); cursor: pointer; flex-shrink: 0;
        }
        .es-sticker-btn.has { border-style: solid; }
        .es-sticker-hint { font-size: 9px; font-weight: 700; color: var(--outline); text-align: center; line-height: 1.1; }
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
      <div className="es-sheet" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar entrada' : 'Nueva entrada'}>
        <div className="es-handle" />
        <div className="es-head">
          <span className="es-title">{isEdit ? 'Editar entrada' : 'Nueva entrada'}</span>
          <button className="es-close" onClick={closeEntrySheet} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="es-scroll">
          {/* Sticker + título */}
          <div className="es-card">
            <div className="es-head-row">
              <button
                type="button"
                className={`es-sticker-btn${form.sticker ? ' has' : ''}`}
                onClick={() => set('sticker', form.sticker ? null : STICKERS[0].id)}
                style={form.sticker ? { borderColor: form.color } : {}}
                aria-label="Elegir sticker"
              >
                {form.sticker ? <Sticker id={form.sticker} size={40} /> : <span className="es-sticker-hint">+<br/>sticker</span>}
              </button>
              <input
                className="es-title-input"
                placeholder="Ej. Pagar tarjeta, Cumple Luis…"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                autoFocus
                id="entry-title"
              />
            </div>
            <div className="es-sticker-grid">
              <button type="button" className={`es-sticker-cell${!form.sticker ? ' sel' : ''}`} onClick={() => set('sticker', null)} aria-label="Sin sticker">
                <span className="es-sticker-none">—</span>
              </button>
              {STICKERS.map(s => (
                <button key={s.id} type="button" className={`es-sticker-cell${form.sticker === s.id ? ' sel' : ''}`} onClick={() => set('sticker', s.id)} aria-label={s.label} title={s.label}>
                  <Sticker id={s.id} size={30} />
                </button>
              ))}
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

          {/* Fecha y hora */}
          <div className="es-card">
            <div className="es-label"><span className="material-symbols-outlined">event</span>Fecha</div>
            <DatePicker value={form.date} onChange={d => set('date', d)} id="entry-date" />
            <div className="es-row" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} color="var(--on-surface-variant)" />
                <span style={{ fontSize: 'var(--text-body-md)', color: 'var(--on-surface)' }}>Todo el día</span>
              </div>
              <button type="button" className={`es-toggle ${form.allDay ? 'on' : 'off'}`} onClick={() => set('allDay', !form.allDay)} aria-label="Todo el día" />
            </div>
            {!form.allDay && (
              <div style={{ marginTop: 16 }}>
                <TimePicker value={form.time || null} onChange={t => set('time', t)} id="entry-time" defaultTime="09:00" />
              </div>
            )}
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
            <textarea className="es-note" placeholder="Detalles, contexto, cliente…" value={form.note} onChange={e => set('note', e.target.value)} id="entry-note" />
          </div>

          {/* Recordatorio */}
          <div className="es-card">
            <div className="es-row">
              <div className="es-label" style={{ marginBottom: 0 }}><Bell size={17} />Recordatorio</div>
              <button type="button" className={`es-toggle ${form.reminder ? 'on' : 'off'}`} onClick={() => set('reminder', !form.reminder)} aria-label="Recordatorio" />
            </div>
            {form.reminder && (
              <div className="es-pills">
                {REMINDER_OFFSETS.map(m => (
                  <button key={m} type="button" className={`es-pill${form.reminderOffset === m ? ' sel' : ''}`} onClick={() => set('reminderOffset', m)}>
                    {m < 60 ? `${m} min` : '1 hora'} antes
                  </button>
                ))}
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
            {isEdit ? 'Guardar cambios' : 'Crear entrada'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
