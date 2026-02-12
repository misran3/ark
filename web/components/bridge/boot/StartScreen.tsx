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
        return 'title-glitch-in 1s ease-out forwards, ark-glitch-main 7s ease-in-out 1.2s infinite';
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
      {/* ARK title with volumetric bloom */}
      <div className="relative mb-12">
        {/* Volumetric light cone behind ARK title */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '100%',
            height: '120%',
            top: '-10%',
            left: 0,
            background: 'radial-gradient(ellipse 600px 800px at 50% 40%, rgba(0, 240, 255, 0.12) 0%, rgba(0, 240, 255, 0.04) 40%, transparent 70%)',
            opacity: phase === 'waiting' ? 0 : 1,
            transition: 'opacity 0.5s',
          }}
        />
        <h1
          data-text="ARK"
          className={`relative font-orbitron font-black tracking-[0.3em] ${phase === 'ready' ? 'ark-idle' : ''}`}
          style={{
            fontSize: 'clamp(80px, 12vw, 160px)',
            lineHeight: 1,
            color: 'rgba(0, 240, 255, 0.9)',
            opacity: phase === 'waiting' ? 0 : undefined,
            animation: getTitleAnimation(),
            textShadow:
              '0 0 40px rgba(0, 240, 255, 0.6), 0 0 80px rgba(0, 240, 255, 0.35), 0 0 160px rgba(0, 240, 255, 0.2), 0 0 300px rgba(0, 240, 255, 0.1), 0 0 500px rgba(0, 240, 255, 0.05)',
          }}
        >
          ARK
        </h1>
      </div>

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
