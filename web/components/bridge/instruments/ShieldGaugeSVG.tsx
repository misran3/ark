'use client';

import { useEffect, useState } from 'react';

interface ShieldGaugeSVGProps {
  /** Overall shield integrity 0-100 */
  value: number;
}

const RADIUS = 40;
const CENTER = 45;
const START_ANGLE = 135; // degrees, sweep starts bottom-left
const SWEEP = 270; // degrees total sweep

// Tick mark config
const MAJOR_TICKS = 11;
const MINOR_PER_MAJOR = 4;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * SVG circular dial gauge — drop-in replacement for ShieldGauge3D.
 * Same visual language: dark disc, tick marks (red danger zone 0-25),
 * spring-animated needle, glass specular arc.
 */
export function ShieldGaugeSVG({ value }: ShieldGaugeSVGProps) {
  const normalized = Math.max(0, Math.min(100, value)) / 100;
  const needleAngle = START_ANGLE + SWEEP * normalized;

  // Spring-like animation via CSS transition with overshoot bezier
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Build tick marks
  const ticks: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  const totalTicks = (MAJOR_TICKS - 1) * (MINOR_PER_MAJOR + 1) + 1;
  for (let i = 0; i < totalTicks; i++) {
    const t = i / (totalTicks - 1);
    const angle = START_ANGLE + SWEEP * t;
    const isMajor = i % (MINOR_PER_MAJOR + 1) === 0;
    const innerR = isMajor ? RADIUS * 0.72 : RADIUS * 0.80;
    const outerR = RADIUS * 0.88;
    const isDanger = t <= 0.25;
    const p1 = polarToCartesian(CENTER, CENTER, innerR, angle);
    const p2 = polarToCartesian(CENTER, CENTER, outerR, angle);
    ticks.push({
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      color: isDanger ? 'rgba(239, 68, 68, 0.6)' : 'rgba(74, 101, 128, 0.6)',
    });
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 90 90" className="w-full h-full max-w-[90px] max-h-[90px]">
        {/* Dial disc background */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#080c1a" opacity="0.9" />

        {/* Outer ring */}
        <circle
          cx={CENTER} cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#1a2235"
          strokeWidth={RADIUS * 0.08}
          opacity="0.8"
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1} y1={tick.y1}
            x2={tick.x2} y2={tick.y2}
            stroke={tick.color}
            strokeWidth={i % (MINOR_PER_MAJOR + 1) === 0 ? 0.8 : 0.4}
          />
        ))}

        {/* Needle — rotated line from center */}
        <g
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
            transform: `rotate(${mounted ? needleAngle : START_ANGLE}deg)`,
            transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Shadow */}
          <line
            x1={CENTER + 0.4}
            y1={CENTER + 0.4}
            x2={CENTER + 0.4}
            y2={CENTER - RADIUS * 0.62 + 0.4}
            stroke="black"
            strokeWidth="1.2"
            opacity="0.3"
            strokeLinecap="round"
          />
          {/* Needle body */}
          <line
            x1={CENTER}
            y1={CENTER + RADIUS * 0.1}
            x2={CENTER}
            y2={CENTER - RADIUS * 0.62}
            stroke="#00f0ff"
            strokeWidth="1"
            opacity="0.85"
            strokeLinecap="round"
          />
        </g>

        {/* Center pivot */}
        <circle cx={CENTER} cy={CENTER} r="2.5" fill="#1a2a3d" />
        <circle cx={CENTER} cy={CENTER} r="1.5" fill="#2a3a50" />

        {/* Glass specular arc */}
        <ellipse
          cx={CENTER - 5} cy={CENTER - 8}
          rx="14" ry="2.5"
          fill="#c0d8ff"
          opacity="0.06"
          transform={`rotate(-20 ${CENTER - 5} ${CENTER - 8})`}
        />

        {/* Glass vignette ring */}
        <circle
          cx={CENTER} cy={CENTER}
          r={RADIUS * 0.85}
          fill="none"
          stroke="black"
          strokeWidth={RADIUS * 0.3}
          opacity="0.08"
        />

        {/* Bezel rim */}
        <circle
          cx={CENTER} cy={CENTER}
          r={RADIUS * 0.99}
          fill="none"
          stroke="#2a3a50"
          strokeWidth="1.2"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
