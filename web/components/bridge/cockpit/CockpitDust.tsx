'use client';

import { useMemo } from 'react';

interface DustMote {
  id: number;
  x: string;
  y: string;
  size: number;
  opacity: number;
  driftDuration: number;
  driftDelay: number;
  driftPath: number; // which path variant (0, 1, or 2)
  pulseDuration: number;
  pulseDelay: number;
}

function generateMotes(): DustMote[] {
  // 18 motes distributed across the cockpit interior
  const motes: DustMote[] = [];
  // Seeded pseudo-random using simple hash
  const seed = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 18; i++) {
    motes.push({
      id: i,
      x: `${10 + seed(i * 3) * 80}%`,
      y: `${5 + seed(i * 3 + 1) * 90}%`,
      size: 1.5 + seed(i * 3 + 2) * 2,
      opacity: 0.08 + seed(i * 5) * 0.12,
      driftDuration: 30 + seed(i * 7) * 40,
      driftDelay: -(seed(i * 11) * 30),
      driftPath: i % 3,
      pulseDuration: 6 + seed(i * 13) * 8,
      pulseDelay: seed(i * 17) * 6,
    });
  }
  return motes;
}

/**
 * CockpitDust — always-visible floating dust motes in the cockpit interior.
 * CSS-animated on compositor thread (transform + opacity only).
 * Positioned at z-12 (above EnvironmentalCohesion at z-11, below HUD at z-30).
 */
export function CockpitDust() {
  const motes = useMemo(generateMotes, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 12 }}
      aria-hidden="true"
    >
      {motes.map((m) => (
        <div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: m.x,
            top: m.y,
            width: m.size,
            height: m.size,
            background: `rgba(200, 220, 255, ${m.opacity})`,
            filter: `blur(${0.5 + m.size * 0.2}px)`,
            willChange: 'transform, opacity',
            animation:
              `cockpit-dust-drift-${m.driftPath} ${m.driftDuration}s linear ${m.driftDelay}s infinite, ` +
              `cockpit-dust-pulse ${m.pulseDuration}s ease-in-out ${m.pulseDelay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
