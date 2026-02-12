'use client';

import { useEffect, useRef } from 'react';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useNovaDialogueStore } from '@/lib/stores/nova-dialogue-store';

const HOVER_DEBOUNCE_MS = 150;

/**
 * When hoveredThreat changes, enqueue that threat's verdict for Nova to speak.
 * Auto-dismisses when hover ends (hoveredThreat becomes null).
 * Debounced to prevent stutter when mousing quickly across threats.
 */
export function useNovaHoverSpeech() {
  const hoveredThreat = useThreatStore((s) => s.hoveredThreat);
  const threats = useThreatStore((s) => s.threats);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    if (hoveredThreat) {
      const threat = threats.find((t) => t.id === hoveredThreat);
      if (threat) {
        // Debounce: wait before speaking to prevent stutter on quick mouse movement
        speakTimeoutRef.current = setTimeout(() => {
          const current = useNovaDialogueStore.getState().currentMessage;
          // Skip if already speaking this exact threat
          if (current?.threatId === threat.id) return;
          if (!current || current.priority === 'normal') {
            useNovaDialogueStore.getState().speakForThreat(threat.id, threat.detail);
          }
        }, HOVER_DEBOUNCE_MS);
      }
    } else {
      // Hover ended — let the current message keep speaking.
      // It will only be replaced if the user hovers a different threat.
    }

    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, [hoveredThreat, threats]);
}
