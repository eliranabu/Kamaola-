import React from 'react';
import {
  Wallet,
  Package,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Receipt,
  HelpCircle
} from 'lucide-react';
import { Purchase, UserSettings, MonthlySummary, YearlySummary, WeeklyGoalStats } from '../types/index.ts';
import {
  calculateSavingsBaseline,
  calculateSavingsScenario,
  compareMonthlyPaces,
  formatCurrency,
  formatCurrencyExact
} from '../services/calculations.ts';
import { ExpenseBarChart } from '../components/ExpenseBarChart.tsx';
import { WeeklyGoalCard } from '../components/WeeklyGoalCard.tsx';

interface DashboardViewProps {
  purchases: Purchase[];
  currentMonthStats: MonthlySummary;
  prevMonthStats: MonthlySummary;
  twelveMonthsData: MonthlySummary[];
  yearlyStats: YearlySummary;
  weeklyStats: WeeklyGoalStats;
  settings: UserSettings;
  onOpenAddModal: () => void;
  onNavigateToPurchases: () => void;
  onNavigateToSavings: () => void;
  onUpdateWeeklyGoal: (goal: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  purchases,
  currentMonthStats,
  prevMonthStats,
  twelveMonthsData,
  yearlyStats,
  weeklyStats,
  settings,
  onOpenAddModal,
  onNavigateToPurchases,
  onNavigateToSavings,
  onUpdateWeeklyGoal
}) => {
  const isFreshUser = purchases.length === 0;

  // Fair daily pace comparison (Apples-to-Apples based on daily average)
  const paceComp = compareMonthlyPaces(currentMonthStats, prevMonthStats);

  // Same baseline + scenario math as the Savings screen (single source of truth)
  const teaserBaseline = calculateSavingsBaseline(currentMonthStats, twelveMonthsData);
  const teaserAnnualSaved = calculateSavingsScenario(teaserBaseline.amount, 25).annualSaved;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Visually Hidden Page Title for Screen Readers (WCAG 2.4.2 & 2.4.6) */}
      <h1 className="sr-only">סקירת הוצאות חודשיות ותחזית חיסכון</h1>

      {/* Welcome Banner / Fresh User Empty State */}
      {isFreshUser ? (
        <section
          aria-labelledby="welcome-title"
          className="bg-[#141E34] border border-[#00E676]/30 rounded-3xl p-6 sm:p-8 text-center shadow-xl"
        >
          <div
            className="w-16 h-16 rounded-2xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center mx-auto mb-4 text-[#00E676]"
            aria-hidden="true"
          >
            <Receipt className="w-8 h-8" />
          </div>
          <h2 id="welcome-title" className="text-xl sm:text-2xl font-black text-[#F5F7FA]">
            ברוכים הבאים ל־״כמה זה עולה?״
          </h2>
          <p className="text-xs sm:text-sm text-[#AAB4C5] max-w-md mx-auto mt-2 leading-relaxed">
            גלו בדיוק כמה כסף מושקע בעישון, עקבו אחר רכישות בזמן אמת וראו כמה תוכלו לפנות לטובת מטרות אישיות.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] text-xs sm:text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all min-h-[48px] flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#00E676]"
            >
              <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>הוסיפו את הרכישה הראשונה שלכם</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* Primary KPI Grid */}
      <section aria-label="מדדים מרכזיים לחודש הנוכחי" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Month-to-date Actual Spent (Dominant Anchor) */}
        <div className="bg-[#141E34] border-2 border-[#00E676]/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#AAB4C5]">
              הוצאות בפועל מתחילת החודש
            </h3>
            <div
              className="w-9 h-9 rounded-xl bg-[#00E676]/15 flex items-center justify-center text-[#00E676]"
              aria-hidden="true"
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-[#F5F7FA] font-mono tabular-nums tracking-tight">
              {formatCurrency(currentMonthStats.totalSpent, settings.currency)}
            </div>

            {/* Fair Comparison: Daily average pace comparison */}
            <div className="mt-2.5 text-xs flex flex-col gap-1">
              {paceComp.status === 'valid' ? (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paceComp.diffDirection === 'more' ? (
                      <span className="text-rose-400 flex items-center font-bold">
                        <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span dir="ltr">+{paceComp.diffPercent}%</span> בקצב היומי
                      </span>
                    ) : paceComp.diffDirection === 'less' ? (
                      <span className="text-[#00E676] flex items-center font-bold">
                        <ArrowDownRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span dir="ltr">-{paceComp.diffPercent}%</span> בקצב היומי
                      </span>
                    ) : (
                      <span className="text-[#AAB4C5] font-semibold">קצב יומי זהה לחודש קודם</span>
                    )}
                    <span className="text-[#AAB4C5]">לעומת חודש שעבר</span>
                  </div>
                  <span className="text-[11px] text-[#AAB4C5]">
                    מחושב לפי ממוצע של {formatCurrencyExact(paceComp.currDailyAverage, settings.currency)}/יום לעומת {formatCurrencyExact(paceComp.prevDailyAverage, settings.currency)}/יום
                  </span>
                </>
              ) : (
                <span className="text-[#AAB4C5] text-xs">{paceComp.label}</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Packs Bought This Month */}
        <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#AAB4C5]">חפיסות שנרכשו החודש</h3>
            <div
              className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"
              aria-hidden="true"
            >
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#F5F7FA] font-mono tabular-nums">
              {currentMonthStats.totalPacks}{' '}
              <span className="text-sm font-normal text-[#AAB4C5]">חפיסות</span>
            </div>
            <div className="mt-2 text-xs text-[#AAB4C5]">
              ב־{currentMonthStats.purchaseCount} רכישות נפרדות החודש
            </div>
          </div>
        </div>

        {/* KPI 3: Daily Average Spending */}
        <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#AAB4C5]">ממוצע הוצאה יומי</h3>
            <div
              className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"
              aria-hidden="true"
            >
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#F5F7FA] font-mono tabular-nums">
              {formatCurrencyExact(currentMonthStats.dailyAverage, settings.currency)}
            </div>
            <div className="mt-2 text-xs text-[#AAB4C5]">
              לפי {currentMonthStats.daysConsidered} ימי מעקב החודש
            </div>
          </div>
        </div>

        {/* KPI 4: Monthly Forecast (Strictly Labeled and Distinguished) */}
        <div className="bg-[#141E34] border border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
              <h3 className="text-xs font-bold text-amber-300">תחזית לסוף החודש</h3>
            </div>
            {/* Zero-Pill clean text label */}
            <span className="text-[11px] text-[#AAB4C5]">
              {currentMonthStats.projectionStatus === 'ready' ? 'אומדן משוער' : 'בהמתנה לנתונים'}
            </span>
          </div>

          <div className="mt-4">
            {currentMonthStats.projectionStatus === 'ready' && currentMonthStats.projectedTotal !== null ? (
              <>
                <div className="text-3xl font-black text-amber-300 font-mono tabular-nums">
                  ~{formatCurrency(currentMonthStats.projectedTotal, settings.currency)}
                </div>
                <div className="mt-2 text-xs text-[#AAB4C5] leading-relaxed">
                  {currentMonthStats.projectionMessage}
                </div>
              </>
            ) : currentMonthStats.projectionStatus === 'insufficient_days' ? (
              <>
                <div className="text-base sm:text-lg font-bold text-amber-200">
                  מוקדם מדי לחזות — מתגבש
                </div>
                <div className="mt-2 text-xs text-[#AAB4C5] leading-relaxed">
                  התחזית תוצג החל מהיום ה-5 לחודש, כדי למנוע עיוות מקנייה מרוכזת (פקט) בתחילת החודש.
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-[#AAB4C5]">אין עדיין נתונים</div>
                <div className="mt-2 text-xs text-[#AAB4C5] leading-relaxed">
                  הזינו רכישה החודש לקבלת תחזית הוצאה אוטומטית.
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Weekly Pack Target / Gamification */}
      <WeeklyGoalCard
        stats={weeklyStats}
        settings={settings}
        onUpdateGoal={onUpdateWeeklyGoal}
      />

      {/* Main Interactive Bar Chart */}
      <ExpenseBarChart
        monthlyData={twelveMonthsData}
        settings={settings}
      />

      {/* Annual Horizon Strip & Savings Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Annual Metrics Card */}
        <section aria-labelledby="annual-summary-title" className="lg:col-span-2 bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 id="annual-summary-title" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
              סיכום שנתי מצטבר ({yearlyStats.year})
            </h2>
            <span className="text-xs text-[#AAB4C5]">נתונים בפועל ואומדן שנתי</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <span className="text-xs text-[#AAB4C5] block">סך חפיסות שנרכשו</span>
              <span className="text-xl font-bold text-[#F5F7FA] font-mono tabular-nums mt-1 block">
                {yearlyStats.totalPacks}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#AAB4C5] block">מחיר ממוצע לחפיסה</span>
              <span className="text-xl font-bold text-[#F5F7FA] font-mono tabular-nums mt-1 block">
                {formatCurrencyExact(yearlyStats.averagePricePerPack, settings.currency)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#AAB4C5] block">הוצאה מצטברת בפועל</span>
              <span className="text-xl font-bold text-[#00E676] font-mono tabular-nums mt-1 block">
                {formatCurrency(yearlyStats.totalSpent, settings.currency)}
              </span>
            </div>
            <div className="bg-[#080C14] p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-amber-300 block font-semibold">אומדן שנתי מוערך</span>
              <span className="text-lg sm:text-xl font-bold text-amber-300 font-mono tabular-nums mt-0.5 block">
                {yearlyStats.projectedYearTotal === null
                  ? 'מתגבש'
                  : `~${formatCurrency(yearlyStats.projectedYearTotal, settings.currency)}`}
              </span>
            </div>
          </div>
        </section>

        {/* Quick Savings Horizon Box */}
        <section aria-labelledby="savings-teaser-title" className="bg-[#141E34] border border-[#00E676]/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00E676]">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>תרחיש חיסכון פוטנציאלי</span>
            </div>
            <h3 id="savings-teaser-title" className="text-base font-bold text-[#F5F7FA] mt-2">
              הפחתה של 25% בהוצאה
            </h3>
            <p className="text-xs text-[#AAB4C5] mt-1 leading-relaxed">
              בהתבסס על ההוצאה החודשית שלך, הפחתה של רבע מהכמות בלבד תחסוך:
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#AAB4C5]">חיסכון שנתי צפוי:</span>
              <span className="text-2xl font-black text-[#00E676] font-mono tabular-nums">
                {formatCurrency(teaserAnnualSaved, settings.currency)}
              </span>
            </div>
            <button
              onClick={onNavigateToSavings}
              className="mt-3.5 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-xs sm:text-sm font-semibold rounded-xl transition-colors min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#00E676]"
            >
              <span>בדקו את כל התרחישים והיעדים</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      {/* Recent Purchases Strip */}
      <section aria-labelledby="recent-purchases-title" className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#AAB4C5]" aria-hidden="true" />
            <h2 id="recent-purchases-title" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
              רכישות אחרונות
            </h2>
          </div>
          {purchases.length > 0 && (
            <button
              onClick={onNavigateToPurchases}
              className="text-xs font-semibold text-[#00E676] hover:underline p-1 min-h-[36px] flex items-center focus-visible:ring-2 focus-visible:ring-[#00E676] rounded"
            >
              לכל היסטוריית הרכישות ({purchases.length})
            </button>
          )}
        </div>

        {purchases.length === 0 ? (
          <div className="py-8 text-center text-xs sm:text-sm text-[#AAB4C5]">
            לא נמצאו רכישות במערכת. לחצו על ״הוספת רכישה״ כדי להתחיל.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 mt-2">
            {purchases.slice(0, 3).map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F5F7FA] truncate">{item.brand}</div>
                  <div className="text-xs text-[#AAB4C5] mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{item.date}</span>
                    {item.time && <span>· {item.time}</span>}
                    <span>· {item.quantity} חפיסות</span>
                  </div>
                </div>
                <div className="text-left font-mono font-bold text-base sm:text-lg text-[#F5F7FA] tabular-nums shrink-0">
                  {formatCurrency(item.totalPrice, settings.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
