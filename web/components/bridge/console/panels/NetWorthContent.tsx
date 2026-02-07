'use client';

import { useFinancialSnapshot } from '@/hooks/useFinancialData';

export function NetWorthContent() {
  const { data, isLoading } = useFinancialSnapshot();

  if (isLoading || !data) {
    return (
      <div className="font-mono text-[9px] text-cyan-400/40">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <div className="text-center">
        <div className="font-orbitron text-xl font-bold text-cyan-400">
          ${(data.total_net_worth / 1000).toFixed(1)}K
        </div>
        <div className="font-mono text-[8px] text-white/40 uppercase tracking-wider">
          Net Worth
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div className="text-center">
          <div className="text-green-400 font-orbitron font-semibold">
            +${(data.monthly_income / 1000).toFixed(1)}K
          </div>
          <div className="text-white/30 uppercase">Income</div>
        </div>
        <div className="text-center">
          <div className="text-red-400 font-orbitron font-semibold">
            -${(data.monthly_spending / 1000).toFixed(1)}K
          </div>
          <div className="text-white/30 uppercase">Spending</div>
        </div>
      </div>
    </div>
  );
}
