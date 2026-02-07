'use client';

import { Canvas } from '@react-three/fiber';
import { StarfieldBackground } from './StarfieldBackground';
import { Sun } from './Sun';
import { ThreatsLayer } from './ThreatsLayer';
import SceneEffects from '@/components/three/SceneEffects';
import { CanopyStruts } from './CanopyStruts';
import { SceneHeartbeat } from './SceneHeartbeat';
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
  const hasSolarFlare = threats.some((t) => t.type === 'solar_flare');

  return (
    <div className="w-full h-full">
      <Canvas
        frameloop="demand"
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
        {/* Render loop throttle — drives demand-mode invalidation */}
        <SceneHeartbeat />

        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />

        {/* Starfield */}
        <StarfieldBackground />

        {/* The Sun */}
        {/* TODO: Planet focus acquisition during viewport-awake phase
            - Phase C (1200-2000ms): blur 8→0, saturate 0.6→1.0, brightness 1.3→1.0
            - Requires Three.js shader approach (CSS filters don't work on <group>)
            - Alternative: Apply filter to entire Canvas container from BridgeLayout
            - See: Beat 3 Viewport Display Calibration spec */}
        <Sun solarFlareActive={hasSolarFlare} />

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
