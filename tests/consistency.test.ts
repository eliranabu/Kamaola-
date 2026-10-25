/** F-06 / F-09 / F-20: one baseline for all savings figures; future dates are rejected and never counted. */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { check, finish, installLocalStorage } from './harness.ts';
import {
  calculateMonthlyStats, calculate12MonthsStats, calculateYearlyStats, calculateWeeklyStats,
  calculateSavingsBaseline, calculateSavingsScenario, validatePurchaseData, toIsoDate, formatCurrency
} from '../src/services/calculations.ts';
import { StorageService } from '../src/services/storage.ts';
import { DashboardView } from '../src/views/DashboardView.tsx';
import { SavingsView } from '../src/views/SavingsView.tsx';
import { Purchase } from '../src/types/index.ts';

installLocalStorage();
const P = (date: string, total: number, i = 1): Purchase => ({ id: `p${i}`, brand: 'b', pricePerPack: total, quantity: 1, totalPrice: total, date, createdAt: i });
const settings = { currency: '₪', isDemoModeActive: false, lastBrandPrices: {} } as any;

// F-06: Dashboard teaser and Savings screen show the same annual figure for the same 25% scenario.
const ref = new Date(2026, 9, 10);
const purchases = [P('2026-10-02', 100, 1), P('2026-10-09', 100, 2)];
const month = calculateMonthlyStats(purchases, 2026, 10, ref);
const twelve = calculate12MonthsStats(purchases, ref);
const baseline = calculateSavingsBaseline(month, twelve);
const expectedAnnual = formatCurrency(calculateSavingsScenario(baseline.amount, 25).annualSaved, '₪');
const noop = () => {};
const dash = renderToStaticMarkup(createElement(DashboardView, {
  purchases, currentMonthStats: month, prevMonthStats: calculateMonthlyStats(purchases, 2026, 9, ref), twelveMonthsData: twelve,
  yearlyStats: calculateYearlyStats(purchases, 2026, ref), weeklyStats: calculateWeeklyStats(purchases, ref, 0), settings,
  onOpenAddModal: noop, onNavigateToPurchases: noop, onNavigateToSavings: noop, onUpdateWeeklyGoal: noop
}));
const sav = renderToStaticMarkup(createElement(SavingsView, { purchases, currentMonthStats: month, twelveMonthsData: twelve, settings, onOpenAddModal: noop }));
check('baseline is the projected month (200 over 9 tracked days -> 688.89)', baseline.amount === 688.89);
check('Dashboard teaser shows the shared annual figure', dash.includes(expectedAnnual));
check('Savings screen (default 25%) shows the same annual figure', sav.includes(expectedAnnual));
check('baseline falls back to completed-month average, then to actual spend, then 0', (() => {
  const prev = [P('2026-08-05', 300, 1), P('2026-09-05', 500, 2)];
  const early = new Date(2026, 9, 3);
  const b1 = calculateSavingsBaseline(calculateMonthlyStats(prev, 2026, 10, early), calculate12MonthsStats(prev, early));
  const only = [P('2026-10-03', 90, 1)];
  const b2 = calculateSavingsBaseline(calculateMonthlyStats(only, 2026, 10, early), calculate12MonthsStats(only, early));
  const b3 = calculateSavingsBaseline(calculateMonthlyStats([], 2026, 10, early), calculate12MonthsStats([], early));
  return b1.amount === 400 && b2.amount === 90 && b3.amount === 0;
})());

// F-20: no x12 rounding error.
const s33 = calculateSavingsScenario(33, 25);
check('annual saving for baseline 33 at 25% is 99 (was 96)', s33.annualSaved === 99 && s33.threeYearsSaved === 297 && s33.fiveYearsSaved === 495);
check('monthly saving is still shown rounded', s33.monthlySaved === 8);

// F-09: future dates.
const today = toIsoDate(new Date());
const tomorrow = toIsoDate(new Date(Date.now() + 86400000 * 1.5));
const base = { brand: 'x', pricePerPack: 40, quantity: 1 };
check('today is accepted', validatePurchaseData({ ...base, date: today }).isValid);
check('a future date is rejected with a clear message', validatePurchaseData({ ...base, date: tomorrow }).errors.date === 'לא ניתן לתעד רכישה בתאריך עתידי');
check('validation honours an explicit "today" (deterministic)', !validatePurchaseData({ ...base, date: '2026-10-11' }, '2026-10-10').isValid && validatePurchaseData({ ...base, date: '2026-10-10' }, '2026-10-10').isValid);
const st = new StorageService();
check('savePurchase rejects a future date', !st.savePurchase({ ...base, date: tomorrow }).success);
check('import rejects future dates (counted as skipped)', (() => {
  const r = st.previewImport(JSON.stringify({ purchases: [{ id: 'f', ...base, date: tomorrow }, { id: 'ok', ...base, date: '2020-01-01' }] }));
  return r.success && r.purchases.length === 1 && r.skipped === 1;
})());
const withFuture = [P('2026-10-10', 100, 1), P('2026-10-30', 500, 2)];
const r25 = new Date(2026, 9, 25);
check('already-stored future purchase is not counted in month-to-date', calculateMonthlyStats(withFuture, 2026, 10, r25).totalSpent === 100);
check('already-stored future purchase is not counted in the year', calculateYearlyStats(withFuture, 2026, r25).totalSpent === 100);
check('already-stored future purchase is not counted in the week', calculateWeeklyStats([P('2026-10-30', 78, 1)], r25, 3).currentWeekPacks === 0);
check('purchase dated today IS counted', calculateMonthlyStats([P('2026-10-25', 50, 1)], 2026, 10, r25).totalSpent === 50);

finish('consistency');
