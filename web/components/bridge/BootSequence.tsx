'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { StartScreen } from './boot/StartScreen';
import { NameExitAnimation } from './boot/NameExitAnimation';
import { BootOverlay } from './boot/BootOverlay';
import { BootReadout } from './boot/BootReadout';
import { Viewport3D } from '../viewport/Viewport3D';

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const { phase, startBoot, skipBoot } = useBootSequence();

  return (
    <>
      {/* 3D viewport — always visible behind everything */}
      <div className="fixed inset-0 z-0">
        <Viewport3D />
      </div>

      {/* Start screen - first visit only */}
      {phase === 'start-screen' && <StartScreen onStart={startBoot} />}

      {/* Name exit animation */}
      {phase === 'name-exit' && <NameExitAnimation />}

      {/* Boot overlay - darkness through full-power */}
      {phase !== 'complete' && phase !== 'start-screen' && phase !== 'name-exit' && (
        <BootOverlay phase={phase} onSkip={skipBoot} />
      )}

      {/* Boot readout text — scrolling terminal messages */}
      <BootReadout />

      {/* Bridge content — always rendered, BridgeLayout handles its own opacity */}
      {children}
    </>
  );
}
