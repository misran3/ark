'use client';

import { useState } from 'react';
import { useSeamlessTransition } from '@/hooks/useSeamlessTransition';
import { useFinancialSnapshot, useBudgetReport } from '@/hooks/useFinancialData';
import { useTransitionStore } from '@/lib/stores/transition-store';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { MetricCard } from '@/components/ui/MetricCard';
import { ShieldPanel } from '@/components/ui/ShieldPanel';
import { DataContainer } from '@/components/ui/DataContainer';
import { SpaceErrorBoundary } from '@/components/ui/SpaceErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThreatStore } from '@/lib/stores/threat-store';
import { useModalStore } from '@/lib/stores/modal-store';
import { useShieldStore } from '@/lib/stores/shield-store';

export default function CommandCenterPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { transitionBack } = useSeamlessTransition();
  const isTransitioning = useTransitionStore((state) => state.isTransitioning);
  const snapshotQuery = useFinancialSnapshot();
  const budgetQuery = useBudgetReport();

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-11 bg-gradient-to-b from-space-dark/95 to-space-dark/80 flex items-center justify-between px-5 border-b border-aurora-primary/10 flex-shrink-0 relative">
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-aurora-primary/20 to-transparent" />

        <button
          onClick={() => {
            if (!isTransitioning) {
              transitionBack();
            }
          }}
          disabled={isTransitioning}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-aurora-primary/15 bg-aurora-primary/5 text-aurora-primary/50 font-orbitron text-[8px] tracking-[2px] hover:bg-aurora-primary/10 hover:text-aurora-primary hover:border-aurora-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>◀</span> BACK TO BRIDGE
        </button>

        <div className="font-orbitron font-bold text-sm tracking-[2px] aurora-text">
          COMMAND CENTER
        </div>

        <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 font-orbitron text-[8px] text-red-500/70">
          🔴 ALERT: 4 THREATS
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-0.5 px-5 pt-3 pb-2 bg-space-dark/50">
        {[
          { id: 'overview', label: 'OVERVIEW' },
          { id: 'budget', label: 'BUDGET' },
          { id: 'fleet', label: 'CARD FLEET' },
          { id: 'threats', label: 'THREATS' },
          { id: 'travel', label: 'TRAVEL' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-orbitron text-[7px] tracking-[2px] rounded-t-[3px] border-t border-l border-r transition-all ${
              activeTab === tab.id
                ? 'bg-aurora-primary/10 text-aurora-primary border-aurora-primary/20'
                : 'bg-aurora-primary/[0.008] text-aurora-primary/25 border-aurora-primary/[0.05] hover:bg-aurora-primary/[0.025] hover:text-aurora-primary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        {activeTab === 'overview' && (
          <SpaceErrorBoundary fallbackTitle="OVERVIEW SYSTEMS OFFLINE">
            <OverviewTab snapshotQuery={snapshotQuery} budgetQuery={budgetQuery} setActiveTab={setActiveTab} />
          </SpaceErrorBoundary>
        )}
        {activeTab === 'budget' && (
          <SpaceErrorBoundary fallbackTitle="BUDGET ANALYSIS OFFLINE">
            <BudgetTab budgetQuery={budgetQuery} />
          </SpaceErrorBoundary>
        )}
        {activeTab === 'fleet' && (
          <SpaceErrorBoundary fallbackTitle="FLEET SYSTEMS OFFLINE">
            <FleetTab />
          </SpaceErrorBoundary>
        )}
        {activeTab === 'threats' && (
          <SpaceErrorBoundary fallbackTitle="THREAT SCANNER OFFLINE">
            <ThreatsTab />
          </SpaceErrorBoundary>
        )}
        {activeTab === 'travel' && (
          <SpaceErrorBoundary fallbackTitle="TRAVEL SYSTEMS OFFLINE">
            <TravelTab />
          </SpaceErrorBoundary>
        )}
      </div>
    </div>
  );
}

// Mock transaction data
const MOCK_TRANSACTIONS = [
  { id: '1', merchant: 'Uber Ride', category: 'Transport', amount: -18.50, time: '2h ago', icon: '🛸', card: 'Sapphire', date: 'Feb 7, 2026' },
  { id: '2', merchant: 'Chipotle', category: 'Dining', amount: -12.40, time: '5h ago', icon: '🍜', card: 'Discover', date: 'Feb 7, 2026' },
  { id: '3', merchant: 'Payroll', category: 'Income', amount: 3120, time: '1d ago', icon: '💰', card: 'Direct Deposit', date: 'Feb 6, 2026' },
  { id: '4', merchant: 'Steam', category: 'Entertainment', amount: -29.99, time: '2d ago', icon: '🎮', card: 'Discover', date: 'Feb 5, 2026' },
  { id: '5', merchant: 'Starbucks', category: 'Dining', amount: -6.25, time: '2d ago', icon: '☕', card: 'Sapphire', date: 'Feb 5, 2026' },
];

// Overview Tab
function OverviewTab({
  snapshotQuery,
  budgetQuery,
  setActiveTab
}: {
  snapshotQuery: ReturnType<typeof useFinancialSnapshot>;
  budgetQuery: ReturnType<typeof useBudgetReport>;
  setActiveTab: (tab: string) => void;
}) {
  const activeThreats = useThreatStore((state) => state.threats.filter((t) => !t.deflected));
  const openTransactionModal = useModalStore((state) => state.openTransactionModal);

  // Loading skeleton for Overview tab
  const loadingSkeleton = (
    <div className="max-w-6xl mx-auto space-y-6 animate-[fi_0.4s_ease-out]">
      {/* Hero Metric Skeleton */}
      <GlassPanel level={2} className="text-center p-6 rounded-lg">
        <Skeleton variant="text" width="40%" height="10px" className="mx-auto mb-2" />
        <Skeleton variant="heading" width="60%" height="48px" className="mx-auto mb-1" />
        <Skeleton variant="text" width="30%" height="14px" className="mx-auto" />
      </GlassPanel>

      {/* Quick Metrics Skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassPanel key={i} level={2} className="p-4 rounded-lg text-center">
            <Skeleton variant="text" width="60%" height="10px" className="mx-auto mb-2" />
            <Skeleton variant="metric" width="80px" height="32px" className="mx-auto" />
          </GlassPanel>
        ))}
      </div>
    </div>
  );

  return (
    <DataContainer
      data={snapshotQuery.data}
      isLoading={snapshotQuery.isLoading}
      isError={snapshotQuery.isError}
      error={snapshotQuery.error}
      isRefetching={snapshotQuery.isRefetching}
      refetch={snapshotQuery.refetch}
      loadingSkeleton={loadingSkeleton}
      errorTitle="OVERVIEW SYSTEMS OFFLINE"
      emptyIcon="📡"
      emptyTitle="NO FINANCIAL DATA"
      emptyMessage="Connect your accounts to begin monitoring."
    >
      {(snapshot) => <OverviewContent snapshot={snapshot} budget={budgetQuery.data} setActiveTab={setActiveTab} activeThreats={activeThreats} openTransactionModal={openTransactionModal} />}
    </DataContainer>
  );
}

// Overview Content (rendered when data is available)
function OverviewContent({
  snapshot,
  budget,
  setActiveTab,
  activeThreats,
  openTransactionModal
}: {
  snapshot: any;
  budget?: any;
  setActiveTab: (tab: string) => void;
  activeThreats: any[];
  openTransactionModal: any;
}) {
  const netWorth = snapshot?.total_net_worth || 47832;
  const savings = snapshot?.accounts.find((a: any) => a.type === 'savings')?.balance || 18400;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-[fi_0.4s_ease-out] opacity-100">
      {/* Section 1: Hero Metric - Net Worth */}
      <GlassPanel level={2} className="text-center p-6 rounded-lg">
        <div className="font-orbitron text-[7px] tracking-[4px] text-aurora-primary/25 mb-2">
          TOTAL NET WORTH
        </div>
        <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
          ${netWorth.toLocaleString()}
        </div>
        <div className="font-rajdhani text-sm text-green-500">
          ▲ +$1,247 this cycle · +2.7%
        </div>
      </GlassPanel>

      {/* Section 2: Quick Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <GlassPanel level={2} className="p-4 rounded-lg text-center">
          <div className="font-orbitron text-[6px] tracking-[3px] text-aurora-primary/25 mb-2">
            INCOME
          </div>
          <div className="font-orbitron text-2xl font-bold text-cyan-500">
            $6,240
          </div>
        </GlassPanel>
        <GlassPanel level={2} className="p-4 rounded-lg text-center">
          <div className="font-orbitron text-[6px] tracking-[3px] text-aurora-primary/25 mb-2">
            SAVINGS
          </div>
          <div className="font-orbitron text-2xl font-bold text-green-500">
            $18,400
          </div>
        </GlassPanel>
        <GlassPanel level={2} className="p-4 rounded-lg text-center">
          <div className="font-orbitron text-[6px] tracking-[3px] text-aurora-primary/25 mb-2">
            SPENDING
          </div>
          <div className="font-orbitron text-2xl font-bold text-purple-500">
            $3,891
          </div>
        </GlassPanel>
        <GlassPanel level={2} className="p-4 rounded-lg text-center">
          <div className="font-orbitron text-[6px] tracking-[3px] text-aurora-primary/25 mb-2">
            INVEST
          </div>
          <div className="font-orbitron text-2xl font-bold text-yellow-500">
            $22,100
          </div>
        </GlassPanel>
      </div>

      {/* Section 3: Two Column - Active Threats + Shield Status */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Threats */}
        <GlassPanel level={2} className="p-4 rounded-lg">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
            ACTIVE THREATS
          </div>
          <div className="space-y-2">
            {activeThreats.slice(0, 5).map((threat) => (
              <div
                key={threat.id}
                className="flex items-start gap-2 cursor-pointer hover:bg-aurora-primary/[0.015] transition-colors py-1 px-1 rounded"
                onClick={() => setActiveTab('threats')}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                  style={{
                    background: threat.color,
                    boxShadow: `0 0 6px ${threat.color}`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-rajdhani text-xs font-semibold">
                    {threat.label}
                  </div>
                  <div className="font-rajdhani text-[10px] opacity-40">
                    {threat.detail}
                  </div>
                </div>
              </div>
            ))}
            {activeThreats.length > 5 && (
              <div className="text-xs text-aurora-primary/50 text-center pt-1 cursor-pointer hover:text-aurora-primary/70 transition-colors">
                +{activeThreats.length - 5} more
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Shield Status */}
        <div className="relative">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
            SHIELD STATUS
          </div>
          <ShieldPanel variant="standard" className="-mt-3" />
        </div>
      </div>

      {/* Section 4: Recent Activity */}
      <GlassPanel level={2} className="p-4 rounded-lg">
        <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
          RECENT ACTIVITY
        </div>
        <div className="space-y-0">
          {MOCK_TRANSACTIONS.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-2 py-1.5 border-b border-white/[0.02] hover:bg-aurora-primary/[0.01] transition-colors cursor-pointer"
              onClick={() =>
                openTransactionModal({
                  id: txn.id,
                  merchant: txn.merchant,
                  category: txn.category,
                  amount: txn.amount,
                  date: txn.date,
                  icon: txn.icon,
                  cardUsed: txn.card,
                })
              }
            >
              {/* Icon box */}
              <div className="w-5 h-5 rounded-[3px] bg-aurora-primary/[0.02] border border-aurora-primary/[0.04] flex items-center justify-center text-xs flex-shrink-0">
                {txn.icon}
              </div>
              {/* Merchant */}
              <div className="font-rajdhani text-xs font-semibold flex-shrink-0 w-24">
                {txn.merchant}
              </div>
              {/* Category */}
              <div className="font-rajdhani text-[10px] opacity-30 uppercase flex-shrink-0 w-20">
                {txn.category}
              </div>
              {/* Spacer */}
              <div className="flex-1" />
              {/* Amount */}
              <div
                className={`font-orbitron text-[11px] font-bold flex-shrink-0 w-16 text-right ${
                  txn.amount > 0 ? 'text-green-500' : 'text-purple-500'
                }`}
              >
                {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
              </div>
              {/* Time */}
              <div className="font-share-tech-mono text-[9px] opacity-25 flex-shrink-0 w-12 text-right">
                {txn.time}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <button className="font-orbitron text-[8px] tracking-[2px] text-aurora-primary/30 hover:text-aurora-primary/50 transition-colors">
            ▾ View All Transactions
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

// Budget Tab
function BudgetTab({ budgetQuery }: { budgetQuery: ReturnType<typeof useBudgetReport> }) {
  return <BudgetContent />;
}

// Budget Content (rendered when data is available)
function BudgetContent() {
  const shields = useShieldStore((state) => state.shields);
  const overallPercent = useShieldStore((state) => state.overallPercent);

  // Income data
  const monthlyIncome = 6240;

  // Calculate total spending and remaining
  const totalSpent = Object.values(shields).reduce((sum, shield) => sum + shield.actualSpendAmount, 0);
  const remaining = monthlyIncome - totalSpent;

  // Calculate days left in month
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = lastDay.getDate() - today.getDate();

  // Count categories over budget
  const overBudgetCount = Object.values(shields).reduce(
    (count, shield) => count + shield.subcategories.filter(sub => sub.percentUsed > 100).length,
    0
  );

  // Generate recommendation
  const getRecommendation = () => {
    const recDeck = shields['recreation-deck'];
    const warpFuel = shields['warp-fuel'];

    if (recDeck.actualSpendPct > recDeck.budgetAllocationPct) {
      const overage = recDeck.actualSpendAmount - recDeck.budgetAmount;
      return `Reduce dining by $${Math.round(overage)} to restore Recreation Deck budget.`;
    }

    if (warpFuel.actualSpendPct < warpFuel.budgetAllocationPct) {
      const shortage = warpFuel.budgetAmount - warpFuel.actualSpendAmount;
      return `Increase savings by $${Math.round(shortage)} to meet Warp Fuel target.`;
    }

    return 'Budget on track. Maintain current trajectory, Commander.';
  };

  // Helper to get status
  const getStatus = (shield: typeof shields[keyof typeof shields]) => {
    if (shield.actualSpendPct <= shield.budgetAllocationPct) return { icon: '✅', color: 'text-green-500' };
    if (shield.actualSpendPct < shield.budgetAllocationPct * 1.2) return { icon: '⚠', color: 'text-yellow-500' };
    return { icon: '🔴', color: 'text-red-500' };
  };

  // Helper to get subcategory color
  const getSubcategoryColor = (percentUsed: number) => {
    if (percentUsed < 80) return 'text-green-500';
    if (percentUsed < 100) return 'text-yellow-500';
    if (percentUsed < 120) return 'text-orange-500';
    return 'text-red-500';
  };

  // Helper to get subcategory warning icon
  const getSubcategoryWarning = (percentUsed: number) => {
    if (percentUsed > 120) return '🔴';
    if (percentUsed > 100) return '⚠';
    return null;
  };

  const shieldOrder: Array<keyof typeof shields> = ['life-support', 'recreation-deck', 'warp-fuel'];
  const budgetLabels: Record<string, string> = {
    'life-support': 'NEEDS',
    'recreation-deck': 'WANTS',
    'warp-fuel': 'SAVINGS',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-[fi_0.4s_ease-out]">
      {/* Header */}
      <div className="font-orbitron text-[8px] tracking-[3px] text-aurora-primary/25 text-center">
        50/30/20 BUDGET ANALYSIS
      </div>

      {/* Budget Category Panels */}
      {shieldOrder.map((shieldId) => {
        const shield = shields[shieldId];
        const status = getStatus(shield);
        const fillPercent = Math.min((shield.actualSpendPct / shield.budgetAllocationPct) * 100, 100);
        const overspendPercent = shield.actualSpendPct > shield.budgetAllocationPct
          ? ((shield.actualSpendPct - shield.budgetAllocationPct) / shield.budgetAllocationPct) * 100
          : 0;

        return (
          <GlassPanel key={shieldId} level={2} className="p-5 rounded-lg">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{shield.icon}</span>
                <span className="font-orbitron text-sm tracking-[1px] aurora-text">
                  {shield.name.toUpperCase()}
                </span>
                <span className="font-orbitron text-sm tracking-[1px] text-aurora-primary/40">
                  ({budgetLabels[shieldId]})
                </span>
              </div>
              <div className={`font-orbitron text-xs tracking-[0.5px] ${
                shield.actualSpendPct <= shield.budgetAllocationPct
                  ? 'text-green-500'
                  : shield.actualSpendPct <= shield.budgetAllocationPct * 1.1
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}>
                {shield.actualSpendPct}% of {shield.budgetAllocationPct}%
              </div>
            </div>

            {/* Main Progress Bar */}
            <div className="relative mb-2">
              <div className="h-2.5 bg-white/[0.03] rounded-full overflow-hidden relative">
                {/* Normal fill */}
                <div
                  className={`h-full bg-gradient-to-r ${shield.gradient.from} ${shield.gradient.to} transition-all duration-700`}
                  style={{ width: `${fillPercent}%` }}
                />
                {/* Overspend fill */}
                {overspendPercent > 0 && (
                  <div
                    className="absolute top-0 h-full bg-gradient-to-r from-transparent to-red-500/40 transition-all duration-700"
                    style={{
                      left: `${(shield.budgetAllocationPct / shield.actualSpendPct) * fillPercent}%`,
                      width: `${fillPercent - (shield.budgetAllocationPct / shield.actualSpendPct) * fillPercent}%`
                    }}
                  />
                )}
              </div>

              {/* Target marker */}
              <div
                className="absolute top-0 w-0.5 h-5 bg-white/50 rounded-sm -translate-y-1"
                style={{ left: `${(shield.budgetAllocationPct / shield.actualSpendPct) * fillPercent}%` }}
              />
            </div>

            {/* Dollar amounts and status */}
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-xs text-aurora-primary/60">
                ${shield.actualSpendAmount.toLocaleString()} of ${shield.budgetAmount.toLocaleString()} budgeted
              </div>
              <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                <span>Status:</span>
                <span>{status.icon}</span>
              </div>
            </div>

            {/* Subcategory Cards Grid */}
            <div className={`grid gap-3 ${shield.subcategories.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {shield.subcategories.map((sub) => {
                const warning = getSubcategoryWarning(sub.percentUsed);
                return (
                  <GlassPanel key={sub.name} level={3} className="p-3 rounded-lg min-w-[120px]">
                    <div className="font-orbitron text-[8px] tracking-[1px] text-aurora-primary/40 mb-1">
                      {sub.name.toUpperCase()}
                    </div>
                    <div className="font-orbitron text-base font-bold text-white mb-0.5">
                      ${sub.spent.toLocaleString()}
                    </div>
                    <div className={`font-mono text-[10px] mb-2 flex items-center gap-1 ${getSubcategoryColor(sub.percentUsed)}`}>
                      <span>{sub.percentUsed}%</span>
                      {warning && <span>{warning}</span>}
                    </div>
                    <div className={`h-[3px] bg-white/5 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full bg-gradient-to-r transition-all duration-500 ${
                          sub.percentUsed < 80
                            ? 'from-green-500 to-emerald-500'
                            : sub.percentUsed < 100
                            ? 'from-yellow-500 to-amber-500'
                            : sub.percentUsed < 120
                            ? 'from-orange-500 to-red-500'
                            : 'from-red-600 to-red-700'
                        }`}
                        style={{ width: `${Math.min(sub.percentUsed, 100)}%` }}
                      />
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </GlassPanel>
        );
      })}

      {/* Budget Health Summary */}
      <GlassPanel level={2} className="p-4 rounded-lg">
        <div className="font-orbitron text-[8px] tracking-[3px] text-aurora-primary/25 mb-3">
          BUDGET HEALTH SUMMARY
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-aurora-primary/40 mb-1">Overall</div>
            <div className="font-orbitron text-2xl font-bold text-cyan-500">{Math.round(overallPercent)}%</div>
          </div>
          <div>
            <div className="text-xs text-aurora-primary/40 mb-1">Income</div>
            <div className="font-orbitron text-2xl font-bold text-green-500">${monthlyIncome.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-aurora-primary/40 mb-1">Spent</div>
            <div className="font-orbitron text-2xl font-bold text-purple-500">${totalSpent.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-aurora-primary/40 mb-1">Remaining</div>
            <div className="font-orbitron text-2xl font-bold text-yellow-500">${remaining.toLocaleString()}</div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-aurora-primary/40">Days left:</span>
            <span className="font-mono text-aurora-primary">{daysLeft}</span>
          </div>

          {overBudgetCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <span>⚠</span>
              <span>{overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-aurora-primary/60 font-rajdhani">
            <span className="flex-shrink-0">💡</span>
            <span>{getRecommendation()}</span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

// Fleet Tab
function FleetTab() {
  const cards = [
    {
      id: 1,
      name: 'Chase Sapphire Reserve',
      issuer: 'Chase',
      last4: '4832',
      rewards: ['3x Travel', '3x Dining'],
      limit: 10000,
      used: 3200,
      spending: 3200,
      bestCategory: 'Travel',
      color: 'from-blue-600 to-blue-400',
    },
    {
      id: 2,
      name: 'Discover It',
      issuer: 'Discover',
      last4: '7721',
      rewards: ['5x Gas', '5x Restaurants'],
      limit: 5000,
      used: 1800,
      spending: 1800,
      bestCategory: 'Rotating',
      color: 'from-orange-600 to-orange-400',
    },
    {
      id: 3,
      name: 'Amex Blue Cash',
      issuer: 'Amex',
      last4: '3109',
      rewards: ['6% Groceries', '3% Gas'],
      limit: 8000,
      used: 2100,
      spending: 2100,
      bestCategory: 'Groceries',
      color: 'from-cyan-600 to-cyan-400',
    },
    {
      id: 4,
      name: 'Capital One Venture',
      issuer: 'Capital One',
      last4: '9456',
      rewards: ['2x Everything'],
      limit: 15000,
      used: 4500,
      spending: 4500,
      bestCategory: 'All',
      color: 'from-purple-600 to-purple-400',
    },
  ];

  const getUtilizationColor = (used: number, limit: number) => {
    const pct = (used / limit) * 100;
    if (pct < 30) return 'from-green-500 to-emerald-500';
    if (pct < 70) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-orange-500';
  };

  const getTotalStats = () => {
    const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
    const totalUsed = cards.reduce((sum, c) => sum + c.used, 0);
    return { totalLimit, totalUsed };
  };

  const { totalLimit, totalUsed } = getTotalStats();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-[fi_0.4s_ease-out]">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="TOTAL LIMIT"
          value={`$${totalLimit.toLocaleString()}`}
          color="text-cyan-500"
        />
        <MetricCard
          title="TOTAL USED"
          value={`$${totalUsed.toLocaleString()}`}
          color="text-yellow-500"
        />
        <MetricCard
          title="AVAILABLE"
          value={`$${(totalLimit - totalUsed).toLocaleString()}`}
          color="text-green-500"
        />
      </div>

      {/* Overall Utilization */}
      <GlassPanel level={2} className="p-4">
        <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-2">
          FLEET UTILIZATION
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getUtilizationColor(totalUsed, totalLimit)} transition-all duration-1000`}
            style={{ width: `${Math.min((totalUsed / totalLimit) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 font-orbitron">
          <span className="opacity-50">{Math.round((totalUsed / totalLimit) * 100)}% utilized</span>
          <span className="text-aurora-primary">${(totalLimit - totalUsed).toLocaleString()} available</span>
        </div>
      </GlassPanel>

      {/* Card Grid */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => {
          const utilizationPct = (card.used / card.limit) * 100;
          return (
            <GlassPanel
              key={card.id}
              level={2}
              hover
              className="p-4 transition-all duration-300"
            >
              {/* Card Header with Color Stripe */}
              <div className={`-m-4 mb-0 h-1 bg-gradient-to-r ${card.color}`} />

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-orbitron text-xs tracking-[1px] text-aurora-primary/50 mb-1">
                    {card.issuer.toUpperCase()}
                  </div>
                  <div className="font-semibold text-sm">{card.name}</div>
                  <div className="text-xs opacity-40 mt-1">···{card.last4}</div>
                </div>
                <div className="text-2xl">💳</div>
              </div>

              {/* Rewards */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {card.rewards.map((reward, i) => (
                  <div
                    key={i}
                    className="px-2 py-1 bg-aurora-primary/10 rounded border border-aurora-primary/20 text-[10px] font-orbitron text-aurora-primary/70"
                  >
                    {reward}
                  </div>
                ))}
              </div>

              {/* Best Category */}
              <div className="text-xs mb-3">
                <span className="opacity-50">Best for:</span>{' '}
                <span className="text-yellow-500 font-semibold">{card.bestCategory}</span>
              </div>

              {/* Utilization Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="opacity-40">Utilization</span>
                  <span className="font-orbitron font-semibold">
                    ${card.used.toLocaleString()} / ${card.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getUtilizationColor(card.used, card.limit)} transition-all duration-300`}
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <div className="text-xs text-right mt-1 font-orbitron text-aurora-primary/50">
                  {Math.round(utilizationPct)}%
                </div>
              </div>

              {/* Monthly Spending */}
              <div className="p-2 bg-aurora-primary/5 rounded border border-aurora-primary/10">
                <div className="text-xs opacity-50 mb-1">Monthly Spend</div>
                <div className="font-orbitron font-bold text-green-500">
                  ${card.spending.toLocaleString()}
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

function ThreatsTab() {
  const threats = useThreatStore((state) => state.threats);
  const deflectThreat = useThreatStore((state) => state.deflectThreat);

  const activethreats = threats.filter((t) => !t.deflected);

  const threatIcons: Record<string, string> = {
    asteroid: '☄️',
    ion_storm: '⚡',
    solar_flare: '☀️',
    black_hole: '🕳️',
    wormhole: '🌀',
    enemy_cruiser: '🚀',
  };

  const severityVariants: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
    danger: 'error',
    warning: 'warning',
    info: 'default',
  };

  const severityBgColor: Record<string, string> = {
    danger: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  const severityTextColor: Record<string, string> = {
    danger: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const totalExposure = activethreats.reduce((sum, t) => sum + t.amount, 0);
  const highestSeverity = activethreats.length > 0 ? activethreats[0].severity : 'info';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fi_0.4s_ease-out]">
      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="ACTIVE THREATS"
          value={activethreats.length.toString()}
          color={
            activethreats.length > 5
              ? 'text-red-500'
              : activethreats.length > 2
              ? 'text-yellow-500'
              : 'text-cyan-500'
          }
        />
        <MetricCard
          title="TOTAL EXPOSURE"
          value={`$${totalExposure.toLocaleString()}`}
          color="text-red-500"
        />
        <MetricCard
          title="HIGHEST SEVERITY"
          value={highestSeverity.toUpperCase()}
          color={
            highestSeverity === 'danger'
              ? 'text-red-500'
              : highestSeverity === 'warning'
              ? 'text-yellow-500'
              : 'text-blue-500'
          }
        />
      </div>

      {/* Threats List */}
      <div className="space-y-2">
        {activethreats.length === 0 ? (
          <GlassPanel level={2} className="p-6 text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <div className="font-orbitron text-aurora-primary">ALL CLEAR</div>
            <div className="text-sm opacity-40 mt-2">No active threats detected</div>
          </GlassPanel>
        ) : (
          activethreats.map((threat) => (
            <GlassPanel
              key={threat.id}
              level={2}
              variant={severityVariants[threat.severity]}
              className="p-4 flex items-center justify-between hover:bg-white/[0.015] transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="text-3xl flex-shrink-0">
                  {threatIcons[threat.type] || '☄️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-orbitron font-bold text-sm">
                      {threat.label}
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded text-[8px] font-orbitron font-bold ${severityBgColor[threat.severity]}`}
                    >
                      {threat.severity.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-xs opacity-50">{threat.detail}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs opacity-50 mb-1">Exposure</div>
                  <div className={`font-orbitron font-bold text-lg ${severityTextColor[threat.severity]}`}>
                    ${threat.amount.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => deflectThreat(threat.id)}
                  className="px-3 py-1.5 rounded border border-aurora-primary/20 bg-aurora-primary/5 text-aurora-primary/70 font-orbitron text-[8px] tracking-[1px] hover:bg-aurora-primary/15 hover:text-aurora-primary hover:border-aurora-primary/40 transition-all"
                >
                  DEFLECT
                </button>
              </div>
            </GlassPanel>
          ))
        )}
      </div>

      {/* Deflected Threats Count */}
      {threats.filter((t) => t.deflected).length > 0 && (
        <GlassPanel level={2} variant="success" className="p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl">✓</div>
            <div>
              <div className="font-orbitron text-xs tracking-[1px] text-green-500/50">
                THREATS DEFLECTED
              </div>
              <div className="font-semibold text-sm">
                {threats.filter((t) => t.deflected).length} threat
                {threats.filter((t) => t.deflected).length !== 1 ? 's' : ''} neutralized
              </div>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

function TravelTab() {
  const pointsBalance = 142500;
  const cashValue = 1425;
  const monthlyEarning = 3200;

  const perks = [
    {
      id: 1,
      name: 'Priority Pass',
      status: 'active',
      detail: '4 visits remaining this year',
      icon: '🎟️',
    },
    {
      id: 2,
      name: 'TSA PreCheck',
      status: 'active',
      detail: 'Expires Dec 31, 2027',
      icon: '✅',
    },
    {
      id: 3,
      name: 'Global Entry',
      status: 'active',
      detail: 'Expedited customs & immigration',
      icon: '🌍',
    },
    {
      id: 4,
      name: 'Trip Insurance',
      status: 'active',
      detail: 'Auto-enrolled on all bookings',
      icon: '🛡️',
    },
  ];

  const upcomingTrips = [
    {
      id: 1,
      route: 'SFO → JFK',
      dates: 'Mar 15-20, 2026',
      airline: 'United',
      points: 25000,
      status: 'redeemed',
      icon: '✈️',
    },
    {
      id: 2,
      route: 'SFO → NRT',
      dates: 'Jun 1-15, 2026',
      airline: 'ANA via Chase Portal',
      points: 80000,
      status: 'pending',
      icon: '⏳',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-[fi_0.4s_ease-out]">
      {/* Points Summary */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="POINTS BALANCE"
          value={pointsBalance.toLocaleString()}
          color="text-yellow-500"
        />
        <MetricCard
          title="CASH VALUE"
          value={`$${cashValue.toLocaleString()}`}
          color="text-green-500"
        />
        <MetricCard
          title="EARNING RATE"
          value={`~${monthlyEarning.toLocaleString()}/mo`}
          color="text-cyan-500"
        />
      </div>

      {/* Points Progress */}
      <GlassPanel level={2} className="p-4">
        <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
          POINTS VELOCITY
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-50">Balance Progress</span>
              <span className="font-orbitron font-semibold">
                {pointsBalance.toLocaleString()} / 500,000 pts
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${Math.min((pointsBalance / 500000) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <div className="p-2 bg-aurora-primary/5 rounded">
              <div className="text-[10px] opacity-50 mb-0.5">Last Month</div>
              <div className="font-orbitron font-bold text-green-500">+2,890 pts</div>
            </div>
            <div className="p-2 bg-aurora-primary/5 rounded">
              <div className="text-[10px] opacity-50 mb-0.5">This Month</div>
              <div className="font-orbitron font-bold text-cyan-500">+1,240 pts</div>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Perks */}
        <GlassPanel level={2} className="p-4">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-4">
            ACTIVE PERKS
          </div>
          <div className="space-y-2">
            {perks.map((perk) => (
              <div
                key={perk.id}
                className="p-3 bg-aurora-primary/5 rounded border border-green-500/20 flex items-start gap-3"
              >
                <div className="text-xl flex-shrink-0">{perk.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{perk.name}</div>
                  <div className="text-xs opacity-50 mt-0.5">{perk.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Upcoming Trips */}
        <GlassPanel level={2} className="p-4">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-4">
            UPCOMING REDEMPTIONS
          </div>
          <div className="space-y-2">
            {upcomingTrips.map((trip) => (
              <div
                key={trip.id}
                className={`p-3 rounded border ${
                  trip.status === 'redeemed'
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{trip.icon}</div>
                    <div>
                      <div className="font-semibold text-sm">{trip.route}</div>
                      <div className="text-xs opacity-50">{trip.dates}</div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-[8px] font-orbitron font-bold ${
                      trip.status === 'redeemed'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}
                  >
                    {trip.status.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="opacity-50">{trip.airline}</div>
                  <div className="font-orbitron font-bold text-yellow-500">
                    {trip.points.toLocaleString()} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Recommendations */}
      <GlassPanel level={2} className="p-4">
        <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
          OPTIMIZATION TIPS
        </div>
        <div className="space-y-2">
          <div className="flex gap-3 p-2 bg-cyan-500/5 rounded border border-cyan-500/15">
            <div className="text-lg flex-shrink-0">💡</div>
            <div className="text-xs">
              You're earning ~3,200 points/month. Next redemption target (100k pts) in ~23 months.
            </div>
          </div>
          <div className="flex gap-3 p-2 bg-yellow-500/5 rounded border border-yellow-500/15">
            <div className="text-lg flex-shrink-0">✨</div>
            <div className="text-xs">
              Priority Pass: 4 visits remaining. Lounge visits typically valued at $25-50 each.
            </div>
          </div>
          <div className="flex gap-3 p-2 bg-green-500/5 rounded border border-green-500/15">
            <div className="text-lg flex-shrink-0">🎯</div>
            <div className="text-xs">
              Book longer trips on partners like ANA for better point efficiency (0.71¢ per point vs 0.57¢ on shorthaul).
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
