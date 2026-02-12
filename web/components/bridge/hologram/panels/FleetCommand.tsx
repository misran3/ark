'use client';

import { useMemo, useState, useCallback } from 'react';
import { Color, BufferGeometry, BufferAttribute, AdditiveBlending } from 'three';
import { Text } from '@react-three/drei';
import { useConsoleStore } from '@/lib/stores/console-store';
import { getSystemColor, getSystemCSSColor, getSystemCSSGlow } from '@/lib/hologram/colors';
import { ACTIVE_FLEET_CARDS as FLEET_CARDS, ACTIVE_FLEET_STATS as FLEET_STATS } from '@/lib/data/fleet-cards';
import { DEMO_TRANSACTIONS } from '@/lib/data/demo-financial-data';
import { HologramDetailPanel, DetailHeader, DetailRow, DetailDivider, DetailList } from '@/components/bridge/hologram/HologramDetailPanel';
import { CreditCard3D } from '@/components/bridge/hologram/panels/cards/CreditCard3D';
import { CardUtilizationBar } from '@/components/bridge/hologram/panels/cards/CardUtilizationBar';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';
import { ScanPulse } from '@/components/bridge/hologram/ScanPulse';

/** Returns 0-1 for a layer that starts appearing at `start` and is fully visible at `start + span` */
function layerAlpha(progress: number, start: number, span: number): number {
  if (progress <= start) return 0;
  if (progress >= start + span) return 1;
  return (progress - start) / span;
}

// Card layout positions: arc layout with depth stagger
const CARD_POSITIONS: [number, number, number][] = [
  [0, 0, 0.1],        // Center — AMEX GOLD
  [-1.6, 0.15, -0.1], // Left — SAPPHIRE
  [1.6, 0.15, -0.1],  // Right — DISCOVER
];

// Display order: center first, then flanks
const CARD_ORDER = [1, 0, 2]; // indices into FLEET_CARDS: AMEX(1), SAPPHIRE(0), DISCOVER(2)

const READOUT_Y = 2.2;

// Connector line geometries — from each card top to readout
function ConnectorLines({ systemColor, opacity }: { systemColor: Color; opacity: number }) {
  const geometries = useMemo(() => {
    return CARD_POSITIONS.map((pos) => {
      const geo = new BufferGeometry();
      const pts = new Float32Array([
        pos[0], pos[1] + 0.4, pos[2],
        pos[0] * 0.3, READOUT_Y - 0.3, 0,
      ]);
      geo.setAttribute('position', new BufferAttribute(pts, 3));
      return geo;
    });
  }, []);

  if (opacity <= 0) return null;

  return (
    <>
      {geometries.map((geo, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial
            color={systemColor}
            transparent
            opacity={opacity * 0.25}
            blending={AdditiveBlending}
          />
        </lineSegments>
      ))}
    </>
  );
}

export function FleetCommand() {
  const health = useConsoleStore((s) => s.panelHealth.cards);
  const revealProgress = useConsoleStore((s) => s.revealProgress);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

  const systemColor = useMemo(() => getSystemColor('cards', health).clone(), [health]);
  const cssColor = getSystemCSSColor('cards', health);
  const cssGlow = getSystemCSSGlow('cards', health, 0.3);

  const handleCardClick = useCallback((slotIdx: number) => {
    setSelectedCardIdx((prev) => (prev === slotIdx ? null : slotIdx));
  }, []);

  const { avgUtilization, totalLimit, totalBalance } = FLEET_STATS;

  const statusLabel =
    avgUtilization < 30
      ? 'NOMINAL'
      : avgUtilization < 50
        ? 'CAUTION'
        : avgUtilization < 70
          ? 'WARNING'
          : 'CRITICAL';

  // Reveal timings per card slot
  const cardReveals = [
    layerAlpha(revealProgress, 0.0, 0.2),   // Center (AMEX GOLD) — 0%-20%
    layerAlpha(revealProgress, 0.1, 0.2),   // Left (SAPPHIRE) — 10%-30%
    layerAlpha(revealProgress, 0.25, 0.2),  // Right (DISCOVER) — 25%-45%
  ];

  const connectorAlpha = layerAlpha(revealProgress, 0.4, 0.2);
  const readoutAlpha = layerAlpha(revealProgress, 0.5, 0.25);

  return (
    <group scale={0.55}>
      {/* Credit cards with utilization bars */}
      {CARD_ORDER.map((cardIdx, slotIdx) => {
        const card = FLEET_CARDS[cardIdx];
        const reveal = cardReveals[slotIdx];
        if (reveal <= 0) return null;
        return (
          <group key={card.id} position={CARD_POSITIONS[slotIdx]}>
            <CreditCard3D
              card={card}
              systemColor={systemColor}
              reveal={reveal}
              rotationOffset={slotIdx * (Math.PI * 2) / 3}
              onClick={() => handleCardClick(slotIdx)}
            />
            <CardUtilizationBar
              utilization={card.utilization}
              systemColor={systemColor}
              reveal={reveal}
            />
          </group>
        );
      })}

      {/* Data connector lines — 40%-60% */}
      <ConnectorLines systemColor={systemColor} opacity={connectorAlpha} />

      {/* Fleet Intel readout (top) — 50%-75% */}
      {revealProgress > 0.5 && (
        <group position={[0, READOUT_Y, 0]}>
          <Text
            fontSize={0.12}
            letterSpacing={0.3}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={readoutAlpha * 0.7}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, 0.35, 0]}
          >
            FLEET INTEL
          </Text>
          <Text
            fontSize={0.45}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={readoutAlpha}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, 0, 0]}
          >
            {`${avgUtilization}%`}
          </Text>
          <Text
            fontSize={0.1}
            letterSpacing={0.1}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={readoutAlpha}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, -0.3, 0]}
          >
            {statusLabel}
          </Text>

          {/* Secondary readouts */}
          <Text
            fontSize={0.07}
            letterSpacing={0.08}
            color={systemColor}
            anchorX="right"
            anchorY="middle"
            fillOpacity={readoutAlpha * 0.6}
            position={[-0.15, -0.55, 0]}
          >
            {`LIMIT ₡${totalLimit.toLocaleString()}`}
          </Text>
          <Text
            fontSize={0.07}
            letterSpacing={0.08}
            color={systemColor}
            anchorX="left"
            anchorY="middle"
            fillOpacity={readoutAlpha * 0.6}
            position={[0.15, -0.55, 0]}
          >
            {`BAL ₡${totalBalance.toLocaleString()}`}
          </Text>
        </group>
      )}

      {/* Ambient particles — appear at 60% */}
      {revealProgress > 0.5 && (
        <HologramParticles count={30} color={systemColor} spread={[3, 3, 0.5]} />
      )}

      {/* Scan pulse — appear at 70% */}
      {revealProgress > 0.6 && (
        <ScanPulse color={systemColor} interval={5} maxRadius={3} />
      )}

      {/* Alert banner — high utilization warning */}
      {avgUtilization > 70 && revealProgress > 0.9 && (
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
          position={[0, -2.5, 0.1]}
        >
          HIGH FLEET UTILIZATION
        </Text>
      )}

      {/* Card detail panel */}
      {selectedCardIdx !== null && (() => {
        const cardIdx = CARD_ORDER[selectedCardIdx];
        const card = FLEET_CARDS[cardIdx];
        const pos = CARD_POSITIONS[selectedCardIdx];
        const balance = Math.round(card.limit * (card.utilization / 100));
        const cardTxns = DEMO_TRANSACTIONS
          .filter((t) => t.cardLastFour === card.cardNumber.slice(-4))
          .slice(0, 4);

        return (
          <HologramDetailPanel
            position={[pos[0] + 0.8, pos[1] + 0.3, pos[2] + 0.3]}
            color={cssColor}
            glowColor={cssGlow}
            onClose={() => setSelectedCardIdx(null)}
          >
            <DetailHeader color={cssColor}>{card.name}</DetailHeader>
            <div style={{ opacity: 0.5, marginBottom: '8px' }}>{card.cardNumber}</div>
            <DetailRow label="Balance" value={`$${balance.toLocaleString()}`} />
            <DetailRow label="Limit" value={`$${card.limit.toLocaleString()}`} />
            <DetailRow
              label="Utilization"
              value={`${card.utilization}%`}
              color={card.utilization > 70 ? '#ff4444' : card.utilization > 40 ? '#ffbb33' : '#44ff88'}
            />
            <DetailDivider color={cssColor} />
            <div style={{ color: cssColor, fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>BENEFITS</div>
            <DetailList items={card.benefits} color={cssColor} />
            {cardTxns.length > 0 && (
              <>
                <DetailDivider color={cssColor} />
                <div style={{ color: cssColor, fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>RECENT</div>
                {cardTxns.map((t) => (
                  <DetailRow
                    key={t.id}
                    label={t.merchant}
                    value={`$${Math.abs(t.amount).toFixed(2)}`}
                    color={t.amount > 0 ? '#44ff88' : undefined}
                  />
                ))}
              </>
            )}
          </HologramDetailPanel>
        );
      })()}
    </group>
  );
}
