'use client';

import { useState, useEffect, Suspense } from 'react';
import { useFinancialSnapshot } from '@/hooks/useFinancialData';
import { useInstrumentPower } from '@/hooks/useInstrumentPower';
import { NetWorthOdometer3D } from './NetWorthOdometer3D';
import { DualNeedleGauge3D } from './DualNeedleGauge3D';
import { OdometerFallback } from './fallbacks';
import { InstrumentMalfunction } from './InstrumentMalfunction';

/**
 * INST-02: Net Worth → Financial Instruments
 *
 * Primary: Mechanical odometer (3D) — net worth as digit drums
 * Secondary: Dual-needle gauge (3D) — income (green) vs spending (red)
 * Trend semaphore (CSS) — flag tilts up (green) or down (red)
 *
 * Power lifecycle: off → boot → running
 * On boot: odometer drums roll from 0, needles sweep from 0
 */
export function NetWorthCluster() {
  const { data } = useFinancialSnapshot();
  const [canvasReady, setCanvasReady] = useState(false);
  const { isOff, hasError } = useInstrumentPower('inst-02');

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setCanvasReady(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      setCanvasReady(false);
    }
  }, []);

  const rawNetWorth = data?.total_net_worth ?? 47832;
  const rawIncome = data?.monthly_income ?? 6240;
  const rawSpending = data?.monthly_spending ?? 3891;

  // When off or error, show 0 values; spring physics create natural roll/sweep on transition
  const netWorth = isOff || hasError ? 0 : rawNetWorth;
  const income = isOff || hasError ? 0 : rawIncome;
  const spending = isOff || hasError ? 0 : rawSpending;
  const netFlow = income - spending;
  const isPositive = netFlow >= 0;

  // Normalize income/spending to 0-1 range (assume max ~10K/mo for gauge)
  const maxGauge = Math.max(income, spending, 1) * 1.3;
  const incomeNorm = Math.min(1, income / maxGauge);
  const spendingNorm = Math.min(1, spending / maxGauge);

  const formattedValue = `$${Math.abs(Math.round(netWorth)).toLocaleString()}`;

  return (
    <InstrumentMalfunction active={hasError}>
    <div className="flex flex-col h-full gap-0.5 py-1" role="group" aria-label="Net Worth">
      {/* Screen reader text */}
      <span className="sr-only">
        {hasError
          ? 'Net worth: instrument malfunction.'
          : `Net worth: ${formattedValue}. Monthly income: $${rawIncome.toLocaleString()}. Monthly spending: $${rawSpending.toLocaleString()}. Net flow: ${rawIncome - rawSpending >= 0 ? 'positive' : 'negative'} $${Math.abs(rawIncome - rawSpending).toLocaleString()} per month.`
        }
      </span>
      {/* Primary: Odometer */}
      <div className="relative" style={{ height: '48px' }}>
        {canvasReady ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <OdometerFallback value={formattedValue} />
            </div>
          }>
            <NetWorthOdometer3D value={netWorth} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full">
            <OdometerFallback value={formattedValue} />
          </div>
        )}
      </div>

      {/* Secondary: Dual-needle gauge */}
      <div className="relative" style={{ height: '56px' }}>
        {canvasReady ? (
          <Suspense fallback={<div />}>
            <DualNeedleGauge3D incomeNormalized={incomeNorm} spendingNormalized={spendingNorm} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full gap-3 px-2">
            <div className="font-mono" style={{ fontSize: '6px', color: '#22c55e', opacity: 0.6 }}>
              +${(income / 1000).toFixed(1)}K
            </div>
            <div className="font-mono" style={{ fontSize: '6px', color: '#ef4444', opacity: 0.6 }}>
              -${(spending / 1000).toFixed(1)}K
            </div>
          </div>
        )}
      </div>

      {/* Trend semaphore — mechanical hinged flag */}
      <div className="flex items-center justify-center gap-1.5 px-2 pb-0.5">
        {/* Pivot housing */}
        <div
          className="relative w-[20px] h-[10px]"
          style={{
            background: 'rgba(4, 8, 18, 0.8)',
            borderRadius: '2px',
            border: '0.5px solid rgba(60, 80, 110, 0.15)',
          }}
        >
          {/* Flag arm */}
          <div
            className="absolute left-1/2 top-1/2 origin-left"
            style={{
              width: '8px',
              height: '2px',
              background: isPositive ? '#22c55e' : '#ef4444',
              transform: `translate(-1px, -1px) rotate(${isPositive ? -25 : 25}deg)`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s',
              boxShadow: `1px ${isPositive ? '-1px' : '1px'} 2px rgba(0,0,0,0.3)`,
              borderRadius: '0 1px 1px 0',
            }}
          />
          {/* Pivot dot */}
          <div
            className="absolute left-1/2 top-1/2 w-[3px] h-[3px] rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'rgba(120, 150, 180, 0.2)' }}
          />
        </div>

        {/* Label */}
        <div
          className="font-mono"
          style={{
            fontSize: '5px',
            color: isPositive ? '#22c55e' : '#ef4444',
            opacity: 0.5,
          }}
        >
          {isPositive ? '▲' : '▼'} ${Math.abs(netFlow).toLocaleString()}/mo
        </div>
      </div>
    </div>
    </InstrumentMalfunction>
  );
}
