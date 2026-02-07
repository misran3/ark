'use client';

import { useEffect, useState } from 'react';
import { useBootStore } from '@/lib/stores/boot-store';
import { ConsolePanel } from './ConsolePanel';
import { DashboardMicroCreaks } from './DashboardMicroCreaks';
import { useShieldStore } from '@/lib/stores/shield-store';

export function CommandConsole() {
  const phase = useBootStore((state) => state.phase);
  const isPoweringOn = phase === 'console-boot';
  const shieldsMap = useShieldStore((state) => state.shields);
  const recDeck = shieldsMap['recreation-deck'];
  const isRecWarning = recDeck && (recDeck.status === 'warning' || recDeck.status === 'critical' || recDeck.status === 'breached');

  const [panelOpacity, setPanelOpacity] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

  useEffect(() => {
    if (phase === 'console-boot') {
      // Panel 1: t=0
      setTimeout(() => setPanelOpacity((p) => ({ ...p, 1: 1 })), 0);

      // Panel 2: t=300ms
      setTimeout(() => setPanelOpacity((p) => ({ ...p, 2: 1 })), 300);

      // Panel 3: t=600ms (with hesitation - slower fade)
      setTimeout(() => setPanelOpacity((p) => ({ ...p, 3: 0.3 })), 600);
      setTimeout(() => setPanelOpacity((p) => ({ ...p, 3: 1 })), 1000); // Catches at 1000ms

      // Panel 4: t=900ms
      setTimeout(() => setPanelOpacity((p) => ({ ...p, 4: 1 })), 900);
    }
  }, [phase]);

  return (
    <div
      className="h-full relative px-6 pt-5 pb-6"
      style={{
        // Opaque brushed metal — visible surface between instruments
        background: `
          linear-gradient(180deg,
            #10141e 0%,
            #0e1420 40%,
            #080a12 100%
          )
        `,
        // Perceptible horizontal brush lines (2.5% vs old 0.6%)
        backgroundImage: `
          linear-gradient(180deg,
            #10141e 0%,
            #0e1420 40%,
            #080a12 100%
          ),
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(200, 220, 255, 0.025) 2px,
            transparent 3px
          )
        `,
      }}
    >
      {/* Console top-edge highlight — connects visually to dashboard ledge */}
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(200, 220, 255, 0.08) 20%, rgba(200, 220, 255, 0.10) 50%, rgba(200, 220, 255, 0.08) 80%, transparent)',
        }}
      />

      {/* Shared power bus line (runs through all panels) */}
      <div
        className="absolute top-[50%] left-[8%] right-[8%] h-[1px]"
        style={{
          background: 'rgba(0, 240, 255, 0.08)',
          animation: 'conduit-pulse 4s ease-in-out infinite',
        }}
      />

      {/* Dashboard micro-creaks — thermal expansion shadow events */}
      <DashboardMicroCreaks />

      {/* Perspective tilt wrapper — applied ABOVE wells so wells stay flat for Phase 3 canvases */}
      <div
        className="h-full"
        style={{
          perspective: '700px',
        }}
      >
      {/* Console instrument grid with T-bar dividers */}
      <div
        className="h-full flex gap-0 relative"
        style={{
          transform: 'rotateX(4deg)',
          transformOrigin: 'center bottom',
        }}
      >
        {/* Panel 1: Shields */}
        <div className="flex-1 px-1.5" style={{ opacity: panelOpacity[1], transition: 'opacity 0.4s' }}>
          <ConsolePanel
            type="shields"
            label="Shield Status"
            moduleId="INST-01"
            classification="DEFENSIVE"
            revision="REV 3.2"
            isPoweringOn={isPoweringOn}
            powerOnDelay={0}
            priority={1}
            backlightTint="rgba(0, 242, 253, 0.03)"
          />
        </div>

        {/* T-bar divider with bolt */}
        <div className="w-[3px] flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full border border-white/[0.08] bg-black/40" />
        </div>

        {/* Panel 2: Net Worth */}
        <div className="flex-1 px-1.5" style={{ opacity: panelOpacity[2], transition: 'opacity 0.4s' }}>
          <ConsolePanel
            type="networth"
            label="Net Worth"
            moduleId="INST-02"
            classification="FINANCIAL"
            revision="REV 2.1"
            isPoweringOn={isPoweringOn}
            powerOnDelay={150}
            priority={2}
            backlightTint="rgba(2, 238, 255, 0.03)"
          />
        </div>

        {/* T-bar divider with bolt */}
        <div className="w-[3px] flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full border border-white/[0.08] bg-black/40" />
          {/* Analog backup gauge (between panels 2 and 3) */}
          <div className="absolute top-2 w-[7px] h-[7px] rounded-full border border-cyan-500/15">
            <div className="absolute top-1/2 left-1/2 w-[3px] h-px bg-cyan-500/20 origin-left" style={{ transform: 'rotate(-30deg)' }} />
          </div>
        </div>

        {/* Panel 3: Transactions */}
        <div className="flex-1 px-1.5" style={{ opacity: panelOpacity[3], transition: 'opacity 0.2s' }}>
          <ConsolePanel
            type="transactions"
            label="Transactions"
            moduleId="INST-03"
            classification="FINANCIAL"
            revision="MK-IV"
            isPoweringOn={isPoweringOn}
            powerOnDelay={300}
            priority={3}
            backlightTint="rgba(0, 237, 252, 0.025)"
          />
        </div>

        {/* T-bar divider with bolt */}
        <div className="w-[3px] flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full border border-white/[0.08] bg-black/40" />
        </div>

        {/* Panel 4: Cards */}
        <div className="flex-1 px-1.5" style={{ opacity: panelOpacity[4], transition: 'opacity 0.4s' }}>
          <ConsolePanel
            type="cards"
            label="Card Intelligence"
            moduleId="INST-04"
            classification="INTEL"
            revision="REV 1.8"
            isPoweringOn={isPoweringOn}
            powerOnDelay={450}
            isWarning={isRecWarning}
            backlightTint="rgba(3, 240, 250, 0.028)"
          />
        </div>
      </div>
      </div>
    </div>
  );
}
