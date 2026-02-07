'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBootStore, type BootPhase } from '@/lib/stores/boot-store';
import { storage } from '@/lib/utils/storage';

const PHASE_DURATIONS: Record<string, number> = {
  loading: 3000,
  eyelid: 1000,
  blur: 500,
  blink: 500,
  'console-boot': 1000,
  'hud-rise': 1000,
};

const PHASES: BootPhase[] = [
  'loading',
  'eyelid',
  'blur',
  'blink',
  'console-boot',
  'hud-rise',
  'complete',
];

/**
 * Orchestrates the multi-phase boot sequence
 *
 * Phases: loading → eyelid → blur → blink → console-boot → hud-rise → complete
 *
 * Features:
 * - First visit: full speed boot
 * - Repeat visits: 2x speed (halved durations)
 * - Click/tap to skip: instantly jumps to complete
 * - Phase-based timing (defined in PHASE_DURATIONS)
 * - Automatic phase transitions
 * - Progress tracking (0-100% per phase)
 */
export function useBootSequence() {
  const phase = useBootStore((s) => s.phase);
  const progress = useBootStore((s) => s.progress);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRepeatVisitRef = useRef(false);

  const setPhase = useBootStore.getState().setPhase;
  const setProgress = useBootStore.getState().setProgress;

  // Detect repeat visit on mount
  useEffect(() => {
    const bootCount = parseInt(storage.getItem('bootCount') ?? '0', 10);
    isRepeatVisitRef.current = bootCount > 0;
  }, []);

  // Phase progression with 2x speed on repeat visits
  useEffect(() => {
    if (phase === 'complete') return;

    const baseDuration = PHASE_DURATIONS[phase];
    if (!baseDuration) return;

    // Repeat visits play at 2x speed
    const duration = isRepeatVisitRef.current ? baseDuration / 2 : baseDuration;
    const startTime = Date.now();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const phaseProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(phaseProgress);

      if (phaseProgress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const currentIndex = PHASES.indexOf(phase);
        const nextPhase = PHASES[currentIndex + 1];
        if (nextPhase) {
          setPhase(nextPhase);
        }
      }
    }, 16);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  // Increment boot count on completion
  useEffect(() => {
    if (phase === 'complete') {
      const bootCount = parseInt(storage.getItem('bootCount') ?? '0', 10);
      storage.setItem('bootCount', String(bootCount + 1));
    }
  }, [phase]);

  // Click/tap to skip handler
  const skipBoot = useCallback(() => {
    if (phase !== 'complete') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setPhase('complete');
    }
  }, [phase, setPhase]);

  return { phase, progress, skipBoot, isRepeatVisit: isRepeatVisitRef.current };
}
