'use client';

import { useEffect, useState } from 'react';

type CalibrationPhase = 'color-shift' | 'sync-sweep' | 'complete';

export function ViewportCalibration() {
  const [phase, setPhase] = useState<CalibrationPhase>('color-shift');
  const [hueRotate, setHueRotate] = useState(15);
  const [saturate, setSaturate] = useState(0.7);
  const [sweepPosition, setSweepPosition] = useState(0); // 0-100%

  useEffect(() => {
    // Phase B: Color temperature correction (800-1200ms = 400ms duration)
    const colorStartTime = Date.now();
    const colorDuration = 400;

    const colorInterval = setInterval(() => {
      const elapsed = Date.now() - colorStartTime;
      const progress = Math.min(elapsed / colorDuration, 1);

      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);

      setHueRotate(15 - eased * 15); // 15 → 0
      setSaturate(0.7 + eased * 0.3); // 0.7 → 1.0

      if (progress >= 1) {
        clearInterval(colorInterval);
        setPhase('sync-sweep');
      }
    }, 16);

    // Sync sweep starts at same time as color correction (800ms)
    setTimeout(() => {
      const sweepStartTime = Date.now();
      const sweepDuration = 400;

      const sweepInterval = setInterval(() => {
        const elapsed = Date.now() - sweepStartTime;
        const progress = Math.min(elapsed / sweepDuration, 1);

        setSweepPosition(progress * 100); // 0 → 100%

        if (progress >= 1) {
          clearInterval(sweepInterval);
          setPhase('complete');
        }
      }, 16);
    }, 0);

    return () => {
      clearInterval(colorInterval);
    };
  }, []);

  return (
    <>
      {/* Color temperature overlay (affects stars) */}
      {phase !== 'complete' && (
        <div
          className="fixed inset-0 pointer-events-none z-[10]"
          style={{
            filter: `hue-rotate(${hueRotate}deg) saturate(${saturate})`,
            transition: 'filter 0.05s ease-out',
          }}
        />
      )}

      {/* Sync sweep - single horizontal band moving downward */}
      {phase === 'sync-sweep' && (
        <div
          className="fixed left-0 right-0 h-[70px] pointer-events-none z-[11]"
          style={{
            top: `${sweepPosition}%`,
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)',
            transform: 'translateY(-50%)',
          }}
        />
      )}
    </>
  );
}
