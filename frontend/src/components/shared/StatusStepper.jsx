import React from 'react';
import {
  CreditCard,
  ClipboardList,
  ChefHat,
  Bell,
  PackageCheck,
  XCircle,
  Check,
} from 'lucide-react';

const STEPS = [
  { key: 'PENDING_PAYMENT', label: 'Payment', Icon: CreditCard },
  { key: 'PENDING', label: 'Received', Icon: ClipboardList },
  { key: 'PREPARING', label: 'Kitchen', Icon: ChefHat },
  { key: 'READY', label: 'Ready', Icon: Bell },
  { key: 'DELIVERED', label: 'Delivered', Icon: PackageCheck },
];

export default function StatusStepper({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5" />
        <span>Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const activeIndex = currentIndex >= 0 ? currentIndex : 1; // default to PENDING if unknown

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        {/* Active Connecting Line */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-teal-600 transition-all duration-500 -z-0"
          style={{
            width: `${(activeIndex / (STEPS.length - 1)) * 90}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const { Icon } = step;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-teal-700 text-white shadow-sm scale-110 ring-4 ring-teal-100'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium transition-colors ${
                  isCurrent
                    ? 'text-teal-800 font-semibold'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
