'use client';

import { useEffect, useMemo, useRef } from 'react';
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
import { create } from 'zustand';

// ── Activity store for imperative full-FPS requests (hover/click) ──
interface FrameActivityStore {
  fullFpsUntil: number; // timestamp (ms) when full FPS request expires
  requestFullFps: () => void;
}

export const useFrameActivityStore = create<FrameActivityStore>((set) => ({
  fullFpsUntil: 0,
  requestFullFps: () => set({ fullFpsUntil: Date.now() + 2000 }),
}));

type ActivityTier = 'frozen' | 'idle' | 'threats' | 'active';

const TIER_FPS: Record<ActivityTier, number> = {
  frozen: 0,
  idle: 15,
  threats: 30,
  active: 60,
};

/**
 * Adaptive frame limiter — adjusts render rate based on scene activity.
 *
 * | Scene State                      | Target FPS |
 * |----------------------------------|------------|
 * | Boot (pre-reveal)                | 0 (frozen) |
 * | Idle (no interaction)            | 15 FPS     |
 * | Threats present                  | 30 FPS     |
 * | Panel open / hover / boot reveal | 60 FPS     |
 */
function AdaptiveFrameLimiter() {
  const invalidate = useThree((s) => s.invalidate);

  const bootPhase = useBootStore((s) => s.phase);
  const threatCount = useThreatStore((s) => s.threats.filter((t) => !t.deflected).length);
  const expandedPanel = useConsoleStore((s) => s.expandedPanel);
  const fullFpsUntil = useFrameActivityStore((s) => s.fullFpsUntil);

  const tier: ActivityTier = (() => {
    // Boot phases before full-power: freeze rendering
    if (bootPhase !== 'complete' && bootPhase !== 'full-power') return 'frozen';
    // Imperative full-FPS request (hover/click)
    if (Date.now() < fullFpsUntil) return 'active';
    // Panel open or boot reveal transition
    if (expandedPanel !== null || bootPhase === 'full-power') return 'active';
    // Active threats
    if (threatCount > 0) return 'threats';
    // Nothing happening
    return 'idle';
  })();

  const fps = TIER_FPS[tier];

  useEffect(() => {
    if (fps === 0) return;

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

  // Prime the scene with a single invalidate when transitioning out of frozen
  const prevTierRef = useRef<ActivityTier>(tier);
  useEffect(() => {
    if (prevTierRef.current === 'frozen' && tier !== 'frozen') {
      invalidate();
    }
    prevTierRef.current = tier;
  }, [tier, invalidate]);

  return null;
}

export function Viewport3D() {
  const allThreats = useThreatStore((state) => state.threats);
  const expandedPanel = useConsoleStore((s) => s.expandedPanel);
  const consoleIntensity = useBootStore((s) => s.consoleIntensity);
  const threats = useMemo(() => allThreats.filter((t) => !t.deflected), [allThreats]);

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
        {/* Adaptive render rate: frozen during boot, 15 idle, 30 threats, 60 active */}
        <AdaptiveFrameLimiter />

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
