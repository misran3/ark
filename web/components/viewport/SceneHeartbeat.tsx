'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useConsoleStore } from '@/lib/stores/console-store';

/**
 * Drives rendering in demand mode by calling invalidate() at a throttled rate.
 *
 * - Idle (no threats, no hologram): ~30fps — enough for star twinkle + sun pulse
 * - Active (threats loaded or hologram open): ~60fps — full responsiveness
 *
 * Existing useFrame hooks don't need changes — they run on every rendered frame,
 * just fewer frames get rendered when idle.
 */
export function SceneHeartbeat() {
  const { invalidate } = useThree();
  const lastRenderRef = useRef(0);

  // Subscribe to activity indicators
  const hasThreats = useThreatStore((s) => s.threats.length > 0);
  const hasHologram = useConsoleStore((s) => s.expandedPanel !== null);

  const isActive = hasThreats || hasHologram;

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    const interval = isActive ? 1 / 60 : 1 / 30;

    if (now - lastRenderRef.current >= interval) {
      lastRenderRef.current = now;
      invalidate();
    }
  });

  return null;
}
