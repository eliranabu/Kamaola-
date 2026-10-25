/** Single source of truth for the monthly spending baseline used by every savings figure. */

import { MonthlySummary } from '../../types/index.ts';

export interface SavingsBaseline {
  amount: number;
  explanation: string;
}

/**
 * Priority: this month's forecast (when ready) -> average of finished months
 * that had spending -> actual spending so far -> 0 (no data).
 */
export function calculateSavingsBaseline(
  currentMonthStats: MonthlySummary,
  twelveMonthsData: MonthlySummary[]
): SavingsBaseline {
  if (
    currentMonthStats.projectionStatus === 'ready' &&
    currentMonthStats.projectedTotal &&
    currentMonthStats.projectedTotal > 0
  ) {
    return { amount: currentMonthStats.projectedTotal, explanation: 'מחושב לפי תחזית החודש הנוכחי (מעל 5 ימי תיעוד)' };
  }

  const completed = twelveMonthsData.filter((m) => !m.isCurrentMonth && m.hasData && m.totalSpent > 0);
  if (completed.length > 0) {
    const total = completed.reduce((sum, m) => sum + m.totalSpent, 0);
    return { amount: Math.round(total / completed.length), explanation: 'מחושב לפי ממוצע חודשים קודמים שהסתיימו' };
  }

  if (currentMonthStats.totalSpent > 0) {
    return { amount: currentMonthStats.totalSpent, explanation: 'מחושב לפי סך ההוצאה בפועל שנרשמה החודש' };
  }
  return { amount: 0, explanation: '' };
}
