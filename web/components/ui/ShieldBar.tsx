'use client';

import { Shield } from '@/lib/stores/shield-store';
import { useMemo } from 'react';

interface ShieldBarProps {
  shield: Shield;
  variant?: 'compact' | 'standard';
  className?: string;
}

export function ShieldBar({
  shield,
  variant = 'standard',
  className = '',
}: ShieldBarProps) {
  const isCompact = variant === 'compact';

  // Status color mapping
  const statusColorMap: Record<Shield['status'], { text: string; bar: string }> = useMemo(
    () => ({
      optimal: {
        text: 'text-green-500',
        bar: 'from-green-500 to-cyan-500',
      },
      nominal: {
        text: 'text-green-400',
        bar: 'from-green-400 to-cyan-400',
      },
      caution: {
        text: 'text-yellow-500',
        bar: 'from-yellow-500 to-amber-500',
      },
      warning: {
        text: 'text-orange-500',
        bar: 'from-orange-500 to-red-500',
      },
      critical: {
        text: 'text-red-500',
        bar: 'from-red-500 to-red-700',
      },
      breached: {
        text: 'text-red-600',
        bar: 'from-red-600 to-red-900',
      },
    }),
    []
  );

  const colors = statusColorMap[shield.status];

  // Determine if pulse animation should be applied
  const shouldPulse = shield.status === 'warning' || shield.status === 'critical';

  if (isCompact) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {/* Label and Percentage */}
        <div className="flex items-center justify-between">
          <span className="font-orbitron text-[8px] opacity-35 uppercase tracking-wider">
            {shield.name}
          </span>
          <span className={`font-orbitron text-[8px] font-semibold ${colors.text}`}>
            {Math.round(shield.currentPercent)}%
          </span>
        </div>

        {/* Bar */}
        <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/[0.025]">
          <div
            className={`h-full w-full bg-gradient-to-r ${colors.bar} transition-all duration-300 ease-out ${
              shouldPulse ? 'animate-pulse-shield' : ''
            }`}
            style={{
              width: `${shield.currentPercent}%`,
            }}
          />
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Icon, Name, and Percentage */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{shield.icon}</span>
          <div className="flex flex-col">
            <span className="font-orbitron text-[10px] font-semibold uppercase tracking-wider text-white/95">
              {shield.name}
            </span>
            <span className="font-rajdhani text-[9px] uppercase tracking-wider text-white/40">
              {shield.budgetCategory}
            </span>
          </div>
        </div>
        <span className={`font-orbitron text-sm font-bold ${colors.text}`}>
          {Math.round(shield.currentPercent)}%
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-white/[0.025]">
        <div
          className={`h-full w-full bg-gradient-to-r ${colors.bar} transition-all duration-300 ease-out ${
            shouldPulse ? 'animate-pulse-shield' : ''
          }`}
          style={{
            width: `${shield.currentPercent}%`,
          }}
        />
      </div>

      {/* Subcategory text */}
      <span className="font-rajdhani text-[10px] uppercase tracking-wider opacity-40">
        {shield.budgetCategory === 'needs' && 'Essential Expenses'}
        {shield.budgetCategory === 'wants' && 'Discretionary Spending'}
        {shield.budgetCategory === 'savings' && 'Wealth Accumulation'}
      </span>
    </div>
  );
}
