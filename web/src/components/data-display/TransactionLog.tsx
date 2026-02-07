'use client';

import React from 'react';
import type { Transaction } from '@/src/types/api';

interface TransactionLogProps {
  transactions: Transaction[];
  maxItems?: number;
}

const bucketColors: Record<NonNullable<Transaction['bucket']>, string> = {
  needs: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  wants: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
  savings: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  income: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

const bucketLabels: Record<NonNullable<Transaction['bucket']>, string> = {
  needs: 'LIFE SUPPORT',
  wants: 'REC DECK',
  savings: 'WARP FUEL',
  income: 'INCOMING',
};

export function TransactionLog({
  transactions,
  maxItems = 10,
}: TransactionLogProps) {
  const displayedTransactions = transactions.slice(0, maxItems);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="w-full max-w-md bg-black/60 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-white/5">
        <h3 className="font-bold text-xs tracking-[0.2em] uppercase text-cyan-500/80">
          Recent Transmissions
        </h3>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
        {displayedTransactions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm font-mono">
            NO TRANSMISSIONS DETECTED
          </div>
        ) : (
          displayedTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 flex justify-between items-center hover:bg-white/5 transition-colors"
              style={{ animation: 'fade-in-up 0.3s ease-out' }}
            >
              {/* Left: Merchant & Bucket */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {tx.merchant}
                  </span>
                  {tx.is_recurring && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold tracking-wider">
                      RECURRING
                    </span>
                  )}
                </div>
                {tx.bucket && (
                  <span
                    className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${bucketColors[tx.bucket]}`}
                  >
                    {bucketLabels[tx.bucket]}
                  </span>
                )}
              </div>

              {/* Right: Amount & Date */}
              <div className="text-right ml-4">
                <div
                  className={`text-sm font-mono ${
                    tx.bucket === 'income' ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {tx.bucket === 'income' ? '+' : ''}
                  {formatCurrency(tx.amount)}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {formatDate(tx.date)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {transactions.length > maxItems && (
        <div className="p-2 border-t border-white/10 bg-white/5 text-center">
          <span className="text-[10px] text-gray-500 font-mono">
            +{transactions.length - maxItems} MORE TRANSMISSIONS
          </span>
        </div>
      )}
    </div>
  );
}
