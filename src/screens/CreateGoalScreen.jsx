import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowLeft, Target, Calendar, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/ui/date-picker';
import { GOAL_TYPES } from '../lib/goalUtils';

const CATEGORIES = ['Marketing', 'Personal', 'Espiritual', 'Trabajo', 'Salud'];
const COLORS = [
  '#F8D7E8', '#EDE7F6', '#A8C5A0', '#C9A96E', '#FFD6EC', '#DBEAFE',
];

const today = new Date().toISOString().split('T')[0];

export default function CreateGoalScreen() {
  const { dispatch, goBack, showToast, state } = useApp();
  const { t } = useTranslation();

  // ── Edit mode: pre-fill if navigated with a goalId ──
  const editId   = state.screenParams?.goalId;
  const editGoal = editId ? state.goals.find(g => g.id === editId) : null;
  const isEdit   = !!editGoal;

  const [form, setForm] = useState(() => editGoal ? {
    title:    editGoal.title    || '',
    category: editGoal.category || 'Personal',
    deadline: editGoal.deadline || '',
    color:    editGoal.color    || '#F8D7E8',
    type:     editGoal.type     || 'count',
    target:   editGoal.target != null ? String(editGoal.target) : '',
    unit:     editGoal.unit     || '',
  } : {
    title:    '',
    category: 'Personal',
    deadline: '',
    color:    '#F8D7E8',
    type:     'count',
    target:   '',
    unit:     '',
  });

  // Lista de pasos (para el tipo "Pasos")
  const [stepList, setStepList] = useState(() =>
    isEdit && editGoal.steps?.length ? editGoal.steps.map(s => s.text) : ['']
  );
  const addStep = () => setStepList(l => [...l, '']);
  const rmStep  = (i) => setStepList(l => l.filter((_, idx) => idx !== i));
  const upStep  = (i, v) => setStepList(l => l.map((x, idx) => idx === i ? v : x));

  const [saving, setSaving] = useState(false);

  // Categorías personalizables: defaults + las que ya usan tus objetivos + nuevas
  const goalCats = (state.goals || []).map(g => g.category).filter(Boolean);
  const [extraCats, setExtraCats] = useState([]);
  const allCats = [...new Set([...CATEGORIES, ...goalCats, ...extraCats])];
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const addCat = () => {
    const name = newCatName.trim();
    if (!name) { setAddingCat(false); return; }
    if (!allCats.includes(name)) setExtraCats(e => [...e, name]);
    set('category', name);
    setNewCatName(''); setAddingCat(false);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const base = {
      title: form.title.trim(),
      category: form.category,
      deadline: form.deadline,
      color: form.color,
      type: form.type,
    };
    if (form.type === 'count') {
      base.target = Math.max(0, Math.round(Number(form.target) || 0));
      base.unit   = form.unit.trim();
      base.current = isEdit ? (editGoal.current || 0) : 0;
    } else if (form.type === 'steps') {
      base.steps = stepList.filter(t => t.trim()).map(text => {
        const prev = editGoal?.steps?.find(s => s.text === text);
        return { text: text.trim(), done: prev?.done || false };
      });
    } else { // simple
      base.done = isEdit ? (editGoal.done || false) : false;
    }
    if (isEdit) {
      dispatch({ type: 'UPDATE_GOAL', goal: { ...editGoal, ...base } });
      showToast('Objetivo actualizado', 'success');
    } else {
      dispatch({ type: 'ADD_GOAL', goal: base });
      showToast('¡Objetivo creado!', 'success');
    }
    goBack();
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
          font-weight: 700; color: var(--heading);
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
          border: 1px solid var(--outline-variant);
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
        .cg-cat-add { border-style: dashed; color: var(--primary); border-color: var(--primary); background: none; font-weight: 700; }
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
          {isEdit ? 'Volver al objetivo' : 'Volver a objetivos'}
        </button>
        <h1 className="cg-title">
          {isEdit ? 'Editar Objetivo' : 'Nuevo Objetivo'}
        </h1>
        <p className="cg-sub">
          {isEdit ? 'Modifica los detalles de tu objetivo.' : 'Define hacia dónde quieres ir y cómo llegar.'}
        </p>

        {/* Title */}
        <div className="cg-card">
          <label className="cg-label" htmlFor="cg-title">Título del objetivo</label>
          <Input
            id="cg-title"
            placeholder="Ej. Cerrar 3 clientes nuevos este trimestre"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            autoFocus
          />
        </div>

        {/* Category + Color */}
        <div className="cg-card">
          <span className="cg-label">Categoría</span>
          <div className="cg-cats" style={{ marginBottom: addingCat ? 10 : 'var(--space-lg)' }}>
            {allCats.map(c => (
              <button
                key={c}
                className={`cg-cat-btn${form.category === c ? ' active' : ''}`}
                onClick={() => set('category', c)}
                id={`cg-cat-${c}`}
              >
                {c}
              </button>
            ))}
            <button className="cg-cat-btn cg-cat-add" onClick={() => setAddingCat(v => !v)} id="cg-cat-add">
              ＋ Nueva
            </button>
          </div>
          {addingCat && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-lg)' }}>
              <Input
                autoFocus
                placeholder="Nombre de la categoría"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCat()}
                id="cg-cat-new"
                className="flex-1"
              />
              <Button onClick={addCat} disabled={!newCatName.trim()}>Agregar</Button>
            </div>
          )}

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
          <label className="cg-label" htmlFor="cg-deadline">{t('goals.deadline')}</label>
          <DatePicker
            id="cg-deadline"
            min={today}
            value={form.deadline}
            onChange={v => set('deadline', v)}
            placeholder="Seleccionar fecha límite"
          />
        </div>

        {/* Tipo de medición */}
        <div className="cg-card">
          <span className="cg-label">¿Cómo se mide?</span>
          <div className="cg-cats" style={{ marginTop: 6 }}>
            {GOAL_TYPES.map(tp => (
              <button key={tp.id} className={`cg-cat-btn${form.type === tp.id ? ' active' : ''}`}
                onClick={() => set('type', tp.id)} id={`cg-type-${tp.id}`} title={tp.hint}>
                {tp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campos según el tipo */}
        {form.type === 'count' && (
          <div className="cg-card">
            <span className="cg-label">¿Cuánto quieres lograr?</span>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <Input type="number" inputMode="numeric" min={1} placeholder="Ej. 7"
                value={form.target} onChange={e => set('target', e.target.value)} id="cg-target" style={{ flex: '0 0 110px' }} />
              <Input placeholder="unidad (días, $, libros…)"
                value={form.unit} onChange={e => set('unit', e.target.value)} id="cg-unit" className="flex-1" />
            </div>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 8 }}>
              Marcas <b>+1</b> cada vez y la barra se llena hasta la meta.
            </p>
          </div>
        )}

        {form.type === 'steps' && (
          <div className="cg-card">
            <span className="cg-label">Pasos</span>
            {stepList.map((s, i) => (
              <div key={i} className="cg-task-row">
                <div className="cg-task-num">{i + 1}</div>
                <Input placeholder={`Paso ${i + 1}…`} value={s} onChange={e => upStep(i, e.target.value)} id={`cg-step-${i}`} className="flex-1" />
                {stepList.length > 1 && <button className="cg-rm-btn" onClick={() => rmStep(i)} aria-label="Quitar paso">×</button>}
              </div>
            ))}
            <button onClick={addStep} className="cg-cat-btn cg-cat-add" style={{ marginTop: 8 }} id="cg-add-step">＋ Añadir paso</button>
          </div>
        )}

        {form.type === 'simple' && (
          <div className="cg-card">
            <p style={{ fontSize: 13.5, color: 'var(--on-surface-variant)' }}>
              Se marca como <b>cumplido</b> o <b>pendiente</b> con un toque desde Objetivos.
            </p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!form.title.trim() || saving}
          id="cg-save"
        >
          {isEdit ? <Edit2 size={16} /> : <Target size={16} />}
          {saving ? (isEdit ? 'Guardando…' : 'Creando…') : (isEdit ? 'Guardar Cambios' : 'Crear Objetivo')}
        </Button>
      </div>
    </>
  );
}
