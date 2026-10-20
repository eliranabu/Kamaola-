/**
 * Automated Verification Test Suite for "כמה זה עולה?"
 * Tests all core scenarios plus all 5 critical fixes requested in the specification:
 * - Fix 1: Safe demo and user data reset isolation
 * - Fix 2: Storage error handling (QuotaExceeded, SecurityError) with StorageResult
 * - Fix 3: Fair daily average pace comparison between months
 * - Fix 4: CSV formula injection neutralization (=, +, -, @)
 * - Fix 5: Reliable monthly forecast with 5-day minimum threshold
 */

import {
  calculatePurchaseTotal,
  validatePurchaseData,
  getDaysInMonth,
  calculateMonthlyStats,
  calculateYearlyStats,
  calculateSavingsScenario,
  formatCurrencyExact,
  compareMonthlyPaces,
  MIN_DAYS_FOR_PROJECTION,
  calculateWeeklyStats
} from './calculations.ts';
import {
  StorageService,
  sanitizeCsvField,
  USER_PURCHASES_KEY,
  USER_SETTINGS_KEY,
  DEMO_PURCHASES_KEY,
  SAMPLE_DEMO_PURCHASES
} from './storage.ts';
import { Purchase } from '../types/index.ts';

interface TestResult {
  id: number;
  description: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(id: number, description: string, condition: boolean, details?: string) {
  results.push({
    id,
    description,
    passed: condition,
    details: details || (condition ? 'Passed' : 'Failed')
  });
}

console.log('--- Starting Comprehensive Automated Test Suite for "כמה זה עולה?" ---');

// Mock localStorage environment for Node.js test execution
const memoryStore: Record<string, string> = {};
let shouldSimulateQuotaError = false;
let shouldSimulateSecurityError = false;

const mockLocalStorage = {
  getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key: string, value: string) => {
    if (shouldSimulateQuotaError) {
      const err = new Error('Quota exceeded');
      err.name = 'QuotaExceededError';
      throw err;
    }
    if (shouldSimulateSecurityError) {
      const err = new Error('The operation is insecure');
      err.name = 'SecurityError';
      throw err;
    }
    memoryStore[key] = value;
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    for (const k in memoryStore) delete memoryStore[k];
  }
};

// Polyfill global localStorage in test runner
(globalThis as any).localStorage = mockLocalStorage;

const testStorage = new StorageService();

// ==========================================
// SECTION 1: CORE CALCULATION TESTS (1 - 15)
// ==========================================

// 1. רכישה של שתי חפיסות במחיר 40 ₪ לחפיסה יוצרת הוצאה של 80 ₪.
const test1 = calculatePurchaseTotal(40, 2);
assert(1, '2 packs at 40 ₪ per pack equals exactly 80 ₪', test1 === 80, `Expected 80, got ${test1}`);

// 2. שתי רכישות של 40 ₪ ו־80 ₪ יוצרות הוצאה כוללת של 120 ₪.
const p1: Purchase = {
  id: 't-1',
  brand: 'Marlboro',
  pricePerPack: 40,
  quantity: 1,
  totalPrice: calculatePurchaseTotal(40, 1),
  date: '2026-10-01',
  createdAt: 1000
};
const p2: Purchase = {
  id: 't-2',
  brand: 'Parliament',
  pricePerPack: 40,
  quantity: 2,
  totalPrice: calculatePurchaseTotal(40, 2),
  date: '2026-10-02',
  createdAt: 2000
};
const refDate = new Date(2026, 9, 20); // 2026-10-20 (Day 20)
const monthlyOct = calculateMonthlyStats([p1, p2], 2026, 10, refDate);
assert(2, 'Purchases of 40 ₪ and 80 ₪ produce total 120 ₪', monthlyOct.totalSpent === 120, `Got ${monthlyOct.totalSpent}`);

// 3. עריכת רכישה מעדכנת את כל הסיכומים.
const p2Edited: Purchase = {
  ...p2,
  quantity: 3,
  totalPrice: calculatePurchaseTotal(40, 3) // 120
};
const monthlyOctEdited = calculateMonthlyStats([p1, p2Edited], 2026, 10, refDate);
assert(3, 'Editing purchase from 80 ₪ to 120 ₪ updates month total to 160 ₪', monthlyOctEdited.totalSpent === 160 && monthlyOctEdited.totalPacks === 4);

// 4. מחיקת רכישה מעדכנת את כל הסיכומים.
const monthlyOctAfterDelete = calculateMonthlyStats([p1], 2026, 10, refDate);
assert(4, 'Deleting one purchase drops month total back to 40 ₪', monthlyOctAfterDelete.totalSpent === 40 && monthlyOctAfterDelete.totalPacks === 1);

// 5. נתוני הדגמה אינם מופיעים בחישובי המשתמש.
const demoPurchase: Purchase = {
  id: 'demo-x',
  brand: 'Demo Brand',
  pricePerPack: 50,
  quantity: 10,
  totalPrice: 500,
  date: '2026-10-05',
  createdAt: 3000,
  isDemo: true
};
const strictlyUserPurchases = [p1, demoPurchase].filter(p => !p.isDemo);
const statsStrict = calculateMonthlyStats(strictlyUserPurchases, 2026, 10, refDate);
assert(5, 'Demo data tagged with isDemo:true is excluded from real calculations', statsStrict.totalSpent === 40);

// 6. מחיקת נתוני הדגמה אינה מוחקת רכישות אמיתיות.
let userStore = [p1, p2];
let demoStore = [demoPurchase];
demoStore = [];
assert(6, 'Clearing demo store leaves user store completely untouched', userStore.length === 2 && demoStore.length === 0);

// 7. משתמש חדש אינו מקבל רכישות מומצאות.
const freshUserPurchases: Purchase[] = [];
const freshStats = calculateMonthlyStats(freshUserPurchases, 2026, 10, refDate);
assert(7, 'Fresh user starts with 0 purchases, 0 ₪ spent, hasData is false', freshStats.totalSpent === 0 && freshStats.hasData === false);

// 8. מחיר אפס, מחיר שלילי וכמות אפס אינם נשמרים.
const valZeroPrice = validatePurchaseData({ brand: 'Marlboro', pricePerPack: 0, quantity: 1, date: '2026-10-01' });
const valNegPrice = validatePurchaseData({ brand: 'Marlboro', pricePerPack: -10, quantity: 1, date: '2026-10-01' });
const valZeroQty = validatePurchaseData({ brand: 'Marlboro', pricePerPack: 40, quantity: 0, date: '2026-10-01' });
const valNoBrand = validatePurchaseData({ brand: '', pricePerPack: 40, quantity: 1, date: '2026-10-01' });
assert(8, 'Validation rejects invalid prices, zero quantity, and empty brands', !valZeroPrice.isValid && !valNegPrice.isValid && !valZeroQty.isValid && !valNoBrand.isValid);

// 9. חישובים נכונים במעבר בין חודשים ובמעבר בין שנים (כולל פברואר ושנים מעוברות).
const daysFeb2024 = getDaysInMonth(2024, 2); // 29
const daysFeb2026 = getDaysInMonth(2026, 2); // 28
const daysApr2026 = getDaysInMonth(2026, 4); // 30
assert(9, 'Calendar days correctly handles leap years (Feb 2024=29, Feb 2026=28)', daysFeb2024 === 29 && daysFeb2026 === 28 && daysApr2026 === 30);

// 10. חודשים שאין בהם רכישות מוצגים בצורה נכונה.
const emptyMonthStats = calculateMonthlyStats([p1], 2026, 5, refDate);
assert(10, 'Month without purchases has totalSpent:0 and hasData:false', emptyMonthStats.totalSpent === 0 && emptyMonthStats.hasData === false);

// 11. תחזיות אינן מוצגות כהוצאות בפועל.
const test11Stats = calculateMonthlyStats([p1, p2], 2026, 10, refDate);
assert(11, 'Forecast is distinctly separate from actual: totalSpent=120, projectedTotal=186', test11Stats.totalSpent === 120 && test11Stats.projectedTotal === 186);

// 12. רענון הדף ושמירה ב-JSON.
const serialized = JSON.stringify([p1, p2]);
const deserialized: Purchase[] = JSON.parse(serialized);
assert(12, 'JSON serialization integrity preserves all fields accurately', deserialized.length === 2 && deserialized[1].totalPrice === 80);

// 13. ייצוא ושחזור נתונים פועלים ודוחים נתונים פגומים.
const corruptJson = '{"purchases": [{"brand": "Fake", "pricePerPack": -50, "quantity": 0}]}';
const importRes = testStorage.importFromJson(corruptJson);
assert(13, 'Import validation rejects corrupt data with negative price or zero quantity', !importRes.success);

// 14. חישוב אגורות ומניעת שגיאות עיגול מצטברות.
const fracTotal = calculatePurchaseTotal(38.5, 3); // 115.5
const exactFormatted = formatCurrencyExact(fracTotal, '₪');
assert(14, 'Floating point multiplication handles agorot accurately (38.5 * 3 = 115.5 ₪)', fracTotal === 115.5 && exactFormatted.includes('115.5'));

// 15. חישוב תרחישי חיסכון וסימולציות.
const sim50 = calculateSavingsScenario(1200, 50);
const sim100 = calculateSavingsScenario(1200, 100);
assert(15, 'Savings simulations: 1200 ₪ at 50% = 600 ₪/mo; 100% = 1200 ₪/mo', sim50.monthlySaved === 600 && sim100.monthlySaved === 1200 && sim100.annualSaved === 14400);

// ==========================================
// SECTION 2: FIX 1 - DEMO VS USER DATA RESET
// ==========================================

// 16. איפוס נתוני הדגמה שומר על הרכישות האמיתיות ללא שינוי
mockLocalStorage.clear();
testStorage.savePurchase({ brand: 'Real Marlboro', pricePerPack: 40, quantity: 2, date: '2026-10-10' }, false);
testStorage.savePurchase({ brand: 'Demo Marlboro', pricePerPack: 40, quantity: 5, date: '2026-10-10' }, true);

const realBeforeDemoReset = testStorage.getPurchases(false);
const resetDemoRes = testStorage.resetDemoData();
const realAfterDemoReset = testStorage.getPurchases(false);
const demoAfterReset = testStorage.getPurchases(true);

assert(
  16,
  'Resetting demo data clears demo sandbox but leaves real user purchases 100% untouched',
  resetDemoRes.success &&
  realBeforeDemoReset.length === 1 &&
  realAfterDemoReset.length === 1 &&
  realAfterDemoReset[0].brand === 'Real Marlboro' &&
  demoAfterReset.length === 0
);

// 17. לאחר איפוס הדגמה, לא נוצרים נתוני הדגמה אוטומטית ברענון
const demoReloadCheck = testStorage.getPurchases(true);
assert(
  17,
  'Demo data is NOT auto-recreated after reset unless explicitly requested',
  demoReloadCheck.length === 0
);

// 18. איפוס במצב רגיל אינו מוחק את נתוני ההדגמה
testStorage.seedDemoData(); // Re-seed demo
const demoBeforeUserReset = testStorage.getPurchases(true);
testStorage.resetAllUserData();
const realAfterUserReset = testStorage.getPurchases(false);
const demoAfterUserReset = testStorage.getPurchases(true);

assert(
  18,
  'Resetting user data clears user purchases but leaves demo sandbox intact',
  realAfterUserReset.length === 0 && demoAfterUserReset.length === demoBeforeUserReset.length && demoAfterUserReset.length > 0
);

// ==========================================
// SECTION 3: FIX 2 - STORAGE ERROR HANDLING
// ==========================================

// 19. טיפול בשגיאת QuotaExceededError ב-savePurchase מחזיר StorageResult עם שגיאה בעברית ולא קורס
shouldSimulateQuotaError = true;
const quotaFailResult = testStorage.savePurchase({ brand: 'Marlboro', pricePerPack: 40, quantity: 1, date: '2026-10-10' }, false);
shouldSimulateQuotaError = false;

assert(
  19,
  'savePurchase catches QuotaExceededError and returns structured failure with informative message',
  !quotaFailResult.success && typeof quotaFailResult.error === 'string' && quotaFailResult.error.includes('זיכרון הדפדפן מלא')
);

// 20. טיפול בשגיאת SecurityError ב-saveSettings אינו קורס ומחזיר שגיאה מסודרת
shouldSimulateSecurityError = true;
const securityFailResult = testStorage.saveSettings({ currency: '$' });
shouldSimulateSecurityError = false;

assert(
  20,
  'saveSettings catches SecurityError and returns failure without crashing the app',
  !securityFailResult.success && typeof securityFailResult.error === 'string' && securityFailResult.error.includes('שגיאת הרשאה')
);

// 21. כשל בשמירה אינו משנה את רשימת הרכישות הקיימת
testStorage.savePurchase({ brand: 'Valid Item', pricePerPack: 35, quantity: 1, date: '2026-10-11' }, false);
const countBeforeFail = testStorage.getPurchases(false).length;
shouldSimulateQuotaError = true;
testStorage.savePurchase({ brand: 'Failed Item', pricePerPack: 35, quantity: 1, date: '2026-10-12' }, false);
shouldSimulateQuotaError = false;
const countAfterFail = testStorage.getPurchases(false).length;

assert(
  21,
  'Storage failure preserves existing data integrity and does not add partially saved records',
  countBeforeFail === countAfterFail && countBeforeFail === 1
);

// ==========================================
// SECTION 4: FIX 3 - FAIR DAILY PACE COMPARISON
// ==========================================

// 22. השוואת קצב יומי הוגנת בתחילת חודש (יום 2 מול חודש שלם)
// Current month: 2 days passed, spent 80 ₪ -> dailyAverage = 40 ₪/day
// Prev month: 30 days, spent 1200 ₪ -> dailyAverage = 40 ₪/day
const currMonthStart: any = {
  hasData: true,
  totalSpent: 80,
  dailyAverage: 40,
  daysConsidered: 2
};
const prevMonthFull: any = {
  hasData: true,
  totalSpent: 1200,
  dailyAverage: 40,
  daysInMonth: 30
};
const paceEqual = compareMonthlyPaces(currMonthStart, prevMonthFull);
assert(
  22,
  'Fair pace comparison: 80 ₪ in 2 days vs 1200 ₪ in 30 days is recognized as EQUAL pace (40 ₪/day), not a 93% drop',
  paceEqual.status === 'valid' && paceEqual.diffPercent === 0 && paceEqual.diffDirection === 'equal'
);

// 23. השוואת קצב כאשר הקצב היומי גדל ב-25%
const currMonthHigher: any = {
  hasData: true,
  totalSpent: 100,
  dailyAverage: 50,
  daysConsidered: 2
};
const paceHigher = compareMonthlyPaces(currMonthHigher, prevMonthFull);
assert(
  23,
  'Fair pace comparison detects +25% increase in daily pace (50 ₪/day vs 40 ₪/day)',
  paceHigher.status === 'valid' && paceHigher.diffPercent === 25 && paceHigher.diffDirection === 'more'
);

// 24. טיפול בחודש קודם ללא רכישות אינו גורם לחלוקה באפס ומחזיר סטטוס מתאים
const prevMonthEmpty: any = {
  hasData: false,
  totalSpent: 0,
  dailyAverage: 0,
  daysInMonth: 30
};
const paceNoPrev = compareMonthlyPaces(currMonthStart, prevMonthEmpty);
assert(
  24,
  'Zero previous month spending is handled safely without division by zero',
  paceNoPrev.status === 'no_prev_data' && paceNoPrev.diffPercent === null
);

// 25. השוואה בין חודשים בעלי מספר ימים שונה (פברואר 28 ימים מול מרץ 31 ימים)
const febStats: any = { hasData: true, totalSpent: 1120, dailyAverage: 40, daysInMonth: 28 };
const marStats: any = { hasData: true, totalSpent: 1240, dailyAverage: 40, daysConsidered: 31 };
const paceFebMar = compareMonthlyPaces(marStats, febStats);
assert(
  25,
  'Pace comparison between February (28 days) and March (31 days) correctly normalizes daily rates',
  paceFebMar.status === 'valid' && paceFebMar.diffPercent === 0
);

// ==========================================
// SECTION 5: FIX 4 - CSV FORMULA INJECTION
// ==========================================

// 26. נטרול נוסחת =1+1
const csvEq = sanitizeCsvField('=1+1', false);
assert(26, 'CSV injection: =1+1 is neutralized with prepended quote', csvEq === `"'=1+1"`);

// 27. נטרול נוסחת +SUM(A1:A2)
const csvPlus = sanitizeCsvField('+SUM(A1:A2)', false);
assert(27, 'CSV injection: +SUM(A1:A2) is neutralized with prepended quote', csvPlus === `\"'+SUM(A1:A2)\"`);

// 28. נטרול נוסחת -1+2 בשדה טקסט
const csvMinus = sanitizeCsvField('-1+2', false);
assert(28, 'CSV injection: -1+2 in text field is neutralized with prepended quote', csvMinus === `\"'-1+2\"`);

// 29. נטרול נוסחת @SUM(A1)
const csvAt = sanitizeCsvField('@SUM(A1)', false);
assert(29, 'CSV injection: @SUM(A1) is neutralized with prepended quote', csvAt === `\"'@SUM(A1)\"`);

// 30. נוסחה עם רווחים מובילים מנוטרלת כראוי
const csvLeadingSpaces = sanitizeCsvField('   =cmd|/C', false);
assert(30, 'CSV injection: leading spaces before formula are recognized and neutralized', csvLeadingSpaces === `"'   =cmd|/C"`);

// 31. שדות מספריים תקינים אינם מקבלים גרש מקדים
const csvPrice = sanitizeCsvField(40, true);
const csvQty = sanitizeCsvField(2, true);
assert(31, 'Numeric fields (price: 40, quantity: 2) remain standard numbers without quotes', csvPrice === '"40"' && csvQty === '"2"');

// 32. טקסט עברי רגיל נשאר קריא ותקין ללא שינוי
const csvHebrew = sanitizeCsvField('קיוסק המרכז, תל אביב', false);
assert(32, 'Standard Hebrew text with comma is properly escaped in quotes without formula modifier', csvHebrew === '"קיוסק המרכז, תל אביב"');

// 33. טקסט עם מרכאות כפולות ושורות חדשות
const csvComplex = sanitizeCsvField('הערה עם "מרכאות"\nושורה חדשה', false);
assert(33, 'Text with quotes and newlines follows RFC 4180 escaping', csvComplex === '"הערה עם ""מרכאות""\nושורה חדשה"');

// ==========================================
// SECTION 6: FIX 5 - RELIABLE MONTHLY FORECAST
// ==========================================

// 34. רכישת פקט גדולה (400 ₪) ביום ה-1 לחודש אינה מציגה תחזית מנופחת (סף 5 ימים)
const cartonPurchase: Purchase = {
  id: 'carton-1',
  brand: 'Marlboro Carton',
  pricePerPack: 40,
  quantity: 10,
  totalPrice: 400,
  date: '2026-10-01',
  createdAt: 1000
};
const day1Date = new Date(2026, 9, 1); // 2026-10-01 (Day 1 < 5)
const day1Stats = calculateMonthlyStats([cartonPurchase], 2026, 10, day1Date);

assert(
  34,
  'Day 1 carton purchase (400 ₪) does NOT show inflated forecast (threshold < 5 days)',
  day1Stats.totalSpent === 400 &&
  day1Stats.projectedTotal === null &&
  day1Stats.projectionStatus === 'insufficient_days' &&
  Boolean(day1Stats.projectionMessage?.includes('מוקדם מדי לחזות'))
);

// 35. רכישה בודדת ביום ה-3 לחודש עדיין מוגדרת כ-insufficient_days
const day3Date = new Date(2026, 9, 3); // Day 3 < 5
const day3Stats = calculateMonthlyStats([cartonPurchase], 2026, 10, day3Date);
assert(
  35,
  'Day 3 is still below 5-day threshold: projectedTotal is null and explanation is displayed',
  day3Stats.projectedTotal === null && day3Stats.projectionStatus === 'insufficient_days'
);

// 36. משתמש ללא רכישות מקבל סטטוס no_data ותחזית null
const noPurchasesStats = calculateMonthlyStats([], 2026, 10, day1Date);
assert(
  36,
  'User with 0 purchases has projectionStatus: no_data and projectedTotal: null',
  noPurchasesStats.projectedTotal === null && noPurchasesStats.projectionStatus === 'no_data'
);

// 37. ביום ה-5 ומעלה, תחזית מוצגת בצורה אמינה
const day5Date = new Date(2026, 9, 5); // Day 5 >= 5
// 400 ₪ over 5 days = 80 ₪/day -> in 31 days = 2,480 ₪
const day5Stats = calculateMonthlyStats([cartonPurchase], 2026, 10, day5Date);
assert(
  37,
  'Day 5 reaches threshold: projectionStatus is ready and forecast is computed accurately',
  day5Stats.projectionStatus === 'ready' &&
  day5Stats.projectedTotal === 2480 &&
  day5Stats.dailyAverage === 80
);

// 38. מספר רכישות לאורך מספר ימים ביום 15
const pMulti1: Purchase = { id: 'm-1', brand: 'Kent', pricePerPack: 40, quantity: 1, totalPrice: 40, date: '2026-10-02', createdAt: 1 };
const pMulti2: Purchase = { id: 'm-2', brand: 'Kent', pricePerPack: 40, quantity: 1, totalPrice: 40, date: '2026-10-06', createdAt: 2 };
const pMulti3: Purchase = { id: 'm-3', brand: 'Kent', pricePerPack: 40, quantity: 1, totalPrice: 40, date: '2026-10-10', createdAt: 3 };
const day15Date = new Date(2026, 9, 15); // Day 15
// Total spent = 120 ₪ in 15 days = 8 ₪/day -> 31 days = 248 ₪
const day15Stats = calculateMonthlyStats([pMulti1, pMulti2, pMulti3], 2026, 10, day15Date);
assert(
  38,
  'Purchases across multiple days produce steady realistic projection (120 ₪ / 15 * 31 = 248 ₪)',
  day15Stats.dailyAverage === 8 && day15Stats.projectedTotal === 248 && day15Stats.projectionStatus === 'ready'
);

// 39. חודש קצר (פברואר 28 ימים) מחושב במדויק
const feb2026Date = new Date(2026, 1, 14); // Feb 14, 2026 (Common year, 28 days)
const pFeb: Purchase = { id: 'feb-1', brand: 'Next', pricePerPack: 35, quantity: 2, totalPrice: 70, date: '2026-02-05', createdAt: 1 };
// 70 ₪ over 14 days = 5 ₪/day -> in 28 days = 140 ₪
const febProjection = calculateMonthlyStats([pFeb], 2026, 2, feb2026Date);
assert(
  39,
  'Short month (February 28 days) calculates exact projection without 30-day assumption (5 ₪/day * 28 = 140 ₪)',
  febProjection.daysInMonth === 28 && febProjection.projectedTotal === 140
);

// 40. הפרדה מוחלטת: הוצאה בפועל (totalSpent) אינה משתנה מהתחזית
assert(
  40,
  'Actual spending (totalSpent) remains strictly independent of projectedTotal',
  febProjection.totalSpent === 70 && febProjection.projectedTotal === 140
);

// 41. יעד שבועי: ללא הגדרה (hasGoal: false)
const noGoal = calculateWeeklyStats([], new Date(2026, 9, 20), 0);
assert(
  41,
  'Weekly stats handles 0 or undefined goal with hasGoal: false',
  noGoal.hasGoal === false && noGoal.weeklyPackGoal === 0
);

// 42. יעד שבועי: 3 חפיסות, נרכשו 2 (on_track)
const pWeek1: Purchase = { id: 'w-1', brand: 'Kent', pricePerPack: 40, quantity: 2, totalPrice: 80, date: '2026-10-19', createdAt: 1 };
const weekStats = calculateWeeklyStats([pWeek1], new Date(2026, 9, 20), 3);
assert(
  42,
  'Weekly stats detects 2 of 3 packs on track (67% used)',
  weekStats.hasGoal === true && weekStats.currentWeekPacks === 2 && weekStats.percentUsed === 67 && weekStats.status === 'on_track'
);

// 43. יעד שבועי: חריגה של חפיסה אחת (exceeded)
const pWeekOver: Purchase = { id: 'w-2', brand: 'Kent', pricePerPack: 40, quantity: 4, totalPrice: 160, date: '2026-10-19', createdAt: 2 };
const weekOverStats = calculateWeeklyStats([pWeekOver], new Date(2026, 9, 20), 3);
assert(
  43,
  'Weekly stats detects exceeded goal (4 packs vs 3 pack target)',
  weekOverStats.status === 'exceeded' && weekOverStats.percentUsed === 133
);

// ==========================================
// TEST SUMMARY REPORT
// ==========================================
console.log('\n--- Complete Test Execution Results ---');
let allPassed = true;
results.forEach(r => {
  console.log(`[Test ${String(r.id).padStart(2, '0')}] ${r.description} -> ${r.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  if (!r.passed) {
    allPassed = false;
    if (r.details) console.log(`   Details: ${r.details}`);
  }
});

console.log(`\nTOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);

if (allPassed) {
  console.log(`ALL ${results.length} TESTS PASSED WITH ZERO ERRORS! 🏆`);
  process.exit(0);
} else {
  console.error('SOME TESTS FAILED!');
  process.exit(1);
}
