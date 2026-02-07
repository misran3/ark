'use client';

interface CounterFallbackProps {
  /** Single digit count value */
  value: number;
  /** Label */
  label?: string;
  /** Digit color */
  color?: string;
}

/**
 * CSS-only large single-digit counter at ~70% fidelity.
 * Shows a big mechanical digit in a recessed window.
 */
export function CounterFallback({
  value,
  label,
  color = '#00f0ff',
}: CounterFallbackProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.15)' }}>
          {label}
        </div>
      )}
      <div
        className="relative overflow-hidden"
        style={{
          width: '28px',
          height: '36px',
          background: 'rgba(4, 8, 18, 0.9)',
          borderRadius: '3px',
          border: '1.5px solid rgba(42, 58, 80, 0.4)',
          boxShadow:
            'inset 0 2px 6px rgba(0, 0, 0, 0.5), ' +
            '0 0 0 1px rgba(100, 140, 180, 0.05)',
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-bold"
          style={{
            fontSize: '22px',
            color,
            opacity: 0.85,
            textShadow: `0 0 6px ${color}`,
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {value}
        </div>
        {/* Top shadow */}
        <div
          className="absolute top-0 left-0 right-0 h-[6px]"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' }}
        />
        {/* Bottom shadow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[6px]"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.5), transparent)' }}
        />
      </div>
    </div>
  );
}
