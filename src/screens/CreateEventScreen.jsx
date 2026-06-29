import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarPlus, Clock, Tag, MapPin, Users, AlignLeft,
  Link2, Search, Paperclip, Bell, ChevronDown, X, Check, Leaf
} from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';
import { TimePicker } from '../components/ui/time-picker';

import { localToday } from '../lib/utils';

const today = localToday();

const CATEGORIES = [
  { id: 'Marketing',  color: '#546347', bg: 'rgba(84,99,71,0.12)',  border: 'rgba(84,99,71,0.3)'  },
  { id: 'Personal',   color: '#705765', bg: 'rgba(112,87,101,0.1)', border: 'rgba(112,87,101,0.3)'},
  { id: 'Espiritual', color: '#695e37', bg: 'rgba(105,94,55,0.1)',  border: 'rgba(105,94,55,0.3)' },
];

const REMINDER_OPTIONS = ['15 minutos antes', '30 minutos antes', '1 hora antes', '1 día antes'];

export default function CreateEventScreen() {
  const { dispatch, navigate, showToast, state } = useApp();

  const [form, setForm] = useState({
    title:     '',
    date:      today,
    startTime: '',
    location:  '',
    category:  'Personal',
    notes:     '',
    reminder:  '15 minutos antes',
    reminderOn: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));

    dispatch({
      type: 'ADD_EVENT',
      event: {
        id:          Date.now().toString(),
        title:       form.title,
        date:        form.date,
        startTime:   form.startTime,
        location:    form.location,
        category:    form.category,
        notes:       form.notes,
        color:       CATEGORIES.find(c => c.id === form.category)?.color || '#705765',
        type:        form.category.toLowerCase(),
        // ── Reminder fields — needed by AppContext to schedule FCM push ──
        reminderOn:  form.reminderOn,
        reminder:    form.reminder,
      },
    });

    setSaving(false);
    setSaved(true);
    showToast('Evento creado', 'success');
    setTimeout(() => navigate('calendar'), 900);
  };

  return (
    <>
      <style>{`
        /* ========= CREATE EVENT SCREEN ========= */
        .ce-screen {
          padding: var(--space-xl) var(--space-container) var(--space-8);
          max-width: 860px;
          margin: 0 auto;
          animation: screenEnter 0.55s var(--ease-out) both;
        }

        /* ---- Header ---- */
        .ce-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--primary);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: var(--space-sm);
        }

        .ce-heading {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--on-surface);
          margin-bottom: var(--space-xl);
          line-height: 1.2;
        }

        /* ---- Cards ---- */
        .ce-card {
          background: var(--surface-container);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 24px;
          padding: var(--space-lg);
          box-shadow: 0 8px 32px rgba(112,87,101,0.06);
        }

        .ce-card-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--primary);
          margin-bottom: var(--space-md);
        }

        /* ---- Title field ---- */
        .ce-title-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--on-surface);
          padding: 0;
          caret-color: var(--primary);
        }

        .ce-title-input::placeholder { color: var(--outline-variant); }

        .ce-title-label {
          font-size: var(--text-label-sm);
          font-weight: 600;
          color: var(--outline);
          letter-spacing: 0.02em;
          display: block;
          margin-bottom: 6px;
        }

        /* ---- Bento grid ---- */
        .ce-bento {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        @media (min-width: 640px) {
          .ce-bento { grid-template-columns: 1fr 1fr; }
        }

        .ce-col { display: flex; flex-direction: column; gap: var(--space-md); }

        /* ---- Inputs ---- */
        .ce-field-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .ce-field label {
          display: block;
          font-size: var(--text-label-sm);
          color: var(--outline);
          margin-bottom: 4px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .ce-input {
          width: 100%;
          padding: 0.75rem 0.875rem;
          background: var(--surface-container-low);
          border: none;
          border-radius: 12px;
          font-size: var(--text-body-md);
          color: var(--on-surface);
          font-family: var(--font-body);
          transition: box-shadow var(--transition-fast);
          outline: none;
        }

        .ce-input:focus {
          box-shadow: 0 0 0 4px rgba(248,215,232,0.5);
        }

        .ce-input-wrap {
          position: relative;
        }

        .ce-input-wrap .ce-input { padding-left: 2.5rem; }

        .ce-input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--outline);
          pointer-events: none;
          transition: color var(--transition-fast);
        }

        .ce-input-wrap:focus-within .ce-input-icon { color: var(--primary); }

        .ce-input-right {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--outline);
          pointer-events: none;
        }

        /* ---- Category pills ---- */
        .ce-cats {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .ce-cat-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: var(--text-label-md);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-spring);
          border: 1.5px solid transparent;
          letter-spacing: 0.01em;
        }

        .ce-cat-btn:active { transform: scale(0.95); }

        .ce-cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ---- Avatars ---- */
        .ce-avatars {
          display: flex;
          margin-top: var(--space-sm);
        }

        .ce-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          object-fit: cover;
          margin-left: -8px;
        }

        .ce-avatar:first-child { margin-left: 0; }

        .ce-avatar-more {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          background: var(--primary-container);
          color: var(--on-primary-container);
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: -8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* ---- Textarea ---- */
        .ce-textarea {
          width: 100%;
          padding: var(--space-lg);
          background: var(--surface-container-low);
          border: none;
          border-radius: 16px;
          font-size: var(--text-body-md);
          color: var(--on-surface);
          font-family: var(--font-body);
          resize: none;
          outline: none;
          transition: box-shadow var(--transition-fast);
          line-height: 1.6;
        }

        .ce-textarea:focus { box-shadow: 0 0 0 4px rgba(248,215,232,0.5); }
        .ce-textarea::placeholder { color: var(--outline-variant); }

        /* ---- Attachments ---- */
        .ce-attach-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(208,195,200,0.2);
          padding-top: var(--space-md);
          margin-top: var(--space-md);
        }

        .ce-attach-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-label-md);
          color: var(--outline);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color var(--transition-fast);
          font-weight: 500;
        }

        .ce-attach-btn:hover { color: var(--primary); }

        .ce-file-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          background: var(--surface-container);
          border-radius: 10px;
          font-size: 12px;
          color: var(--on-surface-variant);
        }

        .ce-file-chip button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--outline);
          display: flex;
          padding: 0;
          transition: color var(--transition-fast);
        }
        .ce-file-chip button:hover { color: var(--error); }

        /* ---- Reminder row ---- */
        .ce-reminder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .ce-reminder-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .ce-reminder-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(84,99,71,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--secondary);
          flex-shrink: 0;
        }

        .ce-reminder-label {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--on-surface);
        }

        .ce-reminder-sub {
          font-size: 12px;
          color: var(--outline);
          margin-top: 1px;
        }

        .ce-reminder-right {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        /* Toggle */
        .ce-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          cursor: pointer;
        }

        .ce-toggle input { opacity: 0; width: 0; height: 0; }

        .ce-toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          transition: background var(--transition-fast);
        }

        .ce-toggle input:checked ~ .ce-toggle-track { background: var(--secondary); }
        .ce-toggle input:not(:checked) ~ .ce-toggle-track { background: var(--surface-container-highest); }

        .ce-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--surface-container-low);
          transition: transform var(--transition-spring);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }

        .ce-toggle input:checked ~ .ce-toggle-thumb { transform: translateX(20px); }

        .ce-select {
          background: transparent;
          border: none;
          font-size: var(--text-label-md);
          font-weight: 700;
          color: var(--primary);
          cursor: pointer;
          outline: none;
          font-family: var(--font-body);
        }

        /* ---- Action buttons ---- */
        .ce-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
          padding-top: var(--space-lg);
          padding-bottom: var(--space-8);
        }

        .ce-btn-save {
          padding: 1rem 2.5rem;
          border-radius: 9999px;
          background: var(--primary);
          color: var(--on-primary);
          font-size: 16px;
          font-weight: 600;
          font-family: var(--font-body);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(112,87,101,0.2);
          transition: all var(--transition-spring);
          min-width: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.01em;
        }

        .ce-btn-save:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(112,87,101,0.25); }
        .ce-btn-save:active { transform: scale(0.97); }
        .ce-btn-save.saved { background: var(--secondary); }

        .ce-btn-cancel {
          padding: 1rem var(--space-lg);
          background: none;
          border: none;
          color: var(--outline);
          font-size: var(--text-label-md);
          font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .ce-btn-cancel:hover { color: var(--on-surface); }

        /* ---- Ambient decor ---- */
        .ce-deco {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          opacity: 0.15;
          pointer-events: none;
          user-select: none;
          color: var(--primary-fixed-dim);
          transform: rotate(12deg);
        }
        .dark .ce-deco { opacity: 0; }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ce-screen">

        {/* ── Header ── */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="ce-eyebrow">
            <CalendarPlus size={16} />
            Crear Nuevo Evento
          </div>
          <h2 className="ce-heading">Diseña tu momento de hoy</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

          {/* ── Title Card ── */}
          <div className="ce-card">
            <label className="ce-title-label">Título del evento</label>
            <input
              className="ce-title-input"
              placeholder="Escribe el nombre del evento..."
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              id="ce-title"
              autoFocus
            />
          </div>

          {/* ── Bento grid ── */}
          <div className="ce-bento">

            {/* Left column */}
            <div className="ce-col">

              {/* Scheduling */}
              <div className="ce-card">
                <div className="ce-card-title">
                  <Clock size={16} />
                  Programación
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div className="ce-field">
                    <label>Fecha</label>
                    <DatePicker
                      value={form.date}
                      onChange={v => set('date', v)}
                      min={new Date().toISOString().split('T')[0]}
                      id="ce-date"
                    />
                  </div>
                  <div className="ce-field">
                    <label>Hora de inicio</label>
                    <TimePicker
                      value={form.startTime}
                      onChange={v => set('startTime', v)}
                      placeholder="Seleccionar hora"
                      id="ce-time"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="ce-card">
                <div className="ce-card-title">
                  <Tag size={16} />
                  Categoría
                </div>
                <div className="ce-cats">
                  {CATEGORIES.map(cat => {
                    const isActive = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className="ce-cat-btn"
                        style={{
                          background: isActive ? cat.bg : 'rgba(0,0,0,0.03)',
                          border: `1.5px solid ${isActive ? cat.color + '60' : 'rgba(208,195,200,0.5)'}`,
                          color: isActive ? cat.color : 'var(--on-surface-variant)',
                          boxShadow: isActive ? `0 0 0 3px ${cat.color}18` : 'none',
                        }}
                        onClick={() => set('category', cat.id)}
                        id={`ce-cat-${cat.id.toLowerCase()}`}
                      >
                        <span className="ce-cat-dot" style={{ background: cat.color }} />
                        {cat.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="ce-col">

              {/* Location */}
              <div className="ce-card">
                <div className="ce-card-title">
                  <MapPin size={16} />
                  Ubicación
                </div>
                <div className="ce-input-wrap">
                  <Link2 size={16} className="ce-input-icon" />
                  <input
                    type="text"
                    className="ce-input"
                    placeholder="Link de videollamada o dirección física"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    id="ce-location"
                  />
                </div>
              </div>

              {/* Invitees */}
              <div className="ce-card">
                <div className="ce-card-title">
                  <Users size={16} />
                  Invitados
                </div>
                <div className="ce-input-wrap">
                  <input
                    type="text"
                    className="ce-input"
                    placeholder="Buscar por nombre o correo..."
                    style={{ paddingLeft: '0.875rem', paddingRight: '2.5rem' }}
                    id="ce-invitees"
                  />
                  <Search size={16} className="ce-input-right" />
                </div>
                {/* Avatar stack */}
                <div className="ce-avatars" style={{ marginTop: 'var(--space-md)' }}>
                  {[
                    'https://i.pravatar.cc/40?img=47',
                    'https://i.pravatar.cc/40?img=15',
                  ].map((src, i) => (
                    <img key={i} src={src} className="ce-avatar" alt="Invitado" />
                  ))}
                  <div className="ce-avatar-more">+3</div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Notes card ── */}
          <div className="ce-card">
            <div className="ce-card-title">
              <AlignLeft size={16} />
              Notas y Descripción
            </div>
            <textarea
              className="ce-textarea"
              rows={4}
              placeholder="Añade intenciones, objetivos o detalles importantes..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              id="ce-notes"
            />
            {/* Attachment row */}
            <div className="ce-attach-row">
              <button type="button" className="ce-attach-btn" id="ce-attach">
                <Paperclip size={18} />
                Adjuntar archivos
              </button>
            </div>
          </div>

          {/* ── Reminder card ── */}
          <div className="ce-card">
            <div className="ce-reminder">
              <div className="ce-reminder-left">
                <div className="ce-reminder-icon">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="ce-reminder-label">Recordatorios automáticos</div>
                  <div className="ce-reminder-sub">Notificar {form.reminder.toLowerCase()}</div>
                </div>
              </div>
              <div className="ce-reminder-right">
                {/* Toggle */}
                <label className="ce-toggle" htmlFor="ce-reminder-toggle" aria-label="Activar recordatorio">
                  <input
                    type="checkbox"
                    id="ce-reminder-toggle"
                    checked={form.reminderOn}
                    onChange={e => set('reminderOn', e.target.checked)}
                  />
                  <div className="ce-toggle-track" />
                  <div className="ce-toggle-thumb" />
                </label>
                {/* Dropdown */}
                <select
                  className="ce-select"
                  value={form.reminder}
                  onChange={e => set('reminder', e.target.value)}
                  id="ce-reminder-select"
                >
                  {REMINDER_OPTIONS.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="ce-actions">
            <button
              type="submit"
              className={`ce-btn-save${saved ? ' saved' : ''}`}
              id="ce-save"
              disabled={saving}
            >
              {saving ? (
                <span style={{ opacity: 0.8 }}>Guardando...</span>
              ) : saved ? (
                <><Check size={18} /> Evento guardado</>
              ) : (
                'Guardar Evento'
              )}
            </button>
            <button
              type="button"
              className="ce-btn-cancel"
              onClick={() => navigate('calendar')}
              id="ce-cancel"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>

      {/* Ambient decor */}
      <div className="ce-deco" aria-hidden="true">
        <Leaf size={120} strokeWidth={0.5} />
      </div>
    </>
  );
}
