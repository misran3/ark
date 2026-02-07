'use client';

import { useState, useEffect, Suspense } from 'react';
import { useInstrumentPower } from '@/hooks/useInstrumentPower';
import { CardCounter3D } from './CardCounter3D';
import { MiniUtilizationDial3D } from './MiniUtilizationDial3D';
import { CounterFallback } from './fallbacks';
import { InstrumentMalfunction } from './InstrumentMalfunction';

const MOCK_CARDS = [
  { name: 'Sapphire', utilization: 23, color: '#3b82f6', active: true },
  { name: 'Amex Gold', utilization: 57, color: '#f59e0b', active: true },
  { name: 'Freedom', utilization: 12, color: '#10b981', active: true },
];

/**
 * INST-04: Card Intelligence → Status Board
 *
 * Primary: Large single-digit counter (3D) — active card count
 * Card nameplates (CSS): Horizontal slots with backlit names, indicator lights
 * Utilization mini-dials (3D): Tiny circular gauges per card
 */
export function CardStatusBoard() {
  const [canvasReady, setCanvasReady] = useState(false);
  const { isOff, hasError } = useInstrumentPower('inst-04');

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setCanvasReady(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      setCanvasReady(false);
    }
  }, []);

  const cards = MOCK_CARDS;
  // When off or error, counter shows 0 and dials show 0; drums roll on power-on
  const activeCount = isOff || hasError ? 0 : cards.filter((c) => c.active).length;

  return (
    <InstrumentMalfunction active={hasError}>
    <div className="flex flex-col h-full gap-0.5 py-1" role="group" aria-label="Card Intelligence">
      {/* Screen reader text */}
      <span className="sr-only">
        {hasError
          ? 'Card intelligence: instrument malfunction.'
          : `${cards.filter((c) => c.active).length} active cards. ${cards.map(
              (c) => `${c.name}: ${c.utilization} percent utilization, ${c.active ? 'active' : 'inactive'}`
            ).join('. ')}.`
        }
      </span>
      {/* Primary: Large single-digit counter */}
      <div className="relative flex justify-center" style={{ height: '40px' }}>
        {canvasReady ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <CounterFallback value={activeCount} label="ACTIVE" />
              </div>
            }
          >
            <CardCounter3D value={activeCount} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full">
            <CounterFallback value={activeCount} label="ACTIVE" />
          </div>
        )}
      </div>

      {/* Label */}
      <div
        className="text-center font-mono uppercase tracking-wider"
        style={{ fontSize: '5px', color: 'rgba(0, 240, 255, 0.3)' }}
      >
        Active Cards
      </div>

      {/* Metal divider strip with fasteners */}
      <div className="relative mx-2 my-0.5">
        <div
          className="h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(120, 150, 180, 0.12) 20%, rgba(120, 150, 180, 0.12) 80%, transparent 100%)',
          }}
        />
        {/* Fastener dots on divider */}
        <div
          className="absolute top-1/2 left-[15%] -translate-y-1/2 w-[3px] h-[3px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(180, 195, 220, 0.1), rgba(30, 40, 60, 0.3))',
          }}
        />
        <div
          className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[3px] h-[3px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(180, 195, 220, 0.1), rgba(30, 40, 60, 0.3))',
          }}
        />
      </div>

      {/* Card nameplates with mini utilization dials */}
      <div className="flex flex-col gap-[3px] px-1.5 flex-1">
        {cards.map((card) => (
          <div key={card.name} className="flex items-center gap-1">
            {/* Active indicator light */}
            <div
              className="w-[5px] h-[5px] rounded-full flex-shrink-0"
              style={{
                background: card.active
                  ? `radial-gradient(circle at 40% 40%, ${card.color}, ${card.color}88)`
                  : 'rgba(20, 28, 40, 0.8)',
                boxShadow: card.active ? `0 0 3px ${card.color}55` : 'none',
                border: '0.5px solid rgba(60, 80, 110, 0.15)',
              }}
            />

            {/* Nameplate — backlit text slot */}
            <div
              className="flex-1 font-mono truncate"
              style={{
                fontSize: '6px',
                color: card.active ? 'rgba(0, 240, 255, 0.6)' : 'rgba(0, 240, 255, 0.2)',
                textShadow: card.active ? '0 0 4px rgba(0, 240, 255, 0.15)' : 'none',
              }}
            >
              {card.name}
            </div>

            {/* Mini utilization dial */}
            <div className="flex-shrink-0" style={{ width: '22px', height: '22px' }}>
              {canvasReady ? (
                <Suspense
                  fallback={
                    <div
                      className="font-mono text-center"
                      style={{ fontSize: '5px', color: card.color, opacity: 0.5 }}
                    >
                      {card.utilization}%
                    </div>
                  }
                >
                  <MiniUtilizationDial3D value={isOff || hasError ? 0 : card.utilization} color={card.color} />
                </Suspense>
              ) : (
                <div
                  className="font-mono text-center"
                  style={{ fontSize: '5px', color: card.color, opacity: 0.5 }}
                >
                  {card.utilization}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </InstrumentMalfunction>
  );
}
