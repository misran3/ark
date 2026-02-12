'use client';

import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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

/** Drives the render loop at a capped FPS via demand-mode invalidation */
function FrameLimiter({ fps = 60 }: { fps?: number }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    const interval = 1000 / fps;

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const elapsed = time - lastTime;
      if (elapsed >= interval) {
        lastTime = time - (elapsed % interval);
        invalidate();
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [fps, invalidate]);

  return null;
}

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
        dpr={[1, 1]}
        gl={{
          antialias: false,
          alpha: true,
        }}
        frameloop="demand"
      >
        {/* Cap render loop to 60 FPS — halves GPU/CPU load vs 120 Hz */}
        <FrameLimiter />

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

        {/* Post-processing: bloom, chromatic aberration, vignette — skip at idle */}
        {(threats.length > 0 || expandedPanel !== null) && <SceneEffects />}
      </Canvas>
    </div>
  );
}
