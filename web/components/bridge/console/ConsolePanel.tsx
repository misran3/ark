'use client';

import { useConsoleStore, type PanelType } from '@/lib/stores/console-store';
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
}: ConsolePanelProps) {
  const { setOpenPanel } = useConsoleStore();
  const [isPowered, setIsPowered] = useState(false);
  const [showStatic, setShowStatic] = useState(false);

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
      {/* Console well (recessed housing) */}
      <div className="console-well h-full relative overflow-hidden">
        {/* Eject latch details (top corners) */}
        <div className="absolute top-0 left-0 w-3 h-1.5 border-b border-r border-cyan-500/20 rounded-br-sm" />
        <div className="absolute top-0 right-0 w-3 h-1.5 border-b border-l border-cyan-500/20 rounded-bl-sm" />

        {/* Data port indicator */}
        <div
          className="absolute top-1 right-1.5 w-[4px] h-[4px] rounded-full"
          style={{
            background: isPowered ? '#22c55e' : '#374151',
            boxShadow: isPowered ? '0 0 4px #22c55e' : 'none',
          }}
        />

        {/* Priority marker */}
        {priority && (
          <div className="absolute top-1 left-1.5 hull-stencil" style={{ fontSize: '5px', color: 'rgba(0, 240, 255, 0.25)' }}>
            PRI-{priority}
          </div>
        )}

        {/* Caution stripe (warning state) */}
        {isWarning && (
          <div className="absolute top-0 left-0 right-0 h-[3px] caution-stripe" />
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
  );
}
