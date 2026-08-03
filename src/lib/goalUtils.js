/* ============================================
   GOAL UTILS — objetivos por CANTIDAD (meta numérica)
   Ej: 7 días de ejercicio, $10,000 ahorrados, 5 libros.
   El avance se calcula solo: current / target.
   ============================================ */

/** Progreso 0–100 de un objetivo. */
export function progressOf(g) {
  if (!g) return 0;
  const target = Number(g.target) || 0;
  if (target > 0) {
    const current = Number(g.current) || 0;
    return Math.round(Math.min(current / target, 1) * 100);
  }
  // Objetivos viejos (esquema anterior con progress 0–100 manual)
  return Number(g.progress) || 0;
}

export function isGoalComplete(g) {
  return progressOf(g) >= 100;
}

/** Texto del avance, ej "4 / 7 días" o "40%". */
export function goalCountLabel(g) {
  const target = Number(g.target) || 0;
  if (target <= 0) return `${progressOf(g)}%`;
  const current = Number(g.current) || 0;
  const unit = g.unit ? ` ${g.unit}` : '';
  return `${current} / ${target}${unit}`;
}
