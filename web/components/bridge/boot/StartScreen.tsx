'use client';

import { useState, useEffect } from 'react';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [phase, setPhase] = useState<'waiting' | 'title' | 'ready'>('waiting');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'), 400);
    const t2 = setTimeout(() => setPhase('ready'), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      {/* ARK title */}
      <h1
        className="relative font-orbitron font-black tracking-[0.3em] mb-12"
        style={{
          fontSize: 'clamp(80px, 12vw, 160px)',
          lineHeight: 1,
          color: 'rgba(0, 240, 255, 0.9)',
          opacity: phase === 'waiting' ? 0 : undefined,
          animation:
            phase !== 'waiting'
              ? 'title-glitch-in 1s ease-out forwards'
              : undefined,
          textShadow:
            '0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.25), 0 0 120px rgba(0, 240, 255, 0.1)',
        }}
      >
        ARK
      </h1>

      {/* Initialize button */}
      <button
        onClick={onStart}
        className="relative px-10 py-4 font-mono text-sm tracking-[0.25em] uppercase
                   border rounded-sm cursor-pointer
                   hover:bg-cyan-400/10 hover:border-cyan-300 transition-colors duration-300"
        style={{
          borderColor: 'rgba(0, 240, 255, 0.3)',
          color: 'rgba(0, 240, 255, 0.7)',
          textShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
          opacity: phase === 'ready' ? undefined : 0,
          pointerEvents: phase === 'ready' ? undefined : 'none',
          animation:
            phase === 'ready'
              ? 'fadeIn 0.8s ease-out forwards, start-btn-breathe 4s ease-in-out 0.8s infinite'
              : undefined,
        }}
      >
        Initialize Bridge
      </button>
    </div>
  );
}
