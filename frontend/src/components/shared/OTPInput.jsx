import React, { useRef, useEffect } from 'react';

export default function OTPInput({ value = '', onChange, length = 6, disabled = false }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index, val) => {
    if (disabled) return;
    const sanitized = val.replace(/\D/g, '');
    if (!sanitized) {
      // Clear current digit
      const nextDigits = [...digits];
      nextDigits[index] = '';
      onChange(nextDigits.join(''));
      return;
    }

    // Single digit or paste
    if (sanitized.length === 1) {
      const nextDigits = [...digits];
      nextDigits[index] = sanitized;
      onChange(nextDigits.join(''));
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Multiple digits pasted
      const nextDigits = [...digits];
      for (let i = 0; i < sanitized.length && index + i < length; i++) {
        nextDigits[index + i] = sanitized[i];
      }
      onChange(nextDigits.join(''));
      const nextIndex = Math.min(index + sanitized.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const targetIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none ${
            digits[idx]
              ? 'border-teal-600 bg-teal-50 text-slate-900'
              : 'border-slate-300 bg-white text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}
