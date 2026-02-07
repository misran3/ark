'use client';

import DevThreatLayout from '@/components/dev/DevThreatLayout';
import SolarFlare from '@/components/three/threats/SolarFlare';

export default function DevSolarFlarePage() {
  return (
    <DevThreatLayout
      title="DEV: Solar Flare"
      subtitle="Large unexpected charges & billing spikes"
      accentColor="#fbbf24"
      defaultSize={2}
      defaultColor="#fbbf24"
      cameraZ={12}
      maxDistance={30}
    >
      {({ size, color, position }) => (
        <SolarFlare position={position} size={size} color={color} />
      )}
    </DevThreatLayout>
  );
}
