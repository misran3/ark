'use client';

import { useEffect, useState, useRef } from 'react';
import { useSeamlessTransition } from '@/hooks/useSeamlessTransition';
import { useFinancialSnapshot, useBudgetReport } from '@/hooks/useFinancialData';
import { useModalStore } from '@/lib/stores/modal-store';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useShieldStore } from '@/lib/stores/shield-store';
import { useTransitionStore } from '@/lib/stores/transition-store';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ShieldPanel } from '@/components/ui/ShieldPanel';
import { DataContainer } from '@/components/ui/DataContainer';
import { SpaceErrorBoundary } from '@/components/ui/SpaceErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BridgePage() {
  const [stardate, setStardate] = useState('');
  const { transitionTo } = useSeamlessTransition();
  const commandCenterPanelRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useTransitionStore((state) => state.isTransitioning);
  const {
    data: snapshot,
    isLoading: snapshotLoading,
    isError: snapshotError,
    error: snapshotErrorObj,
    refetch: refetchSnapshot,
    isRefetching: snapshotRefetching
  } = useFinancialSnapshot();
  const { data: budget } = useBudgetReport();
  const { openTransactionModal } = useModalStore();
  const { threats } = useThreatStore();
  const { shields, overallPercent } = useShieldStore();

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

  // Calculate active threats count
  const activeThreats = threats.filter((t) => !t.deflected);
  const hasCriticalThreats = activeThreats.some((t) => t.severity === 'danger');

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      {/* Top Bar HUD */}
      <div className="bridge-content h-[60px] bg-space-dark/80 backdrop-blur-lg flex items-center justify-between px-6 border-b border-aurora-primary/10 flex-shrink-0 relative">
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-aurora-primary/20 to-transparent" />

        {/* Stardate Clock */}
        <div className="font-mono text-sm text-aurora-primary">
          {stardate}
        </div>

        {/* User Name */}
        <div className="font-orbitron font-semibold text-base text-white/90">
          CMDR. BENJAMIN FAIB
        </div>

        {/* Shield Status Mini */}
        <div className="flex items-center gap-2">
          <span className="font-orbitron text-[10px] tracking-wider text-white/60 uppercase">
            SHIELDS:
          </span>
          <div className="flex items-center gap-1">
            {Object.values(shields).map((shield) => {
              const statusColorMap: Record<typeof shield.status, string> = {
                optimal: 'bg-gradient-to-r from-green-500 to-cyan-500',
                nominal: 'bg-gradient-to-r from-green-400 to-cyan-400',
                caution: 'bg-gradient-to-r from-yellow-500 to-amber-500',
                warning: 'bg-gradient-to-r from-orange-500 to-red-500',
                critical: 'bg-gradient-to-r from-red-500 to-red-700',
                breached: 'bg-gradient-to-r from-red-600 to-red-900',
              };
              return (
                <div
                  key={shield.id}
                  className={`w-[30px] h-[6px] rounded-full ${statusColorMap[shield.status]}`}
                  style={{ width: `${(shield.currentPercent / 100) * 30}px` }}
                />
              );
            })}
          </div>
          <span className="font-orbitron text-xs font-bold text-aurora-primary ml-1">
            {Math.round(overallPercent)}%
          </span>
        </div>

        {/* Alert Count */}
        <div
          className={`font-orbitron text-xs tracking-wider ${
            hasCriticalThreats ? 'text-red-500 animate-pulse' : 'text-aurora-primary'
          }`}
        >
          ⚠ {activeThreats.length} THREAT{activeThreats.length !== 1 ? 'S' : ''}
        </div>

        {/* Menu Button Placeholder */}
        <button className="w-8 h-8 flex items-center justify-center rounded border border-aurora-primary/20 hover:bg-aurora-primary/10 transition-colors">
          <div className="w-4 h-3 flex flex-col justify-between">
            <div className="h-[2px] bg-aurora-primary/60 rounded" />
            <div className="h-[2px] bg-aurora-primary/60 rounded" />
            <div className="h-[2px] bg-aurora-primary/60 rounded" />
          </div>
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative min-h-0 flex">
        {/* Side beams */}
        <div className="side-panels absolute left-0 top-0 bottom-0 w-7 bg-gradient-to-r from-space-darker to-space-dark border-r border-aurora-primary/5 z-10" />
        <div className="side-panels absolute right-0 top-0 bottom-0 w-7 bg-gradient-to-l from-space-darker to-space-dark border-l border-aurora-primary/5 z-10" />

        {/* HUD Corners */}
        <div className="bridge-content absolute top-8 left-8 w-[30px] h-[30px] border-t border-l border-aurora-primary/10 pointer-events-none z-10" />
        <div className="bridge-content absolute top-8 right-8 w-[30px] h-[30px] border-t border-r border-aurora-primary/10 pointer-events-none z-10" />
        <div className="bridge-content absolute bottom-1 left-8 w-[30px] h-[30px] border-b border-l border-aurora-primary/10 pointer-events-none z-10" />
        <div className="bridge-content absolute bottom-1 right-8 w-[30px] h-[30px] border-b border-r border-aurora-primary/10 pointer-events-none z-10" />

        {/* HUD Labels */}
        <div className="bridge-content absolute top-9 left-[66px] font-orbitron text-[6px] tracking-[3px] text-aurora-primary/15 pointer-events-none z-10">
          FORWARD VIEWPORT
        </div>
        <div className="bridge-content absolute top-9 right-[280px] font-orbitron text-[6px] tracking-[3px] text-aurora-primary/15 pointer-events-none z-10">
          SECTOR 7G-FINANCE
        </div>

        {/* Main 3D Viewport (flex grow) */}
        <div className="flex-1 relative">
          {/* Captain Nova UI is now in the layout (persists across routes) */}
        </div>

        {/* Right Panel: Transaction Log */}
        <div className="bridge-content w-[280px] flex-shrink-0 p-4 pr-8 z-10">
          <SpaceErrorBoundary fallbackTitle="TRANSACTION FEED INTERRUPTED">
            <GlassPanel level={1} className="h-full flex flex-col">
              <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 p-3 pb-2 uppercase flex-shrink-0">
                Recent Transactions
              </div>
              <div className="flex-1 overflow-y-auto p-3 pt-0 min-h-0 space-y-2 custom-scrollbar">
                {[
                  { id: 'tx-1', icon: '🛸', merchant: 'Uber Ride', category: 'Transport', amount: -18.50, date: '2026-02-07T14:30:00', bucket: 'wants' as const, cardUsed: 'Visa', cardLastFour: '4242', location: 'San Francisco' },
                  { id: 'tx-2', icon: '🍜', merchant: 'Chipotle', category: 'Dining', amount: -12.40, date: '2026-02-06T19:15:00', bucket: 'wants' as const, cardUsed: 'Amex', cardLastFour: '1005', location: 'Downtown' },
                  { id: 'tx-3', icon: '💰', merchant: 'Payroll', category: 'Income', amount: 3120, date: '2026-02-05T09:00:00', bucket: 'income' as const, cardUsed: 'Direct Deposit', isRecurring: true },
                  { id: 'tx-4', icon: '🎮', merchant: 'Steam', category: 'Gaming', amount: -29.99, date: '2026-02-04T21:45:00', bucket: 'wants' as const, cardUsed: 'Visa', cardLastFour: '4242', isRecurring: true },
                  { id: 'tx-5', icon: '☕', merchant: 'Starbucks', category: 'Dining', amount: -5.75, date: '2026-02-04T08:20:00', bucket: 'wants' as const, cardUsed: 'Amex', cardLastFour: '1005', location: 'Main St' },
                ].map((tx) => {
                  const txDate = new Date(tx.date);
                  const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const dateStr = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <button
                      key={tx.id}
                      onClick={() => openTransactionModal(tx)}
                      className="w-full flex flex-col gap-2 p-2 border border-white/[0.03] hover:bg-white/[0.03] hover:border-aurora-primary/20 transition-all rounded-[4px]"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-[4px] flex items-center justify-center text-[11px] bg-aurora-primary/[0.03] border border-aurora-primary/[0.05] flex-shrink-0">
                          {tx.icon}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                            {tx.merchant}
                          </div>
                          <div className="text-[8px] text-white/30 tracking-wide uppercase">
                            {tx.category}
                          </div>
                        </div>
                        <div className={`font-orbitron text-[11px] font-bold flex-shrink-0 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[7px] text-white/20 font-mono">
                        <span>{dateStr} · {timeStr}</span>
                        {tx.isRecurring && <span className="text-aurora-primary/40">RECURRING</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </GlassPanel>
          </SpaceErrorBoundary>
        </div>
      </div>

      {/* Bottom Console */}
      <div className="bridge-content h-[280px] flex-shrink-0 relative bg-gradient-to-t from-space-dark via-space-dark/98 to-space-dark/95 border-t border-aurora-primary/10 flex gap-2 p-3">
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-aurora-primary/15 to-transparent" />

        {/* Column 1: Shield Status (30%) */}
        <div className="flex-[0_0_30%]">
          <SpaceErrorBoundary fallbackTitle="SHIELD SYSTEMS OFFLINE">
            <ShieldPanel variant="compact" />
          </SpaceErrorBoundary>
        </div>

        {/* Column 2: Command Center Preview (40%) */}
        <div className="flex-[0_0_40%]">
          <SpaceErrorBoundary fallbackTitle="FINANCIAL SYSTEMS OFFLINE">
            <GlassPanel
              ref={commandCenterPanelRef}
              level={2}
              className="h-full flex flex-col cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.015] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:-translate-y-[2px]"
              onClick={() => {
                if (!isTransitioning) {
                  transitionTo('/command-center', commandCenterPanelRef);
                }
              }}
              style={{
                pointerEvents: isTransitioning ? 'none' : 'auto',
              }}
            >
              <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 p-3 pb-2 uppercase flex-shrink-0">
                Command Center
              </div>
              <DataContainer
                data={snapshot}
                isLoading={snapshotLoading}
                isError={snapshotError}
                error={snapshotErrorObj}
                refetch={refetchSnapshot}
                isRefetching={snapshotRefetching}
                errorTitle="FINANCIAL SYSTEMS OFFLINE"
                emptyTitle="NO FINANCIAL DATA"
                emptyMessage="Connect your accounts to begin monitoring."
                emptyIcon="📡"
                loadingSkeleton={
                  <div className="flex-1 p-3 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} variant="metric" />
                      ))}
                    </div>
                  </div>
                }
              >
                {(data) => (
                  <>
                    <div className="flex-1 p-3 pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: 'NET WORTH',
                            value: `$${data.total_net_worth.toLocaleString()}`,
                            trend: '+2.3%',
                            trendIcon: '▲',
                            color: 'text-cyan-500'
                          },
                          {
                            label: 'INCOME',
                            value: `$${data.monthly_income.toLocaleString()}`,
                            context: 'This month',
                            color: 'text-green-500'
                          },
                          {
                            label: 'SPENDING',
                            value: `$${data.monthly_spending.toLocaleString()}`,
                            context: 'This month',
                            color: 'text-purple-500'
                          },
                          {
                            label: 'SAVINGS',
                            value: `$${(data.accounts.find(a => a.type === 'savings')?.balance || 18400) >= 1000 ? ((data.accounts.find(a => a.type === 'savings')?.balance || 18400) / 1000).toFixed(1) + 'K' : (data.accounts.find(a => a.type === 'savings')?.balance || 18400)}`,
                            trend: '+$340',
                            trendIcon: '▲',
                            color: 'text-yellow-500'
                          },
                        ].map((metric, i) => (
                          <GlassPanel key={i} level={2} className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="font-rajdhani text-xs text-white/40 uppercase tracking-wide">
                                {metric.label}
                              </div>
                              <div className="flex items-end justify-between">
                                <div className={`font-orbitron text-xl font-bold ${metric.color}`}>
                                  {metric.value}
                                </div>
                                {metric.trend && (
                                  <div className="font-orbitron text-[10px] text-green-500 font-semibold">
                                    {metric.trend} {metric.trendIcon}
                                  </div>
                                )}
                              </div>
                              {metric.context && (
                                <div className="font-rajdhani text-xs text-white/40">
                                  {metric.context}
                                </div>
                              )}
                            </div>
                          </GlassPanel>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTransitioning) {
                          transitionTo('/command-center', commandCenterPanelRef);
                        }
                      }}
                      className="text-center py-2 font-orbitron text-[7px] tracking-[2px] text-aurora-primary/40 hover:text-aurora-primary/60 border-t border-aurora-primary/[0.03] transition-colors uppercase"
                      disabled={isTransitioning}
                    >
                      Expand to Full View ▲
                    </button>
                  </>
                )}
              </DataContainer>
            </GlassPanel>
          </SpaceErrorBoundary>
        </div>

        {/* Column 3: Quick Actions (30%) */}
        <div className="flex-[0_0_30%] flex flex-col gap-2">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 uppercase mb-1">
            Quick Actions
          </div>
          {[
            { icon: '🎯', label: 'Review Budget', route: '/command-center?tab=budget' },
            { icon: '💳', label: 'Optimize Cards', route: '/command-center?tab=fleet' },
            { icon: '🛡️', label: 'Activate Controls', route: '/command-center?tab=threats' },
            { icon: '📊', label: 'View Insights', route: '/command-center?tab=overview' },
          ].map((action, i) => (
            <GlassPanel
              key={i}
              level={2}
              hover
              className="flex-1 flex items-center gap-2 px-3 cursor-pointer hover:bg-aurora-primary/10 hover:border-aurora-primary/30 transition-all"
              onClick={() => {
                if (!isTransitioning) {
                  transitionTo(action.route);
                }
              }}
              style={{
                pointerEvents: isTransitioning ? 'none' : 'auto',
              }}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="font-orbitron text-[8px] tracking-[1px] text-white/80 uppercase">
                {action.label}
              </span>
            </GlassPanel>
          ))}
        </div>
      </div>
    </div>
  );
}
