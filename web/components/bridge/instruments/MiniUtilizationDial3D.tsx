'use client';

import { Canvas } from '@react-three/fiber';
import { DialFace, GaugeNeedle, GlassLens } from './primitives';

interface MiniUtilizationDial3DProps {
  /** Utilization percentage 0-100 */
  value: number;
  /** Needle color */
  color?: string;
}

/**
 * INST-04 Mini-dial: Tiny circular gauge beside each card nameplate.
 * Same design language as shield gauge, miniaturized.
 */
function MiniDialScene({ value, color = '#00f0ff' }: MiniUtilizationDial3DProps) {
  const normalized = Math.max(0, Math.min(100, value)) / 100;

  return (
    <group>
      <DialFace
        radius={0.85}
        minValue={0}
        maxValue={100}
        majorTicks={5}
        minorTicks={1}
        dangerRange={[75, 100]}
        dangerColor="#ef4444"
      />
      <GaugeNeedle
        value={normalized}
        length={0.55}
        color={color}
        stiffness={80}
        damping={10}
        tremorMagnitude={0.004}
      />
      <GlassLens radius={0.85} />
    </group>
  );
}

export function MiniUtilizationDial3D({ value, color }: MiniUtilizationDial3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 2], fov: 45 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="always"
      resize={{ offsetSize: true }}
    >
      <MiniDialScene value={value} color={color} />
    </Canvas>
  );
}
