'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Color, Group } from 'three';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useAssetStore } from '@/lib/stores/asset-store';
import { getSystemColor } from '@/lib/hologram/colors';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';
import { ScanPulse } from '@/components/bridge/hologram/ScanPulse';
import { OrreryCore } from '@/components/bridge/hologram/panels/orrery/OrreryCore';
import { OrbitPath } from '@/components/bridge/hologram/panels/orrery/OrbitPath';
import { AssetPlanet } from '@/components/bridge/hologram/panels/orrery/AssetPlanet';
import { DebtDebrisRing } from '@/components/bridge/hologram/panels/orrery/DebtDebrisRing';

/** Returns 0-1 for a layer that starts appearing at `start` and is fully visible at `start + span` */
function layerAlpha(progress: number, start: number, span: number): number {
  if (progress <= start) return 0;
  if (progress >= start + span) return 1;
  return (progress - start) / span;
}

const ORRERY_TILT = 0.3; // radians (~17 degrees)
const DEBT_COLOR = new Color(0.8, 0.2, 0.15);

const formatCredits = (v: number) => `₡${v.toLocaleString('en-US')}`;

export function AssetNavigation() {
  const health = useConsoleStore((s) => s.panelHealth.networth);
  const revealProgress = useConsoleStore((s) => s.revealProgress);
  const assets = useAssetStore((s) => s.assets);
  const netWorth = useAssetStore((s) => s.netWorth);
  const liabilities = useAssetStore((s) => s.liabilities);
  const trendPct = useAssetStore((s) => s.trendPct);
  const timeRef = useRef(0);

  const systemColor = useMemo(() => getSystemColor('networth', health).clone(), [health]);

  // Status label based on health
  const statusLabel =
    health >= 0.8
      ? 'NOMINAL'
      : health >= 0.6
        ? 'CAUTION'
        : health >= 0.4
          ? 'WARNING'
          : 'CRITICAL';

  // Track animation time
  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime();
  });

  return (
    <group scale={0.55}>
      {/* === LAYER 1: Central star — appears first (0% - 25%) === */}
      <group scale={0.3 + layerAlpha(revealProgress, 0, 0.25) * 0.7}>
        <OrreryCore color={systemColor} health={health} />
      </group>

      {/* === LAYER 2: Debt debris ring — appears second (10% - 40%) === */}
      <group scale={layerAlpha(revealProgress, 0.1, 0.3)}>
        <DebtDebrisRing color={DEBT_COLOR} tilt={ORRERY_TILT} beltRadius={3.5} count={80} />
      </group>

      {/* === LAYER 3: Orbit paths — appear third (20% - 50%) === */}
      {assets.map((asset) => (
        <group key={asset.id} scale={layerAlpha(revealProgress, 0.2, 0.3)}>
          <OrbitPath
            radius={asset.orbitRadius}
            color={systemColor}
            opacity={0.15}
            tilt={ORRERY_TILT}
          />
        </group>
      ))}

      {/* === LAYER 4: Planets — appear fourth (30% - 60%) === */}
      {revealProgress > 0.25 &&
        assets.map((asset, i) => (
          <group key={asset.id} scale={layerAlpha(revealProgress, 0.3, 0.3)}>
            <AssetPlanet
              name={asset.name}
              value={asset.value}
              orbitRadius={asset.orbitRadius}
              orbitSpeed={asset.orbitSpeed}
              size={asset.size}
              detail={asset.detail}
              hasRing={asset.hasRing}
              color={systemColor}
              tilt={ORRERY_TILT}
              orbitOffset={(i * Math.PI * 2) / assets.length}
              time={timeRef.current}
            />
          </group>
        ))}

      {/* === LAYER 5: Ambient particles — appear late (55% - 85%) === */}
      {revealProgress > 0.5 && (
        <HologramParticles count={40} color={systemColor} spread={[3.5, 3.5, 0.5]} />
      )}

      {/* === LAYER 6: Scan pulse — appears last (65% - 95%) === */}
      {revealProgress > 0.6 && (
        <ScanPulse color={systemColor} interval={5} maxRadius={3.5} />
      )}

      {/* === TEXT READOUTS — appear with core (15% - 45%) === */}
      {revealProgress > 0.15 && (
        <group position={[0, 4.2, 0]}>
          {/* Header */}
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
            position={[0, 0.55, 0]}
          >
            ASSET NAVIGATION
          </Text>

          {/* Net worth hero number */}
          <Text
            fontSize={0.4}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3)}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, 0.15, 0]}
          >
            {formatCredits(netWorth)}
          </Text>

          {/* Trend indicator */}
          <Text
            fontSize={0.1}
            letterSpacing={0.1}
            color={trendPct >= 0 ? new Color(0.3, 1, 0.5) : new Color(1, 0.3, 0.3)}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3) * 0.8}
            position={[0, -0.15, 0]}
          >
            {trendPct >= 0 ? '▲' : '▼'} {Math.abs(trendPct).toFixed(1)}%
          </Text>

          {/* Status label */}
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
            position={[0, -0.4, 0]}
          >
            {statusLabel}
          </Text>
        </group>
      )}

      {/* === LIABILITIES LABEL — appears with debris ring (15% - 45%) === */}
      {revealProgress > 0.15 && (
        <Text
          fontSize={0.1}
          letterSpacing={0.2}
          color={DEBT_COLOR}
          anchorX="center"
          anchorY="middle"
          fillOpacity={layerAlpha(revealProgress, 0.15, 0.3) * 0.5}
          position={[0, -3.2, 0.1]}
        >
          {`LIABILITIES · -${formatCredits(liabilities)}`}
        </Text>
      )}

      {/* === CRITICAL ALERT — only when health < 40% and fully revealed === */}
      {health < 0.4 && revealProgress > 0.9 && (
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
          position={[0, -4.0, 0.1]}
        >
          ASSET INTEGRITY CRITICAL
        </Text>
      )}
    </group>
  );
}
