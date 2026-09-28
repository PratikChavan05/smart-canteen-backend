import React from 'react';

export default function LoadingSpinner({ size = 'md', label = 'Loading...', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-teal-200 border-t-teal-700 rounded-full animate-spin`}
      />
      {label && <p className="text-xs font-medium text-slate-500 tracking-wide">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
        {spinner}
      </div>
    );
  }

  return <div className="py-8 flex justify-center">{spinner}</div>;
}
