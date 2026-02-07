'use client';

import { Canvas } from '@react-three/fiber';
import { StarfieldBackground } from './StarfieldBackground';
import { Sun } from './Sun';
import { ThreatsLayer } from './ThreatsLayer';
import SceneEffects from '@/components/three/SceneEffects';
import { CanopyStruts } from './CanopyStruts';
import { useThreatStore } from '@/lib/stores/threat-store';

export function Viewport3D() {
  const allThreats = useThreatStore((state) => state.threats);
  const threats = allThreats.filter((t) => !t.deflected);
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
          antialias: false,
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

        {/* Canopy struts — converging structural beams */}
        <CanopyStruts />

        {/* Post-processing: bloom, chromatic aberration, vignette */}
        <SceneEffects />
      </Canvas>
    </div>
  );
}
