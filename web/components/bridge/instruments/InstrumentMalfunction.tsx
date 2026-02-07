'use client';

import { useEffect, useState, useRef } from 'react';

interface InstrumentMalfunctionProps {
  /** Whether this instrument is in error state */
  active: boolean;
  children: React.ReactNode;
}

/**
 * Wraps an instrument with malfunction visuals when data fails to load.
 *
 * Effects:
 * - Backlight flickers unstably (irregular timeout chain)
 * - Faint red tint overlay
 * - "MALFUNCTION" text flashes
 *
 * The wrapped instrument should show its own error state:
 * - Needles drop to 0 and tremble erratically (pass value=0 to gauges)
 * - Drums display dashes (pass empty/error data)
 */
export function InstrumentMalfunction({ active, children }: InstrumentMalfunctionProps) {
  const [flickerVisible, setFlickerVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Irregular flicker using setTimeout chain (not setInterval) for truly random timing
  useEffect(() => {
    if (!active) {
      setFlickerVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const scheduleFlicker = () => {
      timeoutRef.current = setTimeout(() => {
        setFlickerVisible((v) => !v);
        scheduleFlicker();
      }, 80 + Math.random() * 200);
    };

    scheduleFlicker();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active]);

  if (!active) return <>{children}</>;

  return (
    <div className="relative h-full">
      {/* Instrument content (should be showing error values) */}
      <div style={{ opacity: flickerVisible ? 0.6 : 0.3, transition: 'opacity 80ms' }}>
        {children}
      </div>

      {/* Red tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.06) 0%, transparent 80%)',
        }}
      />

      {/* Flashing MALFUNCTION text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: flickerVisible ? 0.5 : 0 }}
      >
        <div
          className="font-mono uppercase tracking-wider"
          style={{
            fontSize: '6px',
            color: '#ef4444',
            textShadow: '0 0 4px rgba(239, 68, 68, 0.5)',
          }}
        >
          MALFUNCTION
        </div>
      </div>
    </div>
  );
}
