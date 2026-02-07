'use client';

import { useEffect, useState } from 'react';

interface EyelidRevealProps {
  isOpen: boolean;
}

export function EyelidReveal({ isOpen }: EyelidRevealProps) {
  const [lightLeakOpacity, setLightLeakOpacity] = useState(0);
  const [lightLeakHeight, setLightLeakHeight] = useState(2);

  useEffect(() => {
    if (!isOpen) {
      // Light leak preview: 0-200ms, widens to 300ms
      const startTime = Date.now();
      const duration = 300;

      const leakInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress <= 200 / 300) {
          // Fade in and widen (0-200ms)
          setLightLeakOpacity(progress * 3); // 0 → 0.9 by 200ms
          setLightLeakHeight(2 + progress * 10); // 2px → ~8px
        } else {
          // Absorbed into viewport brightness (200-300ms)
          setLightLeakOpacity(0.9 - (progress - 200 / 300) * 3);
        }

        if (progress >= 1) {
          clearInterval(leakInterval);
        }
      }, 16);

      return () => clearInterval(leakInterval);
    }
  }, [isOpen]);

  return (
    <>
      {/* Light leak at center seam (before shutters part) */}
      {!isOpen && (
        <div
          className="fixed left-0 right-0 top-1/2 -translate-y-1/2 z-[9999] pointer-events-none"
          style={{
            height: `${lightLeakHeight}px`,
            background: 'linear-gradient(to bottom, transparent, rgba(200, 220, 255, 0.9), transparent)',
            opacity: lightLeakOpacity,
            boxShadow: `0 0 20px rgba(200, 220, 255, ${lightLeakOpacity * 0.6})`,
          }}
        />
      )}

      {/* Top eyelid */}
      <div
        className="fixed top-0 left-0 right-0 h-[50vh] bg-black z-[9998] transition-transform duration-[800ms] ease-in-out"
        style={{
          transform: isOpen ? 'translateY(-100%)' : 'translateY(0)',
        }}
      />

      {/* Bottom eyelid */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[50vh] bg-black z-[9998] transition-transform duration-[800ms] ease-in-out"
        style={{
          transform: isOpen ? 'translateY(100%)' : 'translateY(0)',
        }}
      />
    </>
  );
}
