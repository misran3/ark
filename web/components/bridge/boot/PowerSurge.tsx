'use client';

import { useEffect, useState } from 'react';

type SurgePhase = 'overshoot' | 'settle' | 'breath';

export function PowerSurge() {
  const [surgePhase, setSurgePhase] = useState<SurgePhase>('overshoot');
  const [cyanIntensity, setCyanIntensity] = useState(0);
  const [redIntensity, setRedIntensity] = useState(1);
  const [redGradientCenter, setRedGradientCenter] = useState(50); // 50% = centered

  useEffect(() => {
    // Phase 1: Overshoot (0-150ms) - too bright
    const overshootInterval = setInterval(() => {
      setCyanIntensity((prev) => Math.min(prev + 0.1, 0.5)); // Ramp to 0.5 (too bright)
    }, 16);

    setTimeout(() => {
      clearInterval(overshootInterval);
      setSurgePhase('settle');

      // Phase 2: Settle (150-300ms) - drop to nominal
      const settleInterval = setInterval(() => {
        setCyanIntensity((prev) => Math.max(prev - 0.033, 0.25)); // Settle to 0.25 (nominal)
      }, 16);

      setTimeout(() => {
        clearInterval(settleInterval);
        setSurgePhase('breath');
      }, 150);
    }, 150);

    // Emergency red drain (overlapping 300ms, directional)
    const redDrainStart = Date.now();
    const redDrainDuration = 300;

    const redDrainInterval = setInterval(() => {
      const elapsed = Date.now() - redDrainStart;
      const progress = Math.min(elapsed / redDrainDuration, 1);

      // Red fades out
      setRedIntensity(1 - progress);

      // Gradient center moves from 50% (centered) to 0% (edge-weighted)
      // Last traces of red linger at edges
      setRedGradientCenter(50 - progress * 50);

      if (progress >= 1) {
        clearInterval(redDrainInterval);
      }
    }, 16);

    return () => {
      clearInterval(overshootInterval);
      clearInterval(redDrainInterval);
    };
  }, []);

  return (
    <>
      {/* Cyan primary power (frame lighting) */}
      <div
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{
          backgroundColor: `rgba(0, 240, 255, ${cyanIntensity})`,
          transition: 'background-color 0.05s ease-out',
        }}
      />

      {/* Frame edge glow (cyan) */}
      <div
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{
          boxShadow: `inset 0 0 30px rgba(0, 240, 255, ${cyanIntensity * 0.8})`,
          transition: 'box-shadow 0.05s ease-out',
        }}
      />

      {/* Emergency red draining (directional gradient) */}
      {redIntensity > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{
            background: `radial-gradient(circle at ${redGradientCenter}% 50%,
              rgba(200, 80, 40, 0) 0%,
              rgba(200, 80, 40, ${redIntensity * 0.25}) 100%)`,
            transition: 'opacity 0.05s ease-out',
          }}
        />
      )}

      {/* Viewport glass reflection flare (during overshoot) */}
      {surgePhase === 'overshoot' && (
        <div
          className="fixed inset-0 pointer-events-none z-[9996]"
          style={{
            boxShadow: 'inset 0 0 60px rgba(0, 240, 255, 0.4)',
            opacity: 0.8,
          }}
        />
      )}
    </>
  );
}
