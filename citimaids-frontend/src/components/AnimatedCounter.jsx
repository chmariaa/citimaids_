import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter Component
 *
 * Smoothly counts up to a numerical target when scrolled into view.
 * Handles prefixes/suffixes (e.g. "500+", "4.9 / 5", "9+ Yrs", "100%").
 * Respects `prefers-reduced-motion` and avoids layout shifts via tabular numerals.
 *
 * @param {string} value - Raw display value (e.g. '500+', '4.9 / 5', '100%')
 * @param {number} duration - Animation duration in milliseconds (default: 1300ms)
 * @param {string} className - Optional Tailwind/CSS classes
 */
export default function AnimatedCounter({ value, duration = 1300, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Respect user's motion preference: if reduced motion is requested, display target immediately
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(value);
      return;
    }

    // Parse the number from the string
    // e.g. "500+" -> num: 500, prefix: "", suffix: "+", decimals: 0
    // "4.9 / 5" -> num: 4.9, prefix: "", suffix: " / 5", decimals: 1
    // "9+ Yrs" -> num: 9, prefix: "", suffix: "+ Yrs", decimals: 0
    // "100%" -> num: 100, prefix: "", suffix: "%", decimals: 0
    const match = value.match(/^([^0-9.]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1] || '';
    const targetNum = parseFloat(match[2]);
    const suffix = match[3] || '';
    const hasDecimals = match[2].includes('.');
    const decimalPlaces = hasDecimals ? match[2].split('.')[1].length : 0;

    const el = containerRef.current;
    if (!el) return;

    // Start counter with 0 or 0.0
    setDisplayValue(`${prefix}${(0).toFixed(decimalPlaces)}${suffix}`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth cubic ease-out curve
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentNum = targetNum * easeOut;

            setDisplayValue(`${prefix}${currentNum.toFixed(decimalPlaces)}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={containerRef} className={`tabular-nums ${className}`}>
      {displayValue}
    </span>
  );
}
