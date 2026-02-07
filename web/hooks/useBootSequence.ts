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
 * - LocalStorage skip on repeat visits
 * - Phase-based timing (defined in PHASE_DURATIONS)
 * - Automatic phase transitions
 * - Progress tracking (0-100% per phase)
 *
 * @returns {Object} Current phase and progress
 * @returns {BootPhase} phase - Current boot phase
 * @returns {number} progress - Progress percentage (0-100) for current phase
 *
 * @example
 * const { phase, progress } = useBootSequence();
 * if (phase === 'complete') {
 *   // Boot sequence finished
 * }
 */
export function useBootSequence() {
  // Use individual selectors to avoid unnecessary re-renders
  const phase = useBootStore((s) => s.phase);
  const progress = useBootStore((s) => s.progress);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable references to store actions (zustand actions are stable by default)
  const setPhase = useBootStore.getState().setPhase;
  const setProgress = useBootStore.getState().setProgress;

  useEffect(() => {
    // Check localStorage for skip flag
    const shouldSkip = storage.getItem('skipBootSequence') === 'true';
    if (shouldSkip && phase === 'loading') {
      setPhase('complete');
      return;
    }

    if (phase === 'complete') return;

    const duration = PHASE_DURATIONS[phase];
    if (!duration) return;

    const startTime = Date.now();

    // Clear any existing interval
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
        // Advance to next phase
        const currentIndex = PHASES.indexOf(phase);
        const nextPhase = PHASES[currentIndex + 1];
        if (nextPhase) {
          setPhase(nextPhase);
        }
      }
    }, 16); // ~60fps

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]); // Only re-run when phase changes, not on progress updates

  useEffect(() => {
    // Save skip preference when complete
    if (phase === 'complete') {
      storage.setItem('skipBootSequence', 'true');
    }
  }, [phase]);

  return { phase, progress };
}
