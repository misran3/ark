'use client';

import { useShieldStore } from '@/lib/stores/shield-store';

export function ShieldsContent() {
  const shieldsMap = useShieldStore((state) => state.shields);
  const shields = Object.values(shieldsMap);
  const overallPercent = useShieldStore((state) => state.overallPercent);

  return (
    <div className="space-y-2 w-full">
      {/* Overall status */}
      <div className="text-center mb-3">
        <div className="font-orbitron text-2xl font-bold text-green-400">
          {Math.round(overallPercent)}%
        </div>
        <div className="font-mono text-[9px] text-white/40 uppercase tracking-wider">
          Overall Integrity
        </div>
      </div>

      {/* Mini shield bars */}
      {shields.map((shield) => (
        <div key={shield.id} className="flex items-center gap-2">
          <div className="font-mono text-[9px] text-cyan-400/60 w-16 truncate">
            {shield.name}
          </div>
          <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${shield.currentPercent}%`,
                background:
                  shield.status === 'optimal' || shield.status === 'nominal'
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : shield.status === 'caution'
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
          <div className="font-orbitron text-[9px] text-cyan-400/60 w-8 text-right">
            {Math.round(shield.currentPercent)}%
          </div>
        </div>
      ))}
    </div>
  );
}
