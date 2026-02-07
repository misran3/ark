'use client';

import { Canvas } from '@react-three/fiber';
import { StarfieldBackground } from './StarfieldBackground';
import { Sun } from './Sun';
import { ThreatsLayer } from './ThreatsLayer';
import { useThreatStore } from '@/lib/stores/threat-store';

export function Viewport3D() {
  const threats = useThreatStore((state) => state.threats.filter((t) => !t.deflected));
  const hasSolarFlare = threats.some((t) => t.type === 'solar_flare');

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
          near: 0.1,
          far: 2000,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />

        {/* Starfield */}
        <StarfieldBackground />

        {/* The Sun */}
        <Sun solarFlareActive={hasSolarFlare} />

        {/* Threat objects */}
        <ThreatsLayer threats={threats} />
      </Canvas>
    </div>
  );
}
