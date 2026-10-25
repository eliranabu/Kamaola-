import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { LoadIssue } from '../services/storage.ts';
import { CorruptBackup } from '../services/storage/backups.ts';
import { downloadText } from '../services/download.ts';

interface DataRecoveryBannerProps {
  issue: LoadIssue;
  backups: CorruptBackup[];
  onDismiss: () => void;
}

export const DataRecoveryBanner: React.FC<DataRecoveryBannerProps> = ({ issue, backups, onDismiss }) => {
  const latest = backups[backups.length - 1];
  const description =
    issue.reason === 'dropped_items'
      ? `${issue.dropped} רכישות שמורות היו פגומות ולא נטענו. שאר הרכישות נטענו כרגיל.`
      : 'הנתונים השמורים במכשיר פגומים ולא ניתן היה לקרוא אותם.';

  return (
    <div role="alert" className="bg-rose-500/15 border-b border-rose-500/40 px-4 py-3 text-xs sm:text-sm text-rose-100">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <p>
            <strong>{description}</strong>{' '}
            {issue.backupSaved && latest
              ? 'שמרנו עותק מלא של הנתונים המקוריים כדי שלא יאבדו.'
              : 'לא הצלחנו לשמור עותק של הנתונים המקוריים (אין מקום באחסון).'}
          </p>
          {latest && (
            <button
              onClick={() =>
                downloadText(`kama-ze-ole-recovery-${new Date(latest.at).toISOString().slice(0, 10)}.json`, latest.raw)
              }
              className="px-3 py-2 bg-rose-500/30 hover:bg-rose-500/40 border border-rose-400/50 rounded-lg font-semibold min-h-[44px]"
            >
              הורדת עותק שחזור
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="סגירת ההודעה"
          className="w-11 h-11 -m-2 flex items-center justify-center rounded-lg hover:bg-white/10 shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
