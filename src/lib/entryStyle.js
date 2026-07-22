/* ============================================
   ENTRY STYLE — colores de resaltador + repetir + recordatorio
   Estilo visual único para las "entradas" de la agenda.
   ============================================ */

/** Colores de resaltador kawaii (como los marcadores de una agenda física) */
export const HIGHLIGHTERS = [
  { id: 'pink',   hex: '#FF9DBB' },
  { id: 'lavender',hex: '#B9A7F5' },
  { id: 'mint',   hex: '#74D6AE' },
  { id: 'yellow', hex: '#FFD86B' },
  { id: 'sky',    hex: '#8CCDEB' },
  { id: 'peach',  hex: '#FFB08A' },
  { id: 'coral',  hex: '#FF7A8A' },
];

export const DEFAULT_COLOR = '#FF9DBB';

/** Devuelve un color válido de la paleta (o el default) */
export function normalizeColor(hex) {
  if (!hex) return DEFAULT_COLOR;
  return HIGHLIGHTERS.some(h => h.hex.toLowerCase() === String(hex).toLowerCase())
    ? hex
    : DEFAULT_COLOR;
}

/** Opciones de repetición */
export const REPEAT_OPTIONS = ['No repetir', 'Diario', 'Semanal', 'Mensual'];

/** Offsets de recordatorio (minutos antes) */
export const REMINDER_OFFSETS = [5, 10, 15, 30, 60];

/** Formatea un monto como moneda MXN, sin decimales si es entero */
export function formatAmount(amount) {
  if (amount == null || amount === '' || isNaN(Number(amount))) return null;
  const n = Number(amount);
  return n.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
