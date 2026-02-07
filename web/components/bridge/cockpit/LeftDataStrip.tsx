// web/components/bridge/cockpit/LeftDataStrip.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useShieldStore } from '@/lib/stores/shield-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';

/**
 * Left Frame Vertical Data Strip — 50px wide
 *
 * Narrow recessed panel with 4 small stacked analog readouts:
 * - Mission clock (enhanced analog styling)
 * - Ship heading (slowly drifting decorative value)
 * - Fuel status (tiny gauge)
 * - System readout
 *
 * Non-interactive ambient instruments using same analog design language.
 */
export function LeftDataStrip() {
  const overallPercent = useShieldStore((state) => state.overallPercent);
  const alertLevel = useAlertStore((state) => state.level);
  const colors = ALERT_COLORS[alertLevel];
  const [missionTime, setMissionTime] = useState('00:00:00');
  const [heading, setHeading] = useState(127.4);
  const [fuelPercent, setFuelPercent] = useState(84);
  const [sysLoad, setSysLoad] = useState(42);
  const headingRef = useRef(127.4);

  // Mission clock
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setMissionTime(`${h}:${m}:${s}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Slowly drifting decorative values
  useEffect(() => {
    const interval = setInterval(() => {
      // Heading drifts slowly ±0.1-0.3 degrees
      headingRef.current += (Math.random() - 0.48) * 0.3;
      if (headingRef.current > 360) headingRef.current -= 360;
      if (headingRef.current < 0) headingRef.current += 360;
      setHeading(Math.round(headingRef.current * 10) / 10);

      // Fuel slowly decreases
      setFuelPercent((prev) => Math.max(60, prev - Math.random() * 0.02));

      // System load varies
      setSysLoad(Math.round(38 + Math.random() * 12));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Heading needle rotation (0-360 mapped to 0-360deg)
  const headingNeedleAngle = heading;

  return (
    <div className="absolute top-6 left-0 w-[50px] bottom-[220px] z-15 pointer-events-none">
      {/* Recessed strip panel */}
      <div
        className="absolute inset-x-[3px] top-4 bottom-4 rounded-sm"
        style={{
          background: 'linear-gradient(180deg, rgba(8, 12, 28, 0.9) 0%, rgba(6, 10, 22, 0.95) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(80, 110, 150, 0.06), ' +
            'inset 0 2px 6px rgba(0, 0, 0, 0.5), ' +
            '0 1px 3px rgba(0, 0, 0, 0.3)',
        }}
      />

      <div className="relative flex flex-col items-center pt-8 gap-5 h-full px-1">
        {/* ===== READOUT 1: Mission Clock (analog enhanced) ===== */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px' }}>
            TIME
          </div>
          {/* Clock housing */}
          <div
            className="relative w-[38px] rounded-sm overflow-hidden"
            style={{
              background: 'rgba(2, 5, 14, 0.9)',
              border: '1px solid rgba(80, 120, 160, 0.08)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
              padding: '3px 2px',
            }}
          >
            {/* Mechanical digit display */}
            <div
              className="font-mono text-center leading-none"
              style={{
                fontSize: '7px',
                color: colors.hud,
                opacity: 0.7,
                textShadow: `0 0 4px ${colors.hud}`,
                letterSpacing: '0.5px',
              }}
            >
              {missionTime}
            </div>
            {/* Digit separator groove */}
            <div className="absolute top-0 bottom-0 left-[15px] w-px" style={{ background: 'rgba(255,255,255,0.03)' }} />
            <div className="absolute top-0 bottom-0 right-[15px] w-px" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>

        {/* ===== READOUT 2: Ship Heading (tiny compass gauge) ===== */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px' }}>
            HDG
          </div>
          {/* Compass bezel */}
          <div
            className="relative w-[28px] h-[28px] rounded-full"
            style={{
              background: 'rgba(2, 5, 14, 0.9)',
              border: '1px solid rgba(80, 120, 160, 0.1)',
              boxShadow:
                'inset 0 1px 3px rgba(0, 0, 0, 0.5), ' +
                '0 0 0 1px rgba(140, 170, 210, 0.05)',
            }}
          >
            {/* Tick marks (N, E, S, W) */}
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  width: '1px',
                  height: '4px',
                  background: 'rgba(200, 220, 255, 0.12)',
                  transformOrigin: '50% 0',
                  transform: `translate(-50%, -13px) rotate(${deg}deg)`,
                }}
              />
            ))}
            {/* Needle */}
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                width: '1px',
                height: '10px',
                background: `linear-gradient(0deg, transparent, ${colors.hud})`,
                transformOrigin: '50% 100%',
                transform: `translate(-50%, -10px) rotate(${headingNeedleAngle}deg)`,
                opacity: 0.6,
                transition: 'transform 3s ease-in-out',
              }}
            />
            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 w-[3px] h-[3px] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 35% 35%, rgba(180, 200, 230, 0.15), rgba(40, 50, 70, 0.4))',
              }}
            />
            {/* Glass lens highlight */}
            <div
              className="absolute inset-[2px] rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(200, 220, 255, 0.04) 0%, transparent 50%)',
              }}
            />
          </div>
          {/* Digital readout below */}
          <div
            className="font-mono"
            style={{
              fontSize: '6px',
              color: colors.hud,
              opacity: 0.45,
            }}
          >
            {heading.toFixed(1)}°
          </div>
        </div>

        {/* ===== READOUT 3: Fuel Status (tiny vertical gauge) ===== */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px' }}>
            FUEL
          </div>
          {/* Gauge housing */}
          <div
            className="relative w-[10px] h-[40px] rounded-sm"
            style={{
              background: 'rgba(2, 5, 14, 0.9)',
              border: '1px solid rgba(80, 120, 160, 0.08)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute right-0"
                style={{
                  bottom: `${pct}%`,
                  width: '3px',
                  height: '1px',
                  background: pct <= 25 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(200, 220, 255, 0.08)',
                }}
              />
            ))}
            {/* Fill bar */}
            <div
              className="absolute bottom-0 left-[1px] right-[1px] rounded-sm transition-all duration-3000"
              style={{
                height: `${Math.round(fuelPercent)}%`,
                background: fuelPercent > 25
                  ? `linear-gradient(0deg, ${colors.hud}, rgba(0, 200, 220, 0.3))`
                  : 'linear-gradient(0deg, #ef4444, rgba(239, 68, 68, 0.3))',
                opacity: 0.5,
                boxShadow: `0 0 3px ${fuelPercent > 25 ? colors.hud : '#ef4444'}`,
              }}
            />
            {/* Glass tube highlight */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: 'linear-gradient(90deg, rgba(200, 220, 255, 0.03) 0%, transparent 40%)',
              }}
            />
          </div>
          <div
            className="font-mono"
            style={{ fontSize: '6px', color: colors.hud, opacity: 0.45 }}
          >
            {Math.round(fuelPercent)}%
          </div>
        </div>

        {/* ===== READOUT 4: System Load ===== */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px' }}>
            SYS
          </div>
          {/* Small arc gauge */}
          <div
            className="relative w-[28px] h-[16px] overflow-hidden"
          >
            <svg viewBox="0 0 28 16" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 3 15 A 12 12 0 0 1 25 15"
                fill="none"
                stroke="rgba(80, 120, 160, 0.1)"
                strokeWidth="2"
              />
              {/* Active arc */}
              <path
                d="M 3 15 A 12 12 0 0 1 25 15"
                fill="none"
                stroke={colors.hud}
                strokeWidth="2"
                strokeDasharray={`${(sysLoad / 100) * 34.5} 34.5`}
                opacity={0.4}
              />
              {/* Needle */}
              <line
                x1="14"
                y1="15"
                x2={14 + 9 * Math.cos(Math.PI - (sysLoad / 100) * Math.PI)}
                y2={15 + 9 * Math.sin(Math.PI - (sysLoad / 100) * Math.PI)}
                stroke={colors.hud}
                strokeWidth="0.8"
                opacity={0.5}
              />
              {/* Center pivot */}
              <circle cx="14" cy="15" r="1.5" fill="rgba(120, 150, 180, 0.15)" />
            </svg>
          </div>
          <div
            className="font-mono"
            style={{ fontSize: '6px', color: colors.hud, opacity: 0.45 }}
          >
            {sysLoad}%
          </div>
        </div>
      </div>
    </div>
  );
}
