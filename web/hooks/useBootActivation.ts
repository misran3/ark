'use client';

import { useState, useEffect } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';

const PHASE_ORDER = [
  'start-screen', 'name-exit', 'darkness',
  'console-glow', 'power-surge', 'full-power', 'complete',
] as const;

/**
 * Returns true once boot reaches `activatePhase` + `delayMs`.
 * For returning users (phase=complete on mount), returns true immediately.
 */
export function useBootActivation(activatePhase: string, delayMs = 0): boolean {
  const phase = useBootStore((s) => s.phase);
  const [active, setActive] = useState(phase === 'complete');

  useEffect(() => {
    if (phase === 'complete') {
      setActive(true);
      return;
    }

    const currentIdx = PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]);
    const activateIdx = PHASE_ORDER.indexOf(activatePhase as (typeof PHASE_ORDER)[number]);

    if (currentIdx >= activateIdx && !active) {
      const timer = setTimeout(() => setActive(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [phase, activatePhase, delayMs, active]);

  return active;
}
