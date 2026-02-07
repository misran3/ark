'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  time: string;
  label: string;
  amount: number;
}

const MOCK_TRANSACTIONS: LogEntry[] = [
  { time: '14:32', label: 'FUEL DEPOT', amount: -2340 },
  { time: '13:18', label: 'CARGO HAUL PAYOUT', amount: 8500 },
  { time: '12:05', label: 'DOCKING FEE', amount: -450 },
  { time: '11:47', label: 'HULL REPAIR', amount: -1200 },
  { time: '09:22', label: 'BOUNTY REWARD', amount: 3200 },
  { time: '08:15', label: 'CREW WAGES', amount: -4100 },
  { time: '07:41', label: 'TRADE LICENSE', amount: -680 },
  { time: '06:30', label: 'SALVAGE SALE', amount: 1850 },
];

const VISIBLE_ROWS = 4;

export function TransactionLogFace() {
  const [offset, setOffset] = useState(0);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setOffset((prev) => (prev + 1) % MOCK_TRANSACTIONS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Get the visible window
  const visible: LogEntry[] = [];
  for (let i = 0; i < VISIBLE_ROWS; i++) {
    visible.push(MOCK_TRANSACTIONS[(offset + i) % MOCK_TRANSACTIONS.length]);
  }

  const formatAmount = (n: number) => {
    const abs = Math.abs(n).toLocaleString('en-US');
    return n < 0 ? `-₡ ${abs}` : `+₡ ${abs}`;
  };

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center px-4 py-2 font-mono overflow-hidden"
      style={{
        color: 'rgba(255, 190, 50, 0.8)',
        textShadow: '0 0 4px rgba(255, 180, 40, 0.2)',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,190,50,0.02) 2px, rgba(255,190,50,0.02) 4px)',
        }}
      />

      {/* Log entries */}
      <div className="space-y-[6px]" style={{ fontSize: '12.5px' }}>
        {visible.map((entry, i) => (
          <div
            key={`${entry.time}-${entry.label}-${offset}`}
            className="flex justify-between items-baseline"
            style={{
              opacity: i === 0 ? 0.5 : i === VISIBLE_ROWS - 1 ? 0.6 : 0.85,
              animation: i === VISIBLE_ROWS - 1 ? 'sensor-log-enter 0.3s ease-out' : undefined,
            }}
          >
            <span className="opacity-50 mr-1.5">{entry.time}</span>
            <span className="flex-1 truncate">{entry.label}</span>
            <span
              className="ml-2 tabular-nums"
              style={{
                color: entry.amount > 0 ? 'rgba(80, 255, 120, 0.8)' : 'rgba(255, 190, 50, 0.8)',
              }}
            >
              {formatAmount(entry.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
