'use client';

import DevThreatLayout from '@/components/dev/DevThreatLayout';
import BlackHole from '@/components/three/threats/BlackHole';

export default function DevBlackHolePage() {
  return (
    <DevThreatLayout
      title="DEV: Black Hole"
      subtitle="Debt accumulation & financial gravity"
      accentColor="#7c3aed"
      defaultSize={1.5}
      defaultColor="#4c1d95"
    >
      {({ size, color, position }) => (
        <BlackHole position={position} size={size} color={color} />
      )}
    </DevThreatLayout>
  );
}
