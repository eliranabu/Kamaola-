/** Yearly statistics and run-rate forecast. */

import { Purchase, YearlySummary } from '../../types/index.ts';
import { daysBetweenInclusive, findTrackingStart, toIsoDate } from './dates.ts';
import { MIN_DAYS_FOR_PROJECTION } from './monthly.ts';

/**
 * Annual statistics. The run-rate forecast counts days from the tracking start
 * (or Jan 1 if tracking began earlier) and stays null until enough days exist.
 */
export function calculateYearlyStats(
  purchases: Purchase[],
  targetYear: number,
  referenceDate: Date = new Date()
): YearlySummary {
  const refIso = toIsoDate(referenceDate);
  const yearPurchases = purchases.filter((p) => {
    if (!p.date || p.date > refIso) return false; // future-dated purchases are not counted
    const [pYear] = p.date.split('-').map(Number);
    return pYear === targetYear;
  });

  const totalSpent = yearPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalPacks = yearPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const averagePricePerPack = totalPacks > 0 ? Math.round((totalSpent / totalPacks) * 100) / 100 : 0;

  let projectedYearTotal: number | null = totalSpent;
  let trackedDays = 0;

  if (referenceDate.getFullYear() === targetYear) {
    const yearStart = `${targetYear}-01-01`;
    const trackingStart = findTrackingStart(purchases);
    const start = trackingStart && trackingStart > yearStart ? trackingStart : yearStart;
    trackedDays = daysBetweenInclusive(start, toIsoDate(referenceDate));

    const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
    const totalDaysInYear = isLeapYear ? 366 : 365;

    if (totalSpent <= 0) {
      projectedYearTotal = 0;
    } else if (trackedDays < MIN_DAYS_FOR_PROJECTION) {
      projectedYearTotal = null;
    } else {
      projectedYearTotal = Math.round((totalSpent / trackedDays) * totalDaysInYear);
    }
  }

  return {
    year: targetYear,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalPacks,
    averagePricePerPack,
    projectedYearTotal,
    trackedDays,
    hasData: yearPurchases.length > 0
  };
}
