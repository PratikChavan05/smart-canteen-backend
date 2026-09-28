import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  description = 'Items will appear here once available.',
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-card border-dashed border-slate-300">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-4">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="gradient-btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
