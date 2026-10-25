import React, { useRef, useState } from 'react';
import { Upload, Undo2, LifeBuoy } from 'lucide-react';
import { ImportMode, ImportPreview, storage } from '../services/storage.ts';
import { MAX_IMPORT_CHARS } from '../services/storage/transfer.ts';
import { downloadText } from '../services/download.ts';

interface ImportSectionProps {
  isDemoActive: boolean;
  onRefreshData: () => void;
  onStatus: (type: 'success' | 'error', message: string) => void;
}

const cardBtn =
  'w-full h-full p-4 bg-[#080C14] hover:bg-[#182542] border border-slate-800 hover:border-slate-700 rounded-xl text-right transition-all min-h-[48px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#00E676] disabled:opacity-50 disabled:cursor-not-allowed';

/** Safe import: preview -> explicit confirmation (merge/replace) -> automatic backup -> undo. */
export const ImportSection: React.FC<ImportSectionProps> = ({ isDemoActive, onRefreshData, onStatus }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [hasBackup, setHasBackup] = useState(() => storage.hasImportBackup());
  const corrupt = storage.getCorruptBackups(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_CHARS) return onStatus('error', 'הקובץ גדול מדי לייבוא (מעל 5MB)');

    const reader = new FileReader();
    reader.onerror = () => onStatus('error', 'לא ניתן היה לקרוא את הקובץ שנבחר');
    reader.onload = (event) => {
      const result = storage.previewImport(String(event.target?.result ?? ''));
      if (!result.success) return onStatus('error', result.error || 'הקובץ אינו קובץ גיבוי תקין');
      setMode('merge');
      setPreview(result);
    };
    reader.readAsText(file);
  };

  const confirm = () => {
    if (!preview) return;
    const res = storage.applyImport(preview.purchases, mode);
    setPreview(null);
    if (!res.success) return onStatus('error', res.error);
    setHasBackup(true);
    onRefreshData();
    onStatus('success', `הייבוא הושלם: נוספו ${res.data.added} רכישות, סה״כ ${res.data.count} רכישות. אפשר לבטל את הייבוא.`);
  };

  const undo = () => {
    const res = storage.undoLastImport();
    if (!res.success) return onStatus('error', res.error);
    setHasBackup(false);
    onRefreshData();
    onStatus('success', 'הייבוא האחרון בוטל והנתונים הקודמים שוחזרו.');
  };

  return (
    <div className="space-y-2">
      <input type="file" ref={fileInputRef} accept=".json" onChange={handleFile} aria-label="בחירת קובץ גיבוי JSON לשחזור" className="hidden" />
      <button onClick={() => fileInputRef.current?.click()} disabled={isDemoActive} className={cardBtn}>
        <div className="flex items-center justify-between w-full">
          <span className="text-xs sm:text-sm font-bold text-[#F5F7FA]">שחזור מגיבוי JSON</span>
          <Upload className="w-5 h-5 text-purple-400" aria-hidden="true" />
        </div>
        <span className="text-xs text-[#AAB4C5] mt-2 block leading-relaxed">
          {isDemoActive ? 'לא זמין במצב הדגמה — חזרו לנתונים שלכם כדי לשחזר' : 'תצוגה מקדימה ואישור לפני כל שינוי'}
        </span>
      </button>

      {hasBackup && !isDemoActive && (
        <button onClick={undo} className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-amber-200 bg-amber-500/15 border border-amber-500/40 rounded-xl px-3 py-2.5 min-h-[44px]">
          <Undo2 className="w-4 h-4" aria-hidden="true" />
          בטל ייבוא אחרון ושחזר את הנתונים הקודמים
        </button>
      )}

      {corrupt.length > 0 && (
        <button
          onClick={() => downloadText('kama-ze-ole-recovery.json', corrupt[corrupt.length - 1].raw)}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-rose-200 bg-rose-500/15 border border-rose-500/40 rounded-xl px-3 py-2.5 min-h-[44px]"
        >
          <LifeBuoy className="w-4 h-4" aria-hidden="true" />
          הורדת עותק שחזור של נתונים פגומים ({corrupt.length})
        </button>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" dir="rtl" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="import-title" className="w-full max-w-md bg-[#141E34] border border-slate-700 rounded-2xl p-6 space-y-4">
            <h3 id="import-title" className="text-base font-bold text-[#F5F7FA]">אישור שחזור מגיבוי</h3>
            <p className="text-sm text-[#AAB4C5] leading-relaxed">
              בקובץ נמצאו <strong className="text-[#F5F7FA]">{preview.purchases.length}</strong> רכישות תקינות
              {preview.skipped > 0 && ` (${preview.skipped} פריטים פגומים דולגו)`}. כרגע שמורות אצלכם {preview.existingCount} רכישות.
            </p>
            <fieldset className="space-y-2">
              <legend className="sr-only">אופן השחזור</legend>
              <label className="flex items-start gap-2 text-sm text-[#F5F7FA] min-h-[44px]">
                <input type="radio" name="import-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} className="mt-1" />
                <span><strong>מיזוג (מומלץ):</strong> מוסיף {preview.newCount} רכישות חדשות ושומר את כל הקיימות{preview.duplicateCount > 0 && ` (${preview.duplicateCount} כבר קיימות)`}.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-[#F5F7FA] min-h-[44px]">
                <input type="radio" name="import-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-1" />
                <span><strong>החלפה:</strong> מוחק את {preview.existingCount} הרכישות הקיימות ומשאיר רק את אלה שבקובץ.</span>
              </label>
            </fieldset>
            <p className="text-xs text-[#AAB4C5]">לפני השינוי נשמר גיבוי אוטומטי, ואפשר לבטל את הייבוא.</p>
            <div className="flex gap-3">
              <button autoFocus onClick={() => setPreview(null)} className="flex-1 py-3 bg-slate-800 text-[#F5F7FA] text-sm font-semibold rounded-xl min-h-[48px]">ביטול</button>
              <button onClick={confirm} className="flex-1 py-3 bg-[#00E676] text-[#080C14] text-sm font-bold rounded-xl min-h-[48px]">
                {mode === 'merge' ? 'מזג רכישות' : 'החלף את כל הנתונים'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
