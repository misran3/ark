'use client';

interface CircularGaugeFallbackProps {
  /** Value 0-100 */
  value: number;
  /** Label below the gauge */
  label?: string;
  /** Color of the needle/fill */
  color?: string;
  /** Danger threshold (shows red below this) */
  dangerThreshold?: number;
}

/**
 * CSS-only circular gauge at ~70% fidelity.
 * Fallback if canvas fails to initialize.
 */
export function CircularGaugeFallback({
  value,
  label,
  color = '#00f0ff',
  dangerThreshold = 25,
}: CircularGaugeFallbackProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const isDanger = clampedValue <= dangerThreshold;
  const needleAngle = -135 + (clampedValue / 100) * 270; // -135 to +135 deg
  const activeColor = isDanger ? '#ef4444' : color;

  return (
    <div className="relative w-full aspect-square max-w-[80px] mx-auto">
      {/* Bezel */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(6, 10, 24, 0.9)',
          border: '2px solid rgba(42, 58, 80, 0.6)',
          boxShadow:
            'inset 0 1px 4px rgba(0, 0, 0, 0.5), ' +
            '0 0 0 1px rgba(100, 140, 180, 0.05)',
        }}
      />

      {/* Tick marks via conic gradient */}
      <div
        className="absolute inset-[6px] rounded-full"
        style={{
          background: `conic-gradient(from 225deg,
            ${isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 101, 128, 0.3)'} 0deg,
            ${isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 101, 128, 0.3)'} ${(clampedValue / 100) * 270}deg,
            rgba(30, 40, 60, 0.2) ${(clampedValue / 100) * 270}deg,
            rgba(30, 40, 60, 0.2) 270deg,
            transparent 270deg
          )`,
          mask: 'radial-gradient(circle, transparent 60%, black 62%, black 88%, transparent 90%)',
          WebkitMask: 'radial-gradient(circle, transparent 60%, black 62%, black 88%, transparent 90%)',
        }}
      />

      {/* Needle */}
      <div
        className="absolute top-1/2 left-1/2 origin-bottom"
        style={{
          width: '2px',
          height: '35%',
          background: `linear-gradient(0deg, transparent, ${activeColor})`,
          transform: `translate(-50%, -100%) rotate(${needleAngle}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: `0 0 3px ${activeColor}`,
        }}
      />

      {/* Center dot */}
      <div
        className="absolute top-1/2 left-1/2 w-[6px] h-[6px] rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'rgba(42, 58, 80, 0.8)' }}
      />

      {/* Glass highlight */}
      <div
        className="absolute inset-[3px] rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(200, 220, 255, 0.04) 0%, transparent 50%)',
        }}
      />

      {/* Value label */}
      {label && (
        <div
          className="absolute bottom-[15%] left-1/2 -translate-x-1/2 font-mono"
          style={{ fontSize: '7px', color: activeColor, opacity: 0.6 }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
