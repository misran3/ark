'use client';

interface CardStatus {
  name: string;
  utilization: number; // 0-100
}

const MOCK_CARDS: CardStatus[] = [
  { name: 'SAPPHIRE', utilization: 23 },
  { name: 'AMEX GOLD', utilization: 67 },
  { name: 'DISCOVER', utilization: 82 },
];

function getLampColor(util: number): { bg: string; glow: string } {
  if (util < 30) return {
    bg: 'rgba(34, 197, 94, 0.8)',
    glow: '0 0 8px rgba(34, 197, 94, 0.4), 0 0 16px rgba(34, 197, 94, 0.15)',
  };
  if (util < 70) return {
    bg: 'rgba(251, 191, 36, 0.8)',
    glow: '0 0 8px rgba(251, 191, 36, 0.4), 0 0 16px rgba(251, 191, 36, 0.15)',
  };
  return {
    bg: 'rgba(239, 68, 68, 0.8)',
    glow: '0 0 8px rgba(239, 68, 68, 0.4), 0 0 16px rgba(239, 68, 68, 0.15)',
  };
}

export function CardStatusFace() {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-3 py-1">
      <div className="flex gap-3 items-end">
        {MOCK_CARDS.map((card) => {
          const lamp = getLampColor(card.utilization);
          const isRedZone = card.utilization >= 70;
          return (
            <div key={card.name} className="flex flex-col items-center gap-1.5">
              {/* Card label — stencil style */}
              <div
                className="font-mono uppercase text-center"
                style={{
                  fontSize: '5.5px',
                  color: 'rgba(200, 210, 230, 0.45)',
                  letterSpacing: '1px',
                  textShadow: '0 0 2px rgba(200, 210, 230, 0.1)',
                }}
              >
                {card.name}
              </div>

              {/* Status lamp — recessed indicator */}
              <div
                className="relative"
                style={{
                  width: '22px',
                  height: '22px',
                }}
              >
                {/* Lamp recess */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), inset 0 0 1px rgba(255,255,255,0.05)',
                  }}
                />
                {/* Lit lamp */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: '3px',
                    background: `radial-gradient(circle at 40% 35%, ${lamp.bg}, rgba(0,0,0,0.3))`,
                    boxShadow: lamp.glow,
                    animation: isRedZone ? 'lamp-pulse 2s ease-in-out infinite' : undefined,
                  }}
                />
                {/* Glass highlight */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: '3px',
                    background: 'radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                  }}
                />
              </div>

              {/* Utilization % readout */}
              <div
                className="font-mono tabular-nums"
                style={{
                  fontSize: '7px',
                  color: lamp.bg,
                  textShadow: `0 0 4px ${lamp.bg.replace('0.8', '0.3')}`,
                }}
              >
                {card.utilization}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
