/** F-05 / F-21: forecasts count days from tracking start and are DST-safe. */
import { check, finish } from './harness.ts';
import { calculateMonthlyStats, calculateYearlyStats, calculate12MonthsStats, findTrackingStart, daysBetweenInclusive, isValidIsoDate, validatePurchaseData } from '../src/services/calculations.ts';
import { Purchase } from '../src/types/index.ts';

const P = (date: string, total: number, i = 1): Purchase => ({ id: `p${i}`, brand: 'b', pricePerPack: total, quantity: 1, totalPrice: total, date, createdAt: i });

// Reported scenario: started on the 20th, 100+100 by the 24th, today is the 25th.
const started = [P('2026-10-20', 100, 1), P('2026-10-24', 100, 2)];
const ref = new Date(2026, 9, 25);
const m = calculateMonthlyStats(started, 2026, 10, ref);
check('days are counted from the first purchase (6 tracked days, not 25)', m.daysConsidered === 6);
check('daily average uses tracked days (200/6 = 33.33)', m.dailyAverage === 33.33);
check('monthly forecast reflects the real pace (~1033), not 248', m.projectionStatus === 'ready' && m.projectedTotal === 1033.33);
const y = calculateYearlyStats(started, 2026, ref);
check('yearly forecast uses tracked days (200/6*365 = 12167)', y.trackedDays === 6 && y.projectedYearTotal === 12167);
check('yearly forecast is not lower than the monthly one', (y.projectedYearTotal ?? 0) >= (m.projectedTotal ?? 0));

// Too few tracked days.
const early = calculateMonthlyStats([P('2026-10-23', 100)], 2026, 10, ref);
check('3 tracked days: no monthly forecast', early.projectedTotal === null && early.projectionStatus === 'insufficient_days');
check('3 tracked days: no yearly forecast', calculateYearlyStats([P('2026-10-23', 100)], 2026, ref).projectedYearTotal === null);
check('no spending: yearly forecast is 0 (not null)', calculateYearlyStats([], 2026, ref).projectedYearTotal === 0);

// Tracking since January behaves like the old run-rate.
const jan = calculateYearlyStats([P('2026-01-01', 1000)], 2026, new Date(2026, 5, 15));
check('tracking since Jan 1: 1000 over 166 days -> 2199', jan.trackedDays === 166 && jan.projectedYearTotal === 2199);

// DST safety: same calendar day, different clock times, identical result.
const a = calculateYearlyStats([P('2026-01-02', 1000)], 2026, new Date(2026, 5, 15, 0, 30));
const b = calculateYearlyStats([P('2026-01-02', 1000)], 2026, new Date(2026, 5, 15, 1, 30));
check('00:30 and 01:30 on the same day give the same forecast (no DST off-by-one)', a.projectedYearTotal === b.projectedYearTotal && a.trackedDays === b.trackedDays);
check('daysBetweenInclusive across DST dates is exact', daysBetweenInclusive('2026-03-26', '2026-03-28') === 3 && daysBetweenInclusive('2026-10-24', '2026-10-26') === 3);

// Past month in which tracking began.
const past = calculateMonthlyStats([P('2026-09-20', 110)], 2026, 9, ref);
check('past month where tracking began on the 20th averages over 11 days', past.daysConsidered === 11 && past.dailyAverage === 10);
check('month before tracking start has no data', calculateMonthlyStats(started, 2026, 8, ref).hasData === false);
check('12-month series still has 12 entries', calculate12MonthsStats(started, ref).length === 12);

// Helpers and validation.
check('findTrackingStart ignores invalid dates', findTrackingStart([P('2026-02-31', 1, 1), P('2026-05-03', 1, 2), P('2026-04-10', 1, 3)]) === '2026-04-10');
check('isValidIsoDate rejects impossible dates, accepts leap day', !isValidIsoDate('2026-02-31') && !isValidIsoDate('2026-13-01') && isValidIsoDate('2024-02-29') && !isValidIsoDate('2026-02-29'));
check('form validation rejects 2026-02-31', !validatePurchaseData({ brand: 'x', pricePerPack: 10, quantity: 1, date: '2026-02-31' }).isValid);

finish('projections');
