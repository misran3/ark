'use client';

import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Asteroid from './Asteroid';
import AsteroidFieldCascade from './AsteroidFieldCascade';
import {
  getFieldParams,
  getGrowthFactor,
  getDriftTarget,
  type RockSpec,
} from '@/lib/utils/asteroid-field-params';

interface AsteroidFieldProps {
  /** World position of the field center */
  position: [number, number, number];
  /** Base size from the threat */
  size?: number;
  /** Crack/glow color */
  color?: string;
  /** Threat label */
  label?: string;
  /** Dollar amount — drives log-scale field params */
  amount: number;
  /** Base seed for deterministic generation */
  seed?: number;
  /** Timestamp when this threat was created (for growth) */
  createdAt: number;
  /** Enable/disable drift (defaults to true) */
  driftEnabled?: boolean;
  /** Called when any rock is hovered */
  onHover?: (hovered: boolean) => void;
  /** Called when the threat is fully deflected (cascade complete) */
  onDeflect?: () => void;
}

interface RockState {
  hp: number;
  maxHp: number;
  destroyed: boolean;
  collapsed: boolean;
  impactFlash: boolean;
}

/**
 * Asteroid Field — orchestrates N Asteroid children for a single threat.
 *
 * Manages: field-level drift, growth over time, per-rock HP tracking,
 * cascade threshold logic, escalating tension, and shockwave cascade.
 */
export default function AsteroidField({
  position,
  size = 1,
  color = '#f97316',
  label = 'THREAT',
  amount,
  seed = 42,
  createdAt,
  driftEnabled = true,
  onHover,
  onDeflect,
}: AsteroidFieldProps) {
  const driftGroupRef = useRef<THREE.Group>(null);

  // Compute field params from amount (memoized, doesn't change)
  const fieldParams = useMemo(() => getFieldParams(amount, seed), [amount, seed]);

  // Drift target — random point in convergence circle
  const driftTarget = useMemo(() => getDriftTarget(seed), [seed]);

  // Drift state (refs for frame-loop performance)
  const driftProgressRef = useRef(0);

  // Per-rock state (using useState so React re-renders on HP changes)
  const [rockStates, setRockStates] = useState<RockState[]>(() =>
    fieldParams.rocks.map((rock) => ({
      hp: rock.hp,
      maxHp: rock.hp,
      destroyed: false,
      collapsed: false,
      impactFlash: false,
    }))
  );

  // Cascade state
  const [cascadeTriggered, setCascadeTriggered] = useState(false);
  const [cascadeTriggerPoint, setCascadeTriggerPoint] = useState<[number, number, number] | null>(null);
  const [fieldCleared, setFieldCleared] = useState(false);

  // Computed values
  const destroyedCount = rockStates.filter((r) => r.destroyed).length;
  const aliveCount = rockStates.filter((r) => !r.destroyed).length;

  // Field instability: 0 at no kills, ramps up toward cascade threshold
  const fieldInstability = Math.min(1, destroyedCount / Math.max(1, fieldParams.cascadeThreshold));

  // Sympathetic glow: increases with each destroyed rock
  const sympatheticGlow = fieldInstability * 0.8;

  // Handle rock hit (click)
  const handleRockHit = useCallback(
    (rockIndex: number) => {
      if (cascadeTriggered) return;

      setRockStates((prev) => {
        const next = [...prev];
        const rock = { ...next[rockIndex] };

        if (rock.destroyed) return prev;

        rock.hp -= 1;

        if (rock.hp <= 0) {
          rock.destroyed = true;
          rock.collapsed = true;

          // Check cascade threshold
          const newDestroyedCount = next.filter((r, i) => i === rockIndex || r.destroyed).length;
          if (newDestroyedCount >= fieldParams.cascadeThreshold) {
            // Find this rock's world position for cascade origin
            const rockSpec = fieldParams.rocks[rockIndex];
            setCascadeTriggerPoint(rockSpec.position);
            setCascadeTriggered(true);
          }
        }

        next[rockIndex] = rock;
        return next;
      });
    },
    [cascadeTriggered, fieldParams.cascadeThreshold, fieldParams.rocks]
  );

  // Handle cascade flash (separate from detonation for timing)
  const handleCascadeFlash = useCallback((rockIndex: number) => {
    setRockStates((prev) => {
      const next = [...prev];
      next[rockIndex] = {
        ...next[rockIndex],
        impactFlash: true,
      };
      return next;
    });

    // Clear flash after brief duration (100ms white-hot flash)
    setTimeout(() => {
      setRockStates((prev) => {
        const next = [...prev];
        next[rockIndex] = {
          ...next[rockIndex],
          impactFlash: false,
        };
        return next;
      });
    }, 100);
  }, []);

  // Handle cascade detonation of a specific rock
  const handleCascadeDetonate = useCallback((rockIndex: number) => {
    setRockStates((prev) => {
      const next = [...prev];
      next[rockIndex] = {
        ...next[rockIndex],
        destroyed: true,
        collapsed: true,
      };
      return next;
    });
  }, []);

  // Handle cascade complete — all rocks destroyed
  const handleCascadeComplete = useCallback(() => {
    setFieldCleared(true);
    onDeflect?.();
  }, [onDeflect]);

  // Handle individual rock collapse animation completing
  const handleRockCollapseComplete = useCallback((rockIndex: number) => {
    // Clear impact flash after collapse finishes
    setRockStates((prev) => {
      const next = [...prev];
      next[rockIndex] = { ...next[rockIndex], impactFlash: false };
      return next;
    });
  }, []);

  // Hover routing — any rock hover shows same threat info
  const handleRockHover = useCallback(
    (hovered: boolean) => {
      onHover?.(hovered);
    },
    [onHover]
  );

  // Growth over time + drift animation
  useFrame((_state, delta) => {
    if (!driftGroupRef.current || fieldCleared) return;

    // --- Growth factor (time-based, not frame-based) ---
    const growthFactor = getGrowthFactor(createdAt);

    // Apply growth to drift group scale
    driftGroupRef.current.scale.setScalar(growthFactor);

    // --- Shared drift with deceleration (only if enabled) ---
    if (driftEnabled) {
      // Progress from 0 to ~0.3 then asymptotic ease-out
      const driftSpeed = fieldParams.driftSpeed;
      driftProgressRef.current += delta * driftSpeed * 0.05;

      // Asymptotic ease-out: approaches 0.3 but never reaches it
      const maxDrift = 0.3;
      const easedProgress = maxDrift * (1 - Math.exp(-driftProgressRef.current * 3));

      // Drift direction: from spawn toward convergence target
      driftGroupRef.current.position.set(
        driftTarget[0] * easedProgress,
        driftTarget[1] * easedProgress,
        driftTarget[2] * easedProgress
      );
    }
  });

  if (fieldCleared) return null;

  // Get alive rock indices for cascade
  const aliveRockIndices = rockStates
    .map((r, i) => (!r.destroyed ? i : -1))
    .filter((i) => i >= 0);

  return (
    <group position={position}>
      {/* Drift group — shared movement for entire field */}
      <group ref={driftGroupRef}>
        {/* Render each rock */}
        {fieldParams.rocks.map((rock, index) => {
          const state = rockStates[index];
          if (!state) return null;

          // Don't render rocks that have finished collapsing
          if (state.destroyed && !state.collapsed && !state.impactFlash) return null;

          return (
            <Asteroid
              key={`rock-${index}`}
              position={rock.position}
              size={size * rock.sizeScale}
              color={color}
              label={label}
              seed={rock.seed}
              angularVelocity={rock.angularVelocity}
              hp={state.hp}
              maxHp={state.maxHp}
              onHit={() => handleRockHit(index)}
              onHover={handleRockHover}
              sympatheticGlow={state.destroyed ? 0 : sympatheticGlow}
              fieldInstability={state.destroyed ? 0 : fieldInstability}
              trailTier={rock.trailTier}
              collapsed={state.collapsed}
              impactFlash={state.impactFlash}
              onCollapseComplete={() => handleRockCollapseComplete(index)}
            />
          );
        })}

        {/* Cascade shockwave overlay */}
        {cascadeTriggered && cascadeTriggerPoint && (
          <AsteroidFieldCascade
            triggerPoint={cascadeTriggerPoint}
            rockPositions={fieldParams.rocks.map((r) => r.position)}
            aliveRockIndices={aliveRockIndices}
            onFlashRock={handleCascadeFlash}
            onDetonateRock={handleCascadeDetonate}
            onCascadeComplete={handleCascadeComplete}
            fieldRadius={fieldParams.fieldRadius}
          />
        )}
      </group>
    </group>
  );
}
