'use client';

import { useState } from 'react';
import { useSeamlessTransition } from '@/hooks/useSeamlessTransition';
import { useFinancialSnapshot, useBudgetReport } from '@/hooks/useFinancialData';

export default function CommandCenterPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { transitionBack } = useSeamlessTransition();
  const { data: snapshot } = useFinancialSnapshot();
  const { data: budget } = useBudgetReport();

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-11 bg-gradient-to-b from-space-dark/95 to-space-dark/80 flex items-center justify-between px-5 border-b border-aurora-primary/10 flex-shrink-0 relative">
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-aurora-primary/20 to-transparent" />

        <button
          onClick={transitionBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-aurora-primary/15 bg-aurora-primary/5 text-aurora-primary/50 font-orbitron text-[8px] tracking-[2px] hover:bg-aurora-primary/10 hover:text-aurora-primary hover:border-aurora-primary/25 transition-all"
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
        {activeTab === 'overview' && <OverviewTab snapshot={snapshot} budget={budget} />}
        {activeTab === 'budget' && <BudgetTab budget={budget} />}
        {activeTab === 'fleet' && <FleetTab />}
        {activeTab === 'threats' && <ThreatsTab />}
        {activeTab === 'travel' && <TravelTab />}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ snapshot, budget }: { snapshot?: any; budget?: any }) {
  const netWorth = snapshot?.total_net_worth || 47832;
  const savings = snapshot?.accounts.find((a: any) => a.type === 'savings')?.balance || 18400;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-[fi_0.4s_ease-out] opacity-100">
      {/* Hero Metrics */}
      <div className="text-center glass p-6 rounded-lg">
        <div className="font-orbitron text-[7px] tracking-[4px] text-aurora-primary/25 mb-2">
          TOTAL NET WORTH
        </div>
        <div className="text-5xl font-black aurora-text mb-1">${netWorth.toLocaleString()}</div>
        <div className="text-sm text-green-500 font-semibold">
          ▲ +$1,247 this cycle · +2.7%
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'INCOME', value: `$${snapshot?.monthly_income.toLocaleString() || '6,240'}`, color: 'text-cyan-500' },
          { label: 'SAVINGS', value: `$${savings.toLocaleString()}`, color: 'text-green-500' },
          { label: 'SPENDING', value: `$${snapshot?.monthly_spending.toLocaleString() || '3,891'}`, color: 'text-purple-500' },
          { label: 'INVEST', value: '$22,100', color: 'text-yellow-500' },
        ].map((metric, i) => (
          <div key={i} className="glass p-4 rounded-lg text-center">
            <div className="font-orbitron text-[6px] tracking-[3px] text-aurora-primary/25 mb-2">
              {metric.label}
            </div>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Threats */}
        <div className="glass p-4 rounded-lg">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
            ACTIVE THREATS
          </div>
          <div className="space-y-2">
            {[
              { label: 'GYM MEMBERSHIP', sub: '47 days unused', color: '#ff5733' },
              { label: 'DINING SURGE', sub: '142% over budget', color: '#a855f7' },
              { label: 'STREAMING BILLS', sub: 'Renews in 48h', color: '#fbbf24' },
              { label: 'MISSED REWARDS', sub: '$12/mo lost', color: '#06b6d4' },
            ].map((threat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: threat.color,
                    boxShadow: `0 0 4px ${threat.color}`,
                  }}
                />
                <div className="flex-1">
                  <div className="font-semibold">{threat.label}</div>
                  <div className="text-[10px] opacity-40">{threat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shield Status */}
        <div className="glass p-4 rounded-lg">
          <div className="font-orbitron text-[7px] tracking-[3px] text-aurora-primary/25 mb-3">
            SHIELD STATUS
          </div>
          <div className="space-y-3">
            {[
              { name: 'Budget Integrity', value: 72, gradient: 'from-green-500 to-cyan-500' },
              { name: 'Savings Trajectory', value: 91, gradient: 'from-yellow-500 to-purple-500' },
              { name: 'Spending Control', value: 58, gradient: 'from-red-500 to-yellow-500' },
            ].map((shield, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="opacity-40">{shield.name}</span>
                  <span
                    className={`font-orbitron font-bold ${
                      shield.value > 80
                        ? 'text-green-500'
                        : shield.value > 60
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {shield.value}%
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${shield.gradient} transition-all duration-1000`}
                    style={{ width: `${shield.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Budget Tab
function BudgetTab({ budget }: { budget?: any }) {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-[fi_0.4s_ease-out]">
      <div className="glass p-6 rounded-lg">
        <div className="font-orbitron text-sm tracking-[2px] text-aurora-primary mb-4">
          50/30/20 BUDGET ANALYSIS
        </div>
        <div className="space-y-4">
          {[
            {
              icon: '🛡',
              name: 'Life Support (Needs)',
              sub: 'Rent · Utilities · Groceries',
              pct: budget?.needs.actual_pct || 48,
              alloc: budget?.needs.target_pct || 50,
              color: 'green',
            },
            {
              icon: '🎮',
              name: 'Recreation Deck (Wants)',
              sub: 'Dining · Entertainment · Subscriptions',
              pct: budget?.wants.actual_pct || 37,
              alloc: budget?.wants.target_pct || 30,
              color: 'yellow',
            },
            {
              icon: '🚀',
              name: 'Warp Fuel (Savings)',
              sub: 'Emergency · Investments',
              pct: budget?.savings.actual_pct || 15,
              alloc: budget?.savings.target_pct || 20,
              color: 'cyan',
            },
          ].map((budgetItem, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-2xl">{budget.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{budget.name}</div>
                <div className="text-xs opacity-40">{budget.sub}</div>
              </div>
              <div className="w-48">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full bg-gradient-to-r from-${budget.color}-500 to-cyan-500 transition-all duration-1000`}
                    style={{ width: `${Math.min((budget.pct / budget.alloc) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-right font-orbitron">
                  <span
                    className={
                      budget.pct > budget.alloc ? 'text-red-500' : 'text-green-500'
                    }
                  >
                    {budget.pct}%
                  </span>{' '}
                  / {budget.alloc}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Placeholder tabs
function FleetTab() {
  return (
    <div className="glass p-6 rounded-lg text-center animate-[fi_0.4s_ease-out]">
      <div className="text-4xl mb-2">💳</div>
      <div className="font-orbitron text-aurora-primary">CARD FLEET MODULE</div>
      <div className="text-sm opacity-40 mt-2">Card optimization coming soon...</div>
    </div>
  );
}

function ThreatsTab() {
  return (
    <div className="glass p-6 rounded-lg text-center animate-[fi_0.4s_ease-out]">
      <div className="text-4xl mb-2">☄️</div>
      <div className="font-orbitron text-aurora-primary">THREAT MANAGEMENT</div>
      <div className="text-sm opacity-40 mt-2">Advanced threat analysis coming soon...</div>
    </div>
  );
}

function TravelTab() {
  return (
    <div className="glass p-6 rounded-lg text-center animate-[fi_0.4s_ease-out]">
      <div className="text-4xl mb-2">✈️</div>
      <div className="font-orbitron text-aurora-primary">TRAVEL OPTIMIZATION</div>
      <div className="text-sm opacity-40 mt-2">Lounge access & perks coming soon...</div>
    </div>
  );
}
