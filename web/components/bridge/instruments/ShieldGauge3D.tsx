'use client';

import { Canvas } from '@react-three/fiber';
import { DialFace, GaugeNeedle, GlassLens } from './primitives';

interface ShieldGauge3DProps {
  /** Overall shield integrity 0-100 */
  value: number;
}

/**
 * INST-01 Primary: 3D circular dial gauge for shield integrity.
 * Disc with tick marks (0-100, 0-25 danger zone in red),
 * physical needle with spring physics + drop shadow,
 * glass lens with specular arc.
 */
function ShieldGaugeScene({ value }: ShieldGauge3DProps) {
  const normalizedValue = Math.max(0, Math.min(100, value)) / 100;

  return (
    <group>
      <DialFace
        radius={0.85}
        minValue={0}
        maxValue={100}
        majorTicks={11}
        minorTicks={4}
        dangerRange={[0, 25]}
      />
      <GaugeNeedle
        value={normalizedValue}
        length={0.62}
        color="#00f0ff"
        stiffness={100}
        damping={11}
      />
      <GlassLens radius={0.85} />
    </group>
  );
}

export function ShieldGauge3D({ value }: ShieldGauge3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 2], fov: 45 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="always"
      resize={{ offsetSize: true }}
    >
      <ShieldGaugeScene value={value} />
    </Canvas>
  );
}
