'use client';

const MOCK_TRANSACTIONS = [
  { merchant: 'Uber', amount: -18.50, icon: '\uD83D\uDE80' },
  { merchant: 'Chipotle', amount: -12.40, icon: '\uD83C\uDF5C' },
  { merchant: 'Payroll', amount: 3120, icon: '\uD83D\uDCB0' },
];

export function TransactionsContent() {
  return (
    <div className="space-y-1.5 w-full">
      {MOCK_TRANSACTIONS.slice(0, 3).map((tx, i) => (
        <div key={i} className="flex items-center gap-2 text-[9px]">
          <span className="text-xs">{tx.icon}</span>
          <span className="flex-1 text-cyan-400/60 truncate">{tx.merchant}</span>
          <span className={`font-orbitron font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
}
