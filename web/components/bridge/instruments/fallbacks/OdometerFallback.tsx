'use client';

interface OdometerFallbackProps {
  /** Display value (will be split into individual digits) */
  value: string;
  /** Color of digits */
  digitColor?: string;
}

/**
 * CSS-only mechanical odometer at ~70% fidelity.
 * Shows individual digit windows with scroll transition.
 */
export function OdometerFallback({
  value,
  digitColor = '#00f0ff',
}: OdometerFallbackProps) {
  const digits = value.split('');

  return (
    <div className="flex gap-[1px] items-center justify-center">
      {digits.map((char, i) => (
        <div
          key={i}
          className="relative overflow-hidden"
          style={{
            width: char === '.' || char === ',' || char === '$' ? '6px' : '12px',
            height: '18px',
            background: 'rgba(4, 8, 18, 0.9)',
            borderRadius: '2px',
            border: '1px solid rgba(42, 58, 80, 0.3)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center font-mono"
            style={{
              fontSize: char === '.' || char === ',' || char === '$' ? '8px' : '11px',
              color: digitColor,
              opacity: 0.8,
              textShadow: `0 0 4px ${digitColor}`,
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {char}
          </div>
          {/* Top shadow */}
          <div
            className="absolute top-0 left-0 right-0 h-[4px]"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4), transparent)' }}
          />
          {/* Bottom shadow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[4px]"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.4), transparent)' }}
          />
        </div>
      ))}
    </div>
  );
}
