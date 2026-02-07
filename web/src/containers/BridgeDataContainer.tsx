'use client';

import React from 'react';
import { BalanceHUD, TransactionLog, BottomMetricsBar } from '@/src/components/data-display';
import { useFinancialSnapshot } from '@/src/hooks/finance/useFinance';

/**
 * Smart container that orchestrates the Bridge Data display.
 * Fetches data from the real API via useFinancialSnapshot hook.
 */
export function BridgeDataContainer() {
  const { data, loading, error } = useFinancialSnapshot();

  // Calculate derived values
  const savingsRate = data
    ? ((data.monthly_income - data.monthly_spending) / data.monthly_income) * 100
    : 0;

  // Net worth change (in real app, would compare to previous snapshot)
  const netWorthChange = data ? data.monthly_income - data.monthly_spending : 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 font-mono text-sm mb-2">
          ⚠ SYSTEM ERROR
        </div>
        <div className="text-gray-500 text-xs font-mono">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      {/* Balance HUD - Central Display */}
      <section className="flex justify-center">
        <BalanceHUD
          totalNetWorth={data?.total_net_worth ?? 0}
          accounts={data?.accounts ?? []}
          balanceChange={netWorthChange}
          isLoading={loading}
        />
      </section>

      {/* Bottom Metrics Bar */}
      <section className="w-full px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-black/40 border border-white/10 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <BottomMetricsBar
            monthlyIncome={data?.monthly_income ?? 0}
            monthlySpending={data?.monthly_spending ?? 0}
            savingsRate={savingsRate}
            netWorthChange={netWorthChange}
          />
        )}
      </section>

      {/* Transaction Log */}
      <section className="w-full px-4 flex justify-center">
        {loading ? (
          <div className="w-full max-w-md h-64 bg-black/40 border border-white/10 rounded-lg animate-pulse" />
        ) : (
          <TransactionLog
            transactions={data?.recent_transactions ?? []}
            maxItems={8}
          />
        )}
      </section>
    </div>
  );
}
