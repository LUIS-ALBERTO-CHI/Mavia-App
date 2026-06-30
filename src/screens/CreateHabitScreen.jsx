import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Flame } from 'lucide-react';
import HabitIcon, { HABIT_CATALOGUE } from '../components/HabitIcon';

const CATEGORIES = ['Ejercicio', 'Mente', 'Sueño', 'Nutrición', 'Productividad', 'Espiritual'];

const COLORS = [
  { value: '#F8D7E8', label: 'Rosa'    },
  { value: '#EDE7F6', label: 'Lavanda' },
  { value: '#D5E5C2', label: 'Sage'    },
  { value: '#F0DFAE', label: 'Dorado'  },
  { value: '#DBEAFE', label: 'Azul'    },
  { value: '#FCE4D6', label: 'Melocotón'},
];

const FREQ_OPTIONS = [
  { id: 'daily',    label: 'Todos los días' },
  { id: 'weekdays', label: 'Lunes a Viernes' },
  { id: 'weekend',  label: 'Fin de semana'  },
  { id: 'custom',   label: 'Personalizado'  },
];
const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function CreateHabitScreen() {
  const { dispatch, goBack, showToast } = useApp();

  const [form, setForm] = useState({
    name:        '',
    icon:        'meditation',
    color:       '#F8D7E8',
    frequency:   'daily',
    customDays:  [true, true, true, true, true, false, false],
    target:      '',
    reminder:    false,
    reminderTime:'07:00',
  });
  const [activeCategory, setActiveCategory] = useState('Mente');
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleCustomDay = (i) => {
    const days = [...form.customDays];
    days[i] = !days[i];
    set('customDays', days);
  };

  const getActiveDays = () => {
    if (form.frequency === 'daily')    return [true,true,true,true,true,true,true];
    if (form.frequency === 'weekdays') return [true,true,true,true,true,false,false];
    if (form.frequency === 'weekend')  return [false,false,false,false,false,true,true];
    return form.customDays;
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      dispatch({
        type: 'ADD_HABIT',
        habit: {
          name:            form.name.trim(),
          icon:            form.icon,
          color:           form.color,
          frequency:       form.frequency,
          activeDays:      getActiveDays(),
          ...(form.target ? { target: Number(form.target), current: 0 } : {}),
          reminder:        form.reminder,
          reminderTime:    form.reminder ? form.reminderTime : null,
        },
      });
      showToast('¡Hábito creado! 🌱', 'success');
      goBack();
    }, 400);
  };

  const filteredIcons = HABIT_CATALOGUE.filter(h => h.category === activeCategory);

  return (
    <>
      <style>{`
        .ch-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 600px;
          margin: 0 auto;
        }
        .ch-back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: var(--on-surface-variant); font-size: var(--text-label-md); font-weight: 500;
          margin-bottom: var(--space-lg); padding: 0;
          transition: color var(--transition-fast);
        }
        .ch-back:hover { color: var(--primary); }
        .ch-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500; color: var(--primary);
          margin-bottom: 4px;
        }
        .ch-sub {
          font-size: var(--text-body-md); color: var(--on-surface-variant);
          margin-bottom: var(--space-xl);
        }
        .ch-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          box-shadow: var(--shadow-card);
          margin-bottom: var(--space-lg);
        }
        .ch-field-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          margin-bottom: var(--space-md);
          display: block;
        }

        /* Name input */
        .ch-name-input {
          width: 100%;
          padding: 0.75rem var(--space-md);
          background: var(--surface-container-low);
          border: none;
          border-bottom: 1.5px solid var(--outline-variant);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          font-size: var(--text-body-md);
          color: var(--on-surface);
          font-family: var(--font-body);
          outline: none;
          transition: all var(--transition-fast);
        }
        .ch-name-input::placeholder { color: var(--outline); }
        .ch-name-input:focus {
          border-bottom-color: var(--primary);
          background: var(--surface-container-lowest);
          box-shadow: 0 4px 16px -4px rgba(112,87,101,0.12);
        }

        /* Category tabs */
        .ch-cat-tabs {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: var(--space-md);
        }
        .ch-cat-tab {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: var(--text-label-sm);
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: var(--surface-container);
          color: var(--on-surface-variant);
          transition: all var(--transition-fast);
        }
        .ch-cat-tab.active {
          background: var(--primary-container);
          color: var(--on-primary-container);
        }

        /* Icon grid */
        .ch-icon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
          gap: var(--space-sm);
        }
        .ch-icon-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 10px 4px;
          border-radius: var(--radius-lg);
          border: 2px solid transparent;
          background: var(--surface-container);
          cursor: pointer;
          transition: all var(--transition-spring);
          font-size: 10px;
          font-weight: 600;
          color: var(--on-surface-variant);
          font-family: var(--font-body);
        }
        .ch-icon-btn .ch-emoji { font-size: 24px; line-height: 1.2; }
        .ch-icon-btn:hover { background: var(--primary-container); }
        .ch-icon-btn.selected {
          border-color: var(--primary);
          background: var(--primary-container);
          color: var(--primary);
          transform: scale(1.04);
        }

        /* Colors */
        .ch-color-row { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
        .ch-color-swatch {
          width: 36px; height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all var(--transition-spring);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
        }
        .ch-color-swatch.selected {
          border-color: var(--on-surface);
          transform: scale(1.18);
        }

        /* Frequency */
        .ch-freq-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: var(--space-sm); margin-bottom: var(--space-md);
        }
        .ch-freq-btn {
          padding: 10px var(--space-md);
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--outline-variant);
          background: none;
          font-family: var(--font-body);
          font-size: var(--text-label-md);
          font-weight: 500;
          cursor: pointer;
          color: var(--on-surface-variant);
          transition: all var(--transition-fast);
          text-align: center;
        }
        .ch-freq-btn.selected {
          border-color: var(--primary);
          background: var(--primary-container);
          color: var(--on-primary-container);
          font-weight: 600;
        }

        /* Custom days */
        .ch-days-row { display: flex; gap: 6px; justify-content: center; margin-top: var(--space-md); }
        .ch-day-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1.5px solid var(--outline-variant);
          background: none;
          font-size: var(--text-label-sm);
          font-weight: 700;
          cursor: pointer;
          color: var(--on-surface-variant);
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }
        .ch-day-btn.on {
          border-color: var(--primary);
          background: var(--primary-container);
          color: var(--on-primary-container);
        }

        /* Reminder */
        .ch-reminder-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: var(--space-md);
        }

        /* Save btn */
        .ch-save-btn {
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-full);
          background: var(--primary);
          color: var(--on-primary);
          border: none;
          font-family: var(--font-body);
          font-size: var(--text-body-md);
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all var(--transition-base);
        }
        .ch-save-btn:hover { opacity: 0.9; }
        .ch-save-btn:active { transform: scale(0.97); }
        .ch-save-btn:disabled { opacity: 0.5; pointer-events: none; }
      `}</style>

      <div className="ch-screen">
        <button className="ch-back" onClick={goBack}>
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a hábitos
        </button>
        <h1 className="ch-title">Nuevo Hábito</h1>
        <p className="ch-sub">Crea una rutina que se repita cada día automáticamente.</p>

        {/* Name */}
        <div className="ch-card">
          <label className="ch-field-label" htmlFor="ch-name">Nombre del hábito</label>
          <input
            className="ch-name-input"
            id="ch-name"
            placeholder="Ej. Meditación matutina"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        {/* Icon — filtered by category */}
        <div className="ch-card">
          <span className="ch-field-label">Categoría e icono</span>
          <div className="ch-cat-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`ch-cat-tab${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                id={`ch-cat-${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="ch-icon-grid">
            {filteredIcons.map(h => (
              <button
                key={h.id}
                className={`ch-icon-btn${form.icon === h.id ? ' selected' : ''}`}
                onClick={() => set('icon', h.id)}
                id={`ch-icon-${h.id}`}
              >
                <HabitIcon
                  id={h.id}
                  size={22}
                  color={form.icon === h.id ? 'var(--primary)' : 'var(--on-surface-variant)'}
                />
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="ch-card">
          <span className="ch-field-label">Color</span>
          <div className="ch-color-row">
            {COLORS.map(c => (
              <div
                key={c.value}
                className={`ch-color-swatch${form.color === c.value ? ' selected' : ''}`}
                style={{ background: c.value }}
                onClick={() => set('color', c.value)}
                title={c.label}
                id={`ch-color-${c.label}`}
              />
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="ch-card">
          <span className="ch-field-label">Frecuencia</span>
          <div className="ch-freq-grid">
            {FREQ_OPTIONS.map(f => (
              <button
                key={f.id}
                className={`ch-freq-btn${form.frequency === f.id ? ' selected' : ''}`}
                onClick={() => set('frequency', f.id)}
                id={`ch-freq-${f.id}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {form.frequency === 'custom' && (
            <div className="ch-days-row">
              {DAYS_SHORT.map((d, i) => (
                <button
                  key={d}
                  className={`ch-day-btn${form.customDays[i] ? ' on' : ''}`}
                  onClick={() => toggleCustomDay(i)}
                  id={`ch-day-${i}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reminder */}
        <div className="ch-card">
          <div className="ch-reminder-row">
            <div>
              <span className="ch-field-label" style={{ marginBottom: 2 }}>Recordatorio</span>
              <p style={{ fontSize: 'var(--text-label-sm)', color: 'var(--on-surface-variant)' }}>
                Recibe una notificación diaria para este hábito
              </p>
            </div>
            <label className="switch" style={{ marginLeft: 12 }}>
              <input
                type="checkbox"
                checked={form.reminder}
                onChange={e => set('reminder', e.target.checked)}
                id="ch-reminder"
              />
              <span className="switch-track" />
            </label>
          </div>
          {form.reminder && (
            <input
              type="time"
              className="ch-name-input"
              value={form.reminderTime}
              onChange={e => set('reminderTime', e.target.value)}
              id="ch-reminder-time"
            />
          )}
        </div>

        {/* Optional quantity target */}
        <div className="ch-card">
          <label className="ch-field-label" htmlFor="ch-target">Meta diaria (opcional)</label>
          <input
            className="ch-name-input"
            id="ch-target"
            type="number"
            placeholder="Ej. 8 (vasos de agua, km, páginas…)"
            value={form.target}
            onChange={e => set('target', e.target.value)}
            min={1}
          />
          <p style={{ marginTop: 8, fontSize: 'var(--text-label-sm)', color: 'var(--on-surface-variant)' }}>
            Solo para hábitos con cantidad medible
          </p>
        </div>

        <button
          className="ch-save-btn"
          onClick={handleSave}
          disabled={!form.name.trim() || saving}
          id="ch-save"
        >
          <Flame size={18} />
          {saving ? 'Creando…' : 'Crear Hábito'}
        </button>
      </div>
    </>
  );
}
