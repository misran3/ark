'use client';

import React from 'react';

interface BottomMetricsBarProps {
  monthlyIncome: number;
  monthlySpending: number;
  savingsRate: number;
  netWorthChange: number;
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  colorClass: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ label, value, subValue, colorClass, trend }: MetricCardProps) {
  const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●';
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
      ? 'text-red-400'
      : 'text-gray-500';

  return (
    <div className="bg-black/60 border border-white/10 rounded-lg p-4 backdrop-blur-md hover:border-white/20 transition-colors">
      {/* Label */}
      <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-1">
        {label}
      </div>

      {/* Value */}
      <div className={`text-xl md:text-2xl font-mono font-bold ${colorClass}`}>
        {value}
      </div>

      {/* Sub Value / Trend */}
      {subValue && (
        <div className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${trendColor}`}>
          <span>{trendIcon}</span>
          <span>{subValue}</span>
        </div>
      )}

      {/* Mini Sparkline Placeholder */}
      <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: '60%', opacity: 0.6 }}
        />
      </div>
    </div>
  );
}

export function BottomMetricsBar({
  monthlyIncome,
  monthlySpending,
  savingsRate,
  netWorthChange,
}: BottomMetricsBarProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Monthly Income"
          value={formatCurrency(monthlyIncome)}
          subValue="This month"
          colorClass="text-amber-400"
          trend="neutral"
        />

        <MetricCard
          label="Monthly Spending"
          value={formatCurrency(monthlySpending)}
          subValue={`${((monthlySpending / monthlyIncome) * 100).toFixed(0)}% of income`}
          colorClass="text-fuchsia-400"
          trend={monthlySpending > monthlyIncome * 0.8 ? 'down' : 'up'}
        />

        <MetricCard
          label="Savings Rate"
          value={formatPercent(savingsRate)}
          subValue={savingsRate >= 20 ? 'On target' : 'Below target'}
          colorClass="text-emerald-400"
          trend={savingsRate >= 20 ? 'up' : 'down'}
        />

        <MetricCard
          label="Net Worth Δ"
          value={`${netWorthChange >= 0 ? '+' : '-'}${formatCurrency(netWorthChange)}`}
          subValue="vs last month"
          colorClass="text-cyan-400"
          trend={netWorthChange >= 0 ? 'up' : 'down'}
        />
      </div>
    </div>
  );
}
