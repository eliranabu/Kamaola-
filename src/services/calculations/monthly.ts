/** Monthly statistics, pace comparison and 12-month series. */

import { Purchase, MonthlySummary } from '../../types/index.ts';
import { formatMonthNameHe, getDaysInMonth, findTrackingStart, toIsoDate } from './dates.ts';

export const MIN_DAYS_FOR_PROJECTION = 5;

export interface PaceComparison {
  diffPercent: number | null;
  diffDirection: 'more' | 'less' | 'equal';
  currDailyAverage: number;
  prevDailyAverage: number;
  status: 'valid' | 'no_prev_data' | 'no_curr_data' | 'insufficient_data';
  label: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Calculates stats for one month. Days are counted from the tracking start
 * (first purchase) when it falls inside the month, so a user who began on the
 * 20th is not averaged over 25 days they never tracked.
 * A projection needs at least MIN_DAYS_FOR_PROJECTION tracked days.
 */
export function calculateMonthlyStats(
  purchases: Purchase[],
  targetYear: number,
  targetMonth: number,
  referenceDate: Date = new Date()
): MonthlySummary {
  const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(targetYear, targetMonth);
  const isCurrentMonth =
    referenceDate.getFullYear() === targetYear && referenceDate.getMonth() + 1 === targetMonth;

  // Purchases dated after the reference day have not happened yet and are not counted.
  const refIso = toIsoDate(referenceDate);
  const monthPurchases = purchases.filter((p) => {
    if (!p.date || p.date > refIso) return false;
    const [pYear, pMonth] = p.date.split('-').map(Number);
    return pYear === targetYear && pMonth === targetMonth;
  });

  const totalSpent = monthPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalPacks = monthPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const purchaseCount = monthPurchases.length;
  const hasData = purchaseCount > 0;

  const trackingStart = findTrackingStart(purchases);
  const startsThisMonth =
    trackingStart !== null &&
    trackingStart.startsWith(monthKey) &&
    trackingStart.slice(8, 10) !== '01';
  const firstTrackedDay = startsThisMonth ? Number(trackingStart!.slice(8, 10)) : 1;

  let daysConsidered: number;
  let dailyAverage: number;
  let projectedTotal: number | null = null;
  let projectionStatus: MonthlySummary['projectionStatus'] = 'past_month';
  let projectionMessage: string;

  if (isCurrentMonth) {
    daysConsidered = Math.max(1, referenceDate.getDate() - firstTrackedDay + 1);
    dailyAverage = totalSpent > 0 ? round2(totalSpent / daysConsidered) : 0;

    if (!hasData || totalSpent <= 0) {
      projectionStatus = 'no_data';
      projectionMessage = 'אין עדיין נתונים — הזינו רכישה החודש לקבלת תחזית';
    } else if (daysConsidered < MIN_DAYS_FOR_PROJECTION) {
      projectionStatus = 'insufficient_days';
      projectionMessage = 'מוקדם מדי לחזות — הנתונים עדיין מתגבשים';
    } else {
      projectedTotal = round2((totalSpent / daysConsidered) * daysInMonth);
      projectionStatus = 'ready';
      projectionMessage = `אומדן משוער לפי קצב ממוצע של ${dailyAverage} ₪ ליום ב־${daysConsidered} ימי מעקב`;
    }
  } else {
    daysConsidered = daysInMonth - firstTrackedDay + 1;
    dailyAverage = totalSpent > 0 ? round2(totalSpent / daysConsidered) : 0;
    projectionMessage = 'חודש שהסתיים';
  }

  return {
    monthKey,
    year: targetYear,
    month: targetMonth,
    monthNameHe: formatMonthNameHe(targetYear, targetMonth),
    totalSpent: round2(totalSpent),
    totalPacks,
    purchaseCount,
    dailyAverage,
    projectedTotal,
    projectionStatus,
    projectionMessage,
    isCurrentMonth,
    hasData,
    daysInMonth,
    daysConsidered
  };
}

/** Compares daily-average pace between the current and previous month. */
export function compareMonthlyPaces(
  currentMonthStats: MonthlySummary,
  prevMonthStats: MonthlySummary
): PaceComparison {
  if (!currentMonthStats.hasData || currentMonthStats.totalSpent <= 0) {
    return {
      diffPercent: null,
      diffDirection: 'equal',
      currDailyAverage: 0,
      prevDailyAverage: prevMonthStats.hasData ? prevMonthStats.dailyAverage : 0,
      status: 'no_curr_data',
      label: 'אין עדיין הוצאות החודש להשוואה'
    };
  }

  if (!prevMonthStats.hasData || prevMonthStats.totalSpent <= 0 || prevMonthStats.dailyAverage <= 0) {
    return {
      diffPercent: null,
      diffDirection: 'equal',
      currDailyAverage: currentMonthStats.dailyAverage,
      prevDailyAverage: 0,
      status: 'no_prev_data',
      label: 'אין נתוני חודש קודם להשוואת קצב'
    };
  }

  const currDaily = currentMonthStats.dailyAverage;
  const prevDaily = prevMonthStats.dailyAverage;
  const rawDiff = ((currDaily - prevDaily) / prevDaily) * 100;

  let diffDirection: PaceComparison['diffDirection'] = 'equal';
  if (rawDiff > 0.5) diffDirection = 'more';
  else if (rawDiff < -0.5) diffDirection = 'less';

  return {
    diffPercent: Math.round(Math.abs(rawDiff)),
    diffDirection,
    currDailyAverage: currDaily,
    prevDailyAverage: prevDaily,
    status: 'valid',
    label: 'השוואה לפי הוצאה יומית ממוצעת'
  };
}

/** Last 12 months up to referenceDate, oldest first. */
export function calculate12MonthsStats(
  purchases: Purchase[],
  referenceDate: Date = new Date()
): MonthlySummary[] {
  const result: MonthlySummary[] = [];
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;

  for (let i = 11; i >= 0; i--) {
    let year = currentYear;
    let month = currentMonth - i;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }
    result.push(calculateMonthlyStats(purchases, year, month, referenceDate));
  }
  return result;
}
