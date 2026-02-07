'use client';

import { useEffect, useRef } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useNovaDialogueStore } from '@/lib/stores/nova-dialogue-store';
import { fetchAllScans } from '@/lib/api/captain-api';
import { mapScansToThreats } from '@/lib/api/threat-mapper';

/**
 * Fires Captain Analysis API calls when boot completes.
 * Loads threats into the store and enqueues Nova dialogue messages.
 */
export function useCaptainScans() {
  const bootComplete = useBootStore((s) => s.bootComplete);
  const hasFired = useRef(false);

  useEffect(() => {
    if (!bootComplete || hasFired.current) return;
    hasFired.current = true;

    (async () => {
      const scans = await fetchAllScans();

      // 1. Enqueue Nova greeting (highest priority — speaks first)
      if (scans.financialMeaning) {
        useNovaDialogueStore.getState().enqueue({
          id: 'greeting',
          text: scans.financialMeaning.greeting,
          priority: 'high',
          category: 'greeting',
        });
        // Start speaking immediately
        useNovaDialogueStore.getState().next();
      }

      // 2. Transform scans into threats and load into store
      const threats = mapScansToThreats(scans);
      if (threats.length > 0) {
        useThreatStore.getState().loadFromAPI(threats);
      }

      // 3. Enqueue Nova nudge — "Commander, I'm detecting N contacts..."
      if (threats.length > 0) {
        const dangerCount = threats.filter((t) => t.severity === 'danger').length;
        const typeCount = new Set(threats.map((t) => t.type)).size;
        const nudgeText = dangerCount > 0
          ? `Commander, sensors detect ${threats.length} contacts across ${typeCount} sectors. ${dangerCount} classified as hostile. Recommend reviewing tactical display.`
          : `Commander, sensors detect ${threats.length} contacts across ${typeCount} sectors. Recommend reviewing tactical display.`;

        useNovaDialogueStore.getState().enqueue({
          id: 'nudge',
          text: nudgeText,
          priority: 'medium',
          category: 'nudge',
        });

        // If greeting already dismissed, auto-advance to nudge
        if (useNovaDialogueStore.getState().state === 'idle') {
          useNovaDialogueStore.getState().next();
        }
      }
    })();
  }, [bootComplete]);
}
