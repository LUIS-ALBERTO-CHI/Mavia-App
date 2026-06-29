import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Calendar, Clock, Plus, X, UploadCloud, FileText, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input, Textarea } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { DatePicker } from '../components/ui/date-picker';
import { TimePicker } from '../components/ui/time-picker';
import { localToday } from '../lib/utils';

const CATEGORIES = [
  { id: 'Marketing',  dot: '#546347' },
  { id: 'Personal',   dot: '#705765' },
  { id: 'Espiritual', dot: '#695e37' },
  { id: 'Urgente',    dot: '#ba1a1a', error: true },
  { id: 'Trabajo',    dot: '#4a6fa5' },
  { id: 'Salud',      dot: '#2e7d67' },
];

const today = localToday();

export default function CreateTaskScreen() {
  const { state, dispatch, goBack, showToast } = useApp();

  // Edit mode: if navigated with a taskId param, pre-load that task
  const taskId   = state.screenParams?.taskId || null;
  const editTask = taskId ? state.tasks.find(t => t.id === taskId) : null;
  const isEdit   = !!editTask;

  const [form, setForm] = useState(
    editTask ? {
      title:       editTask.title || '',
      description: editTask.description || '',
      priority:    editTask.priority || 'media',
      category:    editTask.category || 'Personal',
      date:        editTask.date || today,
      time:        editTask.time || '',
      repeat:      editTask.repeat || 'No repetir',
      reminder:    editTask.reminder || false,
      color:       editTask.color || '#F8D7E8',
    } : {
      title:       '',
      description: '',
      priority:    'media',
      category:    'Personal',
      date:        today,
      time:        '',
      repeat:      'No repetir',
      reminder:    false,
      color:       '#F8D7E8',
    }
  );

  const [checklist, setChecklist] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [saving,    setSaving]    = useState(false);
  const [files,     setFiles]     = useState([]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addCheckItem = () =>
    setChecklist(l => [...l, { id: Date.now().toString(), text: '' }]);

  const removeCheckItem = (id) =>
    setChecklist(l => l.filter(c => c.id !== id));

  const updateCheckItem = (id, text) =>
    setChecklist(l => l.map(c => c.id === id ? { ...c, text } : c));

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setTimeout(() => {
      if (isEdit) {
        dispatch({ type: 'UPDATE_TASK', task: { ...editTask, ...form } });
        showToast('Tarea actualizada', 'success');
      } else {
        dispatch({ type: 'ADD_TASK', task: { ...form, completed: false } });
        showToast('¡Tarea creada!', 'success');
      }
      goBack();
    }, 600);
  };

  return (
    <>
      <style>{`
        /* ========= CREATE TASK ========= */
        .ct-screen {
          max-width: 1100px;
          margin: 0 auto;
          padding: var(--space-lg) var(--space-container) var(--space-8);
          animation: screenEnter 0.45s var(--ease-out) both;
        }

        /* ---- Header ---- */
        .ct-back {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--primary);
          font-size: var(--text-label-md);
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: var(--space-md);
          transition: transform var(--transition-fast);
        }
        .ct-back:hover { transform: translateX(-4px); }

        .ct-heading {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.2;
        }

        .ct-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          margin-top: 4px;
          margin-bottom: var(--space-xl);
        }

        /* ---- Grid ---- */
        .ct-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }

        @media (min-width: 1024px) {
          .ct-grid { grid-template-columns: 1fr 340px; }
        }

        .ct-left  { display: flex; flex-direction: column; gap: var(--space-lg); }
        .ct-right { display: flex; flex-direction: column; gap: var(--space-lg); }

        /* ---- Cards ---- */
        .ct-card {
          background: var(--surface-container-lowest);
          border-radius: 32px;
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 24px rgba(112,87,101,0.04);
        }

        .ct-card-sm {
          background: var(--surface-container-low);
          border-radius: 32px;
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.2);
        }

        /* ---- Field label ---- */
        .ct-field-label {
          display: block;
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 6px;
          padding: 0 4px;
        }

        /* ---- Title underline input ---- */
        .ct-title-input {
          width: 100%;
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid var(--outline-variant);
          outline: none;
          color: var(--on-surface);
          padding: 6px 0;
          transition: border-color var(--transition-fast);
          line-height: 1.4;
        }
        .ct-title-input:focus { border-bottom-color: var(--primary); }
        .ct-title-input::placeholder { color: var(--outline); }

        /* ---- Category pills ---- */
        .ct-cats {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .ct-cat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: var(--text-label-md);
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid var(--outline-variant);
          color: var(--on-surface-variant);
          background: transparent;
          transition: all var(--transition-fast);
        }

        .ct-cat-pill:hover {
          background: var(--surface-container);
        }

        .ct-cat-pill.selected {
          border-color: currentColor;
          background: rgba(0,0,0,0.04);
        }

        .ct-cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ---- Checklist ---- */
        .ct-check-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 4px 0;
        }

        .ct-check-icon {
          color: var(--outline);
          flex-shrink: 0;
          transition: color var(--transition-fast);
        }

        .ct-check-row:hover .ct-check-icon { color: var(--primary); }

        .ct-check-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: var(--text-body-md);
          font-family: var(--font-body);
          color: var(--on-surface);
        }

        .ct-check-input::placeholder { color: var(--outline-variant); }

        .ct-check-remove {
          background: none;
          border: none;
          color: var(--outline-variant);
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--transition-fast);
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 4px;
        }

        .ct-check-row:hover .ct-check-remove { opacity: 1; }
        .ct-check-remove:hover { color: var(--error); }

        .ct-add-step {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--primary);
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          background: none;
          border: none;
          cursor: pointer;
          margin-top: var(--space-sm);
          padding: 4px 0;
          transition: transform var(--transition-fast);
        }
        .ct-add-step:hover { transform: translateX(3px); }

        /* ---- DateTime inputs ---- */
        .ct-dt-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--outline);
          margin-bottom: 4px;
          padding-left: 4px;
        }

        .ct-dt-field {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-container-low);
          border: 1px solid rgba(208,195,200,0.3);
          border-radius: 12px;
          padding: 0.75rem 1rem;
        }

        .ct-dt-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: var(--text-label-md);
          font-family: var(--font-body);
          color: var(--on-surface);
          flex: 1;
          min-width: 0;
        }

        /* ---- Drop zone ---- */
        .ct-dropzone {
          border: 2px dashed rgba(208,195,200,0.5);
          border-radius: 16px;
          padding: var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          cursor: pointer;
          text-align: center;
          transition: background var(--transition-fast);
        }
        .ct-dropzone:hover { background: var(--surface-container); }

        .ct-file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-container-high);
          border: 1px solid rgba(208,195,200,0.1);
          border-radius: 12px;
          padding: 10px 12px;
          margin-top: var(--space-sm);
        }

        .ct-file-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: var(--text-label-sm);
          color: var(--on-surface);
        }

        /* ---- Reminder ---- */
        .ct-reminder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(242,226,177,0.2);
          border: 1px solid var(--tertiary-container);
          border-radius: 16px;
          padding: var(--space-md);
        }

        .ct-reminder-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          font-size: var(--text-label-md);
          font-weight: 500;
          color: var(--on-tertiary-container);
        }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <form className="ct-screen" onSubmit={handleSave}>

        {/* ── Header ── */}
        <button type="button" className="ct-back" onClick={goBack}>
          <ArrowLeft size={16} strokeWidth={2} />
          {isEdit ? 'Volver al detalle' : 'Volver a mis tareas'}
        </button>
        <h2 className="ct-heading">{isEdit ? 'Editar Tarea' : 'Crear Nueva Tarea'}</h2>
        <p className="ct-sub">{isEdit ? 'Modifica los detalles de tu tarea.' : 'Define tus intenciones y organiza tu día con propósito.'}</p>

        {/* ── Grid ── */}
        <div className="ct-grid">

          {/* ─── LEFT COLUMN ─── */}
          <div className="ct-left">

            {/* Main form card */}
            <section className="ct-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

                {/* Title */}
                <div>
                  <label className="ct-field-label" htmlFor="ct-title">Título de la tarea</label>
                  <input
                    id="ct-title"
                    className="ct-title-input"
                    placeholder="Ej. Estrategia de Marketing Q4"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="ct-field-label" htmlFor="ct-desc">Descripción detallada</label>
                  <Textarea
                    id="ct-desc"
                    placeholder="¿Qué necesitas lograr hoy?..."
                    rows={4}
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    className="rounded-2xl bg-surface-container-low border-0 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Categories */}
                <div>
                  <div className="ct-field-label">Categoría</div>
                  <div className="ct-cats">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`ct-cat-pill${form.category === cat.id ? ' selected' : ''}`}
                        style={form.category === cat.id
                          ? { color: cat.error ? 'var(--error)' : cat.dot, borderColor: cat.dot }
                          : {}}
                        onClick={() => set('category', cat.id)}
                        id={`ct-cat-${cat.id}`}
                      >
                        <span className="ct-cat-dot" style={{ background: cat.dot }} />
                        {cat.id}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* Checklist card */}
            <section className="ct-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontWeight: 600, fontSize: 'var(--text-headline-md)', color: 'var(--on-surface)' }}>
                  Lista de verificación
                </h3>
                <button type="button" className="ct-add-step" onClick={addCheckItem} id="ct-add-step">
                  <Plus size={16} strokeWidth={2.5} /> Añadir paso
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checklist.map(item => (
                  <div key={item.id} className="ct-check-row">
                    <span className="ct-check-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect x="3" y="3" width="18" height="18" rx="4"/>
                      </svg>
                    </span>
                    <input
                      className="ct-check-input"
                      placeholder="Ej. Revisar métricas finales"
                      value={item.text}
                      onChange={e => updateCheckItem(item.id, e.target.value)}
                      id={`ct-check-${item.id}`}
                    />
                    <button
                      type="button"
                      className="ct-check-remove"
                      onClick={() => removeCheckItem(item.id)}
                      aria-label="Eliminar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="ct-right">

            {/* Date & Time */}
            <section className="ct-card-sm">
              <h3 style={{ fontWeight: 600, fontSize: 'var(--text-headline-md)', color: 'var(--on-surface)', marginBottom: 'var(--space-md)' }}>
                Vencimiento
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                  <span className="ct-dt-label">Fecha</span>
                  <DatePicker
                    value={form.date}
                    onChange={v => set('date', v)}
                    min={new Date().toISOString().split('T')[0]}
                    id="ct-date"
                  />
                </div>
                <div>
                  <span className="ct-dt-label">Hora</span>
                  <TimePicker
                    value={form.time}
                    onChange={v => set('time', v)}
                    placeholder="Seleccionar hora"
                    id="ct-time"
                  />
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section className="ct-card-sm">
              <h3 style={{ fontWeight: 600, fontSize: 'var(--text-headline-md)', color: 'var(--on-surface)', marginBottom: 'var(--space-md)' }}>
                Archivos adjuntos
              </h3>
              <div className="ct-dropzone">
                <UploadCloud size={28} color="var(--primary)" strokeWidth={1.5} />
                <p style={{ fontSize: 'var(--text-label-md)', fontWeight: 500, color: 'var(--on-surface-variant)' }}>
                  Arrastra o sube archivos
                </p>
                <p style={{ fontSize: '10px', color: 'var(--outline)' }}>PDF, JPG, DOC (Max 10MB)</p>
              </div>

              {files.map((f, i) => (
                <div key={i} className="ct-file-item">
                  <div className="ct-file-left">
                    <FileText size={16} color="var(--secondary)" strokeWidth={1.5} />
                    <span>{f.name}</span>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline-variant)' }}
                    onClick={() => setFiles(fl => fl.filter((_, idx) => idx !== i))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </section>

            {/* Reminder */}
            <div className="ct-reminder">
              <div className="ct-reminder-left">
                <Bell size={20} color="var(--tertiary)" strokeWidth={1.5} />
                <span>Recordatorio</span>
              </div>
              <Switch
                id="ct-reminder"
                checked={form.reminder}
                onCheckedChange={v => set('reminder', v)}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Button
                type="submit"
                size="lg"
                disabled={saving || !form.title.trim()}
                id="ct-save"
                className="w-full"
              >
                {saving ? (
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                ) : 'Guardar Tarea'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goBack}
                id="ct-cancel"
                className="w-full"
              >
                Cancelar
              </Button>
            </div>

          </div>
        </div>
      </form>
    </>
  );
}
