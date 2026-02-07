'use client';

import { useEffect, useRef } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';
import { storage } from '@/lib/utils/storage';

const PHASE_DURATIONS: Record<string, number> = {
  'name-exit': 600,
  'darkness': 500,
  'console-glow': 1500,
  'power-surge': 1000,
  'full-power': 1000,
};

/**
 * Orchestrates the boot sequence with automatic phase transitions
 * and console intensity control
 */
export function useBootSequence() {
  const phase = useBootStore((s) => s.phase);
  const consoleIntensity = useBootStore((s) => s.consoleIntensity);
  const hasSeenBoot = useBootStore((s) => s.hasSeenBoot);

  const setPhase = useBootStore.getState().setPhase;
  const setConsoleIntensity = useBootStore.getState().setConsoleIntensity;
  const setHasSeenBoot = useBootStore.getState().setHasSeenBoot;
  const skipBoot = useBootStore.getState().skipBoot;
  const startBoot = useBootStore.getState().startBoot;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const hasSeenBootStorage = storage.getItem('synesthesiapay:hasSeenBoot');
    if (hasSeenBootStorage === 'true') {
      setHasSeenBoot(true);
      skipBoot(); // Skip directly to complete
    }
  }, []);

  // Save to localStorage when hasSeenBoot changes
  useEffect(() => {
    if (hasSeenBoot) {
      storage.setItem('synesthesiapay:hasSeenBoot', 'true');
    }
  }, [hasSeenBoot]);

  // Phase progression
  useEffect(() => {
    if (phase === 'start-screen' || phase === 'complete') {
      return; // Don't auto-advance from these phases
    }

    const duration = PHASE_DURATIONS[phase];
    if (!duration) {
      console.warn(`No duration defined for phase: ${phase}`);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Animate console intensity based on phase
    animateConsoleIntensity(phase, duration, setConsoleIntensity);

    // Schedule next phase
    timeoutRef.current = setTimeout(() => {
      const nextPhase = getNextPhase(phase);
      if (nextPhase) {
        setPhase(nextPhase);
      }
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [phase]);

  // Sync consoleIntensity to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--console-intensity',
      String(consoleIntensity)
    );
  }, [consoleIntensity]);

  return {
    phase,
    consoleIntensity,
    hasSeenBoot,
    startBoot,
    skipBoot,
  };
}

function getNextPhase(current: string): string | null {
  const sequence: Record<string, string> = {
    'name-exit': 'darkness',
    'darkness': 'console-glow',
    'console-glow': 'power-surge',
    'power-surge': 'full-power',
    'full-power': 'complete',
  };
  return sequence[current] || null;
}

function animateConsoleIntensity(
  phase: string,
  duration: number,
  setIntensity: (val: number) => void
) {
  const startTime = Date.now();

  // Define intensity curves for each phase
  const curves: Record<string, (progress: number) => number> = {
    'name-exit': () => 0, // Stay dark
    'darkness': () => 0, // Stay dark
    'console-glow': (p) => p * 0.3, // 0 → 0.3
    'power-surge': (p) => {
      // 0.3 → 0.8 with flicker at 30%
      if (p < 0.3) {
        return 0.3 + (p / 0.3) * 0.2; // Rise to 0.5
      } else if (p < 0.35) {
        return 0.5 - 0.2; // Flicker down to 0.3
      } else {
        return 0.3 + ((p - 0.35) / 0.65) * 0.5; // Rise to 0.8
      }
    },
    'full-power': (p) => {
      // 0.8 → 1.0 → 0.96 (overshoot and settle)
      if (p < 0.6) {
        return 0.8 + (p / 0.6) * 0.2; // Rise to 1.0
      } else {
        return 1.0 - ((p - 0.6) / 0.4) * 0.04; // Settle to 0.96
      }
    },
  };

  const curve = curves[phase];
  if (!curve) return;

  const intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    setIntensity(curve(progress));

    if (progress >= 1) {
      clearInterval(intervalId);
    }
  }, 16); // ~60fps
}
