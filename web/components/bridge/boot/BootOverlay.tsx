'use client';

import type { BootPhase } from '@/lib/stores/boot-store';

interface BootOverlayProps {
  phase: BootPhase;
  onSkip: () => void;
}

export function BootOverlay({ phase, onSkip }: BootOverlayProps) {
  // Only render for active boot phases
  if (phase === 'start-screen' || phase === 'complete') {
    return null;
  }

  const showSkipHint = phase !== 'darkness'; // Hide hint during darkness phase

  return (
    <div
      className="fixed inset-0 z-[9998] cursor-pointer"
      onClick={onSkip}
      style={{
        // Darkness phase: solid black
        // Other phases: transparent (let console brightness show through)
        backgroundColor: phase === 'darkness' || phase === 'name-exit' ? '#000' : 'transparent',
        pointerEvents: 'auto',
      }}
    >
      {/* Skip hint */}
      {showSkipHint && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2
                     font-mono text-[9px] tracking-wider uppercase"
          style={{
            color: 'rgba(0, 240, 255, 0.2)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          Click to skip
        </div>
      )}
    </div>
  );
}
