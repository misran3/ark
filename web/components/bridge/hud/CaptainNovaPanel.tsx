'use client';

import { useState, useEffect } from 'react';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';

type NovaState = 'idle' | 'analyzing' | 'ready' | 'alert';

const IDLE_MESSAGES = [
  'Standing by',
  'Monitoring subsystems',
  'Passive scan active',
  'Awaiting input',
  'Systems nominal',
];

const STATE_BORDER_COLORS: Record<NovaState, string> = {
  idle: 'rgba(0, 200, 255, 0.4)',
  analyzing: 'rgba(251, 191, 36, 0.5)',
  ready: 'rgba(34, 197, 94, 0.5)',
  alert: 'rgba(239, 68, 68, 0.6)',
};

export function CaptainNovaStation() {
  const alertLevel = useAlertStore((state) => state.level);
  const [novaState] = useState<NovaState>('idle');
  const [statusMsg, setStatusMsg] = useState(IDLE_MESSAGES[0]);
  const [prevStatus, setPrevStatus] = useState('');
  const [missionTime, setMissionTime] = useState('00:00:00');
  const [isBooted, setIsBooted] = useState(false);
  const [bootText, setBootText] = useState('');
  const borderColor = STATE_BORDER_COLORS[novaState];
  const colors = ALERT_COLORS[alertLevel];

  // Boot sequence (fires last, after console panels)
  useEffect(() => {
    const bootMsg = 'INITIALIZING ADVISORY SYSTEMS...';
    let i = 0;
    const typeTimer = setInterval(() => {
      if (i <= bootMsg.length) {
        setBootText(bootMsg.slice(0, i));
        i++;
      } else {
        clearInterval(typeTimer);
        setTimeout(() => setIsBooted(true), 600);
      }
    }, 40);
    return () => clearInterval(typeTimer);
  }, []);

  // Cycling idle messages
  useEffect(() => {
    if (!isBooted || novaState !== 'idle') return;
    const interval = setInterval(() => {
      setStatusMsg((prev) => {
        setPrevStatus(prev);
        const idx = IDLE_MESSAGES.indexOf(prev);
        return IDLE_MESSAGES[(idx + 1) % IDLE_MESSAGES.length];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [isBooted, novaState]);

  // Mission time clock
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const d = new Date();
      setMissionTime(d.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Station label */}
      <div className="hull-stencil text-center py-1.5" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.1)' }}>
        STN-R1: ADVISORY
      </div>

      {/* Station screen (CRT treatment) */}
      <div className="flex-1 mx-2 mb-2 console-well relative overflow-hidden">
        {/* Screen status border */}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{ border: `1px solid ${borderColor}`, transition: 'border-color 0.5s' }}
        />

        {/* CRT scanlines */}
        <div className="absolute inset-0 crt-screen pointer-events-none" />

        {/* Barrel distortion */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)' }}
        />

        {/* Signal strength dots */}
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[3px] h-[3px] rounded-full"
              style={{ background: i < 4 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        {!isBooted ? (
          /* Boot text crawl */
          <div className="flex items-center justify-center h-full">
            <div className="font-mono text-[8px] text-cyan-400/60 px-3 text-center">
              {bootText}
              <span className="animate-pulse-slow">_</span>
            </div>
          </div>
        ) : (
          /* Booted content */
          <div className="flex flex-col items-center h-full pt-3 px-2">
            {/* Avatar with glow ring */}
            <div className="relative mb-2">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${borderColor} 0%, transparent 70%)`,
                  transform: 'scale(1.4)',
                  opacity: 0.3,
                }}
              />
              <div
                className="w-12 h-12 rounded-full bg-space-darker/80 border flex items-center justify-center relative"
                style={{
                  borderColor: borderColor,
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
                }}
              >
                <span className="text-lg opacity-60">&#128100;</span>
              </div>
            </div>

            {/* Comm signal visualizer */}
            <div className="flex gap-[2px] mb-2 h-3 items-end">
              {[3, 5, 2, 6, 3, 4, 2].map((h, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-cyan-400/30 rounded-sm"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            {/* Status area */}
            <div className="text-center flex-1 flex flex-col justify-center gap-1 w-full">
              {/* Current status */}
              <div className="font-mono text-[8px] text-cyan-300/70">
                {statusMsg}
              </div>
              {/* Previous status (faded) */}
              {prevStatus && (
                <div className="font-mono text-[6px] text-cyan-400/25 truncate">
                  Prev: {prevStatus}
                </div>
              )}
              {/* Timestamp */}
              <div className="font-mono text-[6px] text-cyan-400/20">
                {missionTime}
              </div>
            </div>

            {/* COMM button */}
            <button className="mb-2 px-3 py-1 rounded border border-cyan-500/25 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors flex items-center gap-1.5 pointer-events-auto">
              <svg width="8" height="8" viewBox="0 0 8 8" className="text-cyan-400/50">
                <path d="M4 0 L4 3 M2 2 L4 0 L6 2 M1 4 L7 4 M1 4 L1 7 L7 7 L7 4" stroke="currentColor" strokeWidth="0.8" fill="none" />
              </svg>
              <span className="font-mono text-[7px] text-cyan-400/50 uppercase">Comm</span>
              <span className="font-mono text-[5px] text-cyan-400/20">CH-01</span>
            </button>
          </div>
        )}

        {/* Cooling vent at bottom */}
        <div className="absolute bottom-0 left-2 right-2 h-[6px] vent-grille" />
      </div>

      {/* Manual disconnect toggle (decorative) */}
      <div className="flex items-center justify-center gap-1 pb-1">
        <div className="w-2 h-1 rounded-sm bg-white/[0.04] border border-white/[0.06]" />
        <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.06)' }}>
          ADV SYS
        </div>
      </div>

      {/* Dedicated power conduit (from shared bus) */}
      <div
        className="absolute left-0 top-[70%] bottom-0 w-[2px]"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0, 240, 255, 0.08))',
          animation: 'conduit-pulse 4s ease-in-out infinite 1s',
        }}
      />
    </div>
  );
}
