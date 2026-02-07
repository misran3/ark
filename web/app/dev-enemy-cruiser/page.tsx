'use client';

import DevThreatLayout from '@/components/dev/DevThreatLayout';
import EnemyCruiser from '@/components/three/threats/EnemyCruiser';

export default function DevEnemyCruiserPage() {
  return (
    <DevThreatLayout
      title="DEV: Enemy Cruiser"
      subtitle="Fraud & unauthorized charges"
      accentColor="#dc2626"
      defaultSize={1.2}
      defaultColor="#991b1b"
    >
      {({ size, color, position }) => (
        <EnemyCruiser position={position} size={size} color={color} />
      )}
    </DevThreatLayout>
  );
}
