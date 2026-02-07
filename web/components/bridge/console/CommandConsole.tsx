'use client';

import { useBootStore } from '@/lib/stores/boot-store';
import { ConsolePanel } from './ConsolePanel';
import { useShieldStore } from '@/lib/stores/shield-store';

export function CommandConsole() {
  const phase = useBootStore((state) => state.phase);
  const isPoweringOn = phase === 'console-boot';
  const shieldsMap = useShieldStore((state) => state.shields);
  const recDeck = shieldsMap['recreation-deck'];
  const isRecWarning = recDeck && (recDeck.status === 'warning' || recDeck.status === 'critical' || recDeck.status === 'breached');

  return (
    <div className="h-full relative px-6 pt-5 pb-6">
      {/* Shared power bus line (runs through all panels) */}
      <div
        className="absolute top-[50%] left-[8%] right-[8%] h-[1px]"
        style={{
          background: 'rgba(0, 240, 255, 0.08)',
          animation: 'conduit-pulse 4s ease-in-out infinite',
        }}
      />

      {/* Console instrument grid with T-bar dividers */}
      <div className="h-full flex gap-0 relative">
        {/* Panel 1: Shields */}
        <div className="flex-1 px-1.5">
          <ConsolePanel
            type="shields"
            label="Shield Status"
            moduleId="INST-01"
            classification="DEFENSIVE"
            revision="REV 3.2"
            isPoweringOn={isPoweringOn}
            powerOnDelay={0}
            priority={1}
          />
        </div>

        {/* T-bar divider with bolt */}
        <div className="w-[3px] flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full border border-white/[0.08] bg-black/40" />
        </div>

        {/* Panel 2: Net Worth */}
        <div className="flex-1 px-1.5">
          <ConsolePanel
            type="networth"
            label="Net Worth"
            moduleId="INST-02"
            classification="FINANCIAL"
            revision="REV 2.1"
            isPoweringOn={isPoweringOn}
            powerOnDelay={150}
            priority={2}
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
        <div className="flex-1 px-1.5">
          <ConsolePanel
            type="transactions"
            label="Transactions"
            moduleId="INST-03"
            classification="FINANCIAL"
            revision="MK-IV"
            isPoweringOn={isPoweringOn}
            powerOnDelay={300}
            priority={3}
          />
        </div>

        {/* T-bar divider with bolt */}
        <div className="w-[3px] flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full border border-white/[0.08] bg-black/40" />
        </div>

        {/* Panel 4: Cards */}
        <div className="flex-1 px-1.5">
          <ConsolePanel
            type="cards"
            label="Card Intelligence"
            moduleId="INST-04"
            classification="INTEL"
            revision="REV 1.8"
            isPoweringOn={isPoweringOn}
            powerOnDelay={450}
            isWarning={isRecWarning}
          />
        </div>
      </div>
    </div>
  );
}
