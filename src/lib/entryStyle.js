/* ============================================
   ENTRY STYLE — colores de resaltador + repetir + recordatorio
   Estilo visual único para las "entradas" de la agenda.
   ============================================ */

/** Colores de resaltador (como los marcadores de una agenda física) */
export const HIGHLIGHTERS = [
  { id: 'pink',   hex: '#FF7EB6' },
  { id: 'yellow', hex: '#FFD84C' },
  { id: 'green',  hex: '#7ED957' },
  { id: 'blue',   hex: '#56C2E6' },
  { id: 'purple', hex: '#B98CE6' },
  { id: 'orange', hex: '#FFA94D' },
  { id: 'red',    hex: '#FF6B6B' },
];

export const DEFAULT_COLOR = '#FF7EB6';

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
