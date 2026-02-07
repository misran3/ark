// web/hooks/useAlertSync.ts
'use client';

import { useEffect } from 'react';
import { useAlertStore } from '@/lib/stores/alert-store';

/**
 * Syncs the alert store level to a data-alert attribute on document.body.
 * This allows CSS to respond to global alert state changes.
 * Call once at the app root level.
 */
export function useAlertSync() {
  const level = useAlertStore((state) => state.level);

  useEffect(() => {
    document.body.setAttribute('data-alert', level);
  }, [level]);
}
