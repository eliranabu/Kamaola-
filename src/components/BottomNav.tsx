import React from 'react';
import { LayoutDashboard, Receipt, PiggyBank, Settings, Plus } from 'lucide-react';
import { ActiveTab } from '../types/index.ts';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

const TABS = [
  { id: 'dashboard' as ActiveTab, label: 'סקירה', icon: LayoutDashboard },
  { id: 'purchases' as ActiveTab, label: 'רכישות', icon: Receipt },
  { id: 'savings' as ActiveTab, label: 'חיסכון', icon: PiggyBank },
  { id: 'settings' as ActiveTab, label: 'הגדרות', icon: Settings }
];

/**
 * Phone navigation. The primary action sits in the middle of the bar (thumb zone) instead of
 * floating over the content, so it can never cover list items or their edit/delete buttons.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onOpenAddModal }) => {
  const renderTab = (tab: (typeof TABS)[number]) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors relative focus-visible:ring-2 focus-visible:ring-[#00E676] rounded-xl ${
          isActive ? 'text-[#00E676]' : 'text-[#AAB4C5] hover:text-[#F5F7FA]'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
        <span className={`text-xs mt-1 font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
        {isActive && (
          <div className="absolute top-1 w-8 h-0.5 bg-[#00E676] rounded-full shadow-[0_0_8px_#00E676]" aria-hidden="true" />
        )}
      </button>
    );
  };

  return (
    <nav
      aria-label="ניווט תחתון למובייל"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-lg border-t border-[#141E34] px-2 pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}
        <div className="flex justify-center">
          <button
            onClick={onOpenAddModal}
            aria-label="הוספת רכישה חדשה"
            className="w-14 h-14 -mt-6 rounded-full bg-[#00E676] text-[#080C14] shadow-[0_4px_20px_rgba(0,230,118,0.4)] flex items-center justify-center transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C14]"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </div>
    </nav>
  );
};
