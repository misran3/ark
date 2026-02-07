'use client';

import { useEffect, useRef } from 'react';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useNovaDialogueStore } from '@/lib/stores/nova-dialogue-store';

/**
 * When hoveredThreat changes, enqueue that threat's verdict for Nova to speak.
 * Auto-dismisses when hover ends (hoveredThreat becomes null).
 */
export function useNovaHoverSpeech() {
  const hoveredThreat = useThreatStore((s) => s.hoveredThreat);
  const threats = useThreatStore((s) => s.threats);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    if (hoveredThreat) {
      const threat = threats.find((t) => t.id === hoveredThreat);
      if (threat) {
        // Only speak if Nova isn't already speaking a higher-priority message
        const current = useNovaDialogueStore.getState().currentMessage;
        if (!current || current.priority === 'normal') {
          useNovaDialogueStore.getState().speakForThreat(threat.id, threat.detail);
        }
      }
    } else {
      // Hover ended — dismiss after a short delay to avoid flicker
      const current = useNovaDialogueStore.getState().currentMessage;
      if (current?.category === 'detail') {
        dismissTimeoutRef.current = setTimeout(() => {
          // Only dismiss if still showing a detail message
          const msg = useNovaDialogueStore.getState().currentMessage;
          if (msg?.category === 'detail') {
            useNovaDialogueStore.getState().dismiss();
          }
        }, 800);
      }
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [hoveredThreat, threats]);
}
