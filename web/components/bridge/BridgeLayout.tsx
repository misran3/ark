'use client';

import { useBootStore } from '@/lib/stores/boot-store';
import { HUDTopBar } from './hud/HUDTopBar';
import { HUDThreats } from './hud/HUDThreats';
import { CommandConsole } from './console/CommandConsole';
import { CaptainNovaPanel } from './hud/CaptainNovaPanel';
import { Viewport3D } from '../viewport/Viewport3D';

export function BridgeLayout() {
  const phase = useBootStore((state) => state.phase);
  const showHUD = phase === 'hud-rise' || phase === 'complete';
  const showConsole = phase === 'console-boot' || phase === 'hud-rise' || phase === 'complete';

  return (
    <div className="fixed inset-0 bg-space-black overflow-hidden">
      {/* HUD Top Bar - nearly transparent */}
      <div
        className="absolute top-0 left-0 right-0 z-30 transition-all duration-700 ease-out"
        style={{
          opacity: showHUD ? 1 : 0,
          transform: showHUD ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        <HUDTopBar />
      </div>

      {/* Main content area - viewport + Nova */}
      <div className="absolute inset-0 flex">
        {/* Threats Box - top left */}
        <div
          className="absolute top-20 left-4 z-30 transition-all duration-700 ease-out"
          style={{
            opacity: showHUD ? 1 : 0,
            transform: showHUD ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <HUDThreats />
        </div>

        {/* Viewport - center, takes most space */}
        <div className="flex-1 relative">
          <Viewport3D />
        </div>

        {/* Captain Nova - right panel */}
        <div
          className="w-80 flex-shrink-0 z-30 transition-all duration-700 ease-out"
          style={{
            opacity: showHUD ? 1 : 0,
            transform: showHUD ? 'translateX(0)' : 'translateX(100%)',
          }}
        >
          <CaptainNovaPanel />
        </div>
      </div>

      {/* Command Console - bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[280px] z-20"
        style={{
          opacity: showConsole ? 1 : 0,
          transform: showConsole ? 'translateY(0)' : 'translateY(100%)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <CommandConsole />
      </div>
    </div>
  );
}
