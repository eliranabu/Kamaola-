/** Strict validation of the /api/insights request body (numbers only, whitelisted currency). */

import { InsightsPayload } from '../src/services/insights.ts';

export const ALLOWED_CURRENCIES = ['₪', '$', '€'];

type Result = { ok: true; value: InsightsPayload } | { ok: false; error: string };

const inRange = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;

export function validateInsightsBody(body: unknown): Result {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'invalid_body' };
  const b = body as Record<string, unknown>;

  if (!inRange(b.totalMonthlySpent, 1_000_000)) return { ok: false, error: 'invalid_totalMonthlySpent' };
  if (!inRange(b.totalPacks, 5_000)) return { ok: false, error: 'invalid_totalPacks' };
  if (!inRange(b.dailyAverage, 100_000)) return { ok: false, error: 'invalid_dailyAverage' };
  if (b.projectedAnnual !== null && !inRange(b.projectedAnnual, 10_000_000)) {
    return { ok: false, error: 'invalid_projectedAnnual' };
  }
  const currency = b.currency === undefined ? '₪' : b.currency;
  if (typeof currency !== 'string' || !ALLOWED_CURRENCIES.includes(currency)) {
    return { ok: false, error: 'invalid_currency' };
  }

  // Only known fields are copied: nothing else can reach the prompt.
  return {
    ok: true,
    value: {
      totalMonthlySpent: b.totalMonthlySpent,
      totalPacks: b.totalPacks,
      dailyAverage: b.dailyAverage,
      projectedAnnual: b.projectedAnnual,
      currency
    }
  };
}
