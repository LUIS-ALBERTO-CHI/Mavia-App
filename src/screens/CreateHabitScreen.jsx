import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Flame, Droplets, TrendingUp, Moon, BookOpen, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const HABIT_ICONS = [
  { id: 'meditation', label: 'Meditación', icon: Heart       },
  { id: 'book',       label: 'Lectura',    icon: BookOpen    },
  { id: 'water',      label: 'Agua',       icon: Droplets    },
  { id: 'exercise',   label: 'Ejercicio',  icon: TrendingUp  },
  { id: 'sleep',      label: 'Dormir',     icon: Moon        },
];

const COLORS = [
  { value: '#F8D7E8', label: 'Rosa'     },
  { value: '#EDE7F6', label: 'Lavanda'  },
  { value: '#A8C5A0', label: 'Sage'     },
  { value: '#C9A96E', label: 'Dorado'   },
  { value: '#FFD6EC', label: 'Flor'     },
  { value: '#DBEAFE', label: 'Azul'     },
];

export default function CreateHabitScreen() {
  const { dispatch, goBack, showToast } = useApp();

  const [form, setForm] = useState({
    name:    '',
    icon:    'meditation',
    color:   '#F8D7E8',
    target:  null,
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      dispatch({
        type: 'ADD_HABIT',
        habit: {
          name: form.name,
          icon: form.icon,
          color: form.color,
          streak: 0,
          weekData: [false,false,false,false,false,false,false],
          completedToday: false,
          ...(form.target ? { target: Number(form.target), current: 0 } : {}),
        },
      });
      showToast('¡Hábito creado!', 'success');
      goBack();
    }, 500);
  };

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
          margin-bottom: 6px;
        }
        .ch-sub {
          font-size: var(--text-body-md); color: var(--on-surface-variant);
          margin-bottom: var(--space-xl);
        }
        .ch-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.05);
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
        .ch-icon-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }
        .ch-icon-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: var(--space-md) 4px;
          border-radius: var(--radius-xl);
          border: 2px solid transparent;
          background: var(--surface-container);
          cursor: pointer;
          transition: all var(--transition-spring);
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }
        .ch-icon-btn:hover { background: var(--primary-container); }
        .ch-icon-btn.selected {
          border-color: var(--primary);
          background: var(--primary-container);
          color: var(--primary);
          transform: scale(1.05);
        }
        .ch-color-row {
          display: flex; gap: var(--space-sm); flex-wrap: wrap;
        }
        .ch-color-swatch {
          width: 36px; height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all var(--transition-spring);
        }
        .ch-color-swatch.selected {
          border-color: var(--on-surface);
          transform: scale(1.15);
        }
      `}</style>

      <div className="ch-screen">
        <button className="ch-back" onClick={goBack}>
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a hábitos
        </button>
        <h1 className="ch-title">Nuevo Hábito</h1>
        <p className="ch-sub">Crea una rutina que cuide tu bienestar.</p>

        {/* Name */}
        <div className="ch-card">
          <label className="ch-field-label" htmlFor="ch-name">Nombre del hábito</label>
          <Input
            id="ch-name"
            placeholder="Ej. Meditación matutina"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        {/* Icon */}
        <div className="ch-card">
          <span className="ch-field-label">Icono</span>
          <div className="ch-icon-grid">
            {HABIT_ICONS.map(h => {
              const Icon = h.icon;
              return (
                <button
                  key={h.id}
                  className={`ch-icon-btn${form.icon === h.id ? ' selected' : ''}`}
                  onClick={() => set('icon', h.id)}
                  id={`ch-icon-${h.id}`}
                >
                  <Icon size={22} strokeWidth={1.75} color={form.icon === h.id ? 'var(--primary)' : 'var(--on-surface-variant)'} />
                  {h.label}
                </button>
              );
            })}
          </div>

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

        {/* Optional target (for measurable habits like water) */}
        <div className="ch-card">
          <label className="ch-field-label" htmlFor="ch-target">Meta diaria (opcional)</label>
          <Input
            id="ch-target"
            type="number"
            placeholder="Ej. 8 (vasos de agua)"
            value={form.target || ''}
            onChange={e => set('target', e.target.value)}
            min={1}
          />
          <p style={{ marginTop: 8, fontSize: 'var(--text-label-sm)', color: 'var(--on-surface-variant)' }}>
            Solo para hábitos con cantidad (vasos de agua, minutos, páginas…)
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!form.name.trim() || saving}
          id="ch-save"
        >
          <Flame size={16} />
          {saving ? 'Creando…' : 'Crear Hábito'}
        </Button>
      </div>
    </>
  );
}
