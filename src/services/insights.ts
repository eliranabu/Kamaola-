/** Client side of the optional AI insights feature (payload, validation, fallback). */

import { MonthlySummary, YearlySummary } from '../types/index.ts';

export interface InsightsData {
  summary: string;
  tips: string[];
  milestoneIdea: string;
}

export interface InsightsPayload {
  totalMonthlySpent: number;
  totalPacks: number;
  dailyAverage: number;
  projectedAnnual: number | null;
  currency: string;
}

/** Exactly what leaves the device: aggregate numbers only - no purchases, dates, brands or notes. */
export function buildInsightsPayload(month: MonthlySummary, year: YearlySummary, currency: string): InsightsPayload {
  return {
    totalMonthlySpent: month.totalSpent,
    totalPacks: month.totalPacks,
    dailyAverage: month.dailyAverage,
    projectedAnnual: year.projectedYearTotal,
    currency
  };
}

/** Accepts only the expected shape; anything else (error JSON, HTML, partial data) becomes null. */
export function parseInsights(data: unknown): InsightsData | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.summary !== 'string' || d.summary.trim() === '') return null;
  if (!Array.isArray(d.tips)) return null;
  const tips = d.tips.filter((t): t is string => typeof t === 'string' && t.trim() !== '');
  if (tips.length === 0) return null;
  return {
    summary: d.summary,
    tips,
    milestoneIdea: typeof d.milestoneIdea === 'string' ? d.milestoneIdea : ''
  };
}

/** Generic offline advice (no invented figures). */
export function buildFallbackInsights(totalSpent: number, currency: string): InsightsData {
  return {
    summary: `ההוצאה החודש עומדת על כ־${Math.round(totalSpent)} ${currency}. מעקב שוטף אחרי כל רכישה הוא הצעד המשמעותי ביותר להשגת שליטה תקציבית.`,
    tips: [
      'הגדירו תקציב שבועי מוגדר מראש במקום לקנות חפיסה בכל פעם שנזכרים.',
      'הפנו כל חיסכון שבועי ישירות לחיסכון נפרד כדי לחוש בהצלחה.',
      'בחנו את ימי השבוע שבהם אתם קונים הכי הרבה וזהו את הטריגרים.'
    ],
    milestoneIdea: ''
  };
}

/** Returns validated insights, or null if the service is unavailable or answered unexpectedly. */
export async function fetchInsights(payload: InsightsPayload, signal?: AbortSignal): Promise<InsightsData | null> {
  try {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
    if (!res.ok) return null;
    return parseInsights(await res.json());
  } catch {
    return null;
  }
}
