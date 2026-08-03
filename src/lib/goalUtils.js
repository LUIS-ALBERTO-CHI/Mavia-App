/* ============================================
   GOAL UTILS — objetivos por CANTIDAD (meta numérica)
   Ej: 7 días de ejercicio, $10,000 ahorrados, 5 libros.
   El avance se calcula solo: current / target.
   ============================================ */

export const GOAL_TYPES = [
  { id: 'count',  label: 'Cantidad', hint: 'Llegar a un número (ej. 7 días)' },
  { id: 'steps',  label: 'Pasos',    hint: 'Completar una lista' },
  { id: 'simple', label: 'Sí / No',  hint: 'Hecho o no' },
];

/** Progreso 0–100 de un objetivo, según su tipo. */
export function progressOf(g) {
  if (!g) return 0;
  if (g.type === 'simple') return g.done ? 100 : 0;
  if (g.type === 'steps') {
    const s = g.steps || [];
    return s.length ? Math.round(s.filter(x => x.done).length / s.length * 100) : 0;
  }
  // count (por defecto) + objetivos viejos con progress manual
  const target = Number(g.target) || 0;
  if (target > 0) return Math.round(Math.min((Number(g.current) || 0) / target, 1) * 100);
  return Number(g.progress) || 0;
}

export function isGoalComplete(g) {
  return progressOf(g) >= 100;
}

/** Texto del avance según el tipo. */
export function goalCountLabel(g) {
  if (g?.type === 'simple') return g.done ? 'Cumplido' : 'Pendiente';
  if (g?.type === 'steps') {
    const s = g.steps || [];
    return `${s.filter(x => x.done).length} / ${s.length} pasos`;
  }
  const target = Number(g?.target) || 0;
  if (target <= 0) return `${progressOf(g)}%`;
  const current = Number(g.current) || 0;
  const unit = g.unit ? ` ${g.unit}` : '';
  return `${current} / ${target}${unit}`;
}
