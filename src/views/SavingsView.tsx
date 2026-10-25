import React, { useState } from 'react';
import {
  PiggyBank,
  Sparkles,
  Plane,
  Smartphone,
  Coins,
  Plus,
  HelpCircle
} from 'lucide-react';
import { Purchase, UserSettings, MonthlySummary } from '../types/index.ts';
import { calculateSavingsBaseline, calculateSavingsScenario, formatCurrency } from '../services/calculations.ts';

interface SavingsViewProps {
  purchases: Purchase[];
  currentMonthStats: MonthlySummary;
  twelveMonthsData: MonthlySummary[];
  settings: UserSettings;
  onOpenAddModal: () => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  purchases,
  currentMonthStats,
  twelveMonthsData,
  settings,
  onOpenAddModal
}) => {
  const { amount: baselineMonthlySpend, explanation: baselineExplanation } = calculateSavingsBaseline(
    currentMonthStats,
    twelveMonthsData
  );

  const [percentage, setPercentage] = useState<number>(25);

  const simulation = calculateSavingsScenario(baselineMonthlySpend, percentage);

  const presetButtons = [
    { label: 'הפחתה של 10%', value: 10, desc: 'צעד ראשון קל' },
    { label: 'הפחתה של 25%', value: 25, desc: 'רבע מהחפיסות' },
    { label: 'הפחתה של 50%', value: 50, desc: 'חצי מהכמות' },
    { label: 'הפסקה מלאה 100%', value: 100, desc: 'אפס הוצאות' }
  ];

  if (purchases.length === 0 || baselineMonthlySpend === 0) {
    return (
      <div className="bg-[#141E34] border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-xl">
        <div
          className="w-16 h-16 rounded-2xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center mx-auto mb-4 text-[#00E676]"
          aria-hidden="true"
        >
          <PiggyBank className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F5F7FA]">
          סימולטור חיסכון אישי
        </h1>
        <p className="text-xs sm:text-sm text-[#AAB4C5] mt-2 leading-relaxed max-w-sm mx-auto">
          כדי לחשב במדויק כמה כסף תוכלו לחסוך בהפחתת צריכת הסיגריות, יש להזין לפחות רכישה אחת באפליקציה.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-6 px-6 py-3 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)] flex items-center justify-center gap-2 mx-auto min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
        >
          <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
          <span>הזנת רכישה ראשונה</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Simulation Header */}
      <section aria-labelledby="savings-header-title" className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-[#00E676]" aria-hidden="true" />
              <h1 id="savings-header-title" className="text-lg sm:text-xl font-bold text-[#F5F7FA]">
                סימולציות ותכנון חיסכון
              </h1>
            </div>
            <p className="text-xs text-[#AAB4C5] mt-0.5">
              בדקו כמה כסף יישאר בכיס שלכם על ידי שינוי בקצב הצריכה
            </p>
          </div>

          <div className="bg-[#080C14] px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-[#AAB4C5]">
            בסיס חישוב חודשי:{' '}
            <span className="font-bold text-[#F5F7FA] font-mono tabular-nums text-sm">
              {formatCurrency(baselineMonthlySpend, settings.currency)}
            </span>
            <span className="block text-[10px] text-[#AAB4C5] mt-0.5">{baselineExplanation}</span>
          </div>
        </div>

        {/* Preset percentage buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {presetButtons.map((btn) => {
            const isSelected = percentage === btn.value;
            return (
              <button
                key={btn.value}
                onClick={() => setPercentage(btn.value)}
                aria-pressed={isSelected}
                className={`p-3 rounded-xl border text-right transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#00E676] ${
                  isSelected
                    ? 'bg-[#00E676]/15 border-[#00E676] text-[#00E676] shadow-sm'
                    : 'bg-[#080C14] border-slate-800 text-[#AAB4C5] hover:text-[#F5F7FA] hover:border-slate-700'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">{btn.label}</div>
                <div className="text-[10px] text-[#AAB4C5] mt-0.5">{btn.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Custom percentage slider with accessible ARIA */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="savings-slider" className="text-xs font-semibold text-[#AAB4C5]">
              או בחרו אחוז הפחתה מותאם אישית:
            </label>
            <span className="text-base sm:text-lg font-black text-[#00E676] font-mono tabular-nums">
              {percentage}%
            </span>
          </div>
          <input
            id="savings-slider"
            type="range"
            min="0"
            max="100"
            step="5"
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
            aria-label="אחוז הפחתת עישון"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="w-full accent-[#00E676] cursor-pointer h-2.5 bg-[#080C14] rounded-lg focus-visible:ring-2 focus-visible:ring-[#00E676]"
          />
          <div className="flex justify-between text-[11px] text-[#AAB4C5] mt-1 font-medium">
            <span>0% (המשך מצב קיים)</span>
            <span>50% (חצי)</span>
            <span>100% (הפסקה מוחלטת)</span>
          </div>
        </div>
      </section>

      {/* Primary Simulation Metrics */}
      <section aria-label="תוצאות סימולציית החיסכון" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Saved */}
        <div className="bg-[#141E34] border-2 border-[#00E676]/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#AAB4C5]">חיסכון חודשי משוער</span>
          <div className="mt-3">
            <div className="text-3xl font-black text-[#00E676] font-mono tabular-nums">
              {formatCurrency(simulation.monthlySaved, settings.currency)}
            </div>
            <span className="text-xs text-[#AAB4C5] mt-1.5 block">
              הוצאה חודשית חדשה: {formatCurrency(simulation.newMonthlySpending, settings.currency)}
            </span>
          </div>
        </div>

        {/* Annual Saved */}
        <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#AAB4C5]">חיסכון שנתי משוער (12 חודשים)</span>
          <div className="mt-3">
            <div className="text-3xl font-black text-[#F5F7FA] font-mono tabular-nums">
              {formatCurrency(simulation.annualSaved, settings.currency)}
            </div>
            <span className="text-xs text-[#AAB4C5] mt-1.5 block">
              פינוי תקציב נקי ללא צורך בהגדלת הכנסה
            </span>
          </div>
        </div>

        {/* 3 Years Horizon */}
        <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#AAB4C5]">חיסכון מצטבר ל-3 שנים</span>
          <div className="mt-3">
            <div className="text-3xl font-black text-blue-400 font-mono tabular-nums">
              {formatCurrency(simulation.threeYearsSaved, settings.currency)}
            </div>
            <span className="text-xs text-[#AAB4C5] mt-1.5 block">
              ב-5 שנים: {formatCurrency(simulation.fiveYearsSaved, settings.currency)}
            </span>
          </div>
        </div>
      </section>

      {/* Visual Spending Comparison Bar */}
      <section aria-labelledby="visual-comparison-title" className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h2 id="visual-comparison-title" className="text-sm sm:text-base font-bold text-[#F5F7FA] mb-4">
          השוואה חזותית: הוצאה נוכחית לעומת תרחיש היעד
        </h2>

        <div className="space-y-4">
          {/* Current */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#AAB4C5]">הוצאה חודשית נוכחית (100%)</span>
              <span className="font-bold text-[#F5F7FA] font-mono tabular-nums">
                {formatCurrency(baselineMonthlySpend, settings.currency)}
              </span>
            </div>
            <div className="w-full h-4 bg-[#080C14] rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div className="h-full bg-slate-500 rounded-full w-full" aria-hidden="true" />
            </div>
          </div>

          {/* After Reduction */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#AAB4C5]">
                הוצאה לאחר הפחתה של {percentage}%
              </span>
              <span className="font-bold text-[#00E676] font-mono tabular-nums">
                {formatCurrency(simulation.newMonthlySpending, settings.currency)} (חיסכון:{' '}
                {formatCurrency(simulation.monthlySaved, settings.currency)})
              </span>
            </div>
            <div className="w-full h-4 bg-[#080C14] rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
              <div
                style={{ width: `${Math.max(0, 100 - percentage)}%` }}
                className="h-full bg-slate-600 rounded-r-full transition-all duration-300"
                aria-hidden="true"
              />
              <div
                style={{ width: `${percentage}%` }}
                className="h-full bg-[#00E676] rounded-l-full transition-all duration-300 shadow-[0_0_8px_#00E676]"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-[#AAB4C5]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-600" aria-hidden="true" />
              <span>הוצאה שנותרה</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00E676]" aria-hidden="true" />
              <span>סכום נחסך</span>
            </div>
          </div>
          <span className="text-slate-400">סימולציה תיאורטית</span>
        </div>
      </section>

      {/* Tangible Israeli Milestones Card */}
      <section aria-labelledby="milestones-title" className="bg-[#141E34] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <Sparkles className="w-4 h-4 text-[#00E676]" aria-hidden="true" />
          <h2 id="milestones-title" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
            מה שווה החיסכון השנתי שלך? ({formatCurrency(simulation.annualSaved, settings.currency)})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
          <div className="bg-[#080C14] border border-slate-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FA]">חופשה שנתית לחו״ל</h3>
              <p className="text-xs text-[#AAB4C5] mt-1 leading-relaxed">
                טיסות ומלון לסופ״ש באתונה, רודוס, קפריסין או בודפשט (~3,500 ₪)
              </p>
            </div>
          </div>

          <div className="bg-[#080C14] border border-slate-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FA]">שדרוג סמארטפון / מחשב</h3>
              <p className="text-xs text-[#AAB4C5] mt-1 leading-relaxed">
                אייפון, גלקסי או לפטופ חדש במזומן ללא תשלומים מעיקים (~4,500 ₪)
              </p>
            </div>
          </div>

          <div className="bg-[#080C14] border border-slate-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FA]">קרן חיסכון והשקעה</h3>
              <p className="text-xs text-[#AAB4C5] mt-1 leading-relaxed">
                ב-3 שנים: כ־{formatCurrency(simulation.threeYearsSaved, settings.currency)} באפיק מניב ריבית
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Respectful Financial Transparency Note */}
      <div className="text-xs text-[#AAB4C5] bg-[#080C14]/80 p-4 rounded-xl border border-slate-800/80 leading-relaxed flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-[#AAB4C5] shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>הבהרת שקיפות:</strong> החישובים המוצגים בעמוד זה מהווים סימולציה מבוססת הנחות
          לצורך המחשה והשראה, ואינם מהווים ייעוץ פיננסי, השקעות או התחייבות לסכום מדויק. החיסכון מתממש
          בפועל רק בהתאם לצמצום הרכישות היומיומיות שלך.
        </span>
      </div>
    </div>
  );
};
