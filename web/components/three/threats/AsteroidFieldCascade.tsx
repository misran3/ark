'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidFieldCascadeProps {
  /** World position where the cascade was triggered (last destroyed rock) */
  triggerPoint: [number, number, number];
  /** All rock positions in the field */
  rockPositions: [number, number, number][];
  /** Indices of rocks still alive when cascade was triggered */
  aliveRockIndices: number[];
  /** Callback to detonate a specific rock */
  onDetonateRock: (rockIndex: number) => void;
  /** Called when the entire cascade sequence completes */
  onCascadeComplete: () => void;
  /** Field radius for sizing the final burst */
  fieldRadius: number;
}

interface CascadeRock {
  index: number;
  position: [number, number, number];
  distance: number;
  delay: number;
  detonated: boolean;
  flashTime: number;
}

/**
 * Cascade collapse sequence:
 *
 * 1. Trigger (0s) — final destroyed rock shatter animation plays
 * 2. Shockwave ring spawns (0.15s) — visible energy ring expands outward
 * 3. Impact flash per rock (~0.05s) — white-hot flash as shockwave reaches each rock
 * 4. Cascade (0.2-0.3s per hop) — each rock detonates after flash, sorted by distance
 * 5. Final burst (last rock + 0.3s) — combined shockwave as "field cleared" punctuation
 * 6. Cleanup — threat marked deflected
 */
export default function AsteroidFieldCascade({
  triggerPoint,
  rockPositions,
  aliveRockIndices,
  onDetonateRock,
  onCascadeComplete,
  fieldRadius,
}: AsteroidFieldCascadeProps) {
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const finalBurstRef = useRef<THREE.Mesh>(null);
  const startTimeRef = useRef(0);
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);

  // Compute cascade schedule: sort alive rocks by distance from trigger, assign delays
  const [cascadeRocks] = useState<CascadeRock[]>(() => {
    const trigger = new THREE.Vector3(...triggerPoint);
    const baseDelay = 0.15; // Shockwave spawn delay
    const hopTime = 0.25; // Time between each rock detonation

    const rocks = aliveRockIndices
      .map((index) => {
        const pos = rockPositions[index];
        const distance = trigger.distanceTo(new THREE.Vector3(...pos));
        return {
          index,
          position: pos,
          distance,
          delay: 0, // Set below
          detonated: false,
          flashTime: 0,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    // Assign staggered delays based on sorted order
    rocks.forEach((rock, i) => {
      rock.delay = baseDelay + hopTime * (i + 1);
      rock.flashTime = rock.delay - 0.05; // Flash 50ms before detonation
    });

    return rocks;
  });

  // Total cascade duration
  const totalDuration = cascadeRocks.length > 0
    ? cascadeRocks[cascadeRocks.length - 1].delay + 0.5 // Last detonation + final burst time
    : 0.5;

  // Track detonated state in refs to avoid re-renders in useFrame
  const detonatedSetRef = useRef(new Set<number>());
  const flashedSetRef = useRef(new Set<number>());

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Initialize start time on first frame
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startTimeRef.current = time;
    }

    const elapsed = time - startTimeRef.current;

    // --- Expanding shockwave ring ---
    if (shockwaveRef.current) {
      const ringProgress = Math.min(elapsed / (totalDuration * 0.8), 1);
      const ringRadius = ringProgress * fieldRadius * 2;
      shockwaveRef.current.scale.setScalar(Math.max(0.01, ringRadius));
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.6 * (1 - ringProgress * 0.8);
      shockwaveRef.current.visible = elapsed > 0.1;
    }

    // --- Per-rock detonation by distance ---
    for (const rock of cascadeRocks) {
      // Flash just before detonation
      if (elapsed >= rock.flashTime && !flashedSetRef.current.has(rock.index)) {
        flashedSetRef.current.add(rock.index);
        // The impactFlash prop on the Asteroid handles the visual
      }

      // Detonate
      if (elapsed >= rock.delay && !detonatedSetRef.current.has(rock.index)) {
        detonatedSetRef.current.add(rock.index);
        onDetonateRock(rock.index);
      }
    }

    // --- Final burst ---
    if (finalBurstRef.current) {
      const finalBurstStart = cascadeRocks.length > 0
        ? cascadeRocks[cascadeRocks.length - 1].delay + 0.3
        : 0.3;
      const finalProgress = Math.max(0, (elapsed - finalBurstStart) / 0.4);

      if (finalProgress > 0 && finalProgress < 1) {
        finalBurstRef.current.visible = true;
        finalBurstRef.current.scale.setScalar(fieldRadius * 1.5 * finalProgress);
        (finalBurstRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.8 * (1 - finalProgress);
      } else {
        finalBurstRef.current.visible = false;
      }
    }

    // --- Cleanup ---
    if (elapsed >= totalDuration && !completedRef.current) {
      completedRef.current = true;
      onCascadeComplete();
    }
  });

  return (
    <group position={triggerPoint}>
      {/* Expanding shockwave ring from trigger point */}
      <mesh ref={shockwaveRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.08, 8, 64]} />
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Final combined shockwave burst */}
      <mesh ref={finalBurstRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
