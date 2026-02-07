'use client';

import { PanelPopup } from '../PanelPopup';
import { useShieldStore } from '@/lib/stores/shield-store';

export function ShieldsPopup() {
  const shieldsMap = useShieldStore((state) => state.shields);
  const shields = Object.values(shieldsMap);

  return (
    <PanelPopup type="shields" title="Shield Status - Detailed View">
      <div className="space-y-4">
        {shields.map((shield) => (
          <div key={shield.id} className="glass-panel glass-panel-level-2 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-orbitron text-lg font-semibold text-white">
                  {shield.icon} {shield.name}
                </div>
                <div className="font-rajdhani text-sm text-white/60">
                  {shield.budgetCategory.charAt(0).toUpperCase() + shield.budgetCategory.slice(1)} ({shield.budgetAllocationPct}% allocation)
                </div>
              </div>
              <div className="text-right">
                <div className="font-orbitron text-2xl font-bold text-green-400">
                  {Math.round(shield.currentPercent)}%
                </div>
                <div className="font-mono text-xs text-white/40 uppercase">
                  {shield.status}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-black/40 rounded-full overflow-hidden mb-2">
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <div className="text-white/40 text-xs">Spent</div>
                <div className="font-orbitron text-white">${shield.actualSpendAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs">Budgeted</div>
                <div className="font-orbitron text-white">${shield.budgetAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Subcategories */}
            {shield.subcategories.length > 0 && (
              <div className="space-y-1.5 border-t border-aurora-primary/10 pt-2">
                {shield.subcategories.map((sub) => (
                  <div key={sub.name} className="flex items-center gap-2 text-xs">
                    <span className="text-white/50 w-20 truncate">{sub.name}</span>
                    <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(sub.percentUsed, 100)}%`,
                          background: sub.percentUsed > 100 ? '#ef4444' : '#10b981',
                        }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] w-10 text-right ${sub.percentUsed > 100 ? 'text-red-400' : 'text-white/50'}`}>
                      {sub.percentUsed}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PanelPopup>
  );
}
