'use client';

import { useState, useEffect, Suspense } from 'react';
import { useShieldStore } from '@/lib/stores/shield-store';
import { useInstrumentPower } from '@/hooks/useInstrumentPower';
import { ShieldGauge3D } from './ShieldGauge3D';
import { CircularGaugeFallback } from './fallbacks';
import { InstrumentMalfunction } from './InstrumentMalfunction';

/**
 * INST-01: Shield Status → Gauge Cluster
 *
 * Primary: Circular dial gauge (3D) — overall shield integrity
 * Secondary: Three tube gauges (CSS) — Life Support, Recreation Deck, Warp Fuel
 * Warning lamp (CSS) — glows red when integrity < 25%
 *
 * Power lifecycle: off → boot → running
 * On boot: needle sweeps from 0, tube gauges fill from 0
 */
export function ShieldCluster() {
  const overallPercent = useShieldStore((s) => s.overallPercent);
  const shields = useShieldStore((s) => s.shields);
  const [canvasReady, setCanvasReady] = useState(false);
  const { isRunning, isOff, hasError } = useInstrumentPower('inst-01');

  // Check if WebGL is available
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setCanvasReady(!!gl);
    } catch {
      setCanvasReady(false);
    }
  }, []);

  // When off or error, show 0 values; spring physics create natural sweep on transition
  // Error state: needle drops to 0 and trembles erratically (handled by spring physics at 0)
  const displayPercent = isOff || hasError ? 0 : overallPercent;
  const isDanger = displayPercent < 25 && isRunning;
  const shieldList = [
    { id: 'life-support', label: 'LS', color: '#22c55e' },
    { id: 'recreation-deck', label: 'RD', color: '#a855f7' },
    { id: 'warp-fuel', label: 'WF', color: '#f59e0b' },
  ] as const;

  const shieldNames: Record<string, string> = {
    'life-support': 'Life Support',
    'recreation-deck': 'Recreation Deck',
    'warp-fuel': 'Warp Fuel',
  };

  return (
    <InstrumentMalfunction active={hasError}>
    <div className="flex flex-col h-full gap-1 py-1" role="group" aria-label="Shield Status">
      {/* Screen reader text */}
      <span className="sr-only">
        {hasError
          ? 'Shield status: instrument malfunction.'
          : `Shield integrity: ${Math.round(overallPercent)} percent. ${
              shieldList.map(({ id }) => {
                const s = shields[id];
                return s ? `${shieldNames[id]}: ${Math.round(s.currentPercent)} percent` : '';
              }).filter(Boolean).join('. ')
            }. ${isDanger ? 'Warning: shield integrity critical.' : ''}`
        }
      </span>
      {/* Primary: Circular dial gauge — fixed height prevents resize loop under CSS perspective */}
      <div className="relative" style={{ height: '90px' }}>
        {canvasReady ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <CircularGaugeFallback value={displayPercent} label={`${Math.round(displayPercent)}%`} />
            </div>
          }>
            <ShieldGauge3D value={displayPercent} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full">
            <CircularGaugeFallback value={overallPercent} label={`${Math.round(overallPercent)}%`} />
          </div>
        )}
      </div>

      {/* Secondary: Three tube gauges */}
      <div className="flex flex-col gap-[3px] px-2">
        {shieldList.map(({ id, label, color }) => {
          const shield = shields[id];
          if (!shield) return null;
          const pct = isOff ? 0 : shield.currentPercent;
          const isLow = pct < 25;
          const barColor = isLow ? '#ef4444' : color;

          return (
            <div key={id} className="flex items-center gap-1.5">
              {/* Label */}
              <div
                className="font-mono flex-shrink-0 w-[14px] text-right"
                style={{ fontSize: '5px', color: barColor, opacity: 0.6 }}
              >
                {label}
              </div>

              {/* Tube gauge housing */}
              <div
                className="flex-1 h-[6px] relative rounded-full overflow-hidden"
                style={{
                  background: 'rgba(4, 8, 18, 0.8)',
                  border: '0.5px solid rgba(60, 80, 110, 0.15)',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Fill */}
                <div
                  className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                    boxShadow: `0 0 4px ${barColor}66`,
                  }}
                />
                {/* Tube highlight (cylinder illusion) */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)',
                  }}
                />
                {/* Tick marks at 25% intervals */}
                {[25, 50, 75].map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: `${tick}%`,
                      background: 'rgba(200, 220, 255, 0.08)',
                    }}
                  />
                ))}
              </div>

              {/* Value */}
              <div
                className="font-mono flex-shrink-0 w-[18px]"
                style={{ fontSize: '5px', color: barColor, opacity: 0.5 }}
              >
                {Math.round(pct)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning lamp */}
      <div className="flex justify-center pb-0.5">
        <div
          className="w-[8px] h-[8px] rounded-full transition-all duration-500"
          style={{
            background: isDanger
              ? 'radial-gradient(circle at 40% 40%, #ef4444, #991b1b)'
              : 'rgba(20, 28, 40, 0.8)',
            boxShadow: isDanger
              ? '0 0 6px rgba(239, 68, 68, 0.6), 0 0 12px rgba(239, 68, 68, 0.3)'
              : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(60, 80, 100, 0.2)',
          }}
        />
      </div>
    </div>
    </InstrumentMalfunction>
  );
}
