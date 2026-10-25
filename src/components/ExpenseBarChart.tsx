import React, { useState } from 'react';
import { MonthlySummary, UserSettings } from '../types/index.ts';
import { formatCurrency } from '../services/calculations.ts';
import { TrendingUp, BarChart3, Table as TableIcon } from 'lucide-react';

interface ExpenseBarChartProps {
  monthlyData: MonthlySummary[];
  settings: UserSettings;
  onSelectMonth?: (monthKey: string) => void;
}

export const ExpenseBarChart: React.FC<ExpenseBarChartProps> = ({
  monthlyData,
  settings,
  onSelectMonth
}) => {
  // Find highest spending month for proportional bar height
  const maxSpend = Math.max(...monthlyData.map((m) => m.totalSpent), 100);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(
    monthlyData.find((m) => m.isCurrentMonth)?.monthKey || null
  );
  const [showTableView, setShowTableView] = useState(false);

  const selectedMonth =
    monthlyData.find((m) => m.monthKey === selectedMonthKey) || monthlyData[monthlyData.length - 1];

  return (
    <section
      aria-label="תרשים עמודות הוצאות חודשיות"
      className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between"
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00E676]" aria-hidden="true" />
            <h2 className="text-sm sm:text-base font-bold text-[#F5F7FA]">
              הוצאות חודשיות לאורך 12 חודשים
            </h2>
          </div>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            בחירה בחודש מציגה את סיכום ההוצאה והחפיסות בפועל
          </p>
        </div>

        {/* Selected Month Quick Snapshot & Table Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedMonth && (
            <div
              role="status"
              aria-live="polite"
              className="bg-[#080C14] px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs"
            >
              <span className="text-[#AAB4C5]">{selectedMonth.monthNameHe}:</span>
              {selectedMonth.hasData ? (
                <span className="font-bold text-[#00E676] font-mono tabular-nums">
                  {formatCurrency(selectedMonth.totalSpent, settings.currency)} ({selectedMonth.totalPacks} חפיסות)
                </span>
              ) : (
                <span className="text-[#AAB4C5] italic">ללא רכישות</span>
              )}
            </div>
          )}

          {/* Toggle Accessible Table View */}
          <button
            type="button"
            onClick={() => setShowTableView(!showTableView)}
            aria-pressed={showTableView}
            className="text-xs px-2.5 py-1.5 bg-slate-800/70 hover:bg-slate-700 text-[#AAB4C5] hover:text-[#F5F7FA] rounded-xl flex items-center gap-1.5 min-h-[36px] transition-colors focus-visible:ring-2 focus-visible:ring-[#00E676]"
            title={showTableView ? 'חזרה לתצוגת גרף עמודות' : 'תצוגת טבלה נגישה'}
          >
            {showTableView ? (
              <>
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">תצוגת גרף</span>
              </>
            ) : (
              <>
                <TableIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">תצוגת טבלה</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showTableView ? (
        /* Accessible Data Table View */
        <div className="pt-4 overflow-x-auto">
          <table className="w-full text-right text-xs text-[#F5F7FA]">
            <thead>
              <tr className="border-b border-slate-800 text-[#AAB4C5]">
                <th className="py-2.5 px-3">חודש</th>
                <th className="py-2.5 px-3">סכום בפועל</th>
                <th className="py-2.5 px-3">חפיסות</th>
                <th className="py-2.5 px-3">רכישות</th>
                <th className="py-2.5 px-3">ממוצע יומי</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {monthlyData.map((m) => (
                <tr
                  key={m.monthKey}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    m.monthKey === selectedMonthKey ? 'bg-[#00E676]/10 font-bold' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-sans font-medium">
                    {m.monthNameHe} {m.isCurrentMonth ? '(חודש נוכחי)' : ''}
                  </td>
                  <td className="py-2 px-3 text-[#00E676]">
                    {formatCurrency(m.hasData ? m.totalSpent : 0, settings.currency)}
                  </td>
                  <td className="py-2 px-3">{m.totalPacks}</td>
                  <td className="py-2 px-3">{m.purchaseCount}</td>
                  <td className="py-2 px-3">
                    {m.hasData ? `${m.dailyAverage} ${settings.currency}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Interactive Bar Chart */
        <div className="pt-6 pb-2 overflow-x-auto">
          <div className="h-44 sm:h-52 min-w-[280px] flex items-end justify-between gap-1 sm:gap-2 px-1">
            {monthlyData.map((item) => {
              const heightPercent =
                item.totalSpent > 0 ? Math.max(12, Math.round((item.totalSpent / maxSpend) * 100)) : 4;
              const isSelected = item.monthKey === selectedMonthKey;

              return (
                <button
                  key={item.monthKey}
                  type="button"
                  onClick={() => {
                    setSelectedMonthKey(item.monthKey);
                    if (onSelectMonth) onSelectMonth(item.monthKey);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${item.monthNameHe}: ${
                    item.hasData
                      ? `${formatCurrency(item.totalSpent, settings.currency)}, ${item.totalPacks} חפיסות`
                      : 'אין נתונים'
                  }`}
                  className="group flex-1 flex flex-col items-center h-full justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] rounded-lg transition-transform"
                >
                  {/* Amount label on hover or selected */}
                  <div
                    className={`text-[10px] sm:text-xs font-mono font-bold mb-1.5 transition-opacity tabular-nums whitespace-nowrap ${
                      isSelected ? 'text-[#00E676] opacity-100' : 'text-[#AAB4C5] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {item.hasData ? `${Math.round(item.totalSpent)}` : ''}
                  </div>

                  {/* Visual Bar with WCAG non-color contrast indicator */}
                  <div className="w-full max-w-[26px] sm:max-w-[32px] h-full flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-200 ${
                        item.hasData
                          ? isSelected
                            ? 'bg-[#00E676] ring-2 ring-white/60 shadow-[0_0_12px_rgba(0,230,118,0.5)]'
                            : item.isCurrentMonth
                            ? 'bg-gradient-to-t from-[#00E676]/70 to-[#00E676]'
                            : 'bg-slate-400 hover:bg-[#00E676]/80'
                          : isSelected
                          ? 'bg-slate-700/80 border border-dashed border-slate-500'
                          : 'bg-slate-800/40 hover:bg-slate-700/50'
                      }`}
                    />
                  </div>

                  {/* X Axis Month and Year Labels */}
                  <span
                    className={`text-[10px] sm:text-[11px] mt-2 tracking-tight transition-colors ${
                      isSelected
                        ? 'font-bold text-[#00E676]'
                        : item.isCurrentMonth
                        ? 'font-bold text-[#F5F7FA]'
                        : 'text-[#AAB4C5] group-hover:text-[#F5F7FA]'
                    }`}
                  >
                    {item.monthNameHe.split(' ')[0].slice(0, 3)}
                  </span>
                  <span className="text-[9px] text-[#AAB4C5]/80 font-mono">
                    {item.year.toString().slice(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Footer Legend with Shapes and Contrast (Not color alone) */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#AAB4C5]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#00E676] ring-1 ring-white/60" aria-hidden="true" />
            <span>חודש נבחר / נוכחי</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" aria-hidden="true" />
            <span>הוצאה בפועל</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-dashed border-slate-600" aria-hidden="true" />
            <span>ללא רכישות</span>
          </div>
        </div>
        <span className="text-slate-400 hidden sm:inline">נתונים אמיתיים מתוך תיעוד הרכישות</span>
      </div>
    </section>
  );
};
