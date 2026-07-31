/* ============================================
   ENTRY STYLE — colores de resaltador + repetir + recordatorio
   Estilo visual único para las "entradas" de la agenda.
   ============================================ */

/** Colores de resaltador — paleta fresa-limón */
export const HIGHLIGHTERS = [
  { id: 'teal',   hex: '#3B9890' },
  { id: 'pink',   hex: '#E07C8E' },
  { id: 'lime',   hex: '#A9BF53' },
  { id: 'olive',  hex: '#718804' },
  { id: 'mint',   hex: '#A0D8CD' },
  { id: 'red',    hex: '#D33243' },
];

export const DEFAULT_COLOR = '#3B9890';

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
