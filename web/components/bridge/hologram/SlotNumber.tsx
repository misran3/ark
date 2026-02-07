'use client';

import { useState, useEffect, useRef } from 'react';

interface SlotNumberProps {
  value: number;
  /** Format function (e.g., toLocaleString, toFixed) */
  format?: (n: number) => string;
  /** Duration of resolve animation in ms (default 350) */
  duration?: number;
  /** Whether to animate on mount (default true) */
  animateOnMount?: boolean;
  className?: string;
}

export function SlotNumber({
  value,
  format = (n) => n.toLocaleString(),
  duration = 350,
  animateOnMount = true,
  className,
}: SlotNumberProps) {
  const [display, setDisplay] = useState(animateOnMount ? '' : format(value));
  const [resolved, setResolved] = useState(!animateOnMount);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  const formatted = format(value);

  useEffect(() => {
    if (!animateOnMount || resolved) return;

    startRef.current = performance.now();

    const step = () => {
      const elapsed = performance.now() - startRef.current;
      if (elapsed >= duration) {
        setDisplay(formatted);
        setResolved(true);
        return;
      }
      // Generate random digits matching the formatted length
      const randomized = formatted.replace(/\d/g, () =>
        String(Math.floor(Math.random() * 10))
      );
      setDisplay(randomized);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animateOnMount, resolved, formatted, duration]);

  // When value changes after already resolved, update directly
  useEffect(() => {
    if (resolved) {
      setDisplay(formatted);
    }
  }, [formatted, resolved]);

  return <span className={className}>{display || formatted}</span>;
}
