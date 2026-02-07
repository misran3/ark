'use client';

import { useEffect, useState } from 'react';

type CalibrationPhase = 'waiting' | 'color-shift' | 'sync-sweep' | 'focus-acquisition' | 'complete';

export function ViewportCalibration() {
  const [phase, setPhase] = useState<CalibrationPhase>('waiting');
  const [hueRotate, setHueRotate] = useState(15);
  const [saturate, setSaturate] = useState(0.7);
  const [sweepPosition, setSweepPosition] = useState(0); // 0-100%

  useEffect(() => {
    // Phase A: Eyelid opening (0-800ms) - wait for shutters to open
    // Phase B starts at 800ms: Color temperature correction (800-1200ms = 400ms duration)
    // Phase C: Focus acquisition (1200-2000ms = 800ms duration)

    const startDelay = setTimeout(() => {
      setPhase('color-shift');
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

      // Sync sweep starts at same time as color correction (within Phase B)
      const sweepDelay = setTimeout(() => {
        const sweepStartTime = Date.now();
        const sweepDuration = 400;

        const sweepInterval = setInterval(() => {
          const elapsed = Date.now() - sweepStartTime;
          const progress = Math.min(elapsed / sweepDuration, 1);

          setSweepPosition(progress * 100); // 0 → 100%

          if (progress >= 1) {
            clearInterval(sweepInterval);

            // Phase C: Focus acquisition (1200-2000ms)
            // TODO: Planet blur/focus needs Three.js shader approach
            // For now, just hold steady for remaining 800ms
            setPhase('focus-acquisition');

            // Transition to complete after Phase C duration
            setTimeout(() => {
              setPhase('complete');
            }, 800);
          }
        }, 16);
      }, 0);

      return () => {
        clearInterval(colorInterval);
        clearTimeout(sweepDelay);
      };
    }, 800); // Delay Phase B start by 800ms

    return () => {
      clearTimeout(startDelay);
    };
  }, []);

  return (
    <>
      {/* Color temperature overlay (affects stars) */}
      {/* Phase A (waiting, 0-800ms): Blue bias visible (wrong color temp) */}
      {/* Phase B (color-shift, 800-1200ms): Correction in progress */}
      {/* Phase C (focus-acquisition, 1200-2000ms): Stable, corrected */}
      {phase !== 'complete' && (
        <div
          className="fixed inset-0 pointer-events-none z-[10]"
          style={{
            filter: `hue-rotate(${hueRotate}deg) saturate(${saturate})`,
            transition: phase === 'color-shift' ? 'filter 0.05s ease-out' : 'none',
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

      {/* Phase C: Focus acquisition indicator (subtle) */}
      {phase === 'focus-acquisition' && (
        <div
          className="fixed top-4 left-4 font-mono text-[8px] tracking-wider uppercase pointer-events-none z-[11]"
          style={{
            color: 'rgba(0, 240, 255, 0.3)',
            opacity: 0.5,
          }}
        >
          FOCAL LOCK
        </div>
      )}
    </>
  );
}
