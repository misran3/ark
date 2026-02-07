'use client';

import { useMemo } from 'react';
import { Color } from 'three';
import { Html } from '@react-three/drei';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useShieldStore } from '@/lib/stores/shield-store';
import { getSystemColor, getSystemCSSColor, getSystemCSSGlow } from '@/lib/hologram/colors';
import { RadarSweep } from '@/components/bridge/hologram/RadarSweep';
import { ShieldRing } from '@/components/bridge/hologram/panels/shields/ShieldRing';
import { ShieldEmblem } from '@/components/bridge/hologram/panels/shields/ShieldEmblem';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';
import { SlotNumber } from '@/components/bridge/hologram/SlotNumber';
import { ScanPulse } from '@/components/bridge/hologram/ScanPulse';

export function DefenseGrid() {
  const health = useConsoleStore((s) => s.panelHealth.shields);
  const shields = useShieldStore((s) => s.shields);
  const overallPercent = useShieldStore((s) => s.overallPercent);

  const systemColor = useMemo(() => getSystemColor('shields', health).clone(), [health]);
  const cssColor = getSystemCSSColor('shields', health);
  const cssGlow = getSystemCSSGlow('shields', health, 0.3);

  // Map shield store data to ring segments
  const budgetSegments = useMemo(
    () =>
      Object.entries(shields).map(([id, shield]) => ({
        id,
        label: shield.name,
        value: shield.currentPercent,
        max: 100,
        health: shield.currentPercent / 100,
      })),
    [shields]
  );

  // Mock data for emergency fund ring
  const emergencySegments = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: `month-${i + 1}`,
        label: `Month ${i + 1}`,
        value: i < 3 ? 100 : i === 3 ? 60 : 0,
        max: 100,
        health: i < 3 ? 1 : i === 3 ? 0.6 : 0,
      })),
    []
  );

  // Mock data for debt ring
  const debtSegments = useMemo(
    () => [
      { id: 'student-loan', label: 'Student Loan', value: 65, max: 100, health: 0.65 },
      { id: 'car-loan', label: 'Auto Loan', value: 40, max: 100, health: 0.4 },
    ],
    []
  );

  const integrityPercent = Math.round(overallPercent);
  const statusLabel =
    integrityPercent >= 80
      ? 'NOMINAL'
      : integrityPercent >= 60
        ? 'CAUTION'
        : integrityPercent >= 40
          ? 'WARNING'
          : 'CRITICAL';

  return (
    <group>
      {/* Background: Radar sweep */}
      <RadarSweep color={systemColor} radius={4} />

      {/* Outer ring: Emergency Fund (6 month segments) */}
      <ShieldRing
        innerRadius={3.0}
        outerRadius={3.4}
        segments={emergencySegments}
        color={systemColor}
        label="EMERGENCY RESERVES"
      />

      {/* Middle ring: Budget Categories */}
      <ShieldRing
        innerRadius={2.0}
        outerRadius={2.4}
        segments={budgetSegments}
        color={systemColor}
        rotationSpeed={0.3}
        label="BUDGET ALLOCATION"
      />

      {/* Inner ring: Debt Shields */}
      <ShieldRing
        innerRadius={1.0}
        outerRadius={1.4}
        segments={debtSegments}
        color={systemColor}
        label="DEBT STATUS"
      />

      {/* Center emblem */}
      <ShieldEmblem health={health} color={systemColor} size={0.6} />

      {/* Ambient particles */}
      <HologramParticles count={40} color={systemColor} spread={[3.5, 3.5, 0.5]} />

      {/* Scan pulse */}
      <ScanPulse color={systemColor} interval={4} maxRadius={3.5} />

      {/* HTML Data Readouts */}
      <Html center position={[0, 3.8, 0]} style={{ pointerEvents: 'none' }}>
        <div
          className="text-center font-mono"
          style={{ color: cssColor, textShadow: `0 0 12px ${cssGlow}` }}
        >
          <div className="text-[10px] tracking-[0.3em] opacity-70 mb-1">DEFENSE GRID</div>
          <div className="text-3xl font-bold">
            <SlotNumber value={integrityPercent} format={(n) => `${n}%`} />
          </div>
          <div className="text-xs tracking-widest mt-1">{statusLabel}</div>
        </div>
      </Html>

      {/* Ring labels */}
      <Html center position={[0, 3.2, 0.1]} style={{ pointerEvents: 'none' }}>
        <div className="text-[8px] font-mono tracking-[0.2em] opacity-50" style={{ color: cssColor }}>
          EMERGENCY RESERVES
        </div>
      </Html>

      <Html center position={[0, 2.2, 0.1]} style={{ pointerEvents: 'none' }}>
        <div className="text-[8px] font-mono tracking-[0.2em] opacity-50" style={{ color: cssColor }}>
          BUDGET ALLOCATION
        </div>
      </Html>

      <Html center position={[0, 1.2, 0.1]} style={{ pointerEvents: 'none' }}>
        <div className="text-[8px] font-mono tracking-[0.2em] opacity-50" style={{ color: cssColor }}>
          DEBT STATUS
        </div>
      </Html>

      {/* Alert banner (only when critical) */}
      {integrityPercent < 40 && (
        <Html center position={[0, -3.5, 0.1]} style={{ pointerEvents: 'none' }}>
          <div
            className="px-4 py-1 font-mono text-xs tracking-widest animate-pulse"
            style={{
              color: '#ff4444',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.4)',
              textShadow: '0 0 8px rgba(255, 0, 0, 0.6)',
            }}
          >
            SHIELD INTEGRITY CRITICAL
          </div>
        </Html>
      )}
    </group>
  );
}
