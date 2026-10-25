import React, { useRef } from 'react';
import { Modal } from './Modal.tsx';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'מחיקה',
  cancelLabel = 'ביטול',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      role="alertdialog"
      labelledBy="confirm-dialog-title"
      describedBy="confirm-dialog-desc"
      initialFocusRef={cancelBtnRef} // safest default for a destructive action
      panelClassName="w-full max-w-md bg-[#141E34] border border-slate-700 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
          aria-hidden="true"
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 id="confirm-dialog-title" className="text-base font-bold text-[#F5F7FA]">
            {title}
          </h2>
          <p id="confirm-dialog-desc" className="text-xs sm:text-sm text-[#AAB4C5] mt-2 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          ref={cancelBtnRef}
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-xs sm:text-sm font-semibold rounded-xl transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-colors min-h-[48px] flex items-center justify-center gap-2 focus-visible:ring-2 ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 focus-visible:ring-rose-400'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 focus-visible:ring-amber-300'
          }`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span>{confirmLabel}</span>
        </button>
      </div>
    </Modal>
  );
};
