import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft, Edit2, Trash2, CheckSquare,
  StickyNote, Bell, Clock, Calendar, RotateCcw, Plus,
  Check, Sparkles, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const CAT_STYLE = {
  Marketing:  { bg: 'rgba(84,99,71,0.15)',   color: '#3d4b31', dot: '#546347'  },
  Personal:   { bg: 'rgba(112,87,101,0.12)', color: '#57404d', dot: '#705765' },
  Espiritual: { bg: 'rgba(105,94,55,0.12)',  color: '#504622', dot: '#695e37' },
};

const STATUS_STYLE = {
  done:    { bg: 'rgba(84,99,71,0.15)',   color: '#3d4b31', label: 'Completada'  },
  pending: { bg: 'rgba(208,195,200,0.25)', color: '#57404d', label: 'En progreso' },
};

export default function TaskDetailScreen() {
  const { state, dispatch, goBack, navigate, showToast } = useApp();
  const { screenParams, tasks } = state;
  const taskId = screenParams?.taskId;
  const task   = tasks.find(t => t.id === taskId);

  const [checklist, setChecklist] = useState([]);
  const [newCheck, setNewCheck] = useState('');
  const [notes, setNotes]       = useState('');

  if (!task) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
          <FileText size={48} style={{ margin: '0 auto' }} />
        </div>
        <p style={{ marginBottom: 'var(--space-md)' }}>Tarea no encontrada</p>
        <button className="btn btn-primary" onClick={goBack}>Volver</button>
      </div>
    );
  }

  const handleComplete = () => {
    dispatch({ type: 'TOGGLE_TASK', id: task.id });
    showToast(task.completed ? 'Tarea reabierta' : '¡Completada!', task.completed ? 'default' : 'success');
    goBack();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_TASK', id: task.id });
    showToast('Tarea eliminada');
    goBack();
  };

  const toggleCheck = (id) => {
    setChecklist(l => l.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const addCheck = () => {
    if (!newCheck.trim()) return;
    setChecklist(l => [...l, { id: Date.now().toString(), text: newCheck, done: false }]);
    setNewCheck('');
  };

  const checkDone    = checklist.filter(c => c.done).length;
  const checkPct     = checklist.length ? Math.round((checkDone / checklist.length) * 100) : 0;
  const catStyle     = CAT_STYLE[task.category] || CAT_STYLE.Personal;
  const statusStyle  = task.completed ? STATUS_STYLE.done : STATUS_STYLE.pending;
  const formattedDate = task.date
    ? new Date(task.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <>
      <style>{`
        /* ======= TASK DETAIL ======= */
        .td-screen {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 var(--space-container) var(--space-8);
          animation: screenEnter 0.5s var(--ease-out) both;
        }

        /* ---- Top bar ---- */
        .td-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md) 0 var(--space-lg);
          gap: var(--space-md);
        }

        .td-topbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          min-width: 0;
        }

        .td-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--on-surface);
          transition: background var(--transition-fast);
          flex-shrink: 0;
        }
        .td-back-btn:hover { background: var(--surface-container); }
        .td-back-btn:active { transform: scale(0.9); }

        .td-topbar-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          color: var(--primary);
          line-height: 1.2;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .td-topbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
        }

        .td-icon-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0.5rem 0.75rem;
          border-radius: 9999px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--on-surface-variant);
          font-size: var(--text-label-md);
          font-family: var(--font-body);
          font-weight: 500;
          transition: background var(--transition-fast);
        }

        .td-icon-btn:hover { background: var(--surface-container-high); }

        .td-delete-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--error);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }

        .td-delete-btn:hover { background: var(--error-container); }

        /* ---- Main card ---- */
        .td-card {
          background: var(--surface-container-lowest);
          border-radius: 32px;
          padding: var(--space-lg);
          border: 1px solid rgba(255,255,255,0.4);
          box-shadow: 0 20px 40px rgba(112,87,101,0.05), 0 4px 12px rgba(112,87,101,0.03);
          margin-bottom: var(--space-lg);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .td-card:hover { transform: translateY(-3px); }

        /* ---- Badges row ---- */
        .td-badges {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .td-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: var(--text-label-sm);
          font-weight: 600;
        }

        .td-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .td-time-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          font-weight: 500;
        }

        /* ---- Task title & desc ---- */
        .td-task-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.25;
          margin-bottom: var(--space-md);
        }

        .td-task-desc {
          font-size: var(--text-body-lg);
          color: var(--on-surface-variant);
          line-height: 1.65;
          margin-bottom: var(--space-xl);
          max-width: 680px;
        }

        /* ---- Bento grid ---- */
        .td-bento {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-xl);
        }

        @media (min-width: 640px) {
          .td-bento { grid-template-columns: 1fr 1fr; }
        }

        .td-col { display: flex; flex-direction: column; gap: var(--space-xl); }

        /* ---- Section heading ---- */
        .td-section-title {
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-bottom: var(--space-md);
        }

        /* ---- Checklist ---- */
        .td-check-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 0.75rem;
          border-radius: 16px;
          transition: background var(--transition-fast);
          cursor: pointer;
        }

        .td-check-item:hover { background: var(--surface-container); }

        .td-check-box {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid var(--outline-variant);
          background: none;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: all var(--transition-spring);
        }

        .td-check-box:hover { border-color: var(--secondary); }

        .td-check-box.checked {
          background: var(--secondary);
          border-color: var(--secondary);
        }

        .td-check-label {
          font-size: var(--text-body-md);
          color: var(--on-surface);
          transition: all var(--transition-fast);
          flex: 1;
        }

        .td-check-label.done {
          text-decoration: line-through;
          color: var(--outline-variant);
        }

        .td-add-check-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0.5rem 0.75rem;
          background: none;
          border: none;
          color: var(--primary);
          font-size: var(--text-label-md);
          font-family: var(--font-body);
          font-weight: 600;
          cursor: pointer;
          transition: transform var(--transition-fast);
          margin-top: var(--space-xs);
        }

        .td-add-check-btn:hover { transform: translateX(3px); }

        .td-check-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: var(--surface-container-low);
          border: none;
          border-radius: 12px;
          font-size: var(--text-body-md);
          font-family: var(--font-body);
          color: var(--on-surface);
          outline: none;
          margin-top: var(--space-sm);
          transition: box-shadow var(--transition-fast);
        }

        .td-check-input:focus { box-shadow: 0 0 0 3px rgba(248,215,232,0.45); }

        /* ---- Attachments ---- */
        .td-attach-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .td-attach-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 0.75rem;
          border-radius: 16px;
          border: 1px solid rgba(208,195,200,0.3);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .td-attach-item:hover { background: var(--surface-container); }

        .td-attach-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .td-attach-name {
          font-size: var(--text-label-md);
          font-weight: 500;
          color: var(--on-surface);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .td-attach-size {
          font-size: 11px;
          color: var(--on-surface-variant);
          margin-top: 2px;
        }

        /* ---- Notes ---- */
        .td-notes-box {
          background: var(--surface-container-low);
          border-radius: 16px;
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          min-height: 160px;
          display: flex;
          flex-direction: column;
        }

        .td-notes-existing {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          font-style: italic;
          margin-bottom: var(--space-md);
          line-height: 1.65;
        }

        .td-notes-divider {
          height: 1px;
          background: rgba(208,195,200,0.2);
          margin-bottom: var(--space-md);
        }

        .td-notes-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: var(--text-body-md);
          font-family: var(--font-body);
          color: var(--on-surface);
          resize: none;
          line-height: 1.6;
          min-height: 80px;
        }

        .td-notes-textarea::placeholder { color: var(--outline); }

        /* ---- Reminder row ---- */
        .td-reminder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md);
          border-radius: 16px;
          background: rgba(242,226,177,0.2);
          border: 1px solid var(--tertiary-container);
        }

        .td-reminder-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .td-reminder-label {
          font-size: var(--text-label-md);
          font-weight: 500;
          color: var(--on-tertiary-container);
        }

        .td-reminder-change {
          background: none;
          border: none;
          color: var(--tertiary);
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
        }

        .td-reminder-change:hover { text-decoration: underline; }

        /* ---- Quote / accent ---- */
        .td-quote {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xl) 0;
          text-align: center;
        }

        .td-quote-text {
          font-family: var(--font-display);
          font-style: italic;
          color: var(--on-surface-variant);
          opacity: 0.6;
          font-size: var(--text-body-lg);
          max-width: 400px;
        }

        /* ---- Bottom actions ---- */
        .td-actions {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-lg);
          flex-wrap: wrap;
        }

        .td-btn-complete {
          flex: 1;
          padding: 0.875rem;
          border-radius: 9999px;
          border: none;
          background: var(--primary);
          color: var(--on-primary);
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 16px rgba(112,87,101,0.2);
          transition: all var(--transition-fast);
          min-width: 160px;
        }

        .td-btn-complete:hover { opacity: 0.9; transform: translateY(-1px); }
        .td-btn-complete:active { transform: scale(0.97); }
        .td-btn-complete.reopen { background: var(--surface-container-high); color: var(--on-surface); box-shadow: none; }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="td-screen">

        {/* ── Top bar ── */}
        <div className="td-topbar">
        <div className="td-topbar-left">
          <Button variant="ghost" size="icon" onClick={goBack} id="td-back" aria-label="Volver" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <span className="td-topbar-title">{task.title}</span>
        </div>
        <div className="td-topbar-right">
          <Button variant="ghost" size="sm" id="td-edit" className="rounded-full gap-1" onClick={() => navigate('createTask', { taskId: task.id })}>
            <Edit2 size={16} /> Editar
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} id="td-delete" aria-label="Eliminar" className="rounded-full text-error hover:bg-error-container hover:text-on-error-container">
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

        {/* ── Main card ── */}
        <article className="td-card">

          {/* Badges */}
          <div className="td-badges">
            <Badge
              variant={task.completed ? 'secondary' : 'primary'}
              dot
            >
              {statusStyle.label}
            </Badge>

            {task.category && (
              <Badge variant="outline">{task.category}</Badge>
            )}

            {(task.time || formattedDate) && (
              <div className="td-time-badge">
                <Clock size={16} strokeWidth={1.75} />
                <span>
                  {formattedDate ? `${formattedDate.split(',')[0]}, ` : ''}
                  {task.time || 'Todo el día'}
                </span>
              </div>
            )}
          </div>

          {/* Title & description */}
          <h1 className="td-task-title">{task.title}</h1>
          {task.description && (
            <p className="td-task-desc">{task.description}</p>
          )}

          {/* Bento grid */}
          <div className="td-bento">

            {/* Left column */}
            <div className="td-col">

              {/* Checklist */}
              <section>
                <div className="td-section-title">
                  <CheckSquare size={18} color="var(--secondary)" strokeWidth={1.75} />
                  Checklist
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <Progress value={checkPct} color="secondary" className="flex-1" />
                  <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{checkDone}/{checklist.length}</span>
                </div>

                {checklist.map(item => (
                  <div
                    key={item.id}
                    className="td-check-item"
                    onClick={() => toggleCheck(item.id)}
                  >
                    <Checkbox
                      id={`check-${item.id}`}
                      checked={item.done}
                      onCheckedChange={() => toggleCheck(item.id)}
                    />
                    <span className={`td-check-label${item.done ? ' done' : ''}`}>{item.text}</span>
                  </div>
                ))}

                {/* Add item */}
                <Input
                  className="mt-2"
                  placeholder="Escribe un nuevo ítem y presiona Enter..."
                  value={newCheck}
                  onChange={e => setNewCheck(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheck()}
                  id="check-add-input"
                />
                <button className="td-add-check-btn" onClick={addCheck} id="check-add-btn">
                  <Plus size={16} /> Añadir ítem
                </button>
              </section>

            </div>

            {/* Right column */}
            <div className="td-col">

              {/* Notes */}
              <section>
                <div className="td-section-title">
                  <StickyNote size={18} color="var(--secondary)" strokeWidth={1.75} />
                  Notas
                </div>
                <div className="td-notes-box">
                  {task.description && (
                    <>
                      <p className="td-notes-existing">
                        "{task.description}"
                      </p>
                      <div className="td-notes-divider" />
                    </>
                  )}
                  <textarea
                    className="td-notes-textarea"
                    placeholder="Escribe una nota nueva..."
                    rows={4}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    id="td-notes"
                  />
                </div>
              </section>

              {/* Reminder */}
              <section>
                <div className="td-section-title">
                  <Bell size={18} color="var(--secondary)" strokeWidth={1.75} />
                  Recordatorios
                </div>
                <div className="td-reminder">
                  <div className="td-reminder-left">
                    <Bell size={20} color="var(--tertiary)" strokeWidth={1.5} />
                    <span className="td-reminder-label">
                      {task.reminder ? '15 minutos antes' : 'Sin recordatorio'}
                    </span>
                  </div>
                  <button className="td-reminder-change">Cambiar</button>
                </div>
              </section>

            </div>
          </div>
        </article>

        {/* ── Inspirational quote ── */}
        <div className="td-quote">
          <Sparkles size={20} color="var(--secondary-fixed-dim)" strokeWidth={1.5} />
          <p className="td-quote-text">
            "El secreto de progresar es comenzar."
          </p>
        </div>

        {/* ── Action buttons ── */}
        <div className="td-actions">
          <Button
            size="lg"
            variant={task.completed ? 'outline' : 'default'}
            onClick={handleComplete}
            id="td-complete"
            className="flex-1"
          >
            {task.completed
              ? <><RotateCcw size={16} /> Reabrir tarea</>
              : <><Check size={16} /> Completar tarea</>}
          </Button>
        </div>

      </div>
    </>
  );
}
