import React, { useState, useMemo } from 'react';
import {
  Search,
  Receipt,
  Edit2,
  Trash2,
  MapPin,
  Plus,
  RotateCcw
} from 'lucide-react';
import { Purchase, UserSettings } from '../types/index.ts';
import { formatCurrency, formatCurrencyExact, HEBREW_MONTHS } from '../services/calculations.ts';

interface PurchasesViewProps {
  purchases: Purchase[];
  settings: UserSettings;
  onEditPurchase: (purchase: Purchase) => void;
  onDeletePurchase: (purchase: Purchase) => void;
  onOpenAddModal: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  settings,
  onEditPurchase,
  onDeletePurchase,
  onOpenAddModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Extract distinct available months from purchases
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.date && p.date.length >= 7) {
        set.add(p.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [purchases]);

  // Extract distinct available brands from purchases
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [purchases]);

  // Filtered and sorted purchases (newest to oldest)
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((p) => {
        // Month filter
        if (selectedMonth !== 'all') {
          if (!p.date.startsWith(selectedMonth)) return false;
        }
        // Brand filter
        if (selectedBrand !== 'all') {
          if (p.brand !== selectedBrand) return false;
        }
        // Search query
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const brandMatch = p.brand.toLowerCase().includes(q);
          const noteMatch = p.note ? p.note.toLowerCase().includes(q) : false;
          const locMatch = p.location ? p.location.toLowerCase().includes(q) : false;
          if (!brandMatch && !noteMatch && !locMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [purchases, selectedMonth, selectedBrand, searchQuery]);

  // Summary of the current filter selection
  const periodSummary = useMemo(() => {
    const totalSpent = filteredPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const totalPacks = filteredPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const count = filteredPurchases.length;
    const avgPerPack = totalPacks > 0 ? Math.round((totalSpent / totalPacks) * 100) / 100 : 0;
    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalPacks,
      count,
      avgPerPack
    };
  }, [filteredPurchases]);


  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    const monthName = HEBREW_MONTHS[m - 1] || '';
    return `${monthName} ${y}`;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedBrand('all');
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Page Header */}
      <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#F5F7FA]">היסטוריית רכישות</h1>
            <p className="text-xs text-[#AAB4C5] mt-0.5">
              מעקב מלא, חיפוש, סינון לפי חודש ומותג ועריכת נתונים
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="self-start sm:self-auto px-4 py-2 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
          >
            <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>הוספת רכישה</span>
          </button>
        </div>

        {/* Filters and Search Bar with accessible labels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          {/* Search box */}
          <div>
            <label htmlFor="search-purchases" className="sr-only">
              חיפוש רכישות
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#AAB4C5] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="search-purchases"
                type="text"
                placeholder="חיפוש לפי מותג, מקום או הערה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] text-xs sm:text-sm rounded-xl pr-10 pl-3 py-2.5 outline-none transition-colors min-h-[44px]"
              />
            </div>
          </div>

          {/* Month Filter */}
          <div>
            <label htmlFor="filter-month" className="sr-only">
              סינון לפי חודש
            </label>
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors min-h-[44px]"
            >
              <option value="all">כל החודשים ({purchases.length} רכישות)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label htmlFor="filter-brand" className="sr-only">
              סינון לפי מותג
            </label>
            <select
              id="filter-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors min-h-[44px]"
            >
              <option value="all">כל המותגים</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 bg-[#080C14]/50 p-3.5 rounded-xl">
          <div>
            <span className="text-[11px] text-[#AAB4C5] block">הוצאה בתקופה</span>
            <span className="text-base sm:text-xl font-bold text-[#00E676] font-mono tabular-nums block mt-0.5">
              {formatCurrency(periodSummary.totalSpent, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#AAB4C5] block">מספר רכישות</span>
            <span className="text-base sm:text-xl font-bold text-[#F5F7FA] font-mono tabular-nums block mt-0.5">
              {periodSummary.count}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#AAB4C5] block">סה״כ חפיסות</span>
            <span className="text-base sm:text-xl font-bold text-[#F5F7FA] font-mono tabular-nums block mt-0.5">
              {periodSummary.totalPacks}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#AAB4C5] block">מחיר ממוצע לחפיסה</span>
            <span className="text-base sm:text-xl font-bold text-[#F5F7FA] font-mono tabular-nums block mt-0.5">
              {formatCurrencyExact(periodSummary.avgPerPack, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Purchases List / Explicit Distinct Empty States */}
      {purchases.length === 0 ? (
        /* Empty State 1: Fresh user, no purchases at all */
        <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-[#AAB4C5] mb-3">
            <Receipt className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#F5F7FA]">
            עדיין לא נרשמו רכישות באפליקציה
          </h2>
          <p className="text-xs sm:text-sm text-[#AAB4C5] mt-1.5 max-w-sm mx-auto leading-relaxed">
            הזינו את הרכישה הראשונה שלכם בלחיצה על הכפתור למטה כדי להתחיל לעקוב אחר ההוצאות.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-5 px-6 py-3 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md min-h-[44px] inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#00E676]"
          >
            <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>הוספת רכישה ראשונה</span>
          </button>
        </div>
      ) : filteredPurchases.length === 0 ? (
        /* Empty State 2: Filters active, but no matches found */
        <div className="bg-[#141E34] border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-[#AAB4C5] mb-3">
            <Search className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#F5F7FA]">
            לא נמצאו רכישות התואמות לחיפוש
          </h2>
          <p className="text-xs sm:text-sm text-[#AAB4C5] mt-1.5 max-w-sm mx-auto leading-relaxed">
            נסו לשנות את מילות החיפוש או לאפס את הסינונים לפי חודש ומותג.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-[#00E676] text-xs sm:text-sm font-bold rounded-xl transition-colors min-h-[44px] inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#00E676]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>איפוס כל הסינונים</span>
          </button>
        </div>
      ) : (
        <section aria-label="רשימת רכישות מפורטת" className="space-y-3">
          {filteredPurchases.map((purchase) => (
            <article
              key={purchase.id}
              className="bg-[#141E34] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Main Information */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-base font-bold text-[#F5F7FA]">{purchase.brand}</h2>
                  <div className="text-xs text-[#AAB4C5] flex items-center gap-2 font-mono">
                    <span>{purchase.date}</span>
                    {purchase.time && <span>· {purchase.time}</span>}
                  </div>
                </div>

                {/* Subtitle Details */}
                <div className="text-xs text-[#AAB4C5] flex items-center gap-3 flex-wrap">
                  <span>
                    {purchase.quantity} חפיסות × {formatCurrencyExact(purchase.pricePerPack, settings.currency)}
                  </span>
                  {purchase.location && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      {purchase.location}
                    </span>
                  )}
                </div>

                {purchase.note && (
                  <p className="text-xs text-slate-300 bg-[#080C14]/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                    {purchase.note}
                  </p>
                )}
              </div>

              {/* Total & Action Buttons with SAFE spacing */}
              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div className="text-right">
                  <div className="text-[11px] text-[#AAB4C5]">סך הרכישה</div>
                  <div className="text-xl sm:text-2xl font-black text-[#00E676] font-mono tabular-nums">
                    {formatCurrency(purchase.totalPrice, settings.currency)}
                  </div>
                </div>

                {/* Separate and well-spaced action touch targets (prevent dangerous mis-taps!) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditPurchase(purchase)}
                    className="w-11 h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[#F5F7FA] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
                    aria-label={`עריכת רכישה של ${purchase.brand} מתאריך ${purchase.date}`}
                    title="עריכת רכישה"
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onDeletePurchase(purchase)}
                    className="w-11 h-11 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/40 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-rose-400"
                    aria-label={`מחיקת רכישה של ${purchase.brand} מתאריך ${purchase.date}`}
                    title="מחיקת רכישה"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};
