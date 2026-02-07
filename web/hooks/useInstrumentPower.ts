'use client';

import { useEffect, useRef } from 'react';
import { usePowerStore, type PowerState } from '@/lib/stores/power-store';

/**
 * Hook for instrument components to participate in the power lifecycle.
 *
 * Returns the element's current power state, boot transition flag,
 * and error state for malfunction visuals.
 *
 * @param elementId - Unique identifier for this instrument element
 */
export function useInstrumentPower(elementId: string) {
  const globalState = usePowerStore((s) => s.state);
  const elementState = usePowerStore((s) => s.elements[elementId] ?? 'off');
  const hasError = usePowerStore((s) => s.errors[elementId] ?? false);
  const prevStateRef = useRef<PowerState>(elementState);

  // Track if this element just transitioned to 'running' (for init animations)
  const justBooted = prevStateRef.current === 'boot' && elementState === 'running';

  useEffect(() => {
    prevStateRef.current = elementState;
  }, [elementState]);

  return {
    powerState: elementState,
    globalPowerState: globalState,
    justBooted,
    isOff: elementState === 'off',
    isBooting: elementState === 'boot',
    isRunning: elementState === 'running',
    /** Data load failure — instrument should show malfunction visuals */
    hasError,
  };
}
