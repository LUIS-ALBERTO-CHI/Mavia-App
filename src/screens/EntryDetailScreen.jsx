import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Pencil, Trash2, Check, Bell, Repeat, CalendarDays, Users, CalendarPlus } from 'lucide-react';
import { formatTime12h } from '../lib/utils';

/* ── Exportar a calendario nativo (.ics) ── */
const _p = (n) => String(n).padStart(2, '0');
const _esc = (s) => (s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
function buildICS(e) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  let when;
  if (e.reminder && e.reminderTime) {
    const [Y, M, D] = e.date.split('-');
    const [h, m] = e.reminderTime.split(':').map(Number);
    const start = `${Y}${M}${D}T${_p(h)}${_p(m)}00`;
    const end   = `${Y}${M}${D}T${_p((h + 1) % 24)}${_p(m)}00`;
    when = `DTSTART:${start}\r\nDTEND:${end}\r\nBEGIN:VALARM\r\nTRIGGER:PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:${_esc(e.title)}\r\nEND:VALARM`;
  } else {
    const d = e.date.replace(/-/g, '');
    const nd = new Date(e.date + 'T00:00:00'); nd.setDate(nd.getDate() + 1);
    const end = `${nd.getFullYear()}${_p(nd.getMonth() + 1)}${_p(nd.getDate())}`;
    when = `DTSTART;VALUE=DATE:${d}\r\nDTEND;VALUE=DATE:${end}`;
  }
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mavia//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${e.id}@mavia`, `DTSTAMP:${stamp}`, when,
    `SUMMARY:${_esc(e.title)}`, e.note ? `DESCRIPTION:${_esc(e.note)}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
function downloadICS(e) {
  const blob = new Blob([buildICS(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(e.title || 'evento').replace(/[^\w\- ]/g, '').slice(0, 40) || 'evento'}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
import Sticker from '../components/Sticker';
import { formatAmount } from '../lib/entryStyle';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * EntryDetailScreen — detalle unificado de una entrada de la agenda.
 * Reemplaza TaskDetail + EventDetail.
 */
export default function EntryDetailScreen() {
  const { state, dispatch, navigate, goBack, showToast, openEntrySheet, deleteEntry, updateEntry } = useApp();

  const entryId = state.screenParams?.entryId || state.screenParams?.taskId || state.screenParams?.eventId || null;
  const entry   = entryId ? state.tasks.find(t => t.id === entryId) : null;

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!entry) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-lg)' }}>No se encontró.</p>
        <button className="btn" onClick={() => navigate('calendar')} style={{ background: 'var(--primary)', color: 'var(--on-primary)', padding: '10px 20px', borderRadius: 99, border: 'none' }}>
          Ir al calendario
        </button>
      </div>
    );
  }

  const color   = entry.color || 'var(--primary)';
  const done    = !!entry.completed;
  const amount  = formatAmount(entry.amount);
  // Hora del recordatorio (nuevo) con respaldo al esquema viejo por offset
  const reminderLabel = entry.reminderTime
    ? formatTime12h(entry.reminderTime)
    : (entry.reminderOffset < 60 ? `${entry.reminderOffset} min antes` : '1 hora antes');
  const entrySpace = entry.spaceId && entry.spaceId !== 'personal'
    ? (state.spaces || []).find(s => s.id === entry.spaceId)
    : null;

  const toggleDone = () => {
    dispatch({ type: 'TOGGLE_TASK', id: entry.id });
    showToast(done ? 'Marcada como pendiente' : (amount ? '¡Pagado!' : '¡Hecho!'), 'success');
  };
  const handleDelete = (scope = 'one') => {
    deleteEntry(entry, scope);   // muestra su propio toast "Eliminada · Deshacer"
    goBack();
  };

  /* ── Mover rápido a otra fecha ── */
  const dsOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const shiftDS = (baseDS, days) => { const d = new Date(baseDS + 'T00:00:00'); d.setDate(d.getDate() + days); return dsOf(d); };
  const todayDS = dsOf(new Date());
  const moveTo = (ds, label) => { updateEntry(entry, { date: ds }); showToast(`Movida a ${label.toLowerCase()}`, 'success'); };
  const MOVES = [
    { ds: todayDS,                    label: 'Hoy' },
    { ds: shiftDS(todayDS, 1),        label: 'Mañana' },
    { ds: shiftDS(entry?.date || todayDS, 7), label: '+1 semana' },
  ].filter(m => m.ds !== entry?.date);

  return (
    <>
      <style>{`
        .ed-screen { max-width: 560px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-xxl); animation: screenEnter 0.4s var(--ease-out) both; }
        .ed-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-lg); }
        .ed-icon-btn {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: var(--surface-container); border: none; cursor: pointer; color: var(--on-surface-variant);
          transition: all var(--transition-fast);
        }
        .ed-icon-btn:hover { background: var(--surface-container-high); }
        .ed-icon-btn.danger:hover { background: var(--error-container); color: var(--error); }

        .ed-hero {
          border-radius: var(--radius-2xl); padding: var(--space-lg);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: var(--space-lg); position: relative; overflow: hidden;
          border: 1px solid var(--outline-variant);
        }
        .ed-hero-sticker {
          width: 72px; height: 72px; border-radius: var(--radius-card); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.65);
        }
        .ed-hero-title {
          font-family: var(--font-display); font-size: var(--text-headline-md);
          font-weight: 700; color: var(--heading); line-height: 1.25;
        }
        .ed-hero-title.done { text-decoration: line-through; opacity: 0.55; }
        .ed-hero-amount { font-size: var(--text-headline-md); font-weight: 700; color: var(--heading); margin-top: 4px; }

        .ed-check {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px; border-radius: 99px; border: none; cursor: pointer;
          font-size: var(--text-body-md); font-weight: 700; font-family: var(--font-body);
          margin-bottom: var(--space-lg); transition: transform var(--transition-fast);
        }
        .ed-check:active { transform: scale(0.98); }
        .ed-check.done   { background: var(--surface-container); color: var(--on-surface-variant); }
        .ed-check.todo   { background: var(--secondary); color: #fff; }

        .ed-rows { background: var(--surface-container-lowest); border-radius: var(--radius-2xl); border: 1px solid var(--outline-variant); overflow: hidden; margin-bottom: var(--space-lg); }
        .ed-row { display: flex; align-items: center; gap: 12px; padding: 15px var(--space-lg); }
        .ed-row + .ed-row { border-top: 1px solid var(--outline-variant); }
        .ed-row-icon { width: 34px; height: 34px; border-radius: var(--radius-control); background: var(--surface-container); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--on-surface-variant); }
        .ed-row-label { font-size: var(--text-label-sm); color: var(--on-surface-variant); }
        .ed-row-value { font-size: var(--text-body-md); color: var(--on-surface); font-weight: 600; }

        .ed-note-card { background: var(--surface-container-lowest); border-radius: var(--radius-2xl); border: 1px solid var(--outline-variant); padding: var(--space-lg); margin-bottom: var(--space-lg); }
        .ed-ics-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: var(--radius-card); border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface); font-family: var(--font-body); font-weight: 700; font-size: var(--text-body-md); cursor: pointer; margin-bottom: var(--space-lg); transition: transform var(--transition-fast); }
        .ed-ics-btn:active { transform: scale(0.98); }
        .ed-note-label { font-size: var(--text-label-sm); font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .ed-note-text { font-size: var(--text-body-md); color: var(--on-surface); line-height: 1.6; white-space: pre-wrap; }

        .ed-move { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
        .ed-move-label { font-size: 12px; font-weight: 700; color: var(--on-surface-variant); }
        .ed-move-row { display: flex; gap: 7px; flex-wrap: wrap; }
        .ed-move-btn { padding: 7px 14px; border-radius: 99px; border: var(--hairline); background: var(--surface-container-lowest); color: var(--on-surface); font-family: var(--font-body); font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); }
        .ed-move-btn:hover { background: var(--primary-container); border-color: var(--primary); }
        .ed-move-btn:active { transform: scale(0.95); }
        .ed-del-banner { background: var(--error-container); border-radius: var(--radius-xl); padding: var(--space-md); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ed-del-text { font-size: var(--text-label-md); color: var(--on-error-container); font-weight: 600; }
        .ed-del-actions { display: flex; gap: 8px; }
        .ed-del-btn { padding: 8px 16px; border-radius: 99px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; }
      `}</style>

      <div className="ed-screen">
        {/* Topbar */}
        <div className="ed-topbar">
          <button className="ed-icon-btn" onClick={goBack} aria-label="Volver"><ArrowLeft size={20} /></button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ed-icon-btn" onClick={() => openEntrySheet({ entryId: entry.id })} aria-label="Editar"><Pencil size={18} /></button>
            <button className="ed-icon-btn danger" onClick={() => entry.seriesId ? setConfirmDelete(true) : handleDelete('one')} aria-label="Eliminar"><Trash2 size={18} /></button>
          </div>
        </div>

        {/* Hero */}
        <div className="ed-hero" style={{ background: `${color}22`, borderColor: `${color}55` }}>
          <div className="ed-hero-sticker">
            {entry.sticker ? <Sticker id={entry.sticker} size={48} /> : <CalendarDays size={40} color={color} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={`ed-hero-title${done ? ' done' : ''}`}>{entry.title}</div>
            {amount && <div className="ed-hero-amount">{amount}</div>}
          </div>
        </div>

        {/* Check hecho/pagado */}
        <button className={`ed-check ${done ? 'done' : 'todo'}`} onClick={toggleDone} id="entry-toggle">
          <Check size={20} strokeWidth={3} />
          {done ? (amount ? 'Pagado — marcar pendiente' : 'Hecho — marcar pendiente') : (amount ? 'Marcar como pagado' : 'Marcar como hecho')}
        </button>

        {/* Detalles */}
        <div className="ed-rows">
          {entrySpace && (
            <div className="ed-row">
              <div className="ed-row-icon"><Users size={17} /></div>
              <div>
                <div className="ed-row-label">Espacio</div>
                <div className="ed-row-value">{entrySpace.name}{entry.client ? ` · ${entry.client}` : ''}</div>
              </div>
            </div>
          )}
          <div className="ed-row">
            <div className="ed-row-icon"><CalendarDays size={17} /></div>
            <div><div className="ed-row-label">Fecha</div><div className="ed-row-value">{formatDate(entry.date)}</div></div>
          </div>
          {entry.reminder && (
            <div className="ed-row">
              <div className="ed-row-icon"><Bell size={17} /></div>
              <div><div className="ed-row-label">Recordatorio</div><div className="ed-row-value">{reminderLabel}</div></div>
            </div>
          )}
          {entry.repeat && entry.repeat !== 'No repetir' && (
            <div className="ed-row">
              <div className="ed-row-icon"><Repeat size={17} /></div>
              <div><div className="ed-row-label">Repetir</div><div className="ed-row-value">{entry.repeat}</div></div>
            </div>
          )}
          {entry.spaceId && entry.spaceId !== 'personal' && (entry.createdBy || entry.updatedBy) && (
            <div className="ed-row">
              <div className="ed-row-icon"><Users size={17} /></div>
              <div>
                <div className="ed-row-label">Actividad</div>
                <div className="ed-row-value">
                  {entry.createdBy ? `Creada por ${entry.createdBy}` : 'Creada'}
                  {entry.updatedBy && entry.updatedBy !== entry.createdBy ? ` · editada por ${entry.updatedBy}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nota */}
        {(entry.note || entry.notes) && (
          <div className="ed-note-card">
            <div className="ed-note-label">Nota</div>
            <div className="ed-note-text">{entry.note || entry.notes}</div>
          </div>
        )}

        {/* Mover rápido */}
        {!entry.completed && MOVES.length > 0 && (
          <div className="ed-move">
            <span className="ed-move-label">Mover a</span>
            <div className="ed-move-row">
              {MOVES.map(m => (
                <button key={m.label} className="ed-move-btn" onClick={() => moveTo(m.ds, m.label)} id={`ed-move-${m.label}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agregar al calendario nativo (.ics) */}
        <button className="ed-ics-btn" onClick={() => { downloadICS(entry); showToast('Descargado — ábrelo para agregarlo'); }} id="ed-ics">
          <CalendarPlus size={17} strokeWidth={2} /> Agregar al calendario del teléfono
        </button>

        {/* Confirmar borrado */}
        {confirmDelete && (
          <div className="ed-del-banner">
            <span className="ed-del-text">{entry.seriesId ? 'Esta entrada se repite. ¿Qué eliminas?' : '¿Eliminar esto?'}</span>
            <div className="ed-del-actions">
              <button className="ed-del-btn" style={{ background: 'transparent', color: 'var(--on-error-container)' }} onClick={() => setConfirmDelete(false)}>Cancelar</button>
              {entry.seriesId ? (
                <>
                  <button className="ed-del-btn" style={{ background: 'var(--error-container)', color: 'var(--error)' }} onClick={() => handleDelete('one')}>Solo esta</button>
                  <button className="ed-del-btn" style={{ background: 'var(--error)', color: '#fff' }} onClick={() => handleDelete('series')}>Esta y futuras</button>
                </>
              ) : (
                <button className="ed-del-btn" style={{ background: 'var(--error)', color: '#fff' }} onClick={() => handleDelete('one')}>Eliminar</button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
