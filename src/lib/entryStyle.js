/* ============================================
   ENTRY STYLE — colores de resaltador + repetir + recordatorio
   Estilo visual único para las "entradas" de la agenda.
   ============================================ */

/** Colores de resaltador — paleta Mentry (pasteles suaves de estados de ánimo) */
export const HIGHLIGHTERS = [
  { id: 'periwinkle', hex: '#A9B4E8' },
  { id: 'lilac',      hex: '#C9A9E0' },
  { id: 'pink',       hex: '#F5AECB' },
  { id: 'mint',       hex: '#A8DBA8' },
  { id: 'yellow',     hex: '#F5E07A' },
  { id: 'blue',       hex: '#A9D6F0' },
];

export const DEFAULT_COLOR = '#A9B4E8';

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
