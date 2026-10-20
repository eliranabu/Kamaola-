import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Database,
  Coins
} from 'lucide-react';
import { UserSettings } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onResetAllData: () => void;
  onRefreshData: () => void;
  isDemoActive: boolean;
  onToggleDemoMode: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onRefreshData,
  isDemoActive,
  onToggleDemoMode,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // CSV Export
  const handleExportCsv = () => {
    try {
      const csvData = storage.exportToCsv(isDemoActive);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `kama-ze-ole-purchases-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (onShowToast) {
        onShowToast('קובץ Excel / CSV הורד בהצלחה', 'success');
      }
    } catch (e: any) {
      setImportStatus({ type: 'error', message: 'שגיאה בייצוא קובץ CSV' });
      if (onShowToast) onShowToast('שגיאה בייצוא קובץ CSV', 'error');
    }
  };

  // JSON Backup Export
  const handleExportJson = () => {
    try {
      const jsonData = storage.exportToJson(isDemoActive);
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `kama-ze-ole-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (onShowToast) {
        onShowToast('קובץ גיבוי JSON הורד בהצלחה', 'success');
      }
    } catch (e: any) {
      setImportStatus({ type: 'error', message: 'שגיאה ביצירת קובץ גיבוי' });
      if (onShowToast) onShowToast('שגיאה ביצירת קובץ גיבוי', 'error');
    }
  };

  // JSON Import Trigger
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = storage.importFromJson(content);
      if (result.success) {
        const msg = `השחזור הושלם בהצלחה! יובאו ${result.count} רכישות תקינות.`;
        setImportStatus({ type: 'success', message: msg });
        if (onShowToast) onShowToast(msg, 'success');
        onRefreshData();
      } else {
        const err = result.error || 'שגיאה בייבוא הקובץ. ודאו שמדובר בקובץ גיבוי תקין של האפליקציה.';
        setImportStatus({ type: 'error', message: err });
        if (onShowToast) onShowToast(err, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Settings Header */}
      <section aria-labelledby="settings-heading" className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h1 id="settings-heading" className="text-lg sm:text-xl font-bold text-[#F5F7FA]">
          הגדרות וניהול נתונים
        </h1>
        <p className="text-xs text-[#AAB4C5] mt-0.5">
          התאמת מטבע, שמירת גיבויים מקומיים, שחזור והגנה על הפרטיות שלך
        </p>
      </section>

      {/* Currency Preferences */}
      <section aria-labelledby="currency-heading" className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-[#00E676]" aria-hidden="true" />
          <h2 id="currency-heading" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
            מטבע ראשי
          </h2>
        </div>
        <p className="text-xs text-[#AAB4C5] mb-4">
          סמל המטבע שיוצג בכל המסכים, הגרפים והדוחות באפליקציה
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {[
            { id: '₪', label: 'שקל (₪)' },
            { id: '$', label: 'דולר ($)' },
            { id: '€', label: 'אירו (€)' }
          ].map((curr) => {
            const isSelected = settings.currency === curr.id;
            return (
              <button
                key={curr.id}
                onClick={() => {
                  onUpdateSettings({ currency: curr.id as any });
                  if (onShowToast) onShowToast(`המטבע עודכן ל-${curr.label}`, 'info');
                }}
                aria-pressed={isSelected}
                className={`py-3 px-3 rounded-xl border text-center transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#00E676] ${
                  isSelected
                    ? 'bg-[#00E676]/15 border-[#00E676] text-[#00E676] font-bold shadow-sm'
                    : 'bg-[#080C14] border-slate-800 text-[#AAB4C5] hover:text-[#F5F7FA]'
                }`}
              >
                <div className="text-lg font-black font-mono">{curr.id}</div>
                <div className="text-xs mt-0.5 font-medium">{curr.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Local Storage & Privacy Notice */}
      <section aria-labelledby="privacy-heading" className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#00E676]" aria-hidden="true" />
          <h2 id="privacy-heading" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
            אחסון מקומי ופרטיות מידע
          </h2>
        </div>

        <div className="bg-[#080C14] border border-slate-800 p-4 rounded-xl text-xs text-[#AAB4C5] space-y-2.5 leading-relaxed">
          <p>
            <strong className="text-[#F5F7FA]">איפה הנתונים נשמרים?</strong> הרכישות וההגדרות שלך נשמרות אך ורק בזיכרון המקומי של הדפדפן במכשיר זה (Local Storage). שום מידע כספי אינו נשלח לשרת חיצוני.
          </p>
          <p>
            <strong className="text-[#F5F7FA]">סנכרון בין מכשירים:</strong> בגרסה זו, הנתונים <em>אינם</em> מסתנכרנים אוטומטית בין טלפונים או מחשבים שונים.
          </p>
          <p className="text-amber-300 font-medium">
            <strong>חשוב לשים לב:</strong> ניקוי היסטוריית גלישה או מחיקת נתוני אתר (Site Data) בהגדרות הדפדפן עלולים למחוק את הרכישות. מומלץ להוריד קובץ גיבוי תקופתי למחשב או לנייד.
          </p>
        </div>
      </section>

      {/* Export & Import Management */}
      <section aria-labelledby="backup-heading" className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div>
          <h2 id="backup-heading" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
            גיבוי, ייצוא ושחזור נתונים
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            הורידו את כל נתוני הרכישות לאקסל או שמרו קובץ גיבוי שלם לשחזור בכל עת
          </p>
        </div>

        {importStatus.type && (
          <div
            role={importStatus.type === 'error' ? 'alert' : 'status'}
            className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 ${
              importStatus.type === 'success'
                ? 'bg-[#00E676]/10 border-[#00E676]/40 text-[#00E676]'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            className="p-4 bg-[#080C14] hover:bg-[#182542] border border-slate-800 hover:border-slate-700 rounded-xl text-right transition-all min-h-[48px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#00E676]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FA]">ייצוא ל-Excel / CSV</span>
              <FileSpreadsheet className="w-5 h-5 text-[#00E676]" aria-hidden="true" />
            </div>
            <span className="text-xs text-[#AAB4C5] mt-2 block leading-relaxed">
              טבלה מסודרת עם תמיכה מלאה בעברית (UTF-8 BOM)
            </span>
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJson}
            className="p-4 bg-[#080C14] hover:bg-[#182542] border border-slate-800 hover:border-slate-700 rounded-xl text-right transition-all min-h-[48px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#00E676]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FA]">הורדת גיבוי JSON</span>
              <FileCode className="w-5 h-5 text-blue-400" aria-hidden="true" />
            </div>
            <span className="text-xs text-[#AAB4C5] mt-2 block leading-relaxed">
              קובץ גיבוי שלם המכיל את כל ההיסטוריה לשחזור
            </span>
          </button>

          {/* JSON Import */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              aria-label="בחירת קובץ גיבוי JSON לשחזור"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-4 bg-[#080C14] hover:bg-[#182542] border border-slate-800 hover:border-slate-700 rounded-xl text-right transition-all min-h-[48px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#00E676]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-bold text-[#F5F7FA]">שחזור מגיבוי JSON</span>
                <Upload className="w-5 h-5 text-purple-400" aria-hidden="true" />
              </div>
              <span className="text-xs text-[#AAB4C5] mt-2 block leading-relaxed">
                טעינת נתונים שנשמרו מקובץ גיבוי קיים
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Demo Sandbox Control */}
      <section aria-labelledby="demo-heading" className="bg-[#141E34] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <h2 id="demo-heading" className="text-sm sm:text-base font-bold text-[#F5F7FA]">
              מצב הדגמה (Demo Sandbox)
            </h2>
          </div>
          <p className="text-xs text-[#AAB4C5] mt-1 max-w-lg leading-relaxed">
            מצב מבודד לחלוטין המאפשר להתנסות בכל הגרפים והחישובים עם נתוני דוגמה ישראליים. נתוני ההדגמה אינם מתערבבים לעולם עם הרכישות האמיתיות שלך.
          </p>
        </div>

        <button
          onClick={onToggleDemoMode}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] whitespace-nowrap focus-visible:ring-2 ${
            isDemoActive
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md focus-visible:ring-amber-300'
              : 'bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] focus-visible:ring-[#00E676]'
          }`}
        >
          {isDemoActive ? 'חזרה לרכישות האמיתיות שלי' : 'הפעלת מצב הדגמה'}
        </button>
      </section>

      {/* Reset Card: Clearly separated between Demo mode and Real User mode */}
      {isDemoActive ? (
        <section aria-labelledby="reset-demo-heading" className="bg-[#141E34] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 id="reset-demo-heading" className="text-sm sm:text-base font-bold text-amber-300">
                איפוס נתוני הדגמה (Demo Sandbox בלבד)
              </h2>
              <p className="text-xs text-[#AAB4C5] mt-1 leading-relaxed">
                מצב הדגמה פעיל כרגע. פעולה זו תאפס אך ורק את רכישות הדוגמה הזמניות. הנתונים וההגדרות האמיתיים שלך בטוחים לחלוטין.
              </p>

              <button
                onClick={onResetAllData}
                className="mt-4 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs sm:text-sm font-bold rounded-xl transition-colors min-h-[44px] flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>איפוס נתוני הדגמה</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section aria-labelledby="danger-zone-heading" className="bg-[#141E34] border border-rose-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 id="danger-zone-heading" className="text-sm sm:text-base font-bold text-rose-300">
                אזור סכנה: מחיקת כל הרכישות שלי
              </h2>
              <p className="text-xs text-[#AAB4C5] mt-1 leading-relaxed">
                פעולה זו תמחק לצמיתות את כל הרכישות וההגדרות האמיתיות שנשמרו במכשיר. לא ניתן לשחזר את הנתונים לאחר מכן ללא קובץ גיבוי שהורדת מראש.
              </p>

              <button
                onClick={onResetAllData}
                className="mt-4 px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs sm:text-sm font-bold rounded-xl transition-colors min-h-[44px] flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>איפוס ומחיקת כל הנתונים שלי</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
