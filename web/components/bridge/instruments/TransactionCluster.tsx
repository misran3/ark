'use client';

import { useState, useEffect, Suspense } from 'react';
import { useInstrumentPower } from '@/hooks/useInstrumentPower';
import { TransactionDrum3D } from './TransactionDrum3D';
import { DrumDisplayFallback } from './fallbacks';
import { InstrumentMalfunction } from './InstrumentMalfunction';

const MOCK_TRANSACTIONS = [
  { merchant: 'Uber', amount: -18.50, icon: '🚀' },
  { merchant: 'Chipotle', amount: -12.40, icon: '🍜' },
  { merchant: 'Payroll', amount: 3120, icon: '💰' },
  { merchant: 'Steam', amount: -59.99, icon: '🎮' },
  { merchant: 'Trader Joe', amount: -47.82, icon: '🛒' },
];

const CATEGORY_COLORS: Record<string, string> = {
  '🚀': '#3b82f6',
  '🍜': '#f59e0b',
  '💰': '#22c55e',
  '🎮': '#a855f7',
  '🛒': '#ec4899',
  '☕': '#f97316',
};

/**
 * INST-03: Transactions → Activity Drum
 *
 * Primary: Rotating drum display (3D) — transactions on cylinder surface
 * Secondary: Category lamps (CSS) — merchant category indicator circles
 */
export function TransactionCluster() {
  const [canvasReady, setCanvasReady] = useState(false);
  const { isOff, hasError } = useInstrumentPower('inst-03');

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setCanvasReady(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      setCanvasReady(false);
    }
  }, []);

  // When off or error, show empty transactions; drum rolls in data on power-on
  const transactions = isOff || hasError ? [] : MOCK_TRANSACTIONS;

  const fallbackEntries = transactions.slice(0, 5).map((tx) => ({
    emoji: tx.icon,
    name: tx.merchant,
    amount: tx.amount > 0 ? `+$${tx.amount}` : `-$${Math.abs(tx.amount)}`,
  }));

  return (
    <InstrumentMalfunction active={hasError}>
    <div className="flex flex-col h-full gap-0.5 py-1" role="group" aria-label="Recent Transactions">
      {/* Screen reader text */}
      <span className="sr-only">
        {hasError
          ? 'Transactions: instrument malfunction.'
          : `Recent transactions: ${MOCK_TRANSACTIONS.map(
              (tx) => `${tx.merchant}: ${tx.amount > 0 ? 'plus' : 'minus'} $${Math.abs(tx.amount).toFixed(2)}`
            ).join('. ')}.`
        }
      </span>
      {/* Primary: Transaction drum */}
      <div className="relative flex-1" style={{ minHeight: '80px' }}>
        {canvasReady ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full px-1">
                <DrumDisplayFallback entries={fallbackEntries} />
              </div>
            }
          >
            <TransactionDrum3D transactions={transactions} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full px-1">
            <DrumDisplayFallback entries={fallbackEntries} />
          </div>
        )}
      </div>

      {/* Secondary: Category lamps — small recessed indicators */}
      <div className="flex items-center justify-center gap-1.5 px-2 pb-0.5">
        {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([icon, color]) => {
          const isActive = transactions.some((tx) => tx.icon === icon);
          return (
            <div
              key={icon}
              className="relative"
              title={icon}
            >
              {/* Recessed housing */}
              <div
                className="w-[7px] h-[7px] rounded-full"
                style={{
                  background: isActive
                    ? `radial-gradient(circle at 40% 40%, ${color}, ${color}88)`
                    : 'rgba(20, 28, 40, 0.8)',
                  boxShadow: isActive
                    ? `0 0 4px ${color}66, inset 0 -1px 1px rgba(0,0,0,0.3)`
                    : 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
                  border: '0.5px solid rgba(60, 80, 110, 0.2)',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
    </InstrumentMalfunction>
  );
}
