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
  isPoweringOn: boolean;
  powerOnDelay: number;
}

export function ConsolePanel({ type, label, isPoweringOn, powerOnDelay }: ConsolePanelProps) {
  const { setOpenPanel } = useConsoleStore();
  const [isPowered, setIsPowered] = useState(false);

  useEffect(() => {
    if (isPoweringOn) {
      const timer = setTimeout(() => setIsPowered(true), powerOnDelay);
      return () => clearTimeout(timer);
    } else {
      setIsPowered(true);
    }
  }, [isPoweringOn, powerOnDelay]);

  return (
    <button
      onClick={() => setOpenPanel(type)}
      className="relative h-full bg-space-darker/80 border border-aurora-primary/20 rounded-lg overflow-hidden group hover:border-aurora-primary/40 transition-all cursor-pointer"
      style={{
        opacity: isPowered ? 1 : 0,
        transform: isPowered ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      }}
    >
      {/* CRT scanline effect */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)] pointer-events-none" />

      {/* Power-on scan line */}
      {isPoweringOn && isPowered && (
        <div
          className="absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent animate-scan"
          style={{ animationDelay: `${powerOnDelay}ms` }}
        />
      )}

      {/* Screen glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="relative h-full p-4 flex flex-col">
        <div className="font-orbitron text-[9px] tracking-[2px] text-cyan-400/60 uppercase mb-2">
          {label}
        </div>
        <div className="flex-1 flex items-center justify-center">
          {type === 'shields' && <ShieldsContent />}
          {type === 'networth' && <NetWorthContent />}
          {type === 'transactions' && <TransactionsContent />}
          {type === 'cards' && <CardsContent />}
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-cyan-500/40" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-cyan-500/40" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-cyan-500/40" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-cyan-500/40" />
    </button>
  );
}
