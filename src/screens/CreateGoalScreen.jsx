import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Target, Calendar, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input, Textarea } from '../components/ui/input';
import { DatePicker } from '../components/ui/date-picker';

const CATEGORIES = ['Marketing', 'Personal', 'Espiritual', 'Trabajo', 'Salud'];
const COLORS = [
  '#F8D7E8', '#EDE7F6', '#A8C5A0', '#C9A96E', '#FFD6EC', '#DBEAFE',
];

const today = new Date().toISOString().split('T')[0];

export default function CreateGoalScreen() {
  const { dispatch, goBack, showToast } = useApp();

  const [form, setForm] = useState({
    title:    '',
    category: 'Personal',
    deadline: '',
    color:    '#F8D7E8',
    progress: 0,
  });
  const [tasks, setTasks]   = useState(['']);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addTask  = () => setTasks(t => [...t, '']);
  const rmTask   = (i) => setTasks(t => t.filter((_, idx) => idx !== i));
  const upTask   = (i, v) => setTasks(t => t.map((x, idx) => idx === i ? v : x));

  const handleSave = () => {
    if (!form.title.trim()) return;
    const filledTasks = tasks.filter(t => t.trim());
    setSaving(true);
    setTimeout(() => {
      dispatch({
        type: 'ADD_GOAL',
        goal: {
          ...form,
          tasks: filledTasks,
          completedTasks: 0,
          progress: 0,
        },
      });
      showToast('¡Objetivo creado!', 'success');
      goBack();
    }, 500);
  };

  return (
    <>
      <style>{`
        .cg-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 640px;
          margin: 0 auto;
        }
        .cg-back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: var(--on-surface-variant); font-size: var(--text-label-md); font-weight: 500;
          margin-bottom: var(--space-lg); padding: 0;
          transition: color var(--transition-fast);
        }
        .cg-back:hover { color: var(--primary); }
        .cg-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500; color: var(--primary);
          margin-bottom: 6px;
        }
        .cg-sub {
          font-size: var(--text-body-md); color: var(--on-surface-variant);
          margin-bottom: var(--space-xl);
        }
        .cg-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.05);
          margin-bottom: var(--space-lg);
        }
        .cg-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          margin-bottom: var(--space-md);
          display: block;
        }
        .cg-cats {
          display: flex; flex-wrap: wrap; gap: var(--space-sm);
          margin-bottom: 0;
        }
        .cg-cat-btn {
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: var(--text-label-md);
          font-weight: 500;
          border: 1.5px solid var(--outline-variant);
          background: var(--surface-container);
          color: var(--on-surface-variant);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cg-cat-btn.active {
          background: var(--primary);
          color: var(--on-primary);
          border-color: transparent;
        }
        .cg-color-row { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
        .cg-color-swatch {
          width: 36px; height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all var(--transition-spring);
        }
        .cg-color-swatch.selected { border-color: var(--on-surface); transform: scale(1.15); }
        .cg-task-row {
          display: flex; align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }
        .cg-task-num {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: var(--primary-container);
          color: var(--primary);
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cg-rm-btn {
          background: none; border: none; cursor: pointer;
          color: var(--outline); padding: 4px; border-radius: 50%;
          display: flex; align-items: center;
          transition: all var(--transition-fast);
        }
        .cg-rm-btn:hover { color: var(--error); background: var(--error-container); }
      `}</style>

      <div className="cg-screen">
        <button className="cg-back" onClick={goBack}>
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a objetivos
        </button>
        <h1 className="cg-title">Nuevo Objetivo</h1>
        <p className="cg-sub">Define hacia dónde quieres ir y cómo llegar.</p>

        {/* Title */}
        <div className="cg-card">
          <label className="cg-label" htmlFor="cg-title">Título del objetivo</label>
          <Input
            id="cg-title"
            placeholder="Ej. Lanzar mi primer curso online"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            autoFocus
          />
        </div>

        {/* Category + Color */}
        <div className="cg-card">
          <span className="cg-label">Categoría</span>
          <div className="cg-cats" style={{ marginBottom: 'var(--space-lg)' }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`cg-cat-btn${form.category === c ? ' active' : ''}`}
                onClick={() => set('category', c)}
                id={`cg-cat-${c}`}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="cg-label">Color</span>
          <div className="cg-color-row">
            {COLORS.map(c => (
              <div
                key={c}
                className={`cg-color-swatch${form.color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => set('color', c)}
                id={`cg-color-${c}`}
              />
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div className="cg-card">
          <label className="cg-label" htmlFor="cg-deadline">Fecha límite</label>
          <DatePicker
            id="cg-deadline"
            min={today}
            value={form.deadline}
            onChange={v => set('deadline', v)}
            placeholder="Seleccionar fecha límite"
          />
        </div>

        {/* Tasks / milestones */}
        <div className="cg-card">
          <span className="cg-label">Hitos o sub-tareas</span>
          {tasks.map((t, i) => (
            <div key={i} className="cg-task-row">
              <div className="cg-task-num">{i + 1}</div>
              <Input
                placeholder={`Hito ${i + 1}…`}
                value={t}
                onChange={e => upTask(i, e.target.value)}
                id={`cg-task-${i}`}
                className="flex-1"
              />
              {tasks.length > 1 && (
                <button className="cg-rm-btn" onClick={() => rmTask(i)}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTask}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 8,
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px dashed var(--outline-variant)',
              background: 'none',
              color: 'var(--on-surface-variant)',
              fontSize: 'var(--text-label-md)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            id="cg-add-task"
          >
            <Plus size={14} /> Añadir hito
          </button>
        </div>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!form.title.trim() || saving}
          id="cg-save"
        >
          <Target size={16} />
          {saving ? 'Creando…' : 'Crear Objetivo'}
        </Button>
      </div>
    </>
  );
}
