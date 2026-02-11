'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StartScreenProps {
  onStart: () => void;
}

type ScreenPhase = 'waiting' | 'title' | 'ready' | 'exiting' | 'scanline' | 'done';

export function StartScreen({ onStart }: StartScreenProps) {
  const [phase, setPhase] = useState<ScreenPhase>('waiting');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.push(setTimeout(() => setPhase('title'), 400));
    timersRef.current.push(setTimeout(() => setPhase('ready'), 1600));
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const handleStart = useCallback(() => {
    if (phase !== 'ready') return;
    setPhase('exiting');
    // Beat 2: scanline collapse -> fade (after 900ms glitch-out)
    timersRef.current.push(setTimeout(() => setPhase('scanline'), 900));
    // Beat 3: done -- trigger boot (after 300ms scanline fade)
    timersRef.current.push(setTimeout(() => {
      setPhase('done');
      onStart();
    }, 1200));
  }, [phase, onStart]);

  const getTitleAnimation = (): string | undefined => {
    switch (phase) {
      case 'waiting':
      case 'done':
        return undefined;
      case 'title':
      case 'ready':
        // Entrance glitch, then chain into idle flicker loop after 1.2s
        return 'title-glitch-in 1s ease-out forwards, title-idle-glitch 4s ease-in-out 1.2s infinite';
      case 'exiting':
        return 'title-glitch-out 900ms ease-in forwards';
      case 'scanline':
        return 'scanline-fade 300ms ease-in forwards';
    }
  };

  if (phase === 'done') return null;

  const isExiting = phase === 'exiting' || phase === 'scanline';

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
          animation: getTitleAnimation(),
          textShadow:
            '0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.25), 0 0 120px rgba(0, 240, 255, 0.1)',
        }}
      >
        ARK
      </h1>

      {/* Initialize button -- hidden during exit */}
      <button
        onClick={handleStart}
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
