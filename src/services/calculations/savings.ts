/** Savings simulation scenarios. */

import { SavingsSimulation } from '../../types/index.ts';

/**
 * Calculates savings simulation scenarios.
 */
export function calculateSavingsScenario(
  monthlyBaseline: number,
  reductionPercentage: number
): SavingsSimulation {
  const safePercentage = Math.min(100, Math.max(0, reductionPercentage));
  const monthlySaved = Math.round(monthlyBaseline * (safePercentage / 100));
  const newMonthlySpending = Math.max(0, Math.round(monthlyBaseline - monthlySaved));
  // Multi-year totals come from the exact monthly saving, not the rounded one (no x12 error build-up).
  const exactMonthly = monthlyBaseline * (safePercentage / 100);
  const annualSaved = Math.round(exactMonthly * 12);
  const threeYearsSaved = Math.round(exactMonthly * 36);
  const fiveYearsSaved = Math.round(exactMonthly * 60);

  return {
    percentage: safePercentage,
    currentMonthlySpending: monthlyBaseline,
    newMonthlySpending,
    monthlySaved,
    annualSaved,
    threeYearsSaved,
    fiveYearsSaved
  };
}
