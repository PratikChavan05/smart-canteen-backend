import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value = 0, duration = 800, prefix = '', suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = 0;
    const target = Number(value) || 0;

    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic formula
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startValue + (target - startValue) * easedProgress));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
