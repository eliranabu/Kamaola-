import React from 'react';
import { LayoutDashboard, Receipt, PiggyBank, Settings } from 'lucide-react';
import { ActiveTab } from '../types/index.ts';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'סקירה', icon: LayoutDashboard },
    { id: 'purchases' as ActiveTab, label: 'רכישות', icon: Receipt },
    { id: 'savings' as ActiveTab, label: 'חיסכון', icon: PiggyBank },
    { id: 'settings' as ActiveTab, label: 'הגדרות', icon: Settings }
  ];

  return (
    <nav
      aria-label="ניווט תחתון למובייל"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-lg border-t border-[#141E34] px-2 pb-safe"
    >
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
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
              <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="absolute top-1 w-8 h-0.5 bg-[#00E676] rounded-full shadow-[0_0_8px_#00E676]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
