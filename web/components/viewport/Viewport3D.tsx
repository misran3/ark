'use client';

import { Canvas } from '@react-three/fiber';
import { StarfieldBackground } from './StarfieldBackground';
import { Planet } from './Planet';
import { NebulaBackground } from './NebulaBackground';
import { SpaceDust } from './SpaceDust';
import { LensFlare } from './LensFlare';
import { ThreatsLayer } from './ThreatsLayer';
import SceneEffects from '@/components/three/SceneEffects';

import { useThreatStore } from '@/lib/stores/threat-store';
import { useBootStore } from '@/lib/stores/boot-store';
import { HologramOverlay } from '@/components/bridge/hologram/HologramOverlay';
import { DefenseGrid } from '@/components/bridge/hologram/panels/DefenseGrid';
import { AssetNavigation } from '@/components/bridge/hologram/panels/AssetNavigation';
import { StarChart } from '@/components/bridge/hologram/panels/star-chart/StarChart';
import { FleetCommand } from '@/components/bridge/hologram/panels/FleetCommand';
import { useConsoleStore } from '@/lib/stores/console-store';
import { CAMERA } from '@/lib/constants/scene-layout';

export function Viewport3D() {
  const allThreats = useThreatStore((state) => state.threats);
  const expandedPanel = useConsoleStore((s) => s.expandedPanel);
  const consoleIntensity = useBootStore((s) => s.consoleIntensity);
  const threats = allThreats.filter((t) => !t.deflected);

  // Scene brightness ramps with boot — planet/stars dark until console lights the room
  const sceneReveal = Math.min(consoleIntensity / 0.96, 1);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: CAMERA.position as [number, number, number],
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
        }}
      >
        {/* Deep space nebula clouds */}
        <NebulaBackground />

        {/* Ambient lighting — dims during boot so console panels appear as light source */}
        <ambientLight intensity={0.2 * sceneReveal} />

        {/* Starfield */}
        <StarfieldBackground />

        {/* Blue planet backdrop — fades in with boot */}
        <Planet brightness={sceneReveal} />
        <LensFlare brightness={sceneReveal} />

        {/* Sparse drifting dust particles */}
        <SpaceDust />

        {/* Threat objects */}
        <ThreatsLayer threats={threats} />

        {/* Hologram expansion overlay */}
        <HologramOverlay>
          {expandedPanel === 'shields' && <DefenseGrid />}
          {expandedPanel === 'networth' && <AssetNavigation />}
          {expandedPanel === 'transactions' && <StarChart />}
          {expandedPanel === 'cards' && <FleetCommand />}
        </HologramOverlay>

        {/* Post-processing: bloom, chromatic aberration, vignette */}
        <SceneEffects />
      </Canvas>
    </div>
  );
}
