'use client';

import { PanelPopup } from '../PanelPopup';

const MOCK_TRANSACTIONS = [
  { id: '1', merchant: 'Uber Ride', category: 'Transport', amount: -18.50, date: '2h ago', icon: '\uD83D\uDE80', card: 'Visa' },
  { id: '2', merchant: 'Chipotle', category: 'Dining', amount: -12.40, date: '5h ago', icon: '\uD83C\uDF5C', card: 'Amex' },
  { id: '3', merchant: 'Payroll', category: 'Income', amount: 3120, date: '1d ago', icon: '\uD83D\uDCB0', card: 'Direct' },
  { id: '4', merchant: 'Steam', category: 'Gaming', amount: -29.99, date: '2d ago', icon: '\uD83C\uDFAE', card: 'Visa' },
  { id: '5', merchant: 'Starbucks', category: 'Dining', amount: -6.25, date: '2d ago', icon: '\u2615', card: 'Amex' },
];

export function TransactionsPopup() {
  return (
    <PanelPopup type="transactions" title="Recent Transactions - Detailed View">
      <div className="space-y-2">
        {MOCK_TRANSACTIONS.map((tx) => (
          <div key={tx.id} className="glass-panel glass-panel-level-2 p-3 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded bg-aurora-primary/10 flex items-center justify-center text-lg">
              {tx.icon}
            </div>
            <div className="flex-1">
              <div className="font-rajdhani text-sm font-semibold text-white">
                {tx.merchant}
              </div>
              <div className="text-xs text-white/40">
                {tx.category} {'\u2022'} {tx.card} {'\u2022'} {tx.date}
              </div>
            </div>
            <div className={`font-orbitron text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </PanelPopup>
  );
}
