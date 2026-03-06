import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info', action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', action?: { label: string; onClick: () => void }) => {
    const id = ++nextId;
    const duration = action ? 5000 : 3000;
    setToasts(prev => [...prev, { id, message, type, action, duration }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <ToastMessage key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), item.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [item.id, item.duration, onDismiss]);

  const handleAction = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    item.action?.onClick();
    onDismiss(item.id);
  };

  const colors = {
    success: 'bg-accent-green/90 text-white',
    error: 'bg-accent-red/90 text-white',
    info: 'bg-accent-blue/90 text-white',
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg shadow-lg text-sm pointer-events-auto animate-toast flex items-center gap-3 ${colors[item.type]}`}
      onClick={() => !item.action && onDismiss(item.id)}
      style={{ cursor: 'pointer' }}
    >
      <span>{item.message}</span>
      {item.action && (
        <button
          onClick={(e) => { e.stopPropagation(); handleAction(); }}
          className="font-semibold underline underline-offset-2 hover:opacity-80"
        >
          {item.action.label}
        </button>
      )}
    </div>
  );
}
