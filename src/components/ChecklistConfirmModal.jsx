import { CheckSquare } from 'lucide-react';

/**
 * ChecklistConfirmModal
 * Modal elegante que aparece cuando una tarea con ítems pendientes
 * va a ser marcada como completada desde una vista de lista.
 *
 * Props:
 *   taskTitle    — string
 *   pendingCount — number
 *   onConfirm    — () => void  (completar de todas formas)
 *   onReview     — () => void  (ir al detalle / revisar checklist)
 *   onClose      — () => void  (cerrar sin acción)
 */
export default function ChecklistConfirmModal({ taskTitle, pendingCount, onConfirm, onReview, onClose }) {
  return (
    <>
      <style>{`
        .ccm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: ccmFadeIn 0.18s ease both;
        }
        @keyframes ccmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ccm-card {
          background: var(--surface);
          border-radius: 24px;
          padding: 28px 24px 20px;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
          animation: ccmSlideUp 0.22s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        @keyframes ccmSlideUp {
          from { transform: translateY(24px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }

        .ccm-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(242,226,177,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .ccm-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 600;
          color: var(--on-surface);
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .ccm-task-name {
          font-size: 13px;
          color: var(--on-surface-variant);
          margin-bottom: 8px;
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ccm-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 99px;
          background: rgba(242,226,177,0.4);
          color: #7a6234;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .ccm-desc {
          font-size: 13px;
          color: var(--on-surface-variant);
          line-height: 1.55;
          margin-bottom: 22px;
        }

        .ccm-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ccm-btn {
          width: 100%;
          padding: 12px 20px;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .ccm-btn:active { transform: scale(0.97); }

        .ccm-btn-primary {
          background: var(--primary-container);
          color: var(--on-primary-container);
        }
        .ccm-btn-primary:hover { filter: brightness(0.96); }

        .ccm-btn-confirm {
          background: var(--secondary-container);
          color: var(--on-secondary-container);
        }
        .ccm-btn-confirm:hover { filter: brightness(0.96); }

        .ccm-btn-ghost {
          background: none;
          color: var(--on-surface-variant);
          font-weight: 500;
          font-size: 13px;
          padding: 8px;
        }
        .ccm-btn-ghost:hover { color: var(--on-surface); }
      `}</style>

      {/* Backdrop — click outside = close */}
      <div className="ccm-backdrop" onClick={onClose}>
        <div className="ccm-card" onClick={e => e.stopPropagation()}>

          <div className="ccm-icon-wrap">
            <CheckSquare size={26} color="#7a6234" strokeWidth={1.75} />
          </div>

          <div className="ccm-title">Checklist incompleto</div>
          <div className="ccm-task-name">"{taskTitle}"</div>

          <div className="ccm-badge">
            {pendingCount} ítem{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
          </div>

          <p className="ccm-desc">
            Esta tarea aún tiene pasos sin completar.
            ¿Quieres revisar el checklist antes de marcarla como lista?
          </p>

          <div className="ccm-actions">
            <button className="ccm-btn ccm-btn-primary" onClick={onReview} id="ccm-review">
              ✓ Ver checklist
            </button>
            <button className="ccm-btn ccm-btn-confirm" onClick={onConfirm} id="ccm-complete">
              Completar de todas formas
            </button>
            <button className="ccm-btn ccm-btn-ghost" onClick={onClose} id="ccm-cancel">
              Cancelar
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
