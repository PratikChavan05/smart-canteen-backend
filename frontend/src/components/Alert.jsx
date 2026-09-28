import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Alert({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />,
    },
    info: {
      bg: 'bg-teal-50 border-teal-200 text-teal-800',
      icon: <Info className="w-5 h-5 shrink-0 text-teal-700" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />,
    },
  };

  const current = config[type] || config.error;

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-in-right max-w-sm">
      <div
        className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg bg-white transition-all duration-300 ${current.bg}`}
      >
        {current.icon}
        <p className="text-sm font-medium pr-2 leading-snug">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
