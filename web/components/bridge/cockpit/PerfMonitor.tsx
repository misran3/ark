'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Dev-only performance monitor. Displays FPS and frame timing
 * in the top-right corner. Enable with ?perf query param.
 * Used to measure baseline vs post-glass-layer performance.
 */
export function PerfMonitor() {
  const [visible, setVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('perf')) return;
    setVisible(true);

    const tick = (now: number) => {
      framesRef.current++;
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        setFrameTime(Math.round(elapsed / framesRef.current * 100) / 100);
        framesRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-1 right-[185px] z-[9999] font-mono text-[10px] px-2 py-1 pointer-events-none"
      style={{
        background: 'rgba(0,0,0,0.7)',
        color: fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444',
        borderRadius: 4,
      }}
    >
      {fps} FPS · {frameTime}ms
    </div>
  );
}
