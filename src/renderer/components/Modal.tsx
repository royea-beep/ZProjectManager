import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
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
    // Auto-focus first focusable element
    const timer = setTimeout(() => {
      const first = modalRef.current?.querySelector<HTMLElement>('input, textarea, select, button');
      first?.focus();
    }, 50);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timer); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative bg-dark-surface border border-dark-border rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-auto mx-4 animate-modal">
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 id="modal-title" className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-text text-lg p-1 rounded hover:bg-dark-hover transition-colors" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
