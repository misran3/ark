'use client';

import { useBootStore } from '@/lib/stores/boot-store';
import { ConsolePanel } from './ConsolePanel';

export function CommandConsole() {
  const phase = useBootStore((state) => state.phase);
  const isPoweringOn = phase === 'console-boot';

  return (
    <div className="h-full bg-gradient-to-t from-space-dark via-space-dark/98 to-space-dark/95 border-t border-aurora-primary/10 px-4 py-3 relative">
      {/* Top accent line */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-aurora-primary/20 to-transparent" />

      {/* Console grid */}
      <div className="h-full grid grid-cols-4 gap-3">
        <ConsolePanel
          type="shields"
          label="Shield Status"
          isPoweringOn={isPoweringOn}
          powerOnDelay={0}
        />
        <ConsolePanel
          type="networth"
          label="Net Worth"
          isPoweringOn={isPoweringOn}
          powerOnDelay={150}
        />
        <ConsolePanel
          type="transactions"
          label="Transactions"
          isPoweringOn={isPoweringOn}
          powerOnDelay={300}
        />
        <ConsolePanel
          type="cards"
          label="Card Intelligence"
          isPoweringOn={isPoweringOn}
          powerOnDelay={450}
        />
      </div>
    </div>
  );
}
