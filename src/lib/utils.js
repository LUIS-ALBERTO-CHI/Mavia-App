import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Timezone-safe date helpers ───────────────────────────────────────────────
// NEVER use new Date().toISOString().split('T')[0] — it returns UTC date,
// which is wrong for users in UTC-1 to UTC-12 after ~6-11 PM local time.

/**
 * Returns today's date as "YYYY-MM-DD" in the user's LOCAL timezone.
 */
export function localToday() {
  return new Date().toLocaleDateString('en-CA'); // en-CA always gives YYYY-MM-DD
}

/**
 * Returns a date offset by `offsetDays` from today, in local timezone.
 * e.g. localDateOffset(1) = tomorrow, localDateOffset(-1) = yesterday
 */
export function localDateOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-CA');
}

/**
 * Returns "YYYY-MM-DD" for any Date object, in local timezone.
 */
export function localDateStr(date) {
  return new Date(date).toLocaleDateString('en-CA');
}

// ─── Time formatting ───────────────────────────────────────────────────────────

/**
 * Converts a "HH:MM" (24h) string to "8:30 AM" / "10:00 PM" format.
 * Returns `fallback` if the input is null, undefined, empty, or malformed.
 *
 * @param {string|null|undefined} time24  — e.g. "14:30"
 * @param {string} fallback               — returned when time is invalid (default "—")
 */
export function formatTime12h(time24, fallback = '—') {
  if (!time24 || typeof time24 !== 'string') return fallback;
  const parts = time24.trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return fallback;
  const ap  = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}
