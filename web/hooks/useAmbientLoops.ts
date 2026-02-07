'use client';

import { useEffect, useState } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';

export function useAmbientLoops() {
  const phase = useBootStore((state) => state.phase);
  const [loopsActive, setLoopsActive] = useState(false);
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    if (phase === 'settling' || phase === 'complete') {
      setLoopsActive(true);

      // Fade in amplitude from 0 to 1 over 400ms
      const startTime = Date.now();
      const duration = 400;

      const ampInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        setAmplitude(eased);

        if (progress >= 1) {
          clearInterval(ampInterval);
        }
      }, 16);

      return () => clearInterval(ampInterval);
    }
  }, [phase]);

  return { loopsActive, amplitude };
}
