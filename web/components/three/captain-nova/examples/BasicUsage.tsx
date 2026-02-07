// web/components/three/captain-nova/examples/BasicUsage.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CaptainNova from '../index';

/**
 * Example: Basic Captain Nova usage
 */
export function BasicUsageExample() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <CaptainNova position={[0, -2, 0]} />

        <OrbitControls />
      </Canvas>
    </div>
  );
}
