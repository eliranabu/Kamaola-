import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastNotification } from '../types/index.ts';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
      dir="rtl"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
              isError
                ? 'bg-[#1E1118]/95 border-rose-500/40 text-rose-200'
                : isSuccess
                ? 'bg-[#0E201B]/95 border-[#00E676]/40 text-[#E6FFFA]'
                : 'bg-[#141E34]/95 border-slate-700 text-[#F5F7FA]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#00E676] shrink-0" aria-hidden="true" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />}
              <span className="text-xs sm:text-sm font-medium leading-snug break-words">
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors min-h-[44px] min-w-[44px] -m-2 focus-visible:ring-2 focus-visible:ring-white"
              aria-label="סגירת הודעה"
            >
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
