import React, { useState } from 'react';
import { Target, CheckCircle2, AlertCircle, Edit3, Trophy, ChevronLeft } from 'lucide-react';
import { WeeklyGoalStats, UserSettings } from '../types/index.ts';
import { formatCurrency } from '../services/calculations.ts';

interface WeeklyGoalCardProps {
  stats: WeeklyGoalStats;
  settings: UserSettings;
  onUpdateGoal: (newGoal: number) => void;
}

export const WeeklyGoalCard: React.FC<WeeklyGoalCardProps> = ({
  stats,
  settings,
  onUpdateGoal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [goalInput, setGoalInput] = useState(String(stats.weeklyPackGoal || 3));

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 50) {
      onUpdateGoal(val);
      setIsEditing(false);
    }
  };

  if (!stats.hasGoal && !isEditing) {
    return (
      <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00E676]/15 text-[#00E676] flex items-center justify-center shrink-0" aria-hidden="true">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA]">יעד צמצום שבועי (אתגר אישי)</h3>
            <p className="text-xs text-[#AAB4C5] mt-0.5">
              הגדירו תקרת חפיסות שבועית ועקבו אחר העמידה ביעד בזמן אמת
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#00E676] text-xs font-bold rounded-xl border border-[#00E676]/30 transition-colors min-h-[44px] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#00E676]"
        >
          <Target className="w-3.5 h-3.5" aria-hidden="true" />
          <span>הגדרת יעד שבועי</span>
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-[#141E34] border border-[#00E676]/30 rounded-2xl p-4 sm:p-5 shadow-lg" dir="rtl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-[#F5F7FA] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00E676]" aria-hidden="true" />
            <span>קביעת יעד חפיסות לשבוע (ראשון עד שבת)</span>
          </h3>
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-[#AAB4C5] hover:text-[#F5F7FA] min-h-[36px] px-2"
          >
            ביטול
          </button>
        </div>

        <form onSubmit={handleSaveGoal} className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="goal-input" className="text-xs text-[#AAB4C5] whitespace-nowrap">
              יעד שבועי:
            </label>
            <input
              id="goal-input"
              type="number"
              min="1"
              max="50"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-20 bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] font-bold text-base rounded-xl px-3 py-2 text-center tabular-nums outline-none min-h-[44px]"
            />
            <span className="text-xs text-[#AAB4C5]">חפיסות</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {[2, 3, 4, 5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGoalInput(String(preset))}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-[#F5F7FA] rounded-lg transition-colors min-h-[36px]"
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto sm:mr-auto px-4 py-2 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] font-bold text-xs rounded-xl transition-all shadow-sm min-h-[44px]"
          >
            שמירת יעד
          </button>
        </form>
      </div>
    );
  }

  const isExceeded = stats.status === 'exceeded';
  const isNearLimit = stats.status === 'near_limit';
  const progressPercent = Math.min(100, stats.percentUsed);

  return (
    <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isExceeded
                ? 'bg-rose-500/15 text-rose-400'
                : isNearLimit
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-[#00E676]/15 text-[#00E676]'
            }`}
            aria-hidden="true"
          >
            {isExceeded ? (
              <AlertCircle className="w-5 h-5" />
            ) : isNearLimit ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <Target className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FA]">
              יעד שבועי: עד {stats.weeklyPackGoal} חפיסות
            </h3>
            <span className="text-[11px] text-[#AAB4C5]">שבוע נוכחי (מראשון עד שבת)</span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-[#AAB4C5] hover:text-[#00E676] flex items-center gap-1 min-h-[44px] px-2 focus-visible:ring-2 focus-visible:ring-[#00E676] rounded-lg"
          title="עריכת היעד השבועי"
        >
          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">שינוי יעד</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-mono tabular-nums">
          <span className="text-[#AAB4C5]">
            נרכשו: <strong>{stats.currentWeekPacks}</strong> מתוך {stats.weeklyPackGoal} חפיסות
          </span>
          <span
            className={`font-bold ${
              isExceeded ? 'text-rose-400' : isNearLimit ? 'text-amber-300' : 'text-[#00E676]'
            }`}
          >
            {stats.percentUsed}%
          </span>
        </div>

        <div className="w-full h-3 bg-[#080C14] rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              isExceeded
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : isNearLimit
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                : 'bg-[#00E676] shadow-[0_0_8px_rgba(0,230,118,0.4)]'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Encouraging Status Message */}
      <p
        className={`text-xs leading-relaxed pt-1 flex items-center gap-1.5 font-medium ${
          isExceeded ? 'text-rose-300' : isNearLimit ? 'text-amber-200' : 'text-[#AAB4C5]'
        }`}
      >
        <span>{stats.statusMessage}</span>
      </p>
    </div>
  );
};
