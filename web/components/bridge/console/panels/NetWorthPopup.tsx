'use client';

import { PanelPopup } from '../PanelPopup';
import { useFinancialSnapshot } from '@/hooks/useFinancialData';

export function NetWorthPopup() {
  const { data } = useFinancialSnapshot();

  if (!data) return null;

  const metrics = [
    {
      label: 'Net Worth',
      value: `$${data.total_net_worth.toLocaleString()}`,
      trend: '+2.3%',
      color: 'text-cyan-400',
    },
    {
      label: 'Monthly Income',
      value: `$${data.monthly_income.toLocaleString()}`,
      color: 'text-green-400',
    },
    {
      label: 'Monthly Spending',
      value: `$${data.monthly_spending.toLocaleString()}`,
      color: 'text-red-400',
    },
    {
      label: 'Savings',
      value: `$${(data.accounts.find((a: { type: string }) => a.type === 'savings')?.balance || 18400).toLocaleString()}`,
      trend: '+$340',
      color: 'text-yellow-400',
    },
  ];

  return (
    <PanelPopup type="networth" title="Financial Metrics - Detailed View">
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="glass-panel glass-panel-level-2 p-4">
            <div className="text-white/40 text-xs uppercase tracking-wide mb-2">
              {metric.label}
            </div>
            <div className={`font-orbitron text-3xl font-bold ${metric.color} mb-1`}>
              {metric.value}
            </div>
            {metric.trend && (
              <div className="text-green-400 text-sm font-semibold">
                {metric.trend} {'\u25B2'}
              </div>
            )}
          </div>
        ))}
      </div>
    </PanelPopup>
  );
}
