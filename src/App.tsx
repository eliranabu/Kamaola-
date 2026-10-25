/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Purchase, UserSettings, ActiveTab, ToastNotification } from './types/index.ts';
import { storage, LoadIssue } from './services/storage.ts';
import {
  calculateMonthlyStats,
  calculate12MonthsStats,
  calculateYearlyStats,
  calculateWeeklyStats
} from './services/calculations.ts';
import { TopBar } from './components/TopBar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { AddPurchaseModal } from './components/AddPurchaseModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { SmartInsightsModal } from './components/SmartInsightsModal.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.tsx';
import { DataRecoveryBanner } from './components/DataRecoveryBanner.tsx';
import { DashboardView } from './views/DashboardView.tsx';

// Code Splitting (Recommendation 2: React.lazy for secondary views to optimize bundle and initial load)
const PurchasesView = lazy(() =>
  import('./views/PurchasesView.tsx').then((m) => ({ default: m.PurchasesView }))
);
const SavingsView = lazy(() =>
  import('./views/SavingsView.tsx').then((m) => ({ default: m.SavingsView }))
);
const SettingsView = lazy(() =>
  import('./views/SettingsView.tsx').then((m) => ({ default: m.SettingsView }))
);

const ViewLoadingFallback = () => (
  <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-[#AAB4C5]" role="status">
    <Loader2 className="w-8 h-8 animate-spin text-[#00E676]" aria-hidden="true" />
    <span>טוען מסך...</span>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [isDemoActive, setIsDemoActive] = useState<boolean>(settings.isDemoModeActive || false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [loadIssue, setLoadIssue] = useState<LoadIssue | null>(null);

  // Show accessible Toast feedback
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load purchases strictly respecting demo isolation
  const refreshData = useCallback(() => {
    const list = storage.getPurchases(isDemoActive);
    setPurchases(list);
    setLoadIssue(storage.getLoadIssue());
  }, [isDemoActive]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle settings update
  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    const res = storage.saveSettings(partial);
    if (res.success) {
      setSettings(res.data);
    } else {
      showToast(res.error, 'error');
    }
  };

  // Toggle demo sandbox mode
  const handleToggleDemoMode = () => {
    const nextState = !isDemoActive;
    setIsDemoActive(nextState);
    handleUpdateSettings({ isDemoModeActive: nextState });
    showToast(
      nextState ? 'מצב הדגמה הופעל (נתוני דוגמה בלבד)' : 'חזרת לנתוני הרכישות האמיתיים שלך',
      'info'
    );
  };

  // Central Calculation Single Source of Truth
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Previous month calculation
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentMonthStats = useMemo(() => {
    return calculateMonthlyStats(purchases, currentYear, currentMonth, now);
  }, [purchases, currentYear, currentMonth, now]);

  const prevMonthStats = useMemo(() => {
    return calculateMonthlyStats(purchases, prevYear, prevMonth, now);
  }, [purchases, prevYear, prevMonth, now]);

  const twelveMonthsData = useMemo(() => {
    return calculate12MonthsStats(purchases, now);
  }, [purchases, now]);

  const yearlyStats = useMemo(() => {
    return calculateYearlyStats(purchases, currentYear, now);
  }, [purchases, currentYear, now]);

  // Weekly Goal & Gamification
  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(purchases, now, settings.weeklyPackGoal);
  }, [purchases, now, settings.weeklyPackGoal]);

  const handleUpdateWeeklyGoal = (goal: number) => {
    handleUpdateSettings({ weeklyPackGoal: goal });
    showToast(`היעד השבועי עודכן ל-${goal} חפיסות`, 'success');
  };

  // Purchase Actions with StorageResult handling
  const handleSavePurchase = (
    data: Omit<Purchase, 'id' | 'totalPrice' | 'createdAt'> & { id?: string }
  ) => {
    const isEdit = !!data.id;
    const result = storage.savePurchase(data, isDemoActive);
    if (!result.success) {
      showToast(result.error, 'error');
      return result;
    }
    refreshData();
    setEditingPurchase(null);
    showToast(isEdit ? 'הרכישה עודכנה בהצלחה' : 'הרכישה נוספה ונשמרה בהצלחה', 'success');
    return result;
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      const result = storage.deletePurchase(deleteTarget.id, isDemoActive);
      if (result.success) {
        refreshData();
        showToast('הרכישה נמחקה בהצלחה', 'info');
        setDeleteTarget(null);
      } else {
        showToast(result.error, 'error');
      }
    }
  };

  const handleResetConfirm = () => {
    if (isDemoActive) {
      storage.resetDemoData();
      refreshData();
      setIsResetConfirmOpen(false);
      showToast('נתוני ההדגמה אופסו בהצלחה', 'info');
    } else {
      storage.resetAllUserData();
      refreshData();
      setIsResetConfirmOpen(false);
      setActiveTab('dashboard');
      showToast('כל הנתונים האישיים נמחקו בהצלחה', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-[#F5F7FA] flex flex-col font-['Heebo',sans-serif] selection:bg-[#00E676]/30 selection:text-[#00E676]" dir="rtl">
      {/* WCAG Skip-to-Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#00E676] focus:text-[#080C14] focus:font-bold focus:rounded-xl focus:shadow-xl focus:ring-2 focus:ring-white"
      >
        דלג לתוכן המרכזי
      </a>

      {/* Toast Notification Region */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Bar Header */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingPurchase(null);
          setIsAddModalOpen(true);
        }}
        settings={{ ...settings, isDemoModeActive: isDemoActive }}
        onToggleDemoMode={handleToggleDemoMode}
        onOpenInsights={() => setIsInsightsOpen(true)}
      />

      {loadIssue && (
        <DataRecoveryBanner
          issue={loadIssue}
          backups={storage.getCorruptBackups(loadIssue.isDemo)}
          onDismiss={() => setLoadIssue(null)}
        />
      )}

      {/* PWA In-App Install & Offline Connectivity Banner */}
      <PWAInstallBanner />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none">
        {activeTab === 'dashboard' && (
          <DashboardView
            purchases={purchases}
            currentMonthStats={currentMonthStats}
            prevMonthStats={prevMonthStats}
            twelveMonthsData={twelveMonthsData}
            yearlyStats={yearlyStats}
            weeklyStats={weeklyStats}
            settings={settings}
            onOpenAddModal={() => {
              setEditingPurchase(null);
              setIsAddModalOpen(true);
            }}
            onNavigateToPurchases={() => setActiveTab('purchases')}
            onNavigateToSavings={() => setActiveTab('savings')}
            onUpdateWeeklyGoal={handleUpdateWeeklyGoal}
          />
        )}

        <Suspense fallback={<ViewLoadingFallback />}>
          {activeTab === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              settings={settings}
              onEditPurchase={(p) => {
                setEditingPurchase(p);
                setIsAddModalOpen(true);
              }}
              onDeletePurchase={(p) => setDeleteTarget(p)}
              onOpenAddModal={() => {
                setEditingPurchase(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsView
              purchases={purchases}
              currentMonthStats={currentMonthStats}
              twelveMonthsData={twelveMonthsData}
              settings={settings}
              onOpenAddModal={() => {
                setEditingPurchase(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetAllData={() => setIsResetConfirmOpen(true)}
              onRefreshData={refreshData}
              isDemoActive={isDemoActive}
              onToggleDemoMode={handleToggleDemoMode}
              onShowToast={showToast}
            />
          )}
        </Suspense>
      </main>

      {/* Floating Action Button (FAB) on Mobile - Thumb Zone Friendly */}
      <div className="md:hidden fixed bottom-24 left-4 z-30">
        <button
          onClick={() => {
            setEditingPurchase(null);
            setIsAddModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-[#00E676] text-[#080C14] shadow-[0_4px_20px_rgba(0,230,118,0.4)] flex items-center justify-center transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C14]"
          aria-label="הוספת רכישה חדשה"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <AddPurchaseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPurchase(null);
        }}
        onSave={handleSavePurchase}
        initialPurchase={editingPurchase}
        settings={settings}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="מחיקת רכישה"
        message={`האם אתם בטוחים שברצונכם למחוק את הרכישה של ${deleteTarget?.brand || ''} בסך ${deleteTarget?.totalPrice || 0} ${settings.currency}?`}
        confirmLabel="מחק רכישה"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConfirmModal
        isOpen={isResetConfirmOpen}
        title={isDemoActive ? "איפוס נתוני הדגמה (Demo Sandbox)" : "איפוס כל הרכישות שלי"}
        message={
          isDemoActive
            ? "פעולה זו תאפס את נתוני ההדגמה בלבד. הרכישות וההגדרות האמיתיות שלכם שמורות לחלוטין ולעולם לא יושפעו כאן."
            : "פעולה זו תמחק לצמיתות את כל היסטוריית הרכישות וההגדרות האמיתיות שלכם מהמכשיר. לא ניתן לשחזר את הנתונים לאחר מכן ללא קובץ גיבוי שהורדתם מראש."
        }
        confirmLabel={isDemoActive ? "כן, אפס נתוני הדגמה" : "כן, אפס את כל הרכישות שלי"}
        isDestructive={!isDemoActive}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <SmartInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        currentMonthStats={currentMonthStats}
        yearlyStats={yearlyStats}
        settings={settings}
      />
    </div>
  );
}
