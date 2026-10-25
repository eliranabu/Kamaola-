import React, { useState } from 'react';
import { Download, Share, X, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../services/usePWAInstall.ts';
import { useOnlineStatus } from '../services/useOnlineStatus.ts';
import { Modal } from './Modal.tsx';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed as standalone PWA or user dismissed this session
  if (isInstalled || isDismissed) {
    if (!isOnline) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>מצב לא מקוון — הנתונים נשמרים ומחושבים מקומית במכשיר ללא תלות ברשת.</span>
        </div>
      );
    }
    return null;
  }

  // If not online, show offline state
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2"
      >
        <WifiOff className="w-4 h-4 text-amber-400" aria-hidden="true" />
        <span>מצב לא מקוון — הנתונים נשמרים ומחושבים מקומית במכשיר ללא תלות ברשת.</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <aside
        aria-label="התקנת אפליקציה"
        className="bg-[#141E34] border-b border-[#00E676]/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#00E676]/20 flex items-center justify-center text-[#00E676] shrink-0" aria-hidden="true">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[#F5F7FA] font-medium truncate">
            התקינו את האפליקציה במסך הבית לגישה מהירה וחישוב ללא אינטרנט
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={install}
            className="px-3 py-1.5 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] font-bold rounded-lg transition-colors min-h-[36px] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            <span>התקנה</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-[#AAB4C5] flex items-center justify-center min-h-[36px] min-w-[36px]"
            aria-label="סגירת באנר התקנה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <aside
          aria-label="התקנה ב-iOS"
          className="bg-[#141E34] border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Share className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
            <span className="text-[#F5F7FA] font-medium truncate">
              התקנה באייפון/אייפד: הוספה קלה למסך הבית
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[#00E676] font-semibold rounded-lg border border-[#00E676]/30 transition-colors min-h-[36px]"
            >
              הסבר קצר
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-[#AAB4C5] flex items-center justify-center min-h-[36px] min-w-[36px]"
              aria-label="סגירת באנר התקנה"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {showIOSGuide && (
          <Modal
            isOpen
            onClose={() => setShowIOSGuide(false)}
            labelledBy="ios-install-title"
            panelClassName="w-full max-w-sm bg-[#141E34] border border-slate-700 rounded-2xl p-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 id="ios-install-title" className="text-base font-bold text-[#F5F7FA]">
                התקנה במכשירי אפל (iOS)
              </h2>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-[#AAB4C5] flex items-center justify-center min-h-[44px] min-w-[44px]"
                aria-label="סגירה"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <ol className="space-y-4 py-4 text-xs sm:text-sm text-[#E2E8F0] leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold" aria-hidden="true">1</span>
                <span>לחצו על כפתור <strong>השיתוף (Share)</strong> בתחתית דפדפן Safari (אייקון ריבוע עם חץ כלפי מעלה).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#00E676]/15 text-[#00E676] flex items-center justify-center shrink-0 mt-0.5 font-bold" aria-hidden="true">2</span>
                <span>גללו מעט למטה ולחצו על <strong>״הוסף למסך הבית״ (Add to Home Screen)</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 font-bold" aria-hidden="true">3</span>
                <span>האפליקציה תיפתח כמסך נפרד עצמאי ללא שורת כתובת, ותעבוד גם כשאין קליטה!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-[#00E676] text-[#080C14] font-bold text-xs sm:text-sm rounded-xl transition-colors min-h-[44px]"
            >
              הבנתי, תודה
            </button>
          </Modal>
        )}
      </>
    );
  }

  return null;
};
