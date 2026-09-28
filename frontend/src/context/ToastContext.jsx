import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const iconFor = (type) => {
    const cls = 'w-4.5 h-4.5 shrink-0 mt-0.5';
    if (type === 'success') return <CheckCircle2 className={`${cls} text-emerald-600`} />;
    if (type === 'error') return <XCircle className={`${cls} text-rose-600`} />;
    if (type === 'warning') return <AlertTriangle className={`${cls} text-amber-600`} />;
    return <Info className={`${cls} text-teal-700`} />;
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      {/* Global Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-lg bg-white animate-slide-in-right ${
              toast.type === 'success'
                ? 'border-emerald-200'
                : toast.type === 'error'
                ? 'border-rose-200'
                : toast.type === 'warning'
                ? 'border-amber-200'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {iconFor(toast.type)}
              <p className="text-sm font-medium leading-snug text-slate-800">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
