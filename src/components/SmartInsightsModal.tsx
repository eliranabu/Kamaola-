import React, { useState, useEffect } from 'react';
import { Sparkles, X, Lightbulb, Target, Loader2 } from 'lucide-react';
import { MonthlySummary, YearlySummary, UserSettings } from '../types/index.ts';

interface SmartInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthStats: MonthlySummary;
  yearlyStats: YearlySummary;
  settings: UserSettings;
}

interface InsightsData {
  summary: string;
  tips: string[];
  milestoneIdea: string;
}

export const SmartInsightsModal: React.FC<SmartInsightsModalProps> = ({
  isOpen,
  onClose,
  currentMonthStats,
  yearlyStats,
  settings
}) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalMonthlySpent: currentMonthStats.totalSpent,
        totalPacks: currentMonthStats.totalPacks,
        dailyAverage: currentMonthStats.dailyAverage,
        projectedAnnual: yearlyStats.projectedYearTotal,
        currency: settings.currency
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setInsights(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load insights:', err);
        if (isMounted) {
          setInsights({
            summary: `בכל חודש מוקצים כ־${currentMonthStats.totalSpent} ${settings.currency} להוצאות סיגריות. מעקב שוטף הוא הצעד המשמעותי ביותר להשגת שליטה תקציבית.`,
            tips: [
              'הגדירו תקציב שבועי מוגדר מראש במקום לקנות חפיסה בכל פעם שנזכרים.',
              'הפנו כל חיסכון שבועי ישירות לחיסכון נפרד כדי לחוש בהצלחה.',
              'בחנו את ימי השבוע שבהם אתם קונים הכי הרבה וזהו את הטריגרים.'
            ],
            milestoneIdea: 'צמצום של שליש מהחפיסות שווה ערך לכ־4,000 ₪ חיסכון שנתי ממוצע.'
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentMonthStats, yearlyStats, settings]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      dir="rtl"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="insights-dialog-title"
        className="w-full max-w-lg bg-[#141E34] border border-slate-700 rounded-3xl p-6 shadow-2xl overflow-hidden relative focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="insights-dialog-title" className="text-base sm:text-lg font-bold text-[#F5F7FA]">
                תובנות פיננסיות חכמות
              </h2>
              <p className="text-xs text-[#AAB4C5] mt-0.5">ניתוח הרגלי עישון והזדמנויות חיסכון אישיות</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[#AAB4C5] hover:text-[#F5F7FA] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
            aria-label="סגירת חלון"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 max-h-[70vh] overflow-y-auto" aria-busy={loading}>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3" role="status">
              <Loader2 className="w-8 h-8 text-[#00E676] animate-spin" aria-hidden="true" />
              <span className="text-xs sm:text-sm text-[#AAB4C5]">מנתח את נתוני הרכישות שלך...</span>
            </div>
          ) : insights ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-[#080C14] border border-[#00E676]/30 p-4 rounded-2xl">
                <p className="text-sm font-semibold text-[#F5F7FA] leading-relaxed">
                  {insights.summary}
                </p>
              </div>

              {/* Practical Tips */}
              <div>
                <h3 className="text-xs font-bold text-[#AAB4C5] mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>טיפים מעשיים לניהול תקציב</span>
                </h3>
                <div className="space-y-2">
                  {insights.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="bg-[#080C14]/80 border border-slate-800 p-3.5 rounded-xl text-xs sm:text-sm text-[#F5F7FA] leading-relaxed flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[#00E676] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Idea */}
              {insights.milestoneIdea && (
                <div className="bg-gradient-to-r from-blue-950/40 to-[#141E34] border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-300">יעד ששווה לשאוף אליו</h4>
                    <p className="text-xs sm:text-sm text-[#E2E8F0] mt-1 leading-relaxed">
                      {insights.milestoneIdea}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-xs sm:text-sm font-semibold rounded-xl transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
};
