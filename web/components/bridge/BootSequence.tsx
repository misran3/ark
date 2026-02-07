'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { StartScreen } from './boot/StartScreen';
import { NameExitAnimation } from './boot/NameExitAnimation';
import { BootOverlay } from './boot/BootOverlay';

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const { phase, startBoot, skipBoot } = useBootSequence();

  return (
    <>
      {/* Start screen - first visit only */}
      {phase === 'start-screen' && <StartScreen onStart={startBoot} />}

      {/* Name exit animation */}
      {phase === 'name-exit' && <NameExitAnimation />}

      {/* Boot overlay - darkness through full-power */}
      {phase !== 'complete' && phase !== 'start-screen' && phase !== 'name-exit' && (
        <BootOverlay phase={phase} onSkip={skipBoot} />
      )}

      {/* Bridge content - always mounted after name exits */}
      <div
        style={{
          visibility:
            phase === 'start-screen' || phase === 'name-exit'
              ? 'hidden'
              : 'visible',
        }}
      >
        {children}
      </div>
    </>
  );
}
