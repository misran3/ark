'use client';

import { useBootStore } from '@/lib/stores/boot-store';
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
import { DashboardProjection } from './cockpit/DashboardProjection';
import { PerfMonitor } from './cockpit/PerfMonitor';
import { useCaptainScans } from '@/hooks/useCaptainScans';
import { NovaDialogueOverlay } from './hud/NovaDialogueOverlay';
import { useNovaHoverSpeech } from '@/hooks/useNovaHoverSpeech';

export function BridgeLayout() {
  const phase = useBootStore((state) => state.phase);
  const consoleIntensity = useBootStore((state) => state.consoleIntensity);
  const isComplete = phase === 'complete';

  // Apply console intensity to entire layout
  const layoutStyle = {
    opacity: consoleIntensity,
    filter: `brightness(${consoleIntensity})`,
    transition: 'opacity 0.1s linear, filter 0.1s linear',
  };

  // Fire Captain API scans when boot completes
  useCaptainScans();
  // Nova speaks threat verdicts on hover
  useNovaHoverSpeech();

  return (
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
      {/* Top bar - floating above frame */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <HUDTopBar />
      </div>

      {/* Threats list - inside viewscreen, upper-left */}
      <div className="absolute top-12 left-14 z-30">
        <HUDThreats />
      </div>

      {/* Nova dialogue overlay — comm panel next to Nova station */}
      <NovaDialogueOverlay />

      {/* Ambient HUD elements */}
      <HUDAmbient />

      {/* Environmental cohesion: AO, dust, specular (z-11, above frame) */}
      <EnvironmentalCohesion />

      {/* Layer 5: Console dashboard (bottom, integrated into frame) */}
      <div className="absolute bottom-0 left-0 right-0 h-[220px] z-20">
        <CommandConsole />
      </div>
      {/* Dev: Performance monitor (enable with ?perf) */}
      <PerfMonitor />
    </div>
    </div>
  );
}
