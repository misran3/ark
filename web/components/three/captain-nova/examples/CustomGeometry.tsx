// web/components/three/captain-nova/examples/CustomGeometry.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import CaptainNova from '../index';

/**
 * Example: Custom geometry configuration
 */
export function CustomGeometryExample() {
  return (
    <Canvas>
      <CaptainNova
        position={[0, -2, 0]}
        geometryConfig={{
          baseHeight: 2.2,
          headRadius: 0.15,
          torsoWidth: 0.3,
          shoulderWidth: 0.4,
          armLength: 0.5,
          legLength: 0.7,
        }}
      />
    </Canvas>
  );
}
