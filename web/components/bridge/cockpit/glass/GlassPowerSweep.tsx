'use client';

import { useBootStore } from '@/lib/stores/boot-store';
import { VIEWPORT_BOUNDS } from '@/lib/constants/cockpit-layout';

/**
 * GlassPowerSweep — horizontal scanline that sweeps up the viewport glass
 * during console-glow phase. Creates the feeling of the display surface
 * energizing as power comes online.
 */
export function GlassPowerSweep() {
  const phase = useBootStore((s) => s.phase);

  // Only render during console-glow (1.5s duration)
  if (phase !== 'console-glow') return null;

  return (
    <div
      className="fixed pointer-events-none overflow-hidden"
      style={{
        ...VIEWPORT_BOUNDS,
        zIndex: 8, // Same level as glass bevel (top glass layer)
      }}
      aria-hidden="true"
    >
      {/* Primary sweep line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 5%, rgba(0, 240, 255, 0.15) 20%, rgba(0, 240, 255, 0.25) 50%, rgba(0, 240, 255, 0.15) 80%, transparent 95%)',
          boxShadow: '0 0 12px rgba(0, 240, 255, 0.1), 0 0 30px rgba(0, 240, 255, 0.05)',
          animation: 'glass-sweep-up 1.4s ease-in-out forwards',
        }}
      />
      {/* Trailing glow */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(180deg, rgba(0, 240, 255, 0.03) 0%, transparent 100%)',
          animation: 'glass-sweep-up 1.4s ease-in-out forwards',
        }}
      />
    </div>
  );
}
