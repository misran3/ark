'use client';

import { useEffect } from 'react';
import { useModalStore } from '@/lib/stores/modal-store';
import { GlassPanel } from '@/components/ui/GlassPanel';

const CATEGORY_ICONS: Record<string, string> = {
  Transport: '🛸',
  Dining: '🍜',
  Income: '💰',
  Entertain: '🎮',
  Entertainment: '🎮',
  Groceries: '🛒',
  Shopping: '🛍️',
  Subscriptions: '📡',
  Utilities: '⚡',
  Rent: '🏠',
  Healthcare: '🏥',
  Travel: '✈️',
  Gas: '⛽',
  Default: '💫',
};

export default function TransactionDetailModal() {
  const { isTransactionModalOpen, selectedTransaction, closeTransactionModal } =
    useModalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTransactionModalOpen) {
        closeTransactionModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTransactionModalOpen, closeTransactionModal]);

  if (!selectedTransaction) return null;

  const categoryIcon =
    CATEGORY_ICONS[selectedTransaction.category] || CATEGORY_ICONS['Default'];
  const isExpense = selectedTransaction.amount < 0;
  const displayAmount = Math.abs(selectedTransaction.amount);

  // Calculate budget impact (mock data)
  const monthlyBudget = 3000;
  const categoryMonthlySpend = 800; // Mock: dining spend
  const spendPercentage = ((displayAmount / categoryMonthlySpend) * 100).toFixed(0);
  const budgetPercentage = ((displayAmount / monthlyBudget) * 100).toFixed(1);

  const handleRecategorize = () => {
    console.log('Recategorize clicked for transaction:', selectedTransaction.id);
  };

  const handleFlag = () => {
    console.log('Flag clicked for transaction:', selectedTransaction.id);
  };

  const handleSetAlert = () => {
    console.log('Set alert clicked for transaction:', selectedTransaction.id);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-49 bg-[rgba(3,8,24,0.7)] backdrop-blur-sm transition-opacity duration-200 ${
          isTransactionModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeTransactionModal}
      />

      {/* Modal Container */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl transition-transform duration-350 ${
          isTransactionModalOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          transitionDuration: isTransactionModalOpen ? '350ms' : '250ms',
          transitionTimingFunction: isTransactionModalOpen
            ? 'cubic-bezier(0.4, 0, 0.2, 1)'
            : 'cubic-bezier(0.4, 0, 1, 1)',
        }}
      >
        <GlassPanel level={3} className="flex flex-col h-full">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>

          {/* Header Section */}
          <div className="px-6 py-4 flex items-start justify-between flex-shrink-0 border-b border-white/5">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-8 h-8 rounded flex items-center justify-center text-sm bg-aurora-primary/5 flex-shrink-0">
                {categoryIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-orbitron font-bold text-base uppercase tracking-[1px] text-white">
                  {selectedTransaction.merchant}
                </div>
                <div className="font-rajdhani text-xs text-white/40 tracking-wide uppercase">
                  {selectedTransaction.category}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className={`font-orbitron font-bold text-xl tracking-[0.5px] ${
                  isExpense ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {isExpense ? '-' : '+'}${displayAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="px-6 py-4 flex-shrink-0">
            <div className="space-y-4">
              {/* Row 1: Date & Card Used */}
              <div className="flex gap-8">
                <div className="flex-1">
                  <div className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase mb-1.5">
                    Date
                  </div>
                  <div className="font-rajdhani text-sm text-white/80">
                    {selectedTransaction.date}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase mb-1.5">
                    Card Used
                  </div>
                  <div className="font-rajdhani text-sm text-white/80">
                    {selectedTransaction.cardUsed || 'N/A'}
                    {selectedTransaction.cardLastFour && (
                      <span className="text-white/40">
                        {' '}
                        •••• {selectedTransaction.cardLastFour}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5" />

              {/* Row 2: Category & Location */}
              <div className="flex gap-8">
                <div className="flex-1">
                  <div className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase mb-1.5">
                    Category
                  </div>
                  <div className="font-rajdhani text-sm text-white/80">
                    {selectedTransaction.category}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase mb-1.5">
                    Location
                  </div>
                  <div className="font-rajdhani text-sm text-white/80">
                    {selectedTransaction.location || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5" />

              {/* Row 3: Bucket & Status */}
              <div className="flex gap-8">
                <div className="flex-1">
                  <div className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase mb-1.5">
                    Bucket
                  </div>
                  <div className="font-rajdhani text-sm text-white/80">
                    {selectedTransaction.bucket
                      ? selectedTransaction.bucket.charAt(0).toUpperCase() +
                        selectedTransaction.bucket.slice(1)
                      : 'N/A'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase mb-1.5">
                    Status
                  </div>
                  <div className="font-rajdhani text-sm text-white/80">
                    {selectedTransaction.isRecurring ? 'Recurring' : 'One-time'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Impact Section */}
          <div className="px-6 py-4 flex-shrink-0 border-t border-white/5">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-orbitron text-[7px] tracking-[2px] text-aurora-primary/25 uppercase">
                  Category Budget
                </span>
                <span className="font-mono text-xs text-white/60">
                  ${displayAmount.toFixed(2)} / ${categoryMonthlySpend}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    parseFloat(spendPercentage) > 100
                      ? 'bg-red-500'
                      : parseFloat(spendPercentage) > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(parseFloat(spendPercentage), 100)}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-white/50 font-rajdhani">
              This purchase: {budgetPercentage}% of monthly budget
            </div>
          </div>

          {/* Action Buttons - Fixed Bottom */}
          <div className="px-6 py-4 flex-shrink-0 border-t border-white/5 flex gap-2 mt-auto">
            <button
              onClick={handleRecategorize}
              className="flex-1 px-3 py-2 bg-aurora-primary/5 border border-aurora-primary/10 text-aurora-primary/40 rounded-[3px] font-orbitron text-[7px] tracking-[2px] uppercase hover:bg-aurora-primary/10 hover:text-aurora-primary/60 hover:border-aurora-primary/20 transition-all"
            >
              Recategorize
            </button>
            <button
              onClick={handleFlag}
              className="flex-1 px-3 py-2 bg-aurora-primary/5 border border-aurora-primary/10 text-aurora-primary/40 rounded-[3px] font-orbitron text-[7px] tracking-[2px] uppercase hover:bg-aurora-primary/10 hover:text-aurora-primary/60 hover:border-aurora-primary/20 transition-all"
            >
              Flag
            </button>
            <button
              onClick={handleSetAlert}
              className="flex-1 px-3 py-2 bg-aurora-primary/5 border border-aurora-primary/10 text-aurora-primary/40 rounded-[3px] font-orbitron text-[7px] tracking-[2px] uppercase hover:bg-aurora-primary/10 hover:text-aurora-primary/60 hover:border-aurora-primary/20 transition-all"
            >
              Set Alert
            </button>
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
