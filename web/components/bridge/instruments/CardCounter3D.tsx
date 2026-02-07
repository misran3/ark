'use client';

import { Canvas } from '@react-three/fiber';
import { DigitDrum } from './primitives';

interface CardCounter3DProps {
  /** Active card count (0-9 single digit) */
  value: number;
}

/**
 * INST-04 Primary: Large single-digit counter.
 * One big mechanical drum digit in a recessed window.
 */
function CounterScene({ value }: CardCounter3DProps) {
  return (
    <group>
      <DigitDrum
        value={Math.max(0, Math.min(9, value))}
        width={0.5}
        height={0.8}
        digitColor="#00f0ff"
        stiffness={90}
        damping={11}
      />
    </group>
  );
}

export function CardCounter3D({ value }: CardCounter3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 1.5], fov: 35 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="demand"
      resize={{ offsetSize: true }}
    >
      <CounterScene value={value} />
    </Canvas>
  );
}
