'use client';

import { useMemo, useState, useCallback } from 'react';
import { Color } from 'three';
import { Text } from '@react-three/drei';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useShieldStore } from '@/lib/stores/shield-store';
import { getSystemColor, getSystemCSSColor, getSystemCSSGlow } from '@/lib/hologram/colors';
import { HologramDetailPanel, DetailHeader, DetailRow, DetailDivider } from '@/components/bridge/hologram/HologramDetailPanel';
import { RadarSweep } from '@/components/bridge/hologram/RadarSweep';
import { ShieldRing } from '@/components/bridge/hologram/panels/shields/ShieldRing';
import { ShieldEmblem } from '@/components/bridge/hologram/panels/shields/ShieldEmblem';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';
import { ScanPulse } from '@/components/bridge/hologram/ScanPulse';

/** Returns 0-1 for a layer that starts appearing at `start` and is fully visible at `start + span` */
function layerAlpha(progress: number, start: number, span: number): number {
  if (progress <= start) return 0;
  if (progress >= start + span) return 1;
  return (progress - start) / span;
}

export function DefenseGrid() {
  const health = useConsoleStore((s) => s.panelHealth.shields);
  const revealProgress = useConsoleStore((s) => s.revealProgress);
  const shields = useShieldStore((s) => s.shields);
  const overallPercent = useShieldStore((s) => s.overallPercent);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const systemColor = useMemo(() => getSystemColor('shields', health).clone(), [health]);
  const cssColor = getSystemCSSColor('shields', health);
  const cssGlow = getSystemCSSGlow('shields', health, 0.3);

  const handleSegmentClick = useCallback((id: string) => {
    setSelectedSegmentId((prev) => (prev === id ? null : id));
  }, []);

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
    <group scale={0.55}>
      {/* Center emblem — appears first (0% - 25%) */}
      <group scale={0.3 + layerAlpha(revealProgress, 0, 0.25) * 0.7}>
        <ShieldEmblem health={health} color={systemColor} size={0.6} />
      </group>

      {/* Inner ring: Debt Shields — appears second (10% - 40%) */}
      <group scale={layerAlpha(revealProgress, 0.1, 0.3)}>
        <ShieldRing
          innerRadius={1.0}
          outerRadius={1.4}
          segments={debtSegments}
          color={systemColor}
          label="DEBT STATUS"
          onSegmentClick={handleSegmentClick}
        />
      </group>

      {/* Middle ring: Budget Categories — appears third (25% - 55%) */}
      <group scale={layerAlpha(revealProgress, 0.25, 0.3)}>
        <ShieldRing
          innerRadius={2.0}
          outerRadius={2.4}
          segments={budgetSegments}
          color={systemColor}
          rotationSpeed={0.3}
          label="BUDGET ALLOCATION"
          onSegmentClick={handleSegmentClick}
        />
      </group>

      {/* Outer ring: Emergency Fund — appears fourth (40% - 70%) */}
      <group scale={layerAlpha(revealProgress, 0.4, 0.3)}>
        <ShieldRing
          innerRadius={3.0}
          outerRadius={3.4}
          segments={emergencySegments}
          color={systemColor}
          label="EMERGENCY RESERVES"
          onSegmentClick={handleSegmentClick}
        />
      </group>

      {/* Background: Radar sweep — fades in with outer ring (40% - 80%) */}
      <RadarSweep color={systemColor} radius={3.2} opacity={layerAlpha(revealProgress, 0.4, 0.4)} />

      {/* Ambient particles — appear late (60% - 100%) */}
      {revealProgress > 0.5 && (
        <HologramParticles count={40} color={systemColor} spread={[2.8, 2.8, 0.4]} />
      )}

      {/* Scan pulse — appears last (70% - 100%) */}
      {revealProgress > 0.6 && (
        <ScanPulse color={systemColor} interval={4} maxRadius={2.8} />
      )}

      {/* Text readouts — appear with emblem (15% - 45%) */}
      {revealProgress > 0.15 && (
        <group position={[0, 3.8, 0]}>
          <Text
            fontSize={0.12}
            letterSpacing={0.3}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3) * 0.7}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, 0.35, 0]}
          >
            DEFENSE GRID
          </Text>
          <Text
            fontSize={0.45}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3)}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, 0, 0]}
          >
            {`${integrityPercent}%`}
          </Text>
          <Text
            fontSize={0.1}
            letterSpacing={0.1}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3)}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, -0.3, 0]}
          >
            {statusLabel}
          </Text>
        </group>
      )}

      {/* Ring labels — appear with their respective rings */}
      <Text
        fontSize={0.1}
        letterSpacing={0.2}
        color={systemColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={layerAlpha(revealProgress, 0.4, 0.3) * 0.5}
        position={[0, 3.2, 0.1]}
      >
        EMERGENCY RESERVES
      </Text>
      <Text
        fontSize={0.1}
        letterSpacing={0.2}
        color={systemColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={layerAlpha(revealProgress, 0.25, 0.3) * 0.5}
        position={[0, 2.2, 0.1]}
      >
        BUDGET ALLOCATION
      </Text>
      <Text
        fontSize={0.1}
        letterSpacing={0.2}
        color={systemColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={layerAlpha(revealProgress, 0.1, 0.3) * 0.5}
        position={[0, 1.2, 0.1]}
      >
        DEBT STATUS
      </Text>

      {/* Alert banner (only when critical + fully revealed) */}
      {integrityPercent < 40 && revealProgress > 0.9 && (
        <Text
          fontSize={0.12}
          letterSpacing={0.1}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.9}
          outlineWidth="8%"
          outlineColor="#ff0000"
          outlineOpacity={0.6}
          position={[0, -3.5, 0.1]}
        >
          SHIELD INTEGRITY CRITICAL
        </Text>
      )}

      {/* Shield segment detail panel */}
      {selectedSegmentId && (() => {
        // Check budget shields (from store)
        const shield = shields[selectedSegmentId];
        if (shield) {
          const statusColor = shield.status === 'optimal' || shield.status === 'nominal'
            ? '#44ff88'
            : shield.status === 'caution' || shield.status === 'warning'
              ? '#ffbb33'
              : '#ff4444';
          return (
            <HologramDetailPanel
              position={[2.5, 0.5, 0.2]}
              color={cssColor}
              glowColor={cssGlow}
              onClose={() => setSelectedSegmentId(null)}
            >
              <DetailHeader color={cssColor}>{shield.name}</DetailHeader>
              <DetailRow label="Status" value={shield.status.toUpperCase()} color={statusColor} />
              <DetailRow label="Budget" value={`$${shield.budgetAmount.toLocaleString()}`} />
              <DetailRow label="Spent" value={`$${shield.actualSpendAmount.toLocaleString()}`} />
              <DetailRow
                label="Usage"
                value={`${Math.round((shield.actualSpendAmount / shield.budgetAmount) * 100)}%`}
                color={shield.actualSpendAmount > shield.budgetAmount ? '#ff4444' : '#44ff88'}
              />
              <DetailDivider color={cssColor} />
              <div style={{ color: cssColor, fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>SUBCATEGORIES</div>
              {shield.subcategories.map((sub) => (
                <DetailRow
                  key={sub.name}
                  label={sub.name}
                  value={`$${sub.spent} / $${sub.budgeted}`}
                  color={sub.percentUsed > 100 ? '#ff4444' : undefined}
                />
              ))}
            </HologramDetailPanel>
          );
        }

        // Check debt segments
        const debt = debtSegments.find((s) => s.id === selectedSegmentId);
        if (debt) {
          return (
            <HologramDetailPanel
              position={[1.5, 0.3, 0.2]}
              color={cssColor}
              glowColor={cssGlow}
              onClose={() => setSelectedSegmentId(null)}
            >
              <DetailHeader color={cssColor}>{debt.label}</DetailHeader>
              <DetailRow label="Payoff Progress" value={`${debt.value}%`} />
              <DetailRow label="Health" value={debt.health >= 0.6 ? 'ON TRACK' : 'AT RISK'} color={debt.health >= 0.6 ? '#44ff88' : '#ff4444'} />
            </HologramDetailPanel>
          );
        }

        // Check emergency segments
        const emergency = emergencySegments.find((s) => s.id === selectedSegmentId);
        if (emergency) {
          return (
            <HologramDetailPanel
              position={[3.5, 0.5, 0.2]}
              color={cssColor}
              glowColor={cssGlow}
              onClose={() => setSelectedSegmentId(null)}
            >
              <DetailHeader color={cssColor}>{emergency.label}</DetailHeader>
              <DetailRow label="Funded" value={`${emergency.value}%`} color={emergency.value >= 100 ? '#44ff88' : '#ffbb33'} />
            </HologramDetailPanel>
          );
        }

        return null;
      })()}
    </group>
  );
}
