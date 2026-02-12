'use client';

import { useShieldStore } from '@/lib/stores/shield-store';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useEffect, useRef } from 'react';

export function ShieldGaugeFace() {
  const overallPercent = useShieldStore((s) => s.overallPercent);
  const threatCount = useThreatStore((s) => s.threats.filter((t) => !t.deflected).length);
  const needleRef = useRef<HTMLDivElement>(null);
  const jitterRef = useRef<number>(0);

  // Target angle: 0% = -135deg (left), 100% = +135deg (right)
  // Gauge sweep is 270 degrees total
  const targetAngle = -135 + (overallPercent / 100) * 270;

  // Needle jitter -- imperative DOM updates (no React re-renders)
  useEffect(() => {
    const needle = needleRef.current;
    if (!needle) return;

    if (threatCount === 0) {
      // Static position -- CSS transition handles smooth movement
      needle.style.transform = `rotate(${targetAngle}deg)`;
      needle.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      return;
    }

    // Disable CSS transition during jitter animation
    needle.style.transition = 'none';

    let animId: number;
    const animate = () => {
      const jitterAmount = Math.min(threatCount * 2, 12);
      const speed = 0.08 + threatCount * 0.02;
      jitterRef.current += speed;
      const jitter = Math.sin(jitterRef.current) * jitterAmount +
                     Math.sin(jitterRef.current * 2.3) * (jitterAmount * 0.4);
      needle.style.transform = `rotate(${targetAngle + jitter}deg)`;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetAngle, threatCount]);

  // Gauge tick marks (every 10%)
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const pct = i * 10;
    const angle = -135 + (pct / 100) * 270;
    const isMajor = pct % 20 === 0;
    const isRedZone = pct <= 25;
    return { pct, angle, isMajor, isRedZone };
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Gauge housing */}
      <div
        className="relative"
        style={{
          width: '135px',
          height: '135px',
        }}
      >
        {/* Outer ring — dark metal bezel */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, rgba(40,50,70,0.8), rgba(20,25,40,0.9), rgba(40,50,70,0.8))',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.4)',
          }}
        />

        {/* Inner face — dark with subtle radial gradient */}
        <div
          className="absolute rounded-full"
          style={{
            inset: '6px',
            background: 'radial-gradient(circle at 40% 35%, rgba(20,25,40,1) 0%, rgba(8,10,20,1) 100%)',
          }}
        />

        {/* Red danger zone arc (0-25%) */}
        <svg
          className="absolute"
          style={{ inset: '8px' }}
          viewBox="0 0 100 100"
        >
          {/* Danger zone arc */}
          <path
            d={describeArc(50, 50, 42, -135, -135 + 67.5)}
            fill="none"
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Safe zone arc */}
          <path
            d={describeArc(50, 50, 42, -135 + 67.5, 135)}
            fill="none"
            stroke="rgba(0, 240, 255, 0.1)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Tick marks */}
        {ticks.map((tick) => (
          <div
            key={tick.pct}
            className="absolute"
            style={{
              width: '2px',
              height: tick.isMajor ? '14px' : '8px',
              left: '50%',
              top: '10px',
              marginLeft: '-1px',
              transformOrigin: `center ${135 / 2 - 10}px`,
              transform: `rotate(${tick.angle}deg)`,
              background: tick.isRedZone
                ? 'rgba(239, 68, 68, 0.6)'
                : 'rgba(0, 240, 255, 0.35)',
            }}
          />
        ))}

        {/* DANGER label */}
        <div
          className="absolute font-mono uppercase"
          style={{
            fontSize: '7px',
            left: '20px',
            bottom: '40px',
            color: 'rgba(239, 68, 68, 0.5)',
            letterSpacing: '0.5px',
            transform: 'rotate(-45deg)',
          }}
        >
          DANGER
        </div>

        {/* Center value readout */}
        <div
          className="absolute font-mono text-center"
          style={{
            left: '50%',
            bottom: '26px',
            transform: 'translateX(-50%)',
            fontSize: '17px',
            color: overallPercent <= 25 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 240, 255, 0.7)',
            textShadow: overallPercent <= 25
              ? '0 0 6px rgba(239, 68, 68, 0.4)'
              : '0 0 6px rgba(0, 240, 255, 0.3)',
          }}
        >
          {overallPercent.toFixed(1)}%
        </div>

        {/* Needle -- transform updated imperatively via ref (no React re-renders) */}
        <div
          ref={needleRef}
          className="absolute"
          style={{
            width: '2px',
            height: '48px',
            left: '50%',
            top: '20px',
            marginLeft: '-1px',
            transformOrigin: 'center 48px',
            transform: `rotate(${targetAngle}deg)`,
            background: 'linear-gradient(to bottom, rgba(255,200,50,0.9) 0%, rgba(255,120,20,0.7) 100%)',
            borderRadius: '1px',
            boxShadow: '0 0 4px rgba(255,160,30,0.4)',
          }}
        />

        {/* Center hub / pivot */}
        <div
          className="absolute rounded-full"
          style={{
            width: '12px',
            height: '12px',
            left: '50%',
            top: '50%',
            marginLeft: '-6px',
            marginTop: '-6px',
            background: 'radial-gradient(circle at 35% 35%, rgba(180,160,120,0.6), rgba(60,50,30,0.8))',
            boxShadow: '0 0 3px rgba(0,0,0,0.5)',
          }}
        />

        {/* Glass lens — convex reflection arc */}
        <div
          className="absolute inset-[4px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)',
          }}
        />
      </div>
    </div>
  );
}

/** SVG arc path helper */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
