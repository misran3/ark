'use client';

import DevThreatLayout from '@/components/dev/DevThreatLayout';
import IonStorm from '@/components/three/threats/IonStorm';

export default function DevIonStormPage() {
  return (
    <DevThreatLayout
      title="DEV: Ion Storm"
      subtitle="Volatile spending patterns & anomalies"
      accentColor="#a855f7"
      defaultSize={1.5}
      defaultColor="#a855f7"
    >
      {({ size, color, position }) => (
        <IonStorm position={position} size={size} color={color} />
      )}
    </DevThreatLayout>
  );
}
