'use client';

import { PanelPopup } from '../PanelPopup';

const MOCK_CARDS = [
  {
    name: 'Sapphire Reserve',
    bank: 'Chase',
    color: '#3b82f6',
    limit: 24000,
    used: 5520,
    utilization: 23,
    rewards: '3x Travel & Dining',
  },
  {
    name: 'Amex Gold',
    bank: 'American Express',
    color: '#f59e0b',
    limit: 15000,
    used: 8550,
    utilization: 57,
    rewards: '4x Restaurants & Groceries',
  },
  {
    name: 'Freedom Unlimited',
    bank: 'Chase',
    color: '#10b981',
    limit: 10000,
    used: 1200,
    utilization: 12,
    rewards: '1.5% Everything',
  },
];

export function CardsPopup() {
  return (
    <PanelPopup type="cards" title="Card Fleet - Detailed View">
      <div className="grid grid-cols-3 gap-4">
        {MOCK_CARDS.map((card, i) => (
          <div
            key={i}
            className="glass-panel glass-panel-level-2 p-4"
            style={{ borderTopColor: card.color, borderTopWidth: 3 }}
          >
            <div className="font-orbitron text-base font-semibold text-white mb-1">
              {card.name}
            </div>
            <div className="text-xs text-white/40 mb-4">{card.bank}</div>

            {/* Utilization */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">Utilization</span>
                <span style={{ color: card.utilization > 50 ? '#f59e0b' : '#10b981' }}>
                  {card.utilization}%
                </span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${card.utilization}%`,
                    background: card.color,
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="text-xs text-white/40 mb-3">
              Used: ${card.used.toLocaleString()} / ${card.limit.toLocaleString()}
            </div>

            {/* Rewards */}
            <div className="bg-aurora-primary/10 rounded p-2 text-xs text-aurora-primary">
              {'\uD83C\uDFC6'} {card.rewards}
            </div>
          </div>
        ))}
      </div>
    </PanelPopup>
  );
}
