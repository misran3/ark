'use client';

const MOCK_CARDS = [
  { name: 'Sapphire', utilization: 23, color: '#3b82f6' },
  { name: 'Amex Gold', utilization: 57, color: '#f59e0b' },
  { name: 'Freedom', utilization: 12, color: '#10b981' },
];

export function CardsContent() {
  return (
    <div className="space-y-2 w-full">
      <div className="text-center mb-2">
        <div className="font-orbitron text-lg font-bold text-cyan-400">
          {MOCK_CARDS.length}
        </div>
        <div className="font-mono text-[8px] text-white/40 uppercase tracking-wider">
          Active Cards
        </div>
      </div>

      {MOCK_CARDS.map((card, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: card.color }}
          />
          <div className="font-mono text-[9px] text-cyan-400/60 flex-1 truncate">
            {card.name}
          </div>
          <div className="font-orbitron text-[9px] text-cyan-400/60">
            {card.utilization}%
          </div>
        </div>
      ))}
    </div>
  );
}
