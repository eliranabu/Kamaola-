/**
 * Central deterministic calculation engine for "כמה זה עולה?"
 * Single source of truth for all monetary, statistical and forecast calculations.
 */

import { Purchase, MonthlySummary, YearlySummary, SavingsSimulation, ValidationResult, WeeklyGoalStats } from '../types/index.ts';

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

/**
 * Calculates total purchase price avoiding floating point inaccuracies.
 */
export function calculatePurchaseTotal(pricePerPack: number, quantity: number): number {
  if (isNaN(pricePerPack) || isNaN(quantity) || pricePerPack <= 0 || quantity <= 0) {
    return 0;
  }
  return Math.round(pricePerPack * quantity * 100) / 100;
}

/**
 * Validates purchase fields before saving.
 */
export function validatePurchaseData(data: {
  brand?: string;
  pricePerPack?: number;
  quantity?: number;
  date?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.brand || data.brand.trim().length === 0) {
    errors.brand = 'נא להזין או לבחור מותג סיגריות';
  }

  if (data.pricePerPack === undefined || isNaN(data.pricePerPack)) {
    errors.pricePerPack = 'נא להזין מחיר לחפיסה';
  } else if (data.pricePerPack <= 0) {
    errors.pricePerPack = 'המחיר לחפיסה חייב להיות גדול מ-0';
  } else if (data.pricePerPack > 500) {
    errors.pricePerPack = 'המחיר שהוזן גבוה מטווח סביר לחפיסה';
  }

  if (data.quantity === undefined || isNaN(data.quantity)) {
    errors.quantity = 'נא להזין מספר חפיסות';
  } else if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    errors.quantity = 'כמות החפיסות חייבת להיות מספר שלם וחיובי (לפחות 1)';
  } else if (data.quantity > 500) {
    errors.quantity = 'כמות החפיסות חורגת מגבול הגיוני לרכישה בודדת';
  }

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.date = 'נא לבחור תאריך תקין';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Returns exact number of days in month for a given year (1-indexed month 1-12).
 * Correctly accounts for leap years (e.g. Feb 2024=29, Feb 2026=28).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Formats YYYY-MM key into a human Hebrew label, e.g. "מרץ 2026"
 */
export function formatMonthNameHe(year: number, month: number): string {
  const monthIdx = month - 1;
  return `${HEBREW_MONTHS[monthIdx] || ''} ${year}`;
}

export const MIN_DAYS_FOR_PROJECTION = 5;

export interface PaceComparison {
  diffPercent: number | null;
  diffDirection: 'more' | 'less' | 'equal';
  currDailyAverage: number;
  prevDailyAverage: number;
  status: 'valid' | 'no_prev_data' | 'no_curr_data' | 'insufficient_data';
  label: string;
}

/**
 * Calculates monthly stats for a specific month and year.
 * Applies a strict minimum threshold of 5 days before showing projected total.
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
    referenceDate.getFullYear() === targetYear &&
    referenceDate.getMonth() + 1 === targetMonth;

  // Filter purchases for target month
  const monthPurchases = purchases.filter((p) => {
    if (!p.date) return false;
    const [pYear, pMonth] = p.date.split('-').map(Number);
    return pYear === targetYear && pMonth === targetMonth;
  });

  const totalSpent = monthPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalPacks = monthPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const purchaseCount = monthPurchases.length;
  const hasData = purchaseCount > 0;

  // Days considered for average
  let daysConsidered = daysInMonth;
  let dailyAverage = 0;
  let projectedTotal: number | null = null;
  let projectionStatus: 'ready' | 'insufficient_days' | 'no_data' | 'past_month' = 'past_month';
  let projectionMessage = '';

  if (isCurrentMonth) {
    daysConsidered = Math.max(1, referenceDate.getDate());
    dailyAverage = totalSpent > 0 ? Math.round((totalSpent / daysConsidered) * 100) / 100 : 0;

    if (!hasData || totalSpent <= 0) {
      projectedTotal = null;
      projectionStatus = 'no_data';
      projectionMessage = 'אין עדיין נתונים — הזינו רכישה החודש לקבלת תחזית';
    } else if (daysConsidered < MIN_DAYS_FOR_PROJECTION) {
      projectedTotal = null;
      projectionStatus = 'insufficient_days';
      projectionMessage = 'מוקדם מדי לחזות — הנתונים עדיין מתגבשים';
    } else {
      projectedTotal = Math.round(dailyAverage * daysInMonth * 100) / 100;
      projectionStatus = 'ready';
      projectionMessage = `אומדן משוער לפי קצב ממוצע של ${dailyAverage} ₪ ליום ב־${daysConsidered} ימים`;
    }
  } else {
    daysConsidered = daysInMonth;
    dailyAverage = totalSpent > 0 ? Math.round((totalSpent / daysInMonth) * 100) / 100 : 0;
    projectedTotal = null;
    projectionStatus = 'past_month';
    projectionMessage = 'חודש שהסתיים';
  }

  return {
    monthKey,
    year: targetYear,
    month: targetMonth,
    monthNameHe: formatMonthNameHe(targetYear, targetMonth),
    totalSpent: Math.round(totalSpent * 100) / 100,
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

/**
 * Compares spending paces fairly between current month and previous month
 * based on daily average rather than partial-month raw totals.
 */
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
  const diffPercent = Math.round(Math.abs(rawDiff));

  let diffDirection: 'more' | 'less' | 'equal' = 'equal';
  if (rawDiff > 0.5) diffDirection = 'more';
  else if (rawDiff < -0.5) diffDirection = 'less';

  return {
    diffPercent,
    diffDirection,
    currDailyAverage: currDaily,
    prevDailyAverage: prevDaily,
    status: 'valid',
    label: 'השוואה לפי הוצאה יומית ממוצעת'
  };
}

/**
 * Generates an array of MonthlySummary for the last 12 months up to referenceDate.
 * Sorted chronologically from oldest to newest.
 */
export function calculate12MonthsStats(
  purchases: Purchase[],
  referenceDate: Date = new Date()
): MonthlySummary[] {
  const result: MonthlySummary[] = [];
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-12

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

/**
 * Calculates annual statistics for target year.
 */
export function calculateYearlyStats(
  purchases: Purchase[],
  targetYear: number,
  referenceDate: Date = new Date()
): YearlySummary {
  const yearPurchases = purchases.filter((p) => {
    if (!p.date) return false;
    const [pYear] = p.date.split('-').map(Number);
    return pYear === targetYear;
  });

  const totalSpent = yearPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalPacks = yearPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const averagePricePerPack =
    totalPacks > 0 ? Math.round((totalSpent / totalPacks) * 100) / 100 : 0;

  // Day of year for annual forecast
  const isCurrentYear = referenceDate.getFullYear() === targetYear;
  let projectedYearTotal = totalSpent;

  if (isCurrentYear) {
    const startOfYear = new Date(targetYear, 0, 1);
    const dayOfYear = Math.max(
      1,
      Math.floor((referenceDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
    const totalDaysInYear = isLeapYear ? 366 : 365;

    if (totalSpent > 0 && dayOfYear > 0) {
      projectedYearTotal = Math.round((totalSpent / dayOfYear) * totalDaysInYear);
    } else {
      projectedYearTotal = 0;
    }
  }

  return {
    year: targetYear,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalPacks,
    averagePricePerPack,
    projectedYearTotal,
    hasData: yearPurchases.length > 0
  };
}

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

/**
 * Formats a number to Israeli currency or selected currency.
 */
export function formatCurrency(amount: number, currency: string = '₪'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0 ${currency}`;
  }
  const formatted = Math.round(amount).toLocaleString('he-IL');
  return `${formatted} ${currency}`;
}

/**
 * Formats currency with optional agorot / decimals for precise price per pack.
 */
export function formatCurrencyExact(amount: number, currency: string = '₪'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0.00 ${currency}`;
  }
  const formatted = amount.toLocaleString('he-IL', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `${formatted} ${currency}`;
}

/**
 * Calculates current week's spending and progress against a weekly pack target.
 * Week starts on Sunday (standard Israeli week).
 */
export function calculateWeeklyStats(
  purchases: Purchase[],
  referenceDate: Date = new Date(),
  weeklyPackGoal: number = 0
): WeeklyGoalStats {
  if (!weeklyPackGoal || weeklyPackGoal <= 0) {
    return {
      hasGoal: false,
      weeklyPackGoal: 0,
      currentWeekPacks: 0,
      currentWeekSpent: 0,
      percentUsed: 0,
      status: 'on_track',
      statusMessage: 'הגדירו יעד חפיסות שבועי כדי לעקוב אחר ההתקדמות'
    };
  }

  // Calculate start of current week (Sunday 00:00:00)
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;

  const weekPurchases = purchases.filter((p) => {
    if (!p.date) return false;
    return p.date >= startOfWeekStr;
  });

  const currentWeekPacks = weekPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const currentWeekSpent = weekPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const percentUsed = Math.round((currentWeekPacks / weeklyPackGoal) * 100);

  let status: 'on_track' | 'near_limit' | 'exceeded' = 'on_track';
  let statusMessage = '';

  if (currentWeekPacks > weeklyPackGoal) {
    status = 'exceeded';
    const over = currentWeekPacks - weeklyPackGoal;
    statusMessage = `חריגה עדינה של ${over} ${over === 1 ? 'חפיסה' : 'חפיסות'} מהיעד השבועי — אפשר לאזן בשבוע הבא!`;
  } else if (currentWeekPacks === weeklyPackGoal) {
    status = 'near_limit';
    statusMessage = `הגעת בדיוק ליעד השבועי (${weeklyPackGoal} חפיסות) — הישג מעולה!`;
  } else {
    status = 'on_track';
    const remaining = weeklyPackGoal - currentWeekPacks;
    statusMessage = `נרכשו ${currentWeekPacks} מתוך ${weeklyPackGoal} חפיסות (נותרו עוד ${remaining} לפי היעד)`;
  }

  return {
    hasGoal: true,
    weeklyPackGoal,
    currentWeekPacks,
    currentWeekSpent: Math.round(currentWeekSpent * 100) / 100,
    percentUsed,
    status,
    statusMessage
  };
}
