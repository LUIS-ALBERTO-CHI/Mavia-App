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

/** Cuántas ocurrencias se generan por adelantado según la frecuencia */
const REPEAT_HORIZON = { Diario: 21, Semanal: 12, Mensual: 6 };

function _pad(n) { return String(n).padStart(2, '0'); }
function _toDS(d) { return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`; }

/**
 * Devuelve las fechas (YYYY-MM-DD) de una serie que repite, empezando en startDS.
 * Incluye la fecha inicial. Si no repite, devuelve solo [startDS].
 */
export function expandRepeatDates(startDS, repeat) {
  if (!repeat || repeat === 'No repetir' || !startDS) return [startDS];
  const count = REPEAT_HORIZON[repeat];
  if (!count) return [startDS];
  const out = [];
  const d = new Date(startDS + 'T00:00:00');
  for (let i = 0; i <= count; i++) {
    out.push(_toDS(d));
    if (repeat === 'Diario')  d.setDate(d.getDate() + 1);
    if (repeat === 'Semanal') d.setDate(d.getDate() + 7);
    if (repeat === 'Mensual') d.setMonth(d.getMonth() + 1);
  }
  return out;
}

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
