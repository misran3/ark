'use client';

import { useConsoleStore, type PanelType } from '@/lib/stores/console-store';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';
import { useState, useEffect } from 'react';
import { ShieldsContent } from './panels/ShieldsContent';
import { NetWorthContent } from './panels/NetWorthContent';
import { TransactionsContent } from './panels/TransactionsContent';
import { CardsContent } from './panels/CardsContent';

interface ConsolePanelProps {
  type: PanelType;
  label: string;
  moduleId: string;
  classification: string;
  revision: string;
  isPoweringOn: boolean;
  powerOnDelay: number;
  priority?: number;
  isWarning?: boolean;
  /** Per-panel backlight color tint — ±2-3 RGB for aged bulb variation */
  backlightTint?: string;
}

export function ConsolePanel({
  type,
  label,
  moduleId,
  classification,
  revision,
  isPoweringOn,
  powerOnDelay,
  priority,
  isWarning = false,
  backlightTint = 'rgba(0, 240, 255, 0.03)',
}: ConsolePanelProps) {
  const { setOpenPanel } = useConsoleStore();
  const alertLevel = useAlertStore((state) => state.level);
  const cascadeStage = useAlertStore((state) => state.cascadeStage);
  const [isPowered, setIsPowered] = useState(false);
  const [showStatic, setShowStatic] = useState(false);

  // Backlight responds at cascade stage 'backlight' (stage 4)
  const backlightReached = cascadeStage === 'idle' || ['backlight', 'instruments'].includes(cascadeStage);
  const alertBacklight = backlightReached && alertLevel !== 'normal'
    ? ALERT_COLORS[alertLevel].glow
    : backlightTint;

  useEffect(() => {
    if (isPoweringOn) {
      const timer = setTimeout(() => setIsPowered(true), powerOnDelay);
      return () => clearTimeout(timer);
    } else {
      setIsPowered(true);
    }
  }, [isPoweringOn, powerOnDelay]);

  // Brief static burst on power-on
  useEffect(() => {
    if (isPowered && isPoweringOn) {
      setShowStatic(true);
      const timer = setTimeout(() => setShowStatic(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isPowered, isPoweringOn]);

  return (
    <div className="relative h-full">
      {/* ===== INSTRUMENT WELL: Physically recessed housing ===== */}
      <div className="instrument-well h-full relative">
        {/* Multi-step inset bevel (matching glass bevel language) */}
        {/* Step 1: Outer highlight — light catching well rim */}
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(160, 180, 210, 0.08)',
          }}
        />
        {/* Step 2: Mid-thickness depth band */}
        <div
          className="absolute pointer-events-none rounded"
          style={{
            inset: '1px',
            boxShadow:
              'inset 0 0 0 2px rgba(4, 8, 20, 0.8), ' +
              'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        />
        {/* Step 3: Inner shadow lip */}
        <div
          className="absolute pointer-events-none rounded"
          style={{
            inset: '3px',
            boxShadow: 'inset 0 0 0 1px rgba(80, 110, 150, 0.05)',
          }}
        />

        {/* Visible backplate — slightly lighter metal (removable instrument module) */}
        <div
          className="absolute rounded pointer-events-none"
          style={{
            inset: '4px',
            background:
              'linear-gradient(180deg, rgba(18, 24, 42, 0.95) 0%, rgba(12, 16, 32, 0.98) 100%)',
          }}
        />

        {/* Inner shadow — darkening at bottom (light from above) */}
        <div
          className="absolute pointer-events-none rounded"
          style={{
            inset: '4px',
            background: 'linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.2) 100%)',
          }}
        />

        {/* Ambient occlusion — shadows at well-to-dashboard junction */}
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            boxShadow:
              '0 1px 4px rgba(0, 0, 0, 0.4), ' +
              '0 0 8px rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Mounting fasteners — 4 corner dots (matching hull rivets) */}
        <div className="absolute top-[3px] left-[3px] w-[5px] h-[5px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(180, 195, 220, 0.12), rgba(30, 40, 60, 0.4))',
            boxShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
          }}
        />
        <div className="absolute top-[3px] right-[3px] w-[5px] h-[5px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(180, 195, 220, 0.1), rgba(30, 40, 60, 0.4))',
            boxShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
          }}
        />
        <div className="absolute bottom-[3px] left-[3px] w-[5px] h-[5px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(180, 195, 220, 0.1), rgba(30, 40, 60, 0.4))',
            boxShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
          }}
        />
        <div className="absolute bottom-[3px] right-[3px] w-[5px] h-[5px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(180, 195, 220, 0.1), rgba(30, 40, 60, 0.4))',
            boxShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
          }}
        />

        {/* ===== INSTRUMENT CONTENT (inside well, on backplate) ===== */}
        <div className="absolute inset-[5px] relative overflow-hidden rounded-sm">
          {/* Backlight warmup — per-panel aged bulb tint, shifts on alert cascade stage 4 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${alertBacklight} 0%, transparent 70%)`,
              transition: 'background 0.3s ease-out',
            }}
          />

          {/* Eject latch details (top corners) */}
          <div className="absolute top-0 left-0 w-3 h-1.5 border-b border-r border-cyan-500/20 rounded-br-sm z-10" />
          <div className="absolute top-0 right-0 w-3 h-1.5 border-b border-l border-cyan-500/20 rounded-bl-sm z-10" />

          {/* Data port indicator */}
          <div
            className="absolute top-1 right-1.5 w-[4px] h-[4px] rounded-full z-10"
            style={{
              background: isPowered ? '#22c55e' : '#374151',
              boxShadow: isPowered ? '0 0 4px #22c55e' : 'none',
            }}
          />

          {/* Priority marker */}
          {priority && (
            <div className="absolute top-1 left-1.5 hull-stencil z-10" style={{ fontSize: '5px', color: 'rgba(0, 240, 255, 0.25)' }}>
              PRI-{priority}
            </div>
          )}

          {/* Caution stripe (warning state) */}
          {isWarning && (
            <div className="absolute top-0 left-0 right-0 h-[3px] caution-stripe z-10" />
          )}

          {/* CRT Screen area (clickable) */}
          <button
            onClick={() => setOpenPanel(type)}
            className="relative w-full h-full crt-screen cursor-pointer group"
            style={{
              opacity: isPowered ? 1 : 0,
              animation: isPowered && isPoweringOn ? `crt-warmup 1.2s ease-out ${powerOnDelay}ms both` : undefined,
            }}
          >
            {/* Static burst overlay */}
            {showStatic && (
              <div
                className="absolute inset-0 z-10"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,255,255,0.1) 1px, transparent 3px)',
                  animation: 'crt-static-burst 150ms ease-out',
                }}
              />
            )}

            {/* Barrel distortion darkening (corners) */}
            <div
              className="absolute inset-0 pointer-events-none rounded"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)',
              }}
            />

            {/* Screen glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Module header label */}
            <div className="relative px-3 pt-2 pb-1">
              <div className="font-mono text-[8px] tracking-[2px] text-cyan-400/50 uppercase">
                {moduleId}: {label}
              </div>
              <div className="font-mono text-[6px] text-cyan-400/25 uppercase tracking-wider">
                CLASS: {classification}
              </div>
            </div>

            {/* Panel content */}
            <div className="relative flex-1 flex items-center justify-center px-3 pb-2">
              {type === 'shields' && <ShieldsContent />}
              {type === 'networth' && <NetWorthContent />}
              {type === 'transactions' && <TransactionsContent />}
              {type === 'cards' && <CardsContent />}
            </div>

            {/* Revision stamp */}
            <div className="absolute bottom-1 right-2 hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.06)' }}>
              {revision}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
