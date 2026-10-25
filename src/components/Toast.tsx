import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastNotification } from '../types/index.ts';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4500;

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

/** Success/info toasts fade after a while (paused while hovered or focused); errors stay until dismissed. */
const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [paused, setPaused] = useState(false);
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  useEffect(() => {
    if (isError || paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [isError, paused, toast.id, onDismiss]);

  return (
    <div
      role={isError ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 ${
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
        <span className="text-xs sm:text-sm font-medium leading-snug break-words">{toast.message}</span>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors min-h-[44px] min-w-[44px] -m-2 focus-visible:ring-2 focus-visible:ring-white"
        aria-label="סגירת הודעה"
      >
        <X className="w-4 h-4 opacity-70 hover:opacity-100" aria-hidden="true" />
      </button>
    </div>
  );
};

/**
 * The live region is ALWAYS in the DOM (so screen readers announce additions) and lives in a portal
 * outside #root, so toasts stay reachable while a modal makes #root inert.
 */
export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) =>
  createPortal(
    <div
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[60] flex flex-col gap-2 pointer-events-none"
      dir="rtl"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
