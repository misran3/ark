'use client';

import { useEffect } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';

const PHASE_DURATIONS = {
  loading: 3000,
  eyelid: 1000,
  blur: 500,
  blink: 500,
  'console-boot': 1000,
  'hud-rise': 1000,
};

const PHASES = [
  'loading',
  'eyelid',
  'blur',
  'blink',
  'console-boot',
  'hud-rise',
  'complete',
] as const;

export function useBootSequence() {
  const { phase, progress, setPhase, setProgress } = useBootStore();

  useEffect(() => {
    // Check localStorage for skip flag
    const shouldSkip = localStorage.getItem('skipBootSequence') === 'true';
    if (shouldSkip && phase === 'loading') {
      setPhase('complete');
      return;
    }

    if (phase === 'complete') return;

    const duration = PHASE_DURATIONS[phase as keyof typeof PHASE_DURATIONS];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const phaseProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(phaseProgress);

      if (phaseProgress >= 100) {
        clearInterval(interval);
        // Advance to next phase
        const currentIndex = PHASES.indexOf(phase as (typeof PHASES)[number]);
        const nextPhase = PHASES[currentIndex + 1];
        if (nextPhase) {
          setPhase(nextPhase);
        }
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [phase, setPhase, setProgress]);

  useEffect(() => {
    // Save skip preference when complete
    if (phase === 'complete') {
      localStorage.setItem('skipBootSequence', 'true');
    }
  }, [phase]);

  return { phase, progress };
}
