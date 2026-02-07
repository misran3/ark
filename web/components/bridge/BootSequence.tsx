'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { TrueBlack } from './boot/TrueBlack';
import { EyelidReveal } from './boot/EyelidReveal';

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const { phase, progress, skipBoot } = useBootSequence();

  const isBootComplete = phase === 'complete';
  const showBootOverlay = !isBootComplete;

  return (
    <>
      {/* Boot overlay - always in same position in tree */}
      {showBootOverlay && (
        // Click/tap anywhere to skip boot sequence
        <div className="fixed inset-0 bg-black cursor-pointer z-[9999]" onClick={skipBoot}>
          {/* Beat 0: True Black */}
          {phase === 'black' && <TrueBlack />}

          {/* Beat 1: Emergency lighting - TODO */}
          {/* Beat 2: Power surge - TODO */}

          {/* Beat 3: Eyelid reveal (existing component, will be updated in Task 5) */}
          {(phase === 'viewport-awake' || phase === 'console-boot' ||
            phase === 'hud-rise' || phase === 'settling') && (
            <EyelidReveal isOpen={phase !== 'viewport-awake'} />
          )}

          {/* Skip hint */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-wider uppercase z-50"
            style={{
              color: 'rgba(0, 240, 255, 0.2)',
              animation: 'hud-drift 4s ease-in-out infinite',
              opacity: phase === 'black' || phase === 'emergency' ? 0 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            Click to skip
          </div>
        </div>
      )}

      {/* Content - always mounted to prevent remount, but visibility controlled by phase */}
      <div
        className="relative h-full w-full"
        style={{
          visibility: phase === 'console-boot' || phase === 'hud-rise' ||
                     phase === 'settling' || phase === 'complete' ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </>
  );
}
