'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { StartScreen } from './boot/StartScreen';
import { BootOverlay } from './boot/BootOverlay';
import { BootReadout } from './boot/BootReadout';

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const { phase, startBoot, skipBoot } = useBootSequence();

  return (
    <>
      {/* Start screen - first visit only */}
      {phase === 'start-screen' && <StartScreen onStart={startBoot} />}

      {/* Boot overlay - name-exit through full-power */}
      {phase !== 'complete' && phase !== 'start-screen' && (
        <BootOverlay phase={phase} onSkip={skipBoot} />
      )}

      {/* Boot readout text — scrolling terminal messages */}
      <BootReadout />

      {/* Bridge content - always mounted after start screen */}
      <div
        style={{
          visibility: phase === 'start-screen' ? 'hidden' : 'visible',
        }}
      >
        {children}
      </div>
    </>
  );
}
