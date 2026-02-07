'use client';

import { Canvas } from '@react-three/fiber';
import { StarfieldBackground } from './StarfieldBackground';
import { Planet } from './Planet';
import { NebulaBackground } from './NebulaBackground';
import { SpaceDust } from './SpaceDust';
import { ThreatsLayer } from './ThreatsLayer';
import SceneEffects from '@/components/three/SceneEffects';
import { CanopyStruts } from './CanopyStruts';
import { useThreatStore } from '@/lib/stores/threat-store';
import { HologramOverlay } from '@/components/bridge/hologram/HologramOverlay';
import { DefenseGrid } from '@/components/bridge/hologram/panels/DefenseGrid';
import { AssetNavigation } from '@/components/bridge/hologram/panels/AssetNavigation';
import { SensorLog } from '@/components/bridge/hologram/panels/SensorLog';
import { FleetCommand } from '@/components/bridge/hologram/panels/FleetCommand';
import { useConsoleStore } from '@/lib/stores/console-store';

export function Viewport3D() {
  const allThreats = useThreatStore((state) => state.threats);
  const expandedPanel = useConsoleStore((s) => s.expandedPanel);
  const threats = allThreats.filter((t) => !t.deflected);

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
        {/* Deep space nebula clouds */}
        <NebulaBackground />

        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />

        {/* Starfield */}
        <StarfieldBackground />

        {/* Blue planet backdrop */}
        <Planet />

        {/* Sparse drifting dust particles */}
        <SpaceDust />

        {/* Threat objects */}
        <ThreatsLayer threats={threats} />

        {/* Canopy struts — converging structural beams */}
        <CanopyStruts />

        {/* Hologram expansion overlay */}
        <HologramOverlay>
          {expandedPanel === 'shields' && <DefenseGrid />}
          {expandedPanel === 'networth' && <AssetNavigation />}
          {expandedPanel === 'transactions' && <SensorLog />}
          {expandedPanel === 'cards' && <FleetCommand />}
        </HologramOverlay>

        {/* Post-processing: bloom, chromatic aberration, vignette */}
        <SceneEffects />
      </Canvas>
    </div>
  );
}
