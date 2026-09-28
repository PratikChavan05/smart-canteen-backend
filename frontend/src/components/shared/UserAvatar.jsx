import React from 'react';

export default function UserAvatar({ name = '', size = 'md', role = '' }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
  };

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-xl bg-teal-700 text-white font-semibold flex items-center justify-center shadow-sm border border-teal-800/10 select-none`}
      >
        {initials}
      </div>
      {role && (
        <span
          className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border shadow-sm ${
            role === 'ADMIN'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : role === 'MANAGER'
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}
        >
          {role[0]}
        </span>
      )}
    </div>
  );
}
