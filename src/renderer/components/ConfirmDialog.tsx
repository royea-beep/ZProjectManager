import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    // Focus cancel button by default (safer default)
    const timer = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 50);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timer); };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="relative bg-dark-surface border border-dark-border rounded-lg shadow-xl w-full max-w-sm mx-4 p-5 animate-modal">
        <h3 id="confirm-title" className="text-base font-semibold mb-2">{title}</h3>
        <p id="confirm-message" className="text-sm text-dark-muted mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-1.5 text-sm bg-dark-bg border border-dark-border rounded hover:bg-dark-hover">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-1.5 text-sm text-white rounded ${
              danger ? 'bg-accent-red hover:bg-accent-red/80' : 'bg-accent-blue hover:bg-accent-blue/80'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
