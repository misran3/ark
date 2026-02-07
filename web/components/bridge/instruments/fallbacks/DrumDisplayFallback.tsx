'use client';

interface DrumEntry {
  emoji: string;
  name: string;
  amount: string;
}

interface DrumDisplayFallbackProps {
  entries: DrumEntry[];
  color?: string;
}

/**
 * CSS-only drum display at ~70% fidelity.
 * Shows transaction entries in a vertically scrolling list with
 * simulated curvature via opacity/scale gradients.
 */
export function DrumDisplayFallback({
  entries,
  color = '#00f0ff',
}: DrumDisplayFallbackProps) {
  const visible = entries.slice(0, 5);

  return (
    <div className="flex flex-col gap-[2px] overflow-hidden" style={{ maxHeight: '100%' }}>
      {visible.map((entry, i) => {
        const distFromCenter = Math.abs(i - 1); // center index is 1
        const opacity = Math.max(0.2, 1 - distFromCenter * 0.3);
        const scale = Math.max(0.9, 1 - distFromCenter * 0.04);

        return (
          <div
            key={i}
            className="flex items-center gap-1 px-1"
            style={{
              opacity,
              transform: `scale(${scale})`,
              transition: 'all 0.4s ease-out',
            }}
          >
            {/* Emoji lamp */}
            <div
              className="w-[14px] h-[14px] rounded-sm flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(4, 8, 18, 0.8)',
                border: '1px solid rgba(42, 58, 80, 0.2)',
                fontSize: '8px',
              }}
            >
              {entry.emoji}
            </div>
            {/* Name */}
            <div
              className="font-mono truncate flex-1"
              style={{ fontSize: '6px', color, opacity: 0.7 }}
            >
              {entry.name}
            </div>
            {/* Amount */}
            <div
              className="font-mono flex-shrink-0"
              style={{ fontSize: '6px', color, opacity: 0.6 }}
            >
              {entry.amount}
            </div>
          </div>
        );
      })}
    </div>
  );
}
