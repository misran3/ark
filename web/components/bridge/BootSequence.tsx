'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { LoadingBar } from './boot/LoadingBar';
import { EyelidReveal } from './boot/EyelidReveal';
import { VisionBlur } from './boot/VisionBlur';

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const { phase, progress, skipBoot } = useBootSequence();

  if (phase === 'complete') {
    return <>{children}</>;
  }

  return (
    // Click/tap anywhere to skip boot sequence
    <div className="fixed inset-0 bg-black cursor-pointer" onClick={skipBoot}>
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

      {/* Skip hint — subtle text during boot */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-wider uppercase z-50"
        style={{
          color: 'rgba(0, 240, 255, 0.2)',
          animation: 'hud-drift 4s ease-in-out infinite',
        }}
      >
        Click to skip
      </div>

      {/* Content with conditional rendering based on phase */}
      {(phase === 'console-boot' || phase === 'hud-rise') && (
        <div className="relative h-full w-full">
          {children}
        </div>
      )}
    </div>
  );
}
