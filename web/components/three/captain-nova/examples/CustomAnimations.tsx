// web/components/three/captain-nova/examples/CustomAnimations.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import CaptainNova from '../index';

/**
 * Example: Custom animation configuration
 */
export function CustomAnimationsExample() {
  return (
    <Canvas>
      <CaptainNova
        position={[0, -2, 0]}
        animationConfig={{
          breathing: {
            cycleDuration: 6,
            scaleAmount: 0.04,
          },
          weightShift: {
            minInterval: 5,
            maxInterval: 10,
            rotationAmount: 0.08,
          },
          headTracking: {
            maxRotationY: 0.3,
            lerpSpeed: 0.1,
          },
          glitch: {
            frequency: 0.005,
            intensity: 0.8,
          },
        }}
      />
    </Canvas>
  );
}
