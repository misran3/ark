'use client';

import { useEffect, useState } from 'react';
import { useSeamlessTransition } from '@/hooks/useSeamlessTransition';
import { useFinancialSnapshot, useBudgetReport } from '@/hooks/useFinancialData';

export default function BridgePage() {
  const [stardate, setStardate] = useState('');
  const { transitionTo } = useSeamlessTransition();
  const { data: snapshot } = useFinancialSnapshot();
  const { data: budget } = useBudgetReport();

  useEffect(() => {
    const updateStardate = () => {
      const d = new Date();
      setStardate(
        `SD ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} — ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    };

    updateStardate();
    const interval = setInterval(updateStardate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      {/* Top Frame */}
      <div className="h-11 bg-gradient-to-b from-space-dark/95 to-space-dark/80 flex items-center justify-between px-5 border-b border-aurora-primary/10 flex-shrink-0 relative">
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-aurora-primary/20 to-transparent" />

        <div>
          <div className="font-orbitron font-black text-xs tracking-[2px] aurora-text">
            SYNESTHESIAPAY
          </div>
          <div className="font-orbitron text-[7px] tracking-[5px] text-aurora-primary/25 -mt-0.5">
            BRIDGE COMMAND v4.0
          </div>
        </div>

        <div className="font-mono text-[10px] text-aurora-primary/35">
          {stardate}
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-aurora-tertiary/10 border border-aurora-tertiary/20">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a0a3a] to-[#0a2a4a] border-[1.5px] border-aurora-tertiary flex items-center justify-center text-[11px]">
            🧑‍🚀
          </div>
          <div className="font-orbitron text-[8px] text-aurora-primary leading-tight">
            CMDR. NOVA-7<br />
            <span className="text-[7px] text-aurora-primary/25">LVL 12 · FLEET CAPTAIN</span>
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative min-h-0">
        {/* Side beams */}
        <div className="side-panels absolute left-0 top-0 bottom-0 w-7 bg-gradient-to-r from-space-darker to-space-dark border-r border-aurora-primary/5" />
        <div className="side-panels absolute right-0 top-0 bottom-0 w-7 bg-gradient-to-l from-space-darker to-space-dark border-l border-aurora-primary/5" />

        {/* HUD Corners */}
        <div className="absolute top-8 left-8 w-[30px] h-[30px] border-t border-l border-aurora-primary/10 pointer-events-none" />
        <div className="absolute top-8 right-8 w-[30px] h-[30px] border-t border-r border-aurora-primary/10 pointer-events-none" />
        <div className="absolute bottom-1 left-8 w-[30px] h-[30px] border-b border-l border-aurora-primary/10 pointer-events-none" />
        <div className="absolute bottom-1 right-8 w-[30px] h-[30px] border-b border-r border-aurora-primary/10 pointer-events-none" />

        {/* HUD Labels */}
        <div className="absolute top-9 left-[66px] font-orbitron text-[6px] tracking-[3px] text-aurora-primary/15 pointer-events-none">
          FORWARD VIEWPORT
        </div>
        <div className="absolute top-9 right-[66px] font-orbitron text-[6px] tracking-[3px] text-aurora-primary/15 pointer-events-none">
          SECTOR 7G-FINANCE
        </div>

        {/* Captain Nova UI is now in the layout (persists across routes) */}
      </div>

      {/* Console */}
      <div className="h-[220px] flex-shrink-0 relative bg-gradient-to-t from-space-dark via-space-dark/98 to-space-dark/95 border-t border-aurora-primary/10 flex gap-px p-px">
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-aurora-primary/15 to-transparent" />

        {/* Shield Panel */}
        <div className="flex-[0_0_180px] glass flex flex-col">
          <div className="font-orbitron text-[6.5px] tracking-[3px] text-aurora-primary/25 p-2 pb-1 uppercase flex-shrink-0">
            🛡 Shield Status
          </div>
          <div className="flex-1 overflow-y-auto p-2 pt-1 min-h-0 space-y-2">
            {[
              { name: 'Budget Integrity', value: budget?.overall_health || 72, gradient: 'from-green-500 to-cyan-500' },
              { name: 'Savings Trajectory', value: budget?.savings.actual_pct ? Math.min(100, (budget.savings.actual_pct / budget.savings.target_pct) * 100) : 91, gradient: 'from-yellow-500 to-purple-500' },
              { name: 'Spending Control', value: budget?.wants.actual_pct ? Math.max(0, 100 - (budget.wants.actual_pct / budget.wants.target_pct) * 50) : 58, gradient: 'from-red-500 to-yellow-500' },
            ].map((shield, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="opacity-35 text-[8px] tracking-wide">{shield.name}</span>
                  <span className={`font-orbitron text-[8px] ${shield.value > 80 ? 'text-green-500' : shield.value > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {shield.value}%
                  </span>
                </div>
                <div className="h-[2.5px] bg-white/[0.025] rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm bg-gradient-to-r ${shield.gradient} transition-all duration-1000`}
                    style={{ width: `${shield.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Command Center */}
        <div
          onClick={() => transitionTo('/command-center')}
          className="flex-1 glass flex flex-col cursor-pointer hover:bg-aurora-primary/[0.015] transition-colors"
        >
          <div className="font-orbitron text-[6.5px] tracking-[3px] text-aurora-primary/25 p-2 pb-1 uppercase flex-shrink-0">
            ◆ Command Center
          </div>
          <div className="flex-1 p-2 pt-1 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                { label: 'NET WORTH', value: snapshot ? `$${snapshot.total_net_worth.toLocaleString()}` : '$47,832', color: 'text-cyan-500' },
                { label: 'INCOME', value: snapshot ? `$${snapshot.monthly_income.toLocaleString()}` : '$6,240', color: 'text-green-500' },
                { label: 'SPENDING', value: snapshot ? `$${snapshot.monthly_spending.toLocaleString()}` : '$3,891', color: 'text-purple-500' },
                { label: 'SAVINGS', value: snapshot ? `$${(snapshot.accounts.find(a => a.type === 'savings')?.balance || 18400) >= 1000 ? ((snapshot.accounts.find(a => a.type === 'savings')?.balance || 18400) / 1000).toFixed(1) + 'K' : (snapshot.accounts.find(a => a.type === 'savings')?.balance || 18400)}` : '$18.4K', color: 'text-yellow-500' },
              ].map((metric, i) => (
                <div key={i} className="text-center p-1.5 bg-aurora-primary/[0.012] border border-aurora-primary/[0.03] rounded-[3px]">
                  <div className="font-orbitron text-[5.5px] tracking-[2px] opacity-25 mb-0.5">
                    {metric.label}
                  </div>
                  <div className={`font-orbitron text-base font-bold leading-none ${metric.color}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center p-1 font-orbitron text-[6px] tracking-[3px] text-aurora-primary/20 border-t border-aurora-primary/[0.03] mt-auto">
            ▲ EXPAND COMMAND CENTER ▲
          </div>
        </div>

        {/* Transaction Log */}
        <div className="flex-[0_0_240px] glass flex flex-col">
          <div className="font-orbitron text-[6.5px] tracking-[3px] text-aurora-primary/25 p-2 pb-1 uppercase flex-shrink-0">
            ◈ Transaction Log
          </div>
          <div className="flex-1 overflow-y-auto p-2 pt-1 min-h-0 space-y-1">
            {[
              { icon: '🛸', name: 'Uber Ride', category: 'Transport', amount: -18.50 },
              { icon: '🍜', name: 'Chipotle', category: 'Dining', amount: -12.40 },
              { icon: '💰', name: 'Payroll', category: 'Income', amount: 3120 },
              { icon: '🎮', name: 'Steam', category: 'Entertain', amount: -29.99 },
            ].map((tx, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 border-b border-white/[0.015]">
                <div className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[9px] bg-aurora-primary/[0.02] border border-aurora-primary/[0.04] flex-shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                    {tx.name}
                  </div>
                  <div className="text-[7px] opacity-20 tracking-wide uppercase">
                    {tx.category}
                  </div>
                </div>
                <div className={`font-orbitron text-[9px] font-bold flex-shrink-0 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
