'use client';

import { useEffect, useRef } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';
import { useThreatStore, type Threat } from '@/lib/stores/threat-store';
import { useNovaDialogueStore } from '@/lib/stores/nova-dialogue-store';
import { fetchAllScans } from '@/lib/api/captain-api';
import { mapScansToThreats } from '@/lib/api/threat-mapper';
import type { AllScansResult } from '@/lib/api/captain-types';

/**
 * Fires Captain Analysis API calls immediately on mount.
 * Boot sequence runs concurrently — it's just buying time while data loads.
 * Threats load into the store as soon as data arrives.
 * Nova dialogue is held until boot completes.
 */
export function useCaptainScans() {
  const phase = useBootStore((s) => s.phase);
  const hasFired = useRef(false);
  const scansRef = useRef<AllScansResult | null>(null);
  const threatsRef = useRef<Threat[]>([]);
  const dialogueQueued = useRef(false);

  // Fire API immediately on mount — don't wait for boot
  useEffect(() => {
    console.log('[CaptainScans] Mount effect fired. hasFired:', hasFired.current, 'phase:', useBootStore.getState().phase);
    if (hasFired.current) return;
    hasFired.current = true;

    (async () => {
      console.log('[CaptainScans] Fetching all scans...');
      const scans = await fetchAllScans();
      console.log('[CaptainScans] Scans returned:', {
        financialMeaning: scans.financialMeaning ? 'OK' : 'NULL',
        subscriptions: scans.subscriptions ? 'OK' : 'NULL',
        budgetOverruns: scans.budgetOverruns ? 'OK' : 'NULL',
        upcomingBills: scans.upcomingBills ? 'OK' : 'NULL',
        debtSpirals: scans.debtSpirals ? 'OK' : 'NULL',
        missedRewards: scans.missedRewards ? 'OK' : 'NULL',
        fraudAlerts: scans.fraudAlerts ? 'OK' : 'NULL',
      });
      scansRef.current = scans;

      const threats = mapScansToThreats(scans);
      threatsRef.current = threats;
      console.log('[CaptainScans] Mapped threats:', threats.length, threats.map(t => `${t.type}:${t.id}`));

      // Load threats into 3D scene immediately
      if (threats.length > 0) {
        useThreatStore.getState().loadFromAPI(threats);
      }

      // If boot already complete, start dialogue now
      const currentPhase = useBootStore.getState().phase;
      console.log('[CaptainScans] Boot phase at API return:', currentPhase);
      if (currentPhase === 'complete') {
        console.log('[CaptainScans] Boot already complete — queuing dialogue now');
        queueDialogue(scans, threats);
        dialogueQueued.current = true;
      } else {
        console.log('[CaptainScans] Boot not complete yet — deferring dialogue');
      }
    })();
  }, []);

  // When boot completes and data is ready, start dialogue
  useEffect(() => {
    console.log('[CaptainScans] Phase effect:', phase, 'dialogueQueued:', dialogueQueued.current, 'hasScans:', !!scansRef.current);
    if (phase !== 'complete' || dialogueQueued.current || !scansRef.current) return;
    console.log('[CaptainScans] Boot just completed — queuing dialogue now');
    dialogueQueued.current = true;
    queueDialogue(scansRef.current, threatsRef.current);
  }, [phase]);
}

function queueDialogue(scans: AllScansResult, threats: Threat[]) {
  console.log('[CaptainScans:queueDialogue] financialMeaning:', scans.financialMeaning ? 'present' : 'null');
  // 1. Enqueue Nova greeting (highest priority — speaks first)
  if (scans.financialMeaning) {
    console.log('[CaptainScans:queueDialogue] Enqueuing greeting:', scans.financialMeaning.greeting.slice(0, 50) + '...');
    useNovaDialogueStore.getState().enqueue({
      id: 'greeting',
      text: scans.financialMeaning.greeting,
      priority: 'high',
      category: 'greeting',
    });
    useNovaDialogueStore.getState().next();
    console.log('[CaptainScans:queueDialogue] Dialogue store state after next():', useNovaDialogueStore.getState().state, 'currentMessage:', useNovaDialogueStore.getState().currentMessage?.id);
  }

  // 2. Enqueue Nova nudge — "Commander, I'm detecting N contacts..."
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

    if (useNovaDialogueStore.getState().state === 'idle') {
      useNovaDialogueStore.getState().next();
    }
  }
}
