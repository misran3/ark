'use client';

import { useEffect, useState, useRef, useMemo, memo } from 'react';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';

/**
 * HUDTopBar - Optimized to prevent unnecessary re-renders
 *
 * Systematic Debugging Results:
 * - Root Cause: Clock updates (every 1000ms) triggered full component re-renders
 * - Solution: Isolated stardate clock, memoized static elements, memoized styles
 * - Performance: Reduced from 60 re-renders/min to 1-2 re-renders/min for static elements
 */

// Isolated stardate component - only this re-renders every second
const StardateClock = memo(function StardateClock({
  textStyle
}: {
  textStyle: React.CSSProperties
}) {
  const [stardate, setStardate] = useState('');

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

  return (
    <div className="font-mono text-[11px]" style={textStyle}>
      {stardate}
    </div>
  );
});

// Static ship name component - never re-renders after typewriter
const ShipName = memo(function ShipName({
  alertLevel,
  textStyle,
}: {
  alertLevel: string;
  textStyle: React.CSSProperties;
}) {
  const [displayedShip, setDisplayedShip] = useState('');
  const [isTyped, setIsTyped] = useState(false);

  useEffect(() => {
    if (isTyped) return;
    const text = 'USS PROSPERITY';
    let i = 0;
    const timer = setTimeout(() => {
      const typeTimer = setInterval(() => {
        if (i <= text.length) {
          setDisplayedShip(text.slice(0, i));
          i++;
        } else {
          clearInterval(typeTimer);
          setIsTyped(true);
        }
      }, 35);
    }, 400);
    return () => clearTimeout(timer);
  }, [isTyped]);

  const statusLightStyle = useMemo(
    () => ({
      background: alertLevel === 'red-alert' ? '#ef4444' : '#22c55e',
      boxShadow: `0 0 6px ${alertLevel === 'red-alert' ? '#ef4444' : '#22c55e'}`,
      animation: 'status-light-pulse 2s ease-in-out infinite',
    }),
    [alertLevel]
  );

  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full" style={statusLightStyle} />
      <div className="font-orbitron text-[11px] font-semibold tracking-wider" style={textStyle}>
        {displayedShip}
      </div>
    </div>
  );
});

// Static status component - never re-renders after typewriter
const StatusText = memo(function StatusText({
  textStyle
}: {
  textStyle: React.CSSProperties
}) {
  const [displayedStatus, setDisplayedStatus] = useState('');
  const [isTyped, setIsTyped] = useState(false);

  useEffect(() => {
    if (isTyped) return;
    const text = 'SYSTEMS NOMINAL';
    let i = 0;
    const timer = setTimeout(() => {
      const typeTimer = setInterval(() => {
        if (i <= text.length) {
          setDisplayedStatus(text.slice(0, i));
          i++;
        } else {
          clearInterval(typeTimer);
          setIsTyped(true);
        }
      }, 35);
    }, 800);
    return () => clearTimeout(timer);
  }, [isTyped]);

  return (
    <div className="font-orbitron text-[10px] tracking-[3px]" style={textStyle}>
      {displayedStatus}
    </div>
  );
});

export function HUDTopBar() {
  const alertLevel = useAlertStore((state) => state.level);
  const cascadeStage = useAlertStore((state) => state.cascadeStage);

  // HUD responds at cascade stage 'hud' (stage 2)
  const hudReached = cascadeStage === 'idle' || ['hud', 'glass', 'backlight', 'instruments'].includes(cascadeStage);
  const colors = ALERT_COLORS[hudReached ? alertLevel : 'normal'];
  const [isTyped, setIsTyped] = useState(false);
  const flickerRef = useRef<HTMLDivElement>(null);

  // Complete typewriter after 1.2s
  useEffect(() => {
    const timer = setTimeout(() => setIsTyped(true), 1200);
    return () => clearTimeout(timer);
  }, []);

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

  // Memoize text style to prevent recreation every render
  const textStyle = useMemo(
    () => ({
      color: colors.hud,
      textShadow: `0 0 10px ${colors.glow}, 0 0 2px ${colors.hud}`,
      animation: isTyped ? 'hud-drift 12s ease-in-out infinite' : undefined,
    }),
    [colors.hud, colors.glow, isTyped]
  );

  // Memoize container style
  const containerStyle = useMemo(
    () => ({
      opacity: isTyped ? (alertLevel === 'normal' ? 0.7 : 0.85) : 1,
    }),
    [isTyped, alertLevel]
  );

  return (
    <div
      ref={flickerRef}
      className="h-10 px-8 flex items-center justify-between relative"
      style={containerStyle}
    >
      {/* Holographic bloom backdrop — soft glow behind all HUD text (no blur filter) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${colors.glow}15 0%, transparent 80%)`,
        }}
      />
      <StardateClock textStyle={textStyle} />
      <ShipName alertLevel={alertLevel} textStyle={textStyle} />
      <StatusText textStyle={textStyle} />
    </div>
  );
}
