'use client';

import { useBootStore } from '@/lib/stores/boot-store';
import { useBootActivation } from '@/hooks/useBootActivation';
import { HUDTopBar } from './hud/HUDTopBar';
import { HUDThreats } from './hud/HUDThreats';
import { HUDAmbient } from './hud/HUDAmbient';
import { CommandConsole } from './console/CommandConsole';
import { CaptainNovaStation } from './hud/CaptainNovaPanel';
import { CockpitFrame } from './cockpit/CockpitFrame';
import { LeftDataStrip } from './cockpit/LeftDataStrip';
import { Viewport3D } from '../viewport/Viewport3D';
import { ViewportGlass } from './cockpit/ViewportGlass';
import { EnvironmentalCohesion } from './cockpit/EnvironmentalCohesion';
import { CockpitDust } from './cockpit/CockpitDust';
import { DashboardProjection } from './cockpit/DashboardProjection';
import { PerfMonitor } from './cockpit/PerfMonitor';
import { useCaptainScans } from '@/hooks/useCaptainScans';
import { NovaDialogueOverlay } from './hud/NovaDialogueOverlay';
import { useNovaHoverSpeech } from '@/hooks/useNovaHoverSpeech';

export function BridgeLayout() {
  const phase = useBootStore((state) => state.phase);
  const consoleIntensity = useBootStore((state) => state.consoleIntensity);
  const isComplete = phase === 'complete';

  // Base layout dimming — opacity controls overall visibility
  const layoutStyle = {
    opacity: consoleIntensity,
  };

  // Boot lighting: normalized reveal progress (0 = dark, 1 = fully lit)
  const reveal = Math.min(consoleIntensity / 0.96, 1);

  // HUD cascade: elements flicker on sequentially
  const hudTopBarActive = useBootActivation('power-surge', 200);
  const hudThreatsActive = useBootActivation('power-surge', 600);
  const hudAmbientActive = useBootActivation('full-power', 200);

  // Fire Captain API scans when boot completes
  useCaptainScans();
  // Nova speaks threat verdicts on hover
  useNovaHoverSpeech();

  return (
    <>
      <div style={layoutStyle} className="relative w-full h-screen">
      <div className="fixed inset-0 bg-space-black overflow-hidden">
        {/* Layer 1: Full-screen 3D viewport (behind everything) */}
        <div className="absolute inset-0 z-0">
          <Viewport3D />
        </div>

        {/* Glass layers: z-5 through z-8 between viewport and frame */}
        <ViewportGlass />

        {/* Dashboard projection: top surface + shadow gap (z-9, between glass and frame) */}
        <DashboardProjection />

        {/* Layer 2: Cockpit frame (structural hull overlay) */}
        <CockpitFrame />
        <LeftDataStrip />

        {/* Layer 3: Captain Nova station (inside right frame area) */}
        <div
          className="absolute top-6 right-0 w-[180px] z-20 pointer-events-none"
          style={{ bottom: '220px' }}
        >
          <CaptainNovaStation />
        </div>

        {/* Layer 4: HUD overlays (floating holographic elements) */}
        {/* Top bar - flickers on during power-surge */}
        <div
          className="absolute top-0 left-0 right-0 z-30"
          style={
            isComplete
              ? undefined
              : hudTopBarActive
                ? { animation: 'hud-activate 0.35s ease-out forwards' }
                : { opacity: 0 }
          }
        >
          <HUDTopBar />
        </div>
        
        {/* Threats list - flickers on after top bar */}
        <div
          className="absolute top-12 left-14 z-30"
          style={
            isComplete
              ? undefined
              : hudThreatsActive
                ? { animation: 'hud-activate 0.35s ease-out forwards' }
                : { opacity: 0 }
          }
        >
          <HUDThreats />
        </div>

        {/* Nova dialogue overlay — comm panel next to Nova station */}
        <NovaDialogueOverlay />

        {/* Ambient HUD elements - last to activate */}
        <div
          style={
            isComplete
              ? undefined
              : hudAmbientActive
                ? { animation: 'hud-activate 0.35s ease-out forwards' }
                : { opacity: 0 }
          }
        >
          <HUDAmbient />
        </div>

        {/* Environmental cohesion: AO, dust, specular (z-11, above frame) */}
        <EnvironmentalCohesion />

        {/* Cockpit dust — always-visible floating motes (z-12, above frame) */}
        <CockpitDust />

        {/* Layer 5: Console dashboard (bottom, integrated into frame) */}
        <div className="absolute bottom-0 left-0 right-0 h-[220px] z-20">
          <CommandConsole />
        </div>
        {/* Dev: Performance monitor (enable with ?perf) */}
        <PerfMonitor />
      </div>
      </div>

      {/* Boot lighting effects — outside opacity wrapper for correct compositing */}

      {/* Console glow: cyan light source emanating from bottom */}
      {!isComplete && consoleIntensity > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-[35] pointer-events-none"
          style={{
            height: '50%',
            background: `radial-gradient(ellipse 100% 50% at 50% 100%, rgba(0, 240, 255, ${(0.07 * (1 - reveal)).toFixed(4)}) 0%, transparent 100%)`,
          }}
        />
      )}

      {/* Bottom-up lighting sweep: darkness recedes from console upward */}
      {!isComplete && (
        <div
          className="fixed inset-0 z-[36] pointer-events-none"
          style={{
            background: consoleIntensity <= 0
              ? 'black'
              : `linear-gradient(to bottom, rgba(0,0,0,${((1 - reveal) * 0.85).toFixed(4)}) 0%, rgba(0,0,0,${((1 - reveal) * 0.45).toFixed(4)}) ${(30 + reveal * 25).toFixed(1)}%, transparent ${(55 + reveal * 45).toFixed(1)}%)`,
          }}
        />
      )}
    </>
  );
}
