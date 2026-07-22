import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Pencil, Trash2, Check, Clock, Bell, Repeat, CalendarDays } from 'lucide-react';
import { formatTime12h } from '../lib/utils';
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
  const { state, dispatch, navigate, goBack, showToast, openEntrySheet } = useApp();

  const entryId = state.screenParams?.entryId || state.screenParams?.taskId || state.screenParams?.eventId || null;
  const entry   = entryId ? state.tasks.find(t => t.id === entryId) : null;

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!entry) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-lg)' }}>Entrada no encontrada.</p>
        <button className="btn" onClick={() => navigate('calendar')} style={{ background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: 99, border: 'none' }}>
          Ir al calendario
        </button>
      </div>
    );
  }

  const color   = entry.color || 'var(--primary)';
  const done    = !!entry.completed;
  const amount  = formatAmount(entry.amount);
  const timeStr = entry.time ? formatTime12h(entry.time) : 'Todo el día';

  const toggleDone = () => {
    dispatch({ type: 'TOGGLE_TASK', id: entry.id });
    showToast(done ? 'Marcada como pendiente' : (amount ? '¡Pagado!' : '¡Hecho!'), 'success');
  };
  const handleDelete = () => {
    dispatch({ type: 'DELETE_TASK', id: entry.id });
    showToast('Entrada eliminada');
    goBack();
  };

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
          width: 72px; height: 72px; border-radius: 22px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.65);
        }
        .ed-hero-title {
          font-family: var(--font-display); font-size: var(--text-headline-md);
          font-weight: 700; color: var(--heading); line-height: 1.25;
        }
        .ed-hero-title.done { text-decoration: line-through; opacity: 0.55; }
        .ed-hero-amount { font-size: var(--text-headline-md); font-weight: 800; color: var(--heading); margin-top: 4px; }

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
        .ed-row-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--surface-container); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--on-surface-variant); }
        .ed-row-label { font-size: var(--text-label-sm); color: var(--on-surface-variant); }
        .ed-row-value { font-size: var(--text-body-md); color: var(--on-surface); font-weight: 600; }

        .ed-note-card { background: var(--surface-container-lowest); border-radius: var(--radius-2xl); border: 1px solid var(--outline-variant); padding: var(--space-lg); margin-bottom: var(--space-lg); }
        .ed-note-label { font-size: var(--text-label-sm); font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .ed-note-text { font-size: var(--text-body-md); color: var(--on-surface); line-height: 1.6; white-space: pre-wrap; }

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
            <button className="ed-icon-btn danger" onClick={() => setConfirmDelete(true)} aria-label="Eliminar"><Trash2 size={18} /></button>
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
          <div className="ed-row">
            <div className="ed-row-icon"><CalendarDays size={17} /></div>
            <div><div className="ed-row-label">Fecha</div><div className="ed-row-value">{formatDate(entry.date)}</div></div>
          </div>
          <div className="ed-row">
            <div className="ed-row-icon"><Clock size={17} /></div>
            <div><div className="ed-row-label">Hora</div><div className="ed-row-value">{timeStr}</div></div>
          </div>
          {entry.reminder && (
            <div className="ed-row">
              <div className="ed-row-icon"><Bell size={17} /></div>
              <div><div className="ed-row-label">Recordatorio</div><div className="ed-row-value">{entry.reminderOffset < 60 ? `${entry.reminderOffset} min antes` : '1 hora antes'}</div></div>
            </div>
          )}
          {entry.repeat && entry.repeat !== 'No repetir' && (
            <div className="ed-row">
              <div className="ed-row-icon"><Repeat size={17} /></div>
              <div><div className="ed-row-label">Repetir</div><div className="ed-row-value">{entry.repeat}</div></div>
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

        {/* Confirmar borrado */}
        {confirmDelete && (
          <div className="ed-del-banner">
            <span className="ed-del-text">¿Eliminar esta entrada?</span>
            <div className="ed-del-actions">
              <button className="ed-del-btn" style={{ background: 'transparent', color: 'var(--on-error-container)' }} onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button className="ed-del-btn" style={{ background: 'var(--error)', color: '#fff' }} onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
