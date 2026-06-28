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
