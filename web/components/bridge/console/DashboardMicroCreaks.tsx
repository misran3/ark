'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Dashboard Micro-Creaks
 *
 * Every 45-60s: a very faint shadow line briefly appears and disappears
 * on the dashboard surface between two wells (200ms, very low opacity).
 * Thermal expansion / structural stress. Nobody will consciously see it.
 */

const CREAK_POSITIONS = [
  { left: '25%', label: 'between well 1-2' },
  { left: '50%', label: 'between well 2-3' },
  { left: '75%', label: 'between well 3-4' },
];

export function DashboardMicroCreaks() {
  const [activeCreak, setActiveCreak] = useState<number | null>(null);

  const triggerCreak = useCallback(() => {
    const pos = Math.floor(Math.random() * CREAK_POSITIONS.length);
    setActiveCreak(pos);
    setTimeout(() => setActiveCreak(null), 200);
  }, []);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 15000; // 45-60s
      return setTimeout(() => {
        triggerCreak();
        timerId = scheduleNext();
      }, delay);
    };

    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, [triggerCreak]);

  if (activeCreak === null) return null;

  const pos = CREAK_POSITIONS[activeCreak];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: '20%',
        left: pos.left,
        width: '1px',
        height: '60%',
        background: 'linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.15), transparent)',
        opacity: 0.6,
        transition: 'opacity 100ms ease-out',
      }}
    />
  );
}
