import React from 'react';
import { Plus, Sparkles, AlertCircle } from 'lucide-react';
import { ActiveTab, UserSettings } from '../types/index.ts';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  settings: UserSettings;
  onToggleDemoMode: () => void;
  onOpenInsights?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  settings,
  onToggleDemoMode,
  onOpenInsights
}) => {
  return (
    <header role="banner" className="sticky top-0 z-30 w-full bg-[#080C14]/95 backdrop-blur-md border-b border-[#141E34]">
      {/* Demo Mode Alert Banner with High Contrast */}
      {settings.isDemoModeActive && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="font-medium text-xs sm:text-sm truncate">
              <strong>מצב הדגמה פעיל:</strong> הנתונים המוצגים הם להמחשה בלבד ואינם משפיעים על הנתונים האמיתיים שלך.
            </span>
          </div>
          <button
            onClick={onToggleDemoMode}
            className="text-xs font-bold bg-amber-400 text-[#080C14] hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap min-h-[44px] flex items-center shrink-0 focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            חזרה לנתונים שלי
          </button>
        </div>
      )}

      {/* Main Top Bar - 3 Zone Architecture */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E676]/20 to-[#141E34] border border-[#00E676]/40 flex items-center justify-center shadow-sm"
            aria-hidden="true"
          >
            <span className="font-bold text-base text-[#00E676]">₪</span>
          </div>
          <div className="flex flex-col min-w-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="text-lg font-extrabold tracking-tight text-[#F5F7FA] hover:text-[#00E676] transition-colors text-right whitespace-nowrap truncate max-w-full focus-visible:ring-2 focus-visible:ring-[#00E676] rounded-md"
            >
              כמה זה עולה?
            </button>
            <span className="text-xs text-[#AAB4C5] hidden sm:inline">מעקב הוצאות וחיסכון בעישון</span>
          </div>
        </div>

        {/* Zone 2: Desktop/Tablet Navigation Links */}
        <nav aria-label="ניווט ראשי" className="hidden md:flex items-center gap-1 bg-[#141E34]/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => onTabChange('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[38px] ${
              activeTab === 'dashboard'
                ? 'bg-[#080C14] text-[#00E676] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F7FA]'
            }`}
          >
            סקירה
          </button>
          <button
            onClick={() => onTabChange('purchases')}
            aria-current={activeTab === 'purchases' ? 'page' : undefined}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[38px] ${
              activeTab === 'purchases'
                ? 'bg-[#080C14] text-[#00E676] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F7FA]'
            }`}
          >
            רכישות
          </button>
          <button
            onClick={() => onTabChange('savings')}
            aria-current={activeTab === 'savings' ? 'page' : undefined}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[38px] ${
              activeTab === 'savings'
                ? 'bg-[#080C14] text-[#00E676] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F7FA]'
            }`}
          >
            חיסכון
          </button>
          <button
            onClick={() => onTabChange('settings')}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[38px] ${
              activeTab === 'settings'
                ? 'bg-[#080C14] text-[#00E676] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F7FA]'
            }`}
          >
            הגדרות
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenInsights && (
            <button
              onClick={onOpenInsights}
              title="תובנות פיננסיות חכמות"
              aria-label="תובנות חכמות"
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#AAB4C5] hover:text-[#F5F7FA] bg-[#141E34]/60 hover:bg-[#141E34] border border-white/5 rounded-xl transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
            >
              <Sparkles className="w-4 h-4 text-[#00E676]" aria-hidden="true" />
              <span className="hidden lg:inline">תובנות חכמות</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#080C14] bg-[#00E676] hover:bg-[#00c864] rounded-xl shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all active:scale-[0.98] min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C14]"
            aria-label="הוספת רכישה חדשה"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span className="whitespace-nowrap">הוספת רכישה</span>
          </button>
        </div>
      </div>
    </header>
  );
};
