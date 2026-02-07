'use client';

import { useMemo } from 'react';

/**
 * Layer D — Near-field Particles (z-5)
 *
 * 5-8 CSS-animated particles establishing the depth chain:
 * cockpit → glass → particles → deep space.
 *
 * - Very faint, slightly blurred dots drifting slowly
 * - Move faster than background stars but slower than HUD elements
 * - Occasional brightness pulse as particles catch starlight
 * - CSS animations with will-change: transform (compositor thread)
 * - Max 8 particles
 */

interface Particle {
  id: number;
  size: number;
  startX: string;
  startY: string;
  duration: number;
  delay: number;
  opacity: number;
  blur: number;
  pulseDelay: number;
}

function generateParticles(): Particle[] {
  // Deterministic seed-like values for 7 particles
  return [
    { id: 0, size: 2.5, startX: '15%', startY: '25%', duration: 45, delay: 0, opacity: 0.12, blur: 1.5, pulseDelay: 3 },
    { id: 1, size: 1.8, startX: '72%', startY: '40%', duration: 55, delay: -8, opacity: 0.08, blur: 2, pulseDelay: 7 },
    { id: 2, size: 3, startX: '35%', startY: '65%', duration: 38, delay: -15, opacity: 0.1, blur: 1, pulseDelay: 12 },
    { id: 3, size: 2, startX: '88%', startY: '15%', duration: 50, delay: -22, opacity: 0.07, blur: 2.5, pulseDelay: 5 },
    { id: 4, size: 1.5, startX: '55%', startY: '80%', duration: 62, delay: -30, opacity: 0.09, blur: 1.8, pulseDelay: 18 },
    { id: 5, size: 2.2, startX: '25%', startY: '50%', duration: 42, delay: -5, opacity: 0.06, blur: 2.2, pulseDelay: 9 },
    { id: 6, size: 1.6, startX: '60%', startY: '30%', duration: 58, delay: -18, opacity: 0.11, blur: 1.2, pulseDelay: 15 },
  ];
}

export function NearFieldParticles() {
  const particles = useMemo(generateParticles, []);

  const bounds = {
    top: '24px',
    left: '50px',
    right: '180px',
    bottom: '220px',
  };

  return (
    <div
      className="fixed pointer-events-none overflow-hidden"
      style={{
        ...bounds,
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.startX,
            top: p.startY,
            background: `rgba(200, 220, 255, ${p.opacity})`,
            filter: `blur(${p.blur}px)`,
            willChange: 'transform, opacity',
            animation:
              `near-particle-drift-${p.id % 3} ${p.duration}s linear ${p.delay}s infinite, ` +
              `near-particle-pulse ${8 + p.id * 2}s ease-in-out ${p.pulseDelay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
