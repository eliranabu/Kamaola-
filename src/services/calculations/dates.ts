/**
 * Calendar helpers. All day arithmetic uses calendar dates (UTC math on Y-M-D)
 * so DST shifts can never change a day count.
 */

import { Purchase } from '../../types/index.ts';

export const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר'
];

/** Exact number of days in month (1-indexed month). Leap years included. */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Formats year/month into a Hebrew label, e.g. "מרץ 2026". */
export function formatMonthNameHe(year: number, month: number): string {
  return `${HEBREW_MONTHS[month - 1] || ''} ${year}`;
}

/** True only for real calendar dates in YYYY-MM-DD form (rejects 2026-02-31). */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= getDaysInMonth(y, m);
}

/** Local calendar date of a Date object as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Inclusive number of calendar days between two ISO dates (min 1). */
export function daysBetweenInclusive(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const diff = Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd);
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

/**
 * Tracking start = earliest valid purchase date. Forecasts must not assume
 * tracking began on day 1 of the month/year.
 */
export function findTrackingStart(purchases: Purchase[]): string | null {
  let earliest: string | null = null;
  for (const p of purchases) {
    if (isValidIsoDate(p?.date) && (earliest === null || p.date < earliest)) {
      earliest = p.date;
    }
  }
  return earliest;
}
