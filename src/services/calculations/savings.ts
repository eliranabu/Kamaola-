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
  const annualSaved = monthlySaved * 12;
  const threeYearsSaved = annualSaved * 3;
  const fiveYearsSaved = annualSaved * 5;

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
