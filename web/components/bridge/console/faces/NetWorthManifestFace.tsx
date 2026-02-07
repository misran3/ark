'use client';

/** Net Worth panel face — CRT phosphor terminal readout with credit breakdown + sparkline */
export function NetWorthManifestFace() {
  // Hardcoded data matching the ship's credit system
  const netWorth = 1_247_830;
  const breakdown = [
    { label: 'HULL & MODULES', value: 620_000 },
    { label: 'CARGO HOLD', value: 412_830 },
    { label: 'LIQUID CREDITS', value: 315_000 },
    { label: 'LIABILITIES', value: -100_000 },
  ];
  const trendPct = 4.2;

  // Hardcoded upward sparkline points (normalized 0-1)
  const sparkline = [0.3, 0.28, 0.35, 0.33, 0.4, 0.38, 0.45, 0.5, 0.48, 0.55, 0.6, 0.65, 0.62, 0.7, 0.75, 0.8];

  const formatCredits = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US');
    return n < 0 ? `-₡ ${formatted}` : `₡ ${formatted}`;
  };

  const padLabel = (label: string, maxLen: number) => {
    const dotsNeeded = maxLen - label.length;
    return label + ' ' + '.'.repeat(Math.max(0, dotsNeeded));
  };

  // SVG sparkline path
  const sparkW = 80;
  const sparkH = 16;
  const points = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * sparkW;
    const y = sparkH - v * sparkH;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center px-3 py-1 font-mono overflow-hidden"
      style={{
        color: 'rgba(255, 190, 50, 0.85)',
        textShadow: '0 0 6px rgba(255, 180, 40, 0.3)',
        fontSize: '9px',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,190,50,0.02) 2px, rgba(255,190,50,0.02) 4px)',
        }}
      />

      {/* Hero net worth */}
      <div
        className="tracking-wider mb-1"
        style={{
          fontSize: '16px',
          color: 'rgba(255, 200, 60, 0.95)',
          textShadow: '0 0 10px rgba(255, 180, 40, 0.4), 0 0 20px rgba(255, 160, 30, 0.15)',
        }}
      >
        ₡ {netWorth.toLocaleString('en-US')}
      </div>

      {/* Breakdown rows */}
      <div className="space-y-[1px]" style={{ fontSize: '7px', opacity: 0.7 }}>
        {breakdown.map((row) => (
          <div key={row.label} className="flex justify-between">
            <span>{padLabel(row.label, 18)}</span>
            <span style={{ color: row.value < 0 ? 'rgba(239, 68, 68, 0.8)' : undefined }}>
              {formatCredits(row.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Sparkline + trend */}
      <div className="flex items-center gap-2 mt-1.5">
        <svg width={sparkW} height={sparkH} className="opacity-60">
          <path d={pathD} fill="none" stroke="rgba(255, 200, 60, 0.6)" strokeWidth="1.5" />
        </svg>
        <span
          style={{
            fontSize: '8px',
            color: 'rgba(80, 255, 120, 0.8)',
            textShadow: '0 0 4px rgba(80, 255, 120, 0.3)',
          }}
        >
          ▲ {trendPct}%
        </span>
      </div>
    </div>
  );
}
