'use client';

import React from 'react';
import type { AccountSummary } from '@/src/types/api';

interface BalanceHUDProps {
  totalNetWorth: number;
  accounts: AccountSummary[];
  balanceChange?: number;
  isLoading?: boolean;
}

const accountTypeColors: Record<AccountSummary['type'], string> = {
  checking: 'text-cyan-400',
  savings: 'text-emerald-400',
  credit_card: 'text-fuchsia-400',
};

const accountTypeLabels: Record<AccountSummary['type'], string> = {
  checking: 'CHK',
  savings: 'SAV',
  credit_card: 'CC',
};

export function BalanceHUD({
  totalNetWorth,
  accounts,
  balanceChange,
  isLoading = false,
}: BalanceHUDProps) {
  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center p-8 border border-cyan-900/30 bg-black/40 backdrop-blur-xl rounded-full w-72 h-72 md:w-80 md:h-80">
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[orbit_3s_linear_infinite]" />
        <div className="text-cyan-500 animate-pulse font-mono text-sm tracking-widest">
          SCANNING SECTOR...
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(absValue);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 border border-cyan-900/30 bg-black/40 backdrop-blur-xl rounded-full w-72 h-72 md:w-80 md:h-80 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
      {/* Outer Orbital Ring */}
      <div
        className="absolute inset-0 border border-cyan-500/30 rounded-full"
        style={{ animation: 'orbit 12s linear infinite' }}
      />

      {/* Inner Dashed Ring */}
      <div
        className="absolute inset-4 border border-dashed border-cyan-500/15 rounded-full"
        style={{ animation: 'orbit-reverse 18s linear infinite' }}
      />

      {/* Pulsing Glow Ring */}
      <div
        className="absolute inset-2 border border-cyan-500/20 rounded-full"
        style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
      />

      {/* Content */}
      <div className="text-center z-10">
        <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-500/60 uppercase">
          Net Worth
        </span>

        <div className="text-3xl md:text-4xl font-mono font-bold text-white mt-1">
          {formatCurrency(totalNetWorth)}
        </div>

        {balanceChange !== undefined && (
          <div
            className={`text-xs font-mono mt-1 ${
              balanceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {balanceChange >= 0 ? '+' : '-'}
            {formatCurrency(balanceChange)}
          </div>
        )}

        {/* Account List */}
        <div className="mt-4 space-y-1">
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className="text-[10px] font-mono text-gray-400 uppercase flex items-center justify-center gap-2"
            >
              <span className={`${accountTypeColors[acc.type]} font-bold`}>
                [{accountTypeLabels[acc.type]}]
              </span>
              <span className="text-gray-500 truncate max-w-[80px]">
                {acc.nickname}
              </span>
              <span className={acc.balance < 0 ? 'text-red-400' : 'text-white'}>
                {acc.balance < 0 ? '-' : ''}
                {formatCurrency(acc.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
