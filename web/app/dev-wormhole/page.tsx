'use client';

import DevThreatLayout from '@/components/dev/DevThreatLayout';
import Wormhole from '@/components/three/threats/Wormhole';

export default function DevWormholePage() {
  return (
    <DevThreatLayout
      title="DEV: Wormhole"
      subtitle="Missed cashback & unredeemed rewards"
      accentColor="#60a5fa"
      defaultSize={1}
      defaultColor="#60a5fa"
      maxDistance={25}
    >
      {({ size, color, position }) => (
        <Wormhole position={position} size={size} color={color} />
      )}
    </DevThreatLayout>
  );
}
