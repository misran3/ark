'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StartScreenProps {
  onStart: () => void;
}

type ScreenPhase =
  | 'waiting'
  | 'ready'
  | 'glitch-storm'
  | 'crt-collapse'
  | 'blackout'
  | 'done';

interface GlitchState {
  chromaX: number;
  chromaY: number;
  jitterX: number;
  jitterY: number;
  /** Each band: [topPercent, heightPercent, shiftPx] */
  sliceBands: [number, number, number][];
  bloomOpacity: number;
  active: boolean;
}

const GLITCH_ZERO: GlitchState = {
  chromaX: 0,
  chromaY: 0,
  jitterX: 0,
  jitterY: 0,
  sliceBands: [],
  bloomOpacity: 0.4,
  active: false,
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [phase, setPhase] = useState<ScreenPhase>('waiting');
  const [glitch, setGlitch] = useState<GlitchState>(GLITCH_ZERO);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Cleanup helper
  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    return clearAll;
  }, [clearAll]);

  // Phase 0: waiting → ready
  useEffect(() => {
    timersRef.current.push(setTimeout(() => setPhase('ready'), 600));
  }, []);

  // ── Idle glitch engine ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'ready') return;

    let cancelled = false;

    function scheduleIdleBurst() {
      if (cancelled) return;
      const delay = rand(1500, 3500);
      const timer = setTimeout(() => {
        if (cancelled || phaseRef.current !== 'ready') return;
        runIdleBurst();
        scheduleIdleBurst();
      }, delay);
      timersRef.current.push(timer);
    }

    function runIdleBurst() {
      const duration = rand(150, 400);
      const effects: ('chroma' | 'jitter' | 'slice')[] = ['chroma', 'jitter', 'slice'];
      // pick 1-2 effects
      const count = Math.random() < 0.35 ? 1 : 2;
      const chosen: Set<string> = new Set();
      while (chosen.size < count) chosen.add(pickRandom(effects));

      const tickMs = 50;
      const interval = setInterval(() => {
        if (cancelled || phaseRef.current !== 'ready') {
          clearInterval(interval);
          return;
        }
        setGlitch({
          chromaX: chosen.has('chroma') ? rand(-6, 6) : 0,
          chromaY: chosen.has('chroma') ? rand(-2, 2) : 0,
          jitterX: chosen.has('jitter') ? rand(-3, 3) : 0,
          jitterY: chosen.has('jitter') ? rand(-2, 2) : 0,
          sliceBands: chosen.has('slice')
            ? [[rand(15, 65), rand(6, 18), rand(-20, 20)]]
            : [],
          bloomOpacity: rand(0.2, 0.6),
          active: true,
        });
      }, tickMs);
      intervalsRef.current.push(interval);

      const endTimer = setTimeout(() => {
        clearInterval(interval);
        setGlitch(GLITCH_ZERO);
      }, duration);
      timersRef.current.push(endTimer);
    }

    scheduleIdleBurst();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  // ── Glitch storm engine (exit phase 1) ──────────────────────
  useEffect(() => {
    if (phase !== 'glitch-storm') return;

    let cancelled = false;
    const tickMs = 30;

    const interval = setInterval(() => {
      if (cancelled) return;
      setGlitch({
        chromaX: rand(-12, 12),
        chromaY: rand(-3, 3),
        jitterX: rand(-10, 10),
        jitterY: rand(-8, 8),
        sliceBands: [
          [rand(5, 18), rand(6, 14), rand(-30, 30)],
          [rand(22, 38), rand(5, 12), rand(-35, 35)],
          [rand(42, 58), rand(4, 10), rand(-30, 30)],
          [rand(62, 78), rand(5, 12), rand(-35, 35)],
          [rand(80, 95), rand(4, 10), rand(-25, 25)],
        ],
        bloomOpacity: rand(0.1, 0.8),
        active: true,
      });
    }, tickMs);
    intervalsRef.current.push(interval);

    // After 600ms → CRT collapse
    const collapseTimer = setTimeout(() => {
      if (cancelled) return;
      clearInterval(interval);
      setGlitch({ ...GLITCH_ZERO, active: false });
      setPhase('crt-collapse');
    }, 600);
    timersRef.current.push(collapseTimer);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase]);

  // ── CRT collapse → blackout → done ─────────────────────────
  useEffect(() => {
    if (phase !== 'crt-collapse') return;

    // After 300ms of CSS collapse animation → blackout
    const blackoutTimer = setTimeout(() => {
      setPhase('blackout');
    }, 350);
    timersRef.current.push(blackoutTimer);

    // After blackout hold → done
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onStart();
    }, 350 + 100 + 400);
    timersRef.current.push(doneTimer);
  }, [phase, onStart]);

  const handleStart = useCallback(() => {
    if (phase !== 'ready') return;
    setPhase('glitch-storm');
  }, [phase]);

  if (phase === 'done') return null;

  const isCollapsing = phase === 'crt-collapse';
  const isBlackout = phase === 'blackout';
  const showContent = !isBlackout;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
      style={{
        // CRT collapse: squeeze vertically to a line
        transform: isCollapsing ? 'scaleY(0.005)' : 'scaleY(1)',
        filter: isCollapsing ? 'brightness(3)' : 'brightness(1)',
        transition: isCollapsing
          ? 'transform 300ms cubic-bezier(0.7, 0, 1, 0.5), filter 300ms ease-in'
          : undefined,
        // Blackout: fade to pure black
        opacity: isBlackout ? 0 : 1,
        ...(isBlackout && { transition: 'opacity 100ms ease-out' }),
      }}
    >
      {showContent && (
        <>
          {/* Radial bloom glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 'clamp(500px, 60vw, 900px)',
              height: 'clamp(400px, 50vw, 700px)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -55%)',
              background:
                'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.25) 0%, rgba(0, 240, 255, 0.08) 35%, rgba(0, 240, 255, 0.02) 60%, transparent 80%)',
              opacity:
                phase === 'waiting'
                  ? 0
                  : glitch.active
                    ? glitch.bloomOpacity
                    : undefined,
              animation:
                phase !== 'waiting' && !glitch.active
                  ? 'bloom-breathe 4s ease-in-out infinite'
                  : undefined,
              transition: phase === 'waiting' ? 'opacity 0.8s ease-out' : undefined,
            }}
          />

          {/* Title wrapper — receives jitter */}
          <div
            className="relative mb-12"
            style={{
              transform: `translate(${glitch.jitterX}px, ${glitch.jitterY}px)`,
            }}
          >
            {/* Red chromatic copy */}
            <span
              aria-hidden
              className="absolute inset-0 font-orbitron font-black tracking-[0.3em] select-none"
              style={{
                fontSize: 'clamp(80px, 12vw, 160px)',
                lineHeight: 1,
                color: 'rgba(255, 0, 0, 0.7)',
                mixBlendMode: 'screen',
                transform: `translate(${glitch.chromaX}px, ${glitch.chromaY}px)`,
                opacity: glitch.active ? 1 : 0,
                willChange: 'transform, opacity',
              }}
            >
              ARK
            </span>

            {/* Blue chromatic copy */}
            <span
              aria-hidden
              className="absolute inset-0 font-orbitron font-black tracking-[0.3em] select-none"
              style={{
                fontSize: 'clamp(80px, 12vw, 160px)',
                lineHeight: 1,
                color: 'rgba(0, 100, 255, 0.7)',
                mixBlendMode: 'screen',
                transform: `translate(${-glitch.chromaX}px, ${-glitch.chromaY}px)`,
                opacity: glitch.active ? 1 : 0,
                willChange: 'transform, opacity',
              }}
            >
              ARK
            </span>

            {/* Main title */}
            <h1
              className="relative font-orbitron font-black tracking-[0.3em]"
              style={{
                fontSize: 'clamp(80px, 12vw, 160px)',
                lineHeight: 1,
                color: 'rgba(0, 240, 255, 0.9)',
                opacity: phase === 'waiting' ? 0 : 1,
                transition: 'opacity 0.8s ease-out',
                textShadow:
                  '0 0 20px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.15)',
              }}
            >
              ARK
            </h1>

            {/* Slice corruption overlay */}
            {glitch.sliceBands.length > 0 && (
              <div
                aria-hidden
                className="absolute inset-0 overflow-hidden pointer-events-none"
              >
                {glitch.sliceBands.map(([top, height, shift], i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 font-orbitron font-black tracking-[0.3em] overflow-hidden"
                    style={{
                      fontSize: 'clamp(80px, 12vw, 160px)',
                      lineHeight: 1,
                      color: 'rgba(0, 240, 255, 0.9)',
                      textShadow:
                        '0 0 20px rgba(0, 240, 255, 0.4)',
                      top: `${top}%`,
                      height: `${height}%`,
                      transform: `translateX(${shift}px)`,
                      clipPath: `inset(0 0 0 0)`,
                      willChange: 'transform',
                    }}
                  >
                    ARK
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Initialize button */}
          <button
            onClick={handleStart}
            className="relative px-10 py-4 font-mono text-sm tracking-[0.25em] uppercase
                       border rounded-sm cursor-pointer
                       hover:bg-cyan-400/10 hover:border-cyan-300 transition-colors duration-300"
            style={{
              borderColor: 'rgba(0, 240, 255, 0.3)',
              color: 'rgba(0, 240, 255, 0.7)',
              textShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
              opacity: phase === 'ready' ? 1 : 0,
              pointerEvents: phase === 'ready' ? undefined : 'none',
              transition: phase === 'glitch-storm'
                ? 'opacity 0.15s ease-out'
                : 'opacity 0.8s ease-out',
              animation:
                phase === 'ready'
                  ? 'start-btn-breathe 4s ease-in-out infinite'
                  : undefined,
            }}
          >
            Initialize Bridge
          </button>
        </>
      )}
    </div>
  );
}
