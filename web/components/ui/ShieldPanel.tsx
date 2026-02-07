'use client';

import { useShieldStore } from '@/lib/stores/shield-store';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ShieldBar } from '@/components/ui/ShieldBar';
import { useMemo } from 'react';

interface ShieldPanelProps {
  variant?: 'compact' | 'standard';
  className?: string;
}

export function ShieldPanel({
  variant = 'standard',
  className = '',
}: ShieldPanelProps) {
  const { shields, overallPercent } = useShieldStore();
  const isCompact = variant === 'compact';

  // Get status for overall percent
  const getOverallStatus = useMemo(() => {
    if (overallPercent >= 90) return 'optimal';
    if (overallPercent >= 75) return 'nominal';
    if (overallPercent >= 60) return 'caution';
    if (overallPercent >= 40) return 'warning';
    if (overallPercent >= 20) return 'critical';
    return 'breached';
  }, [overallPercent]);

  const glassLevel = isCompact ? 1 : 2;
  const spacing = isCompact ? 'gap-3' : 'gap-4';

  return (
    <GlassPanel level={glassLevel} className={`p-4 ${className}`}>
      <div className={`flex flex-col ${spacing}`}>
        {/* Individual Shields */}
        {Object.values(shields).map((shield) => (
          <ShieldBar
            key={shield.id}
            shield={shield}
            variant={variant}
          />
        ))}

        {/* Divider */}
        <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Overall Shield Integrity */}
        <div className="flex flex-col gap-2">
          <span className={`font-orbitron text-[${isCompact ? '7px' : '9px'}] uppercase tracking-widest text-white/60`}>
            Overall Shield Integrity
          </span>

          {/* Overall Bar */}
          <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-white/[0.025]">
            <div
              className="h-full w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 transition-all duration-300 ease-out"
              style={{
                width: `${overallPercent}%`,
              }}
            />
          </div>

          {/* Percentage and Status */}
          <div className="flex items-center justify-between">
            <span className={`font-orbitron text-[${isCompact ? '7px' : '10px'}] font-semibold uppercase tracking-wider text-white/70`}>
              {Math.round(overallPercent)}%
            </span>
            <span className={`font-rajdhani text-[${isCompact ? '7px' : '9px'}] uppercase tracking-wider text-white/50`}>
              Status: {getOverallStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
