'use client';

import { useEffect, useState, useRef } from 'react';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';

export function HUDTopBar() {
  const alertLevel = useAlertStore((state) => state.level);
  const colors = ALERT_COLORS[alertLevel];
  const [stardate, setStardate] = useState('');
  const [displayedStardate, setDisplayedStardate] = useState('');
  const [displayedShip, setDisplayedShip] = useState('');
  const [displayedStatus, setDisplayedStatus] = useState('');
  const [isTyped, setIsTyped] = useState(false);
  const flickerRef = useRef<HTMLDivElement>(null);

  // Stardate clock
  useEffect(() => {
    const updateStardate = () => {
      const d = new Date();
      const sd = `SD ${d.getFullYear()}.${String(
        Math.floor(((d.getMonth() * 30 + d.getDate()) / 365.25) * 1000)
      ).padStart(3, '0')}`;
      const time = d.toLocaleTimeString('en-US', { hour12: false });
      setStardate(`${sd} | ${time} UTC`);
    };
    updateStardate();
    const interval = setInterval(updateStardate, 1000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter reveal on mount
  useEffect(() => {
    if (isTyped) return;
    const texts = [
      { text: stardate || 'SD 2026.103 | 00:00:00 UTC', setter: setDisplayedStardate, delay: 0 },
      { text: 'USS PROSPERITY', setter: setDisplayedShip, delay: 400 },
      { text: 'SYSTEMS NOMINAL', setter: setDisplayedStatus, delay: 800 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    texts.forEach(({ text, setter, delay }) => {
      let i = 0;
      const startTimer = setTimeout(() => {
        const typeTimer = setInterval(() => {
          if (i <= text.length) {
            setter(text.slice(0, i));
            i++;
          } else {
            clearInterval(typeTimer);
            if (delay === 800) setIsTyped(true);
          }
        }, 35);
        timers.push(typeTimer as unknown as ReturnType<typeof setTimeout>);
      }, delay);
      timers.push(startTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, [stardate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update displayed stardate after typewriter completes
  useEffect(() => {
    if (isTyped) setDisplayedStardate(stardate);
  }, [stardate, isTyped]);

  // Interference flicker (every 30-60s on random element)
  useEffect(() => {
    const scheduleFlicker = () => {
      const delay = 30000 + Math.random() * 30000;
      return setTimeout(() => {
        if (flickerRef.current) {
          const children = flickerRef.current.children;
          const target = children[Math.floor(Math.random() * children.length)] as HTMLElement;
          if (target) {
            target.style.animation = 'hud-flicker 200ms ease-out';
            setTimeout(() => { target.style.animation = ''; }, 200);
          }
        }
        scheduleFlicker();
      }, delay);
    };
    const timer = scheduleFlicker();
    return () => clearTimeout(timer);
  }, []);

  const textStyle = {
    color: colors.hud,
    textShadow: `0 0 10px ${colors.glow}, 0 0 2px ${colors.hud}`,
    animation: isTyped ? 'hud-drift 12s ease-in-out infinite' : undefined,
  };

  return (
    <div
      ref={flickerRef}
      className="h-10 px-8 flex items-center justify-between"
      style={{ opacity: isTyped ? (alertLevel === 'normal' ? 0.7 : 0.85) : 1 }}
    >
      {/* Stardate */}
      <div className="font-mono text-[11px]" style={textStyle}>
        {displayedStardate}
      </div>

      {/* Ship Name */}
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: alertLevel === 'red-alert' ? '#ef4444' : '#22c55e',
            boxShadow: `0 0 6px ${alertLevel === 'red-alert' ? '#ef4444' : '#22c55e'}`,
            animation: 'status-light-pulse 2s ease-in-out infinite',
          }}
        />
        <div className="font-orbitron text-[11px] font-semibold tracking-wider" style={textStyle}>
          {displayedShip}
        </div>
      </div>

      {/* Status */}
      <div className="font-orbitron text-[10px] tracking-[3px]" style={textStyle}>
        {displayedStatus}
      </div>
    </div>
  );
}
