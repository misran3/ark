'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { LoadingBar } from './boot/LoadingBar';
import { EyelidReveal } from './boot/EyelidReveal';
import { VisionBlur } from './boot/VisionBlur';

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const { phase, progress } = useBootSequence();

  if (phase === 'complete') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Loading phase */}
      {phase === 'loading' && <LoadingBar progress={progress} />}

      {/* Eyelid reveal */}
      {(phase === 'eyelid' || phase === 'blur' || phase === 'blink' ||
        phase === 'console-boot' || phase === 'hud-rise') && (
        <EyelidReveal isOpen={phase !== 'eyelid'} />
      )}

      {/* Vision blur effects */}
      {(phase === 'blur' || phase === 'blink') && (
        <VisionBlur phase={phase} />
      )}

      {/* Content with conditional rendering based on phase */}
      {(phase === 'console-boot' || phase === 'hud-rise') && (
        <div className="relative h-full w-full">
          {children}
        </div>
      )}
    </div>
  );
}
