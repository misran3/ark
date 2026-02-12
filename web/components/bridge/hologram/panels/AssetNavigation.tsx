'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { Color } from 'three';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useAssetStore, RING_RADII, DEBRIS_BELT_RADIUS, ASSET_NAV_ORDER } from '@/lib/stores/asset-store';
import type { Asset } from '@/lib/stores/asset-store';
import { getSystemColor, getSystemCSSColor, getSystemCSSGlow } from '@/lib/hologram/colors';
import { HologramDetailPanel } from '@/components/bridge/hologram/HologramDetailPanel';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';
import { ScanPulse } from '@/components/bridge/hologram/ScanPulse';
import { OrreryCore } from '@/components/bridge/hologram/panels/orrery/OrreryCore';
import { OrbitPath } from '@/components/bridge/hologram/panels/orrery/OrbitPath';
import { AssetPlanet } from '@/components/bridge/hologram/panels/orrery/AssetPlanet';
import { DebtDebrisRing } from '@/components/bridge/hologram/panels/orrery/DebtDebrisRing';
import { DeepScanPulse } from '@/components/bridge/hologram/panels/orrery/DeepScanPulse';
import { useCameraFollow } from '@/hooks/useCameraFollow';

/** Returns 0-1 for a layer that starts appearing at `start` and is fully visible at `start + span` */
function layerAlpha(progress: number, start: number, span: number): number {
  if (progress <= start) return 0;
  if (progress >= start + span) return 1;
  return (progress - start) / span;
}

const ORRERY_TILT = 0.3; // radians (~17 degrees)
const DEBT_COLOR = new Color(0.8, 0.2, 0.15);
// 4 unique orbital rings
const UNIQUE_RINGS = [RING_RADII[1], RING_RADII[2], RING_RADII[3], RING_RADII[4]];

const formatDollars = (v: number) => `$${v.toLocaleString('en-US')}`;

export function AssetNavigation() {
  const health = useConsoleStore((s) => s.panelHealth.networth);
  const revealProgress = useConsoleStore((s) => s.revealProgress);
  const assets = useAssetStore((s) => s.assets);
  const netWorth = useAssetStore((s) => s.netWorth);
  const totalLiabilities = useAssetStore((s) => s.totalLiabilities);
  const trendPct = useAssetStore((s) => s.trendPct);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [deepScanTarget, setDeepScanTarget] = useState<Asset | null>(null);

  const systemColor = useMemo(() => getSystemColor('networth', health).clone(), [health]);
  const cssColor = getSystemCSSColor('networth', health);
  const cssGlow = getSystemCSSGlow('networth', health, 0.3);

  const handleAssetClick = useCallback((id: string) => {
    setSelectedAssetId((prev) => (prev === id ? null : id));
    setDeepScanTarget(null); // Reset deep scan when switching asset
  }, []);

  const handleDeepScan = useCallback((asset: Asset) => {
    setDeepScanTarget(asset);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedAssetId(null);
    setDeepScanTarget(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedAssetId((prev) => {
          const currentIdx = prev ? ASSET_NAV_ORDER.indexOf(prev) : -1;
          let nextIdx: number;
          if (e.key === 'ArrowRight') {
            nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % ASSET_NAV_ORDER.length;
          } else {
            nextIdx = currentIdx <= 0 ? ASSET_NAV_ORDER.length - 1 : currentIdx - 1;
          }
          return ASSET_NAV_ORDER[nextIdx];
        });
        setDeepScanTarget(null);
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!selectedAssetId) return;
        const asset = assets.find((a) => a.id === selectedAssetId);
        if (!asset) return;
        if (deepScanTarget?.id === selectedAssetId) {
          setDeepScanTarget(null);
        } else {
          setDeepScanTarget(asset);
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (deepScanTarget) {
          setDeepScanTarget(null);
        } else if (selectedAssetId) {
          setSelectedAssetId(null);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedAssetId, deepScanTarget, assets]);

  // Status label based on health
  const statusLabel =
    health >= 0.8
      ? 'NOMINAL'
      : health >= 0.6
        ? 'CAUTION'
        : health >= 0.4
          ? 'WARNING'
          : 'CRITICAL';

  const selectedAsset = selectedAssetId ? assets.find((a) => a.id === selectedAssetId) : null;

  // Camera target: offset from planet world position to frame planet + panel
  const cameraTarget = useMemo<[number, number, number] | null>(() => {
    if (!selectedAsset) return null;
    const x = Math.cos(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
    const z = Math.sin(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
    // Offset: slightly toward camera (+Z), pan toward planet X, lift slightly
    // Multiply by the group scale (0.4) since the orrery is in a scaled group
    const scale = 0.4;
    return [x * scale * 0.3, 0.6 + 0.3, 5 - 0.5];
  }, [selectedAsset]);

  useCameraFollow(cameraTarget);

  // Panel position: offset right and up from selected planet
  const panelPosition = useMemo<[number, number, number]>(() => {
    if (!selectedAsset) return [3.5, 1.5, 0.3];
    const x = Math.cos(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
    const z = Math.sin(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
    return [x + 2.2, 1.2, z + 0.3];
  }, [selectedAsset]);

  return (
    <group scale={0.4}>
      {/* Orrery group — tilted */}
      <group rotation-x={ORRERY_TILT}>
        {/* === LAYER 1: Central star — appears first (0% - 25%) === */}
        <group scale={0.3 + layerAlpha(revealProgress, 0, 0.25) * 0.7}>
          <OrreryCore color={systemColor} health={health} />
        </group>

        {/* === LAYER 2: Debt debris ring — appears second (10% - 40%) === */}
        <group scale={layerAlpha(revealProgress, 0.1, 0.3)}>
          <DebtDebrisRing color={DEBT_COLOR} beltRadius={DEBRIS_BELT_RADIUS} count={80} />
        </group>

        {/* === LAYER 3: Orbit paths — 4 unique rings (20% - 50%) === */}
        {UNIQUE_RINGS.map((radius) => (
          <group key={radius} scale={layerAlpha(revealProgress, 0.2, 0.3)}>
            <OrbitPath radius={radius} color={systemColor} opacity={0.15} />
          </group>
        ))}

        {/* === LAYER 4: Planets — 6 assets at fixed positions (30% - 60%) === */}
        {revealProgress > 0.25 &&
          assets.map((asset) => (
            <group key={asset.id} scale={layerAlpha(revealProgress, 0.3, 0.3)}>
              <AssetPlanet
                name={asset.name}
                value={asset.value}
                orbitRadius={asset.orbitRadius}
                fixedAngle={asset.fixedAngle}
                size={asset.size}
                geometry={asset.geometry}
                color={systemColor}
                isSelected={selectedAssetId === asset.id}
                someSelected={selectedAssetId !== null}
                onClick={() => handleAssetClick(asset.id)}
              />
            </group>
          ))}

        {/* === LAYER 5: Ambient particles — appear late (55% - 85%) === */}
        {revealProgress > 0.5 && (
          <HologramParticles count={40} color={systemColor} spread={[3.5, 3.5, 0.5]} />
        )}

        {/* === LAYER 6: Ambient scan pulse — appears last (65% - 95%) === */}
        {revealProgress > 0.6 && (
          <ScanPulse color={systemColor} interval={5} maxRadius={3.5} />
        )}

        {/* === Deep scan pulse — from selected planet === */}
        {deepScanTarget && (
          <DeepScanPulse
            color={systemColor}
            originAngle={deepScanTarget.fixedAngle}
            originRadius={deepScanTarget.orbitRadius}
          />
        )}
      </group>

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
            {formatDollars(netWorth)}
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
          {`LIABILITIES · -${formatDollars(totalLiabilities)}`}
        </Text>
      )}

      {/* === "Select a planet" prompt — visible when no planet is selected === */}
      {!selectedAssetId && revealProgress > 0.6 && (
        <Billboard>
          <Text
            fontSize={0.14}
            letterSpacing={0.15}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
            outlineWidth="5%"
            outlineColor="#000000"
            outlineOpacity={0.3}
            position={[0, -1.5, 0.5]}
          >
            SELECT A PLANET TO BEGIN
          </Text>
        </Billboard>
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

      {/* === Asset detail panel — tiered reveal === */}
      {selectedAsset && (
        <HologramDetailPanel
          position={panelPosition}
          color={cssColor}
          glowColor={cssGlow}
          asset={selectedAsset}
          isDeepScan={deepScanTarget?.id === selectedAsset.id}
          onDeepScan={() => handleDeepScan(selectedAsset)}
          onCollapse={() => setDeepScanTarget(null)}
          onClose={handleClose}
        />
      )}
    </group>
  );
}
