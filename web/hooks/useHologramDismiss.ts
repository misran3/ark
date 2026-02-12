'use client';

import { useEffect } from 'react';
import { useConsoleStore } from '@/lib/stores/console-store';

/**
 * Handles Escape key to dismiss the expanded hologram.
 * Mount this once at the page level.
 */
export function useHologramDismiss() {
  const expandedPanel = useConsoleStore((s) => s.expandedPanel);
  const activationPhase = useConsoleStore((s) => s.activationPhase);
  const collapsePanel = useConsoleStore((s) => s.collapsePanel);

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
