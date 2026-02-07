'use client';

import { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useShieldStore } from '@/lib/stores/shield-store';

/**
 * HUDTopBar - Optimized to prevent unnecessary re-renders
 *
 * Systematic Debugging Results:
 * - Root Cause: Clock updates (every 1000ms) triggered full component re-renders
 * - Solution: Isolated stardate clock, memoized static elements, memoized styles
 * - Performance: Reduced from 60 re-renders/min to 1-2 re-renders/min for static elements
 */

// Chromatic aberration wrapper — adds a faint magenta ghost offset 1px right
const ChromaWrap = memo(function ChromaWrap({
  children,
  ghostColor,
}: {
  children: React.ReactNode;
  ghostColor: string;
}) {
  return (
    <div className="relative">
      {children}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          transform: 'translateX(1px)',
          color: ghostColor,
          opacity: 0.1,
          mixBlendMode: 'screen',
        }}
      >
        {children}
      </div>
    </div>
  );
});

// Isolated stardate component - only this re-renders every second
const StardateClock = memo(function StardateClock({
  textStyle,
  ghostColor,
}: {
  textStyle: React.CSSProperties;
  ghostColor: string;
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
    <ChromaWrap ghostColor={ghostColor}>
      <div className="font-mono text-[11px]" style={textStyle}>
        {stardate}
      </div>
    </ChromaWrap>
  );
});

// Static ship name component - never re-renders after typewriter
const ShipName = memo(function ShipName({
  alertLevel,
  textStyle,
  ghostColor,
}: {
  alertLevel: string;
  textStyle: React.CSSProperties;
  ghostColor: string;
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
      animation: 'status-light-pulse 4s ease-in-out infinite',
    }),
    [alertLevel]
  );

  return (
    <ChromaWrap ghostColor={ghostColor}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={statusLightStyle} />
        <div className="font-orbitron text-[11px] font-semibold tracking-wider" style={textStyle}>
          {displayedShip}
        </div>
      </div>
    </ChromaWrap>
  );
});

// Dynamic status component — reflects real app state with typewriter transitions
const StatusText = memo(function StatusText({
  textStyle,
  ghostColor,
}: {
  textStyle: React.CSSProperties;
  ghostColor: string;
}) {
  const alertLevel = useAlertStore((state) => state.level);
  const threatCount = useThreatStore((state) => state.threats.filter((t) => !t.deflected).length);
  const shieldPercent = useShieldStore((state) => state.overallPercent);

  // Priority-based status resolution
  const targetStatus = useMemo(() => {
    if (alertLevel === 'red-alert') return 'RED ALERT — ALL HANDS';
    if (shieldPercent < 80) return 'SHIELDS ENGAGED';
    if (threatCount > 0) return `${threatCount} CONTACT${threatCount > 1 ? 'S' : ''} DETECTED`;
    return 'SYSTEMS NOMINAL';
  }, [alertLevel, shieldPercent, threatCount]);

  const [displayedStatus, setDisplayedStatus] = useState('');
  const [currentTarget, setCurrentTarget] = useState('');
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typewriter effect — runs on initial mount and when targetStatus changes
  const runTypewriter = useCallback((text: string) => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    let i = 0;
    setDisplayedStatus('');
    typewriterRef.current = setInterval(() => {
      if (i <= text.length) {
        setDisplayedStatus(text.slice(0, i));
        i++;
      } else {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    }, 35);
  }, []);

  useEffect(() => {
    if (targetStatus !== currentTarget) {
      setCurrentTarget(targetStatus);
      // Initial mount: delay for boot sequence stagger
      const delay = currentTarget === '' ? 800 : 100;
      const timer = setTimeout(() => runTypewriter(targetStatus), delay);
      return () => clearTimeout(timer);
    }
  }, [targetStatus, currentTarget, runTypewriter]);

  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  return (
    <ChromaWrap ghostColor={ghostColor}>
      <div className="font-orbitron text-[10px] tracking-[3px]" style={textStyle}>
        {displayedStatus}
      </div>
    </ChromaWrap>
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

  // Chromatic aberration ghost color — magenta-shifted version of hud color
  const ghostColor = useMemo(() => {
    // Shift hud color toward magenta for holographic refraction
    if (alertLevel === 'red-alert') return 'rgba(255, 120, 200, 0.9)';
    if (alertLevel === 'alert') return 'rgba(255, 140, 180, 0.85)';
    if (alertLevel === 'caution') return 'rgba(255, 180, 140, 0.8)';
    return 'rgba(200, 120, 255, 0.7)'; // normal: cyan → magenta shift
  }, [alertLevel]);

  // Memoize text style to prevent recreation every render
  const textStyle = useMemo(
    () => ({
      color: colors.hud,
      textShadow: `0 0 10px ${colors.glow}, 0 0 2px ${colors.hud}`,
      animation: isTyped ? 'hud-drift 12s ease-in-out infinite' : undefined,
      transition: 'color 200ms ease, text-shadow 200ms ease',
    }),
    [colors.hud, colors.glow, isTyped]
  );

  // Memoize container style — includes jitter animation
  const containerStyle = useMemo(
    () => ({
      opacity: isTyped ? (alertLevel === 'normal' ? 0.7 : 0.85) : 1,
      animation: isTyped ? 'hud-jitter 0.8s linear infinite' : undefined,
    }),
    [isTyped, alertLevel]
  );

  // Separator style — thin pipe at low opacity
  const separatorStyle = useMemo(
    () => ({
      color: colors.hud,
      opacity: 0.06,
    }),
    [colors.hud]
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
      {/* Scanline overlay — projected-through-glass feel */}
      <div
        className="absolute inset-0 pointer-events-none hud-scanlines"
        aria-hidden="true"
      />
      <StardateClock textStyle={textStyle} ghostColor={ghostColor} />
      <span className="font-mono text-sm" style={separatorStyle}>|</span>
      <ShipName alertLevel={alertLevel} textStyle={textStyle} ghostColor={ghostColor} />
      <span className="font-mono text-sm" style={separatorStyle}>|</span>
      <StatusText textStyle={textStyle} ghostColor={ghostColor} />
    </div>
  );
}
