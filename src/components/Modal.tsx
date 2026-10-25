import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  /** Forms with user input should set this to false so a stray tap never discards data. */
  closeOnBackdrop?: boolean;
  /** Element to focus when the dialog opens (defaults to the first focusable element). */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  overlayClassName?: string;
  panelClassName?: string;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const stack: symbol[] = [];
let openModals = 0;
let previousOverflow = '';

/** Locks the page behind a dialog: background becomes inert and stops scrolling. */
function lockBackground() {
  if (openModals++ === 0) {
    document.getElementById('root')?.setAttribute('inert', '');
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

function unlockBackground() {
  if (--openModals === 0) {
    document.getElementById('root')?.removeAttribute('inert');
    document.body.style.overflow = previousOverflow;
  }
}

/**
 * Accessible modal: rendered in a portal, background inert (no focus, no screen-reader access),
 * focus trapped inside, Escape closes, scroll locked, focus returns to the opener on close.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  closeOnBackdrop = true,
  initialFocusRef,
  overlayClassName = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85',
  panelClassName = '',
  children
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const id = Symbol('modal');
    stack.push(id);
    lockBackground();

    const panel = panelRef.current;
    const target = initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    target?.focus();

    // Document-level so Escape/Tab keep working even if focus ended up outside (e.g. a backdrop tap).
    // Only the top-most modal reacts.
    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id || !panelRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = !!active && panelRef.current.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(id), 1);
      unlockBackground();
      if (opener && document.body.contains(opener)) opener.focus();
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={overlayClassName}
      dir="rtl"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (closeOnBackdrop) onCloseRef.current();
        else e.preventDefault(); // keep focus inside the dialog
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`focus:outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
