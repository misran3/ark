'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBootStore, type BootPhase } from '@/lib/stores/boot-store';
import { storage } from '@/lib/utils/storage';

const PHASE_DURATIONS_FIRST_VISIT: Record<string, number> = {
  black: 1500,           // 1.5s
  emergency: 2000,       // 2s
  'power-surge': 1000,   // 1s (includes 400-500ms breath)
  'viewport-awake': 2000, // 2s
  'console-boot': 1500,  // 1.5s
  'hud-rise': 1000,      // 1s
  settling: 500,         // 0.5s
};

const PHASE_DURATIONS_REPEAT_VISIT: Record<string, number> = {
  black: 500,           // Compressed
  emergency: 0,         // Skip
  'power-surge': 300,   // Quick surge
  'viewport-awake': 1000, // No calibration fumble
  'console-boot': 1000, // No hesitation
  'hud-rise': 500,      // Snap-in
  settling: 300,
};

const PHASES: BootPhase[] = [
  'black',
  'emergency',
  'power-surge',
  'viewport-awake',
  'console-boot',
  'hud-rise',
  'settling',
  'complete',
];

/**
 * Orchestrates the multi-phase boot sequence
 *
 * Phases: black → emergency → power-surge → viewport-awake → console-boot → hud-rise → settling → complete
 *
 * Features:
 * - First visit: full 9.5s cinematic sequence
 * - Repeat visits: 2x speed (halved durations)
 * - Click/tap to skip: instantly jumps to complete
 * - Phase-based timing (defined in PHASE_DURATIONS)
 * - Automatic phase transitions
 * - Progress tracking (0-100% per phase)
 * - Global intensity reduction during settling phase
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

  // Phase progression with compressed timing on repeat visits
  useEffect(() => {
    if (phase === 'complete') return;

    const baseDuration = isRepeatVisitRef.current
      ? PHASE_DURATIONS_REPEAT_VISIT[phase]
      : PHASE_DURATIONS_FIRST_VISIT[phase];

    if (!baseDuration || baseDuration === 0) {
      // Skip this phase for repeat visits
      const currentIndex = PHASES.indexOf(phase);
      const nextPhase = PHASES[currentIndex + 1];
      if (nextPhase) {
        setPhase(nextPhase);
      }
      return;
    }

    const duration = baseDuration;
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

  // Beat 6: The Settle - global intensity reduction
  useEffect(() => {
    if (phase === 'settling') {
      const setGlobalIntensity = useBootStore.getState().setGlobalIntensity;

      // Animate from 1.0 to 0.96 over 400ms
      const startTime = Date.now();
      const duration = 400;
      const startIntensity = 1.0;
      const endIntensity = 0.96;

      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out curve
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentIntensity = startIntensity + (endIntensity - startIntensity) * eased;

        setGlobalIntensity(currentIntensity);

        if (progress >= 1) {
          clearInterval(intervalId);
        }
      }, 16);

      return () => clearInterval(intervalId);
    }
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
      // Fast-forward: transition all remaining effects to completion
      setPhase('complete');
      useBootStore.getState().setGlobalIntensity(0.96);
    }
  }, [phase]);

  return { phase, progress, skipBoot, isRepeatVisit: isRepeatVisitRef.current };
}
