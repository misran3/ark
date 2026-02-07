'use client';

import { Canvas } from '@react-three/fiber';
import { DialFace, GaugeNeedle, GlassLens } from './primitives';

interface DualNeedleGauge3DProps {
  /** Income value normalized 0-1 */
  incomeNormalized: number;
  /** Spending value normalized 0-1 */
  spendingNormalized: number;
}

/**
 * INST-02 Secondary: Dual-needle gauge showing income vs spending.
 * Green needle = income, Red needle = spending.
 * Gap between needles = visual net flow.
 */
function DualNeedleScene({ incomeNormalized, spendingNormalized }: DualNeedleGauge3DProps) {
  return (
    <group scale={0.7}>
      <DialFace
        radius={0.8}
        minValue={0}
        maxValue={100}
        majorTicks={6}
        minorTicks={3}
        dangerRange={[-1, -1]}
        tickColor="#3a4a60"
      />
      {/* Income needle (green) */}
      <GaugeNeedle
        value={incomeNormalized}
        length={0.55}
        color="#22c55e"
        stiffness={80}
        damping={10}
        tremorMagnitude={0.004}
      />
      {/* Spending needle (red) */}
      <GaugeNeedle
        value={spendingNormalized}
        length={0.5}
        color="#ef4444"
        stiffness={80}
        damping={10}
        tremorMagnitude={0.004}
      />
      <GlassLens radius={0.8} />
    </group>
  );
}

export function DualNeedleGauge3D({ incomeNormalized, spendingNormalized }: DualNeedleGauge3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 2], fov: 40 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="demand"
      resize={{ offsetSize: true }}
    >
      <DualNeedleScene incomeNormalized={incomeNormalized} spendingNormalized={spendingNormalized} />
    </Canvas>
  );
}
