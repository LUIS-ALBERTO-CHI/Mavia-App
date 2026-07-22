import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Check, DollarSign, Bell, Repeat, Clock } from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';
import { TimePicker } from '../components/ui/time-picker';
import { localToday } from '../lib/utils';
import Sticker, { STICKERS } from '../components/Sticker';
import { HIGHLIGHTERS, DEFAULT_COLOR, REPEAT_OPTIONS, REMINDER_OFFSETS } from '../lib/entryStyle';

/**
 * CreateEntryScreen — formulario único para una "entrada" de la agenda.
 * Reemplaza CreateTask + CreateEvent. Una entrada puede tener hora, monto,
 * color de resaltador, sticker, nota, recordatorio y repetición.
 */
export default function CreateEntryScreen() {
  const { state, dispatch, goBack, showToast } = useApp();

  // Edit mode: navigate('createEntry', { entryId }) — fallback a taskId por compat
  const entryId   = state.screenParams?.entryId || state.screenParams?.taskId || null;
  const editEntry = entryId ? state.tasks.find(t => t.id === entryId) : null;
  const isEdit    = !!editEntry;

  const paramDate = state.screenParams?.date || localToday();

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
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { showToast('Escribe un título', 'error'); return; }

    const amountNum = form.amount.trim() === '' ? null : Number(form.amount.replace(/[^0-9.]/g, ''));

    const base = {
      title:          form.title.trim(),
      date:           form.date,
      time:           form.allDay ? '' : form.time,
      color:          form.color,
      sticker:        form.sticker,
      note:           form.note.trim(),
      amount:         amountNum != null && !isNaN(amountNum) ? amountNum : null,
      reminder:       form.reminder,
      reminderOffset: form.reminderOffset,
      repeat:         form.repeat,
    };

    if (isEdit) {
      dispatch({ type: 'UPDATE_TASK', task: { ...editEntry, ...base } });
      showToast('Entrada actualizada', 'success');
    } else {
      dispatch({ type: 'ADD_TASK', task: { ...base, completed: false } });
      showToast('Entrada creada', 'success');
    }
    goBack();
  };

  return (
    <>
      <style>{`
        .en-screen {
          max-width: 640px; margin: 0 auto;
          padding: var(--space-lg) var(--space-container) calc(var(--space-xxl) + 40px);
          animation: screenEnter 0.4s var(--ease-out) both;
        }
        .en-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--primary); font-size: var(--text-label-md); font-weight: 600;
          background: none; border: none; cursor: pointer; padding: 0;
          margin-bottom: var(--space-md);
        }
        .en-heading {
          font-family: var(--font-display); font-size: var(--text-headline-lg);
          font-weight: 700; color: var(--heading); line-height: 1.15;
          margin-bottom: 2px;
        }
        .en-sub { font-size: var(--text-body-md); color: var(--on-surface-variant); margin-bottom: var(--space-lg); }

        .en-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--outline-variant);
          box-shadow: var(--shadow-card);
          padding: var(--space-lg);
          margin-bottom: var(--space-md);
        }
        .en-label {
          display: flex; align-items: center; gap: 6px;
          font-size: var(--text-label-md); font-weight: 700; color: var(--on-surface);
          margin-bottom: 10px;
        }
        .en-label .material-symbols-outlined { font-size: 18px; }

        /* Sticker + title header */
        .en-head-row { display: flex; align-items: center; gap: 14px; }
        .en-sticker-btn {
          width: 62px; height: 62px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          border: 2px dashed var(--outline-variant); background: var(--surface-container-low);
          cursor: pointer; flex-shrink: 0; transition: all var(--transition-fast);
        }
        .en-sticker-btn.has { border-style: solid; }
        .en-sticker-hint { font-size: 9px; font-weight: 700; color: var(--outline); text-align: center; line-height: 1.1; }
        .en-title-input {
          flex: 1; width: 100%; background: transparent; border: none;
          border-bottom: 2px solid var(--outline-variant);
          font-family: var(--font-display); font-size: var(--text-headline-md);
          font-weight: 600; color: var(--on-surface); padding: 6px 2px; outline: none;
          transition: border-color var(--transition-fast);
        }
        .en-title-input:focus { border-bottom-color: var(--primary); }
        .en-title-input::placeholder { color: var(--outline); font-weight: 400; }

        /* Sticker grid */
        .en-sticker-grid {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;
          margin-top: 12px;
        }
        @media (max-width: 420px) { .en-sticker-grid { grid-template-columns: repeat(5, 1fr); } }
        .en-sticker-cell {
          aspect-ratio: 1; border-radius: 14px; border: 2px solid transparent;
          background: var(--surface-container-low); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
        }
        .en-sticker-cell:hover { background: var(--surface-container-high); transform: scale(1.06); }
        .en-sticker-cell.sel { border-color: var(--primary); background: var(--primary-container); }
        .en-sticker-none {
          font-size: 11px; font-weight: 700; color: var(--on-surface-variant);
        }

        /* Color swatches */
        .en-colors { display: flex; gap: 10px; flex-wrap: wrap; }
        .en-color {
          width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
          border: 3px solid transparent; transition: transform var(--transition-fast);
          display: flex; align-items: center; justify-content: center;
        }
        .en-color:hover { transform: scale(1.1); }
        .en-color.sel { border-color: var(--on-surface); }

        /* Toggles / pills */
        .en-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .en-toggle {
          position: relative; width: 46px; height: 26px; border-radius: 99px;
          border: none; cursor: pointer; flex-shrink: 0; transition: background var(--transition-fast);
        }
        .en-toggle.on  { background: var(--primary); }
        .en-toggle.off { background: var(--surface-variant); }
        .en-toggle::after {
          content: ''; position: absolute; top: 3px; left: 3px;
          width: 20px; height: 20px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: transform var(--transition-spring);
        }
        .en-toggle.on::after { transform: translateX(20px); }

        .en-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .en-pill {
          padding: 7px 14px; border-radius: 99px; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: var(--font-body);
          border: 1.5px solid var(--outline-variant); background: var(--surface-container-low);
          color: var(--on-surface-variant); transition: all var(--transition-fast);
        }
        .en-pill.sel { border-color: var(--primary); background: var(--primary-container); color: var(--primary); }

        .en-money-wrap { position: relative; }
        .en-money-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--secondary); }
        .en-input {
          width: 100%; padding: 13px 16px 13px 40px;
          border-radius: var(--radius-xl); border: 1.5px solid var(--outline-variant);
          background: var(--surface-container-lowest); color: var(--on-surface);
          font-size: var(--text-body-md); font-family: var(--font-body); outline: none;
          transition: border-color var(--transition-fast);
        }
        .en-input:focus { border-color: var(--primary); }
        .en-note {
          width: 100%; min-height: 90px; resize: vertical;
          padding: 13px 16px; border-radius: var(--radius-xl);
          border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest);
          color: var(--on-surface); font-size: var(--text-body-md); font-family: var(--font-body);
          outline: none; line-height: 1.5; transition: border-color var(--transition-fast);
        }
        .en-note:focus { border-color: var(--primary); }

        .en-save-bar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
          padding: 12px var(--space-container) calc(env(safe-area-inset-bottom,0px) + 12px);
          background: linear-gradient(to top, var(--color-bg) 70%, transparent);
          display: flex; justify-content: center;
        }
        @media (min-width: 1024px) { .en-save-bar { left: var(--sidebar-width); } }
        .en-save-btn {
          width: 100%; max-width: 600px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 15px; border-radius: 99px; border: none; cursor: pointer;
          background: var(--gradient-primary); color: #fff;
          font-size: var(--text-body-md); font-weight: 700; font-family: var(--font-body);
          box-shadow: var(--shadow-fab); transition: transform var(--transition-fast);
        }
        .en-save-btn:active { transform: scale(0.98); }
      `}</style>

      <div className="en-screen">
        <button className="en-back" onClick={goBack}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1 className="en-heading">{isEdit ? 'Editar entrada' : 'Nueva entrada'}</h1>
        <p className="en-sub">Anota lo que sea: un pago, un cumpleaños, una grabación…</p>

        {/* ── Sticker + título ── */}
        <div className="en-card">
          <div className="en-head-row">
            <button
              type="button"
              className={`en-sticker-btn${form.sticker ? ' has' : ''}`}
              onClick={() => set('sticker', form.sticker ? null : STICKERS[0].id)}
              style={form.sticker ? { borderColor: form.color } : {}}
              aria-label="Elegir sticker"
            >
              {form.sticker
                ? <Sticker id={form.sticker} size={40} />
                : <span className="en-sticker-hint">+<br/>sticker</span>}
            </button>
            <input
              className="en-title-input"
              placeholder="Ej. Pagar tarjeta, Cumple Luis…"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
              id="entry-title"
            />
          </div>

          {/* Grid de stickers */}
          <div className="en-sticker-grid">
            <button
              type="button"
              className={`en-sticker-cell${!form.sticker ? ' sel' : ''}`}
              onClick={() => set('sticker', null)}
              aria-label="Sin sticker"
            >
              <span className="en-sticker-none">—</span>
            </button>
            {STICKERS.map(s => (
              <button
                key={s.id}
                type="button"
                className={`en-sticker-cell${form.sticker === s.id ? ' sel' : ''}`}
                onClick={() => set('sticker', s.id)}
                aria-label={s.label}
                title={s.label}
              >
                <Sticker id={s.id} size={30} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Color de resaltador ── */}
        <div className="en-card">
          <div className="en-label"><span className="material-symbols-outlined">palette</span>Color</div>
          <div className="en-colors">
            {HIGHLIGHTERS.map(c => (
              <button
                key={c.id}
                type="button"
                className={`en-color${form.color === c.hex ? ' sel' : ''}`}
                style={{ background: c.hex }}
                onClick={() => set('color', c.hex)}
                aria-label={c.id}
              >
                {form.color === c.hex && <Check size={18} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Fecha y hora ── */}
        <div className="en-card">
          <div className="en-label"><span className="material-symbols-outlined">event</span>Fecha</div>
          <DatePicker value={form.date} onChange={d => set('date', d)} id="entry-date" />

          <div className="en-row" style={{ marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="var(--on-surface-variant)" />
              <span style={{ fontSize: 'var(--text-body-md)', color: 'var(--on-surface)' }}>Todo el día</span>
            </div>
            <button
              type="button"
              className={`en-toggle ${form.allDay ? 'on' : 'off'}`}
              onClick={() => set('allDay', !form.allDay)}
              aria-label="Todo el día"
            />
          </div>

          {!form.allDay && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <TimePicker
                value={form.time || null}
                onChange={t => set('time', t)}
                id="entry-time"
                defaultTime="09:00"
              />
            </div>
          )}
        </div>

        {/* ── Monto ── */}
        <div className="en-card">
          <div className="en-label"><span className="material-symbols-outlined">payments</span>Monto <span style={{ fontWeight: 400, color: 'var(--outline)' }}>· opcional</span></div>
          <div className="en-money-wrap">
            <DollarSign size={17} className="en-money-icon" />
            <input
              className="en-input"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              id="entry-amount"
            />
          </div>
        </div>

        {/* ── Nota ── */}
        <div className="en-card">
          <div className="en-label"><span className="material-symbols-outlined">notes</span>Nota <span style={{ fontWeight: 400, color: 'var(--outline)' }}>· opcional</span></div>
          <textarea
            className="en-note"
            placeholder="Detalles, contexto, número de cliente…"
            value={form.note}
            onChange={e => set('note', e.target.value)}
            id="entry-note"
          />
        </div>

        {/* ── Recordatorio ── */}
        <div className="en-card">
          <div className="en-row">
            <div className="en-label" style={{ marginBottom: 0 }}><Bell size={17} />Recordatorio</div>
            <button
              type="button"
              className={`en-toggle ${form.reminder ? 'on' : 'off'}`}
              onClick={() => set('reminder', !form.reminder)}
              aria-label="Recordatorio"
            />
          </div>
          {form.reminder && (
            <div className="en-pills">
              {REMINDER_OFFSETS.map(m => (
                <button
                  key={m}
                  type="button"
                  className={`en-pill${form.reminderOffset === m ? ' sel' : ''}`}
                  onClick={() => set('reminderOffset', m)}
                >
                  {m < 60 ? `${m} min` : '1 hora'} antes
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Repetir ── */}
        <div className="en-card">
          <div className="en-label"><Repeat size={17} />Repetir</div>
          <div className="en-pills" style={{ marginTop: 0 }}>
            {REPEAT_OPTIONS.map(r => (
              <button
                key={r}
                type="button"
                className={`en-pill${form.repeat === r ? ' sel' : ''}`}
                onClick={() => set('repeat', r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de guardar fija */}
      <div className="en-save-bar">
        <button className="en-save-btn" onClick={handleSave} id="entry-save">
          <Check size={20} strokeWidth={3} />
          {isEdit ? 'Guardar cambios' : 'Crear entrada'}
        </button>
      </div>
    </>
  );
}
