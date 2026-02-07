'use client';

import { useEffect } from 'react';
import { useConsoleStore } from '@/lib/stores/console-store';

/**
 * Handles Escape key to dismiss the expanded hologram.
 * Mount this once at the page level.
 */
export function useHologramDismiss() {
  const { expandedPanel, activationPhase, collapsePanel } = useConsoleStore();

  useEffect(() => {
    if (!expandedPanel || activationPhase === 'dismissing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        collapsePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPanel, activationPhase, collapsePanel]);
}
