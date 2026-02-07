'use client';

import { useEffect, useRef } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';
import { usePowerStore } from '@/lib/stores/power-store';
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

export function BridgeLayout() {
  const phase = useBootStore((state) => state.phase);
  const showHUD = phase === 'hud-rise' || phase === 'settling' || phase === 'complete';
  const showConsole = phase === 'console-boot' || phase === 'hud-rise' || phase === 'settling' || phase === 'complete';
  const showFrame = phase === 'console-boot' || phase === 'hud-rise' || phase === 'settling' || phase === 'complete';
  const isEmergencyPhase = phase === 'emergency';

  // Trigger power lifecycle cold start when console-boot phase begins
  const coldStartTriggered = useRef(false);
  const coldStart = usePowerStore((s) => s.coldStart);

  useEffect(() => {
    if (phase === 'console-boot' && !coldStartTriggered.current) {
      coldStartTriggered.current = true;
      coldStart();
    }
    // Handle skip-boot case: if we jump straight to complete, ensure power is running
    if (phase === 'complete' && !coldStartTriggered.current) {
      coldStartTriggered.current = true;
      // Instantly set all elements to running
      const store = usePowerStore.getState();
      store.setPowerState('running');
      ['inst-01', 'inst-02', 'inst-03', 'inst-04', 'left-strip', 'hud-top', 'hud-threats', 'glass'].forEach(
        (id) => store.setElementPower(id, 'running')
      );
    }
  }, [phase, coldStart]);

  return (
    <div className="fixed inset-0 bg-space-black overflow-hidden">
      {/* Layer 1: Full-screen 3D viewport (behind everything) */}
      {/* Only mount Three.js after viewport-awake phase to prevent boot jank */}
      {showFrame && (
        <div
          className="absolute inset-0 z-0"
          style={{
            // Viewport glass during emergency: rgb(3,2,2) - warm bias from red reflection
            // vs Frame metal: rgb(0,0,0) - absorbs light
            backgroundColor: isEmergencyPhase ? 'rgb(3, 2, 2)' : 'transparent',
            transition: 'background-color 0.5s ease-out',
          }}
        >
          <Viewport3D />
        </div>
      )}

      {/* Glass layers: z-5 through z-8 between viewport and frame */}
      <div
        style={{
          opacity: showFrame ? 1 : 0,
          transition: 'opacity 1.2s ease-out 0.3s',
        }}
      >
        <ViewportGlass />
      </div>

      {/* Dashboard projection: top surface + shadow gap (z-9, between glass and frame) */}
      <div
        style={{
          opacity: showFrame ? 1 : 0,
          transition: 'opacity 0.8s ease-out',
        }}
      >
        <DashboardProjection />
      </div>

      {/* Layer 2: Cockpit frame (structural hull overlay) */}
      <div
        style={{
          opacity: showFrame ? 1 : 0,
          transition: 'opacity 0.8s ease-out',
        }}
      >
        <CockpitFrame />
        <LeftDataStrip />
      </div>

      {/* Layer 3: Captain Nova station (inside right frame area) */}
      <div
        className="absolute top-6 right-0 w-[180px] z-20 pointer-events-none"
        style={{
          bottom: '220px',
          opacity: showHUD ? 1 : 0,
          transform: showHUD ? 'translateX(0)' : 'translateX(40px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
        }}
      >
        <CaptainNovaStation />
      </div>

      {/* Layer 4: HUD overlays (floating holographic elements) */}
      {/* Top bar - floating above frame */}
      <div
        className="absolute top-0 left-0 right-0 z-30"
        style={{
          opacity: showHUD ? 1 : 0,
          transform: showHUD ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
        }}
      >
        <HUDTopBar />
      </div>

      {/* Threats list - inside viewscreen, upper-left */}
      <div
        className="absolute top-12 left-14 z-30"
        style={{
          opacity: showHUD ? 1 : 0,
          transform: showHUD ? 'translateX(0)' : 'translateX(-30px)',
          transition: 'opacity 0.7s ease-out 0.2s, transform 0.7s ease-out 0.2s',
        }}
      >
        <HUDThreats />
      </div>

      {/* Ambient HUD elements */}
      {showHUD && <HUDAmbient />}

      {/* Environmental cohesion: AO, dust, specular (z-11, above frame) */}
      <div
        style={{
          opacity: showFrame ? 1 : 0,
          transition: 'opacity 1s ease-out 0.5s',
        }}
      >
        <EnvironmentalCohesion />
      </div>

      {/* Layer 5: Console dashboard (bottom, integrated into frame) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[220px] z-20"
        style={{
          opacity: showConsole ? 1 : 0,
          transform: showConsole ? 'translateY(0)' : 'translateY(60px)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        <CommandConsole />
      </div>
      {/* Dev: Performance monitor (enable with ?perf) */}
      <PerfMonitor />
    </div>
  );
}
