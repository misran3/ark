'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3, Mesh, MeshStandardMaterial } from 'three';
import { createNoise3D } from 'simplex-noise';
import './AsteroidMaterial';
import '@/lib/materials/VolumetricGlowMaterial';
import '@/lib/materials/EnergyFlowMaterial';
import { InstancedParticleSystem, TrailRibbon } from '@/lib/particles';

// Pre-allocated reusable temp objects (module-level, zero GC pressure)
const _lerpTarget = new THREE.Vector3();
const _chunkPos = new THREE.Vector3();

export interface AsteroidProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  label?: string;
  seed?: number;
  angularVelocity?: [number, number, number];
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;

  // Field-mode props (all optional — standalone mode works without them)
  /** Current HP. When provided, enables damage visuals. */
  hp?: number;
  /** Maximum HP for this rock. Used to compute damageLevel (0-1). */
  maxHp?: number;
  /** Called when this rock is clicked in field mode (parent manages HP). */
  onHit?: () => void;
  /** Sympathetic glow intensity from field instability (0-1). */
  sympatheticGlow?: number;
  /** Field instability drives pulse rate on remaining rocks (0-1). */
  fieldInstability?: number;
  /** Trail tier for performance budgeting. */
  trailTier?: 'full' | 'reduced' | 'none';
  /** When true, triggers the collapse/shatter animation externally (for cascade). */
  collapsed?: boolean;
  /** Called when collapse animation finishes. */
  onCollapseComplete?: () => void;
  /** When true, the impact flash plays first (for cascade timing). */
  impactFlash?: boolean;
}

/**
 * Cinematic asteroid with 5-layer composition:
 * 1. Outer Heat Haze (VolumetricGlowMaterial atmosphere)
 * 2. Rocky Shell (IcosahedronGeometry + Voronoi crack shader)
 * 3. Inner Core Glow (visible through cracks)
 * 4. Particle Systems (ember trail, smoke ribbon, molten chunks) — tiered by trailTier
 * 5. Interaction Overlays (targeting brackets + EnergyFlow scan ring)
 *
 * Supports both standalone mode (original behavior) and field mode (HP, damage, cascade).
 */
export default function Asteroid({
  position,
  size = 1,
  color = '#f97316',
  label = 'THREAT',
  seed = 42,
  angularVelocity = [0.3, 0.5, 0.2],
  onHover,
  onClick,
  hp,
  maxHp,
  onHit,
  sympatheticGlow = 0,
  fieldInstability = 0,
  trailTier = 'full',
  collapsed = false,
  onCollapseComplete,
  impactFlash = false,
}: AsteroidProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const hazeRef = useRef<any>(null);
  const hazeMeshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<any>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);
  const collapseCompleteCalledRef = useRef(false);

  // Shudder animation state
  const shudderTimeRef = useRef(0);
  const isShudderingRef = useRef(false);
  const shudderOriginRef = useRef(new THREE.Vector3());

  // Track previous collapsed prop to detect transitions
  const prevCollapsedRef = useRef(false);

  // Chunk debris particles spawned on hit
  const [chunkParticles, setChunkParticles] = useState<
    Array<{ position: Vector3; velocity: Vector3; lifetime: number; startTime: number }>
  >([]);

  // Compute damage level from HP
  const isFieldMode = hp !== undefined && maxHp !== undefined;
  const damageLevel = isFieldMode ? 1 - Math.max(0, hp) / maxHp : 0;

  // Generate procedural asteroid geometry with seeded simplex noise
  const geometry = useMemo(() => {
    let s = seed;
    const seededRandom = () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const noise3D = createNoise3D(seededRandom);

    const detail = 3; // 320 faces — smooth enough for displacement
    const geo = new THREE.IcosahedronGeometry(size, detail);
    const posAttr = geo.getAttribute('position');

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      // 2-octave FBM displacement
      const n1 = noise3D(x * 1.5, y * 1.5, z * 1.5);
      const n2 = noise3D(x * 3.0, y * 3.0, z * 3.0) * 0.5;
      const distortion = 1 + (n1 + n2) * 0.25;

      posAttr.setXYZ(i, x * distortion, y * distortion, z * distortion);
    }

    geo.computeVertexNormals();
    return geo;
  }, [size, seed]);

  // Targeting bracket line geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.6;
    const len = s * 0.3;
    const points: number[] = [];

    const corners = [
      [-s, s, 0], [s, s, 0], [s, -s, 0], [-s, -s, 0],
    ];
    const dirs = [
      [[1, 0, 0], [0, -1, 0]],
      [[-1, 0, 0], [0, -1, 0]],
      [[-1, 0, 0], [0, 1, 0]],
      [[1, 0, 0], [0, 1, 0]],
    ];

    for (let c = 0; c < 4; c++) {
      const [cx, cy, cz] = corners[c];
      for (const [dx, dy, dz] of dirs[c]) {
        points.push(cx, cy, cz);
        points.push(cx + dx * len, cy + dy * len, cz + dz * len);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [size]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      bracketGeometry.dispose();
    };
  }, [geometry, bracketGeometry]);

  // Detect external collapse trigger
  useEffect(() => {
    if (collapsed && !prevCollapsedRef.current && !isCollapsingRef.current) {
      isCollapsingRef.current = true;
      collapseStartTimeRef.current = 0;
      collapseCompleteCalledRef.current = false;
    }
    prevCollapsedRef.current = collapsed;
  }, [collapsed]);

  const handlePointerOver = useCallback(() => {
    isHoveredRef.current = true;
    onHover?.(true);
  }, [onHover]);

  const handlePointerOut = useCallback(() => {
    isHoveredRef.current = false;
    onHover?.(false);
  }, [onHover]);

  const triggerShudder = useCallback(() => {
    isShudderingRef.current = true;
    shudderTimeRef.current = 0;
    if (groupRef.current) {
      shudderOriginRef.current.copy(groupRef.current.position);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isCollapsingRef.current) return;

    if (onHit) {
      // Field mode: notify parent, trigger shudder, spawn chunk particles
      onHit();
      triggerShudder();

      // Spawn chunk particles based on rock size (infer tier from HP)
      const tier = maxHp === 3 ? 'large' : maxHp === 2 ? 'medium' : 'small';
      const chunkCount = tier === 'large' ? 10 : tier === 'medium' ? 7 : 5;
      const now = performance.now() / 1000;
      const newChunks = Array.from({ length: chunkCount }, (_, i) => {
        const angle = (i / chunkCount) * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.4;
        const velocity = new Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * 0.3
        );
        return {
          position: new Vector3(0, 0, 0), // Will be offset from rock center
          velocity,
          lifetime: 2 + Math.random() * 2, // 2-4 seconds
          startTime: now,
        };
      });

      setChunkParticles((prev) => [...prev, ...newChunks]);
    } else {
      // Standalone mode: trigger collapse directly
      isCollapsingRef.current = true;
      collapseStartTimeRef.current = 0;
      collapseCompleteCalledRef.current = false;
      onClick?.();
    }
  }, [onClick, onHit, triggerShudder, maxHp]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const hovered = isHoveredRef.current;

    // Set collapse start time on first frame
    if (isCollapsingRef.current && collapseStartTimeRef.current === 0) {
      collapseStartTimeRef.current = time;
    }

    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      collapseProgress = Math.min((time - collapseStartTimeRef.current) / 2.0, 1);
    }

    // ---- Shudder animation (0.3s) ----
    if (isShudderingRef.current) {
      shudderTimeRef.current += delta;
      const shudderDuration = 0.3;
      if (shudderTimeRef.current < shudderDuration) {
        const t = shudderTimeRef.current / shudderDuration;
        const intensity = (1 - t) * size * 0.08; // Decaying shake
        const freq = 40; // High frequency vibration
        groupRef.current.position.set(
          shudderOriginRef.current.x + Math.sin(t * freq) * intensity,
          shudderOriginRef.current.y + Math.cos(t * freq * 1.3) * intensity,
          shudderOriginRef.current.z + Math.sin(t * freq * 0.7) * intensity * 0.5,
        );
      } else {
        isShudderingRef.current = false;
        groupRef.current.position.copy(shudderOriginRef.current);
      }
    }

    // ---- Animate and cull chunk particles ----
    if (chunkParticles.length > 0) {
      setChunkParticles((prev) =>
        prev.filter((chunk) => {
          const age = time - chunk.startTime;
          return age <= chunk.lifetime; // Cull expired chunks
        })
      );
    }

    // ---- Passive debris shedding when field is highly unstable ----
    if (fieldInstability >= 0.6) {
      // Only at 60%+ instability (2+ rocks destroyed)
      const shedInterval = 2.5;
      const lastShedKey = `lastShed_${position.join(',')}`;

      if (!(window as any)[lastShedKey] || time - (window as any)[lastShedKey] > shedInterval) {
        (window as any)[lastShedKey] = time;

        // Spawn 1-2 small debris chunks
        const newChunks = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.1 + Math.random() * 0.2;
          return {
            position: new Vector3(0, 0, 0),
            velocity: new Vector3(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              (Math.random() - 0.5) * 0.1
            ),
            lifetime: 3 + Math.random() * 2,
            startTime: time,
          };
        });

        setChunkParticles((prev) => [...prev, ...newChunks]);
      }
    }

    // ---- Layer 1: Heat Haze atmosphere ----
    if (hazeRef.current) {
      hazeRef.current.time = time;
    }
    if (hazeMeshRef.current && !isCollapsingRef.current) {
      // Gentle scale pulse ±5% at 1.5 Hz
      const hazePulse = 1.0 + Math.sin(time * 1.5 * Math.PI * 2) * 0.05;
      hazeMeshRef.current.scale.setScalar(hazePulse);
    }

    // ---- Layer 2: Rocky shell ----
    if (meshRef.current && !isCollapsingRef.current) {
      meshRef.current.rotation.x += angularVelocity[0] * delta;
      meshRef.current.rotation.y += angularVelocity[1] * delta;
      meshRef.current.rotation.z += angularVelocity[2] * delta;

      // Surface pulse when field is unstable
      let scaleFactor = 1.0;
      if (fieldInstability > 0.3) {
        // Pulse frequency increases with instability (1-4 Hz)
        const pulseFreq = 1 + fieldInstability * 3;
        const pulsePhase = Math.sin(time * pulseFreq * Math.PI * 2);

        // Scale pulse amplitude: 2-5% based on instability
        const pulseAmplitude = 0.02 + fieldInstability * 0.03;
        scaleFactor = 1 + pulsePhase * pulseAmplitude;
      }

      // Apply hover scale on top of instability pulse
      const targetScale = hovered ? 1.1 * scaleFactor : scaleFactor;
      _lerpTarget.setScalar(targetScale);
      meshRef.current.scale.lerp(_lerpTarget, delta * 5);
    }

    if (materialRef.current) {
      materialRef.current.time = time;

      // Feed damage and sympathetic glow into shader
      materialRef.current.damageLevel = damageLevel;
      materialRef.current.sympatheticGlow = sympatheticGlow;

      if (!isCollapsingRef.current) {
        materialRef.current.heatIntensity = hovered ? 1.5 : 1.0;

        // Boost emissive when unstable (in addition to sympatheticGlow uniform)
        let baseEmissive = hovered ? 3.5 : 3.0;
        if (sympatheticGlow > 0) {
          const pulse = Math.sin(time * (1 + sympatheticGlow * 3) * Math.PI * 2);
          // Emissive boost: 0-2x based on sympatheticGlow and pulse
          const emissiveBoost = 1.0 + sympatheticGlow * (1.0 + pulse * 0.5);
          baseEmissive *= emissiveBoost;
        }
        materialRef.current.emissiveStrength = baseEmissive;
      }
    }

    // ---- Layer 3: Inner core glow ----
    if (coreRef.current && !isCollapsingRef.current) {
      // Pulse rate increases with field instability
      const pulseFreq = 2 + fieldInstability * 4; // 2 Hz normal → 6 Hz at max instability
      const corePulse = 0.08 + (Math.sin(time * pulseFreq * Math.PI * 2) * 0.5 + 0.5) * 0.12;
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = corePulse;

      // Core gets brighter with damage (exposed inner glow)
      if (damageLevel > 0.6) {
        const coreExposure = (damageLevel - 0.6) / 0.4; // 0-1 over last 40% of damage
        (coreRef.current.material as THREE.MeshBasicMaterial).opacity =
          corePulse + coreExposure * 0.25;
        coreRef.current.scale.setScalar(1 + coreExposure * 0.3);
      }
    }

    // ---- Layer 5: Scan ring material ----
    if (scanRingRef.current) {
      scanRingRef.current.time = time;
    }

    // ---- Collapse animation ----
    if (isCollapsingRef.current && collapseProgress < 1) {
      // Phase 1 (0-0.25): Inner core flares to white, flash sphere
      if (collapseProgress < 0.25) {
        const p1 = collapseProgress / 0.25;

        if (materialRef.current) {
          materialRef.current.heatIntensity = 1.0 + p1 * 3.0;
          materialRef.current.emissiveStrength = 3.0 + p1 * 4.0;
        }
        if (coreRef.current) {
          (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + p1 * 0.5;
          (coreRef.current.material as THREE.MeshBasicMaterial).color.setScalar(1);
        }
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = true;
          flashSphereRef.current.scale.setScalar(1 + p1);
          (flashSphereRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - p1;
        }
      }
      // Phase 2 (0.25-0.6): Rock shrinks, shockwave ring
      else if (collapseProgress < 0.6) {
        const p2 = (collapseProgress - 0.25) / 0.35;

        if (meshRef.current) {
          meshRef.current.scale.setScalar(Math.max(0.05, 1 - p2 * 0.95));
        }
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.visible = true;
          shockwaveRingRef.current.scale.setScalar(1 + p2 * 3);
          (shockwaveRingRef.current.material as THREE.MeshBasicMaterial).opacity =
            0.8 * (1 - p2);
        }
        if (materialRef.current) {
          materialRef.current.emissiveStrength = 7.0 * (1 - p2);
        }
      }
      // Phase 3 (0.6-1.0): Volumetric glow expands and fades
      else {
        const p3 = (collapseProgress - 0.6) / 0.4;

        if (meshRef.current) meshRef.current.visible = false;
        if (coreRef.current) coreRef.current.visible = false;

        if (hazeMeshRef.current) {
          hazeMeshRef.current.scale.setScalar(1.4 + p3 * 1.0);
          if (hazeRef.current) {
            hazeRef.current.opacity = (1 - p3) * 0.6;
          }
        }
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.scale.setScalar(4 + p3 * 2);
          (shockwaveRingRef.current.material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 0.3 * (1 - p3));
        }
      }
    }

    // Complete collapse — in field mode, notify parent; in standalone, reset
    if (isCollapsingRef.current && collapseProgress >= 1) {
      if (!collapseCompleteCalledRef.current) {
        collapseCompleteCalledRef.current = true;
        onCollapseComplete?.();
      }

      if (!isFieldMode) {
        // Standalone mode: reset for re-use
        isCollapsingRef.current = false;
        if (meshRef.current) {
          meshRef.current.visible = true;
          meshRef.current.scale.setScalar(1);
        }
        if (coreRef.current) coreRef.current.visible = true;
        if (flashSphereRef.current) flashSphereRef.current.visible = false;
        if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
        if (hazeMeshRef.current) hazeMeshRef.current.scale.setScalar(1);
        if (hazeRef.current) hazeRef.current.opacity = 1.0;
      }
      // Field mode: stay collapsed (parent will unmount)
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = hovered && !isCollapsingRef.current;
      if (hovered) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }
  });

  // Don't render anything after collapse in field mode
  const isDestroyed = isFieldMode && collapsed && isCollapsingRef.current;

  return (
    <group ref={groupRef} position={position}>
      {/* ===== Layer 1: Outer Heat Haze (atmosphere) ===== */}
      <mesh ref={hazeMeshRef}>
        <sphereGeometry args={[size * 1.4, 24, 24]} />
        <volumetricGlowMaterial
          ref={hazeRef}
          color={color}
          noiseScale={2.0}
          noiseSpeed={0.8}
          rimPower={2.5}
          glowStrength={0.3}
          opacity={0.25}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 2: Rocky Shell (main body) ===== */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <asteroidShaderMaterial
          ref={materialRef}
          key="asteroid-shader"
          seed={seed}
          heatIntensity={1.0}
          emissiveStrength={3.0}
          damageLevel={damageLevel}
          sympatheticGlow={sympatheticGlow}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 3: Inner Core Glow ===== */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[size * 0.4, 16, 16]} />
        <meshBasicMaterial
          color="#ff4500"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 4: Particle Systems (tiered) ===== */}

      {/* Full trail: 200 ember particles + ribbon + molten chunks */}
      {trailTier === 'full' && (
        <>
          <InstancedParticleSystem
            count={80}
            color="#f97316"
            colorEnd="#1a1a1a"
            velocityMin={[-0.3, -0.3, 0.5]}
            velocityMax={[0.3, 0.3, 1.5]}
            lifespan={[1.0, 2.5]}
            gravity={[0, -0.1, 0]}
            emitRate={25}
            size={size * 0.04}
            spawnRadius={size * 0.3}
            loop
          />
          <TrailRibbon
            targetRef={groupRef}
            color="#f97316"
            colorEnd="#333333"
            width={size * 0.12}
            lifetime={1.5}
            maxPoints={40}
            opacity={0.25}
          />
          <InstancedParticleSystem
            count={8}
            color="#dc2626"
            colorEnd="#1a1a1a"
            velocityMin={[-0.1, -0.1, 0.2]}
            velocityMax={[0.1, 0.1, 0.5]}
            lifespan={[2.0, 4.0]}
            emitRate={1.5}
            size={size * 0.15}
            spawnRadius={size * 0.2}
            loop
          />
        </>
      )}

      {/* Reduced trail: 30 ember particles only (no ribbon, no chunks) */}
      {trailTier === 'reduced' && (
        <InstancedParticleSystem
          count={20}
          color="#f97316"
          colorEnd="#1a1a1a"
          velocityMin={[-0.2, -0.2, 0.3]}
          velocityMax={[0.2, 0.2, 1.0]}
          lifespan={[0.8, 2.0]}
          gravity={[0, -0.1, 0]}
          emitRate={8}
          size={size * 0.04}
          spawnRadius={size * 0.2}
          loop
        />
      )}

      {/* trailTier === 'none': no particles */}

      {/* ===== Layer 5: Interaction Overlays ===== */}

      {/* Impact flash — white-hot flash for cascade timing */}
      {impactFlash && (
        <mesh>
          <sphereGeometry args={[size * 1.2, 16, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Flash sphere — collapse phase 1 */}
      <mesh ref={flashSphereRef} visible={false}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Shockwave ring — collapse phase 2 */}
      <mesh ref={shockwaveRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.2, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Targeting brackets + EnergyFlow scan ring */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color={color} opacity={0.9} transparent />
        </lineSegments>
        {/* Scan ring with energy flow instead of plain color */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.4, 0.03, 8, 48]} />
          <energyFlowMaterial
            ref={scanRingRef}
            color1={color}
            color2="#ffffff"
            flowSpeed={2.0}
            stripeCount={6.0}
            opacity={0.6}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Hit-triggered chunk debris */}
      {chunkParticles.map((chunk, i) => (
        <ChunkDebris
          key={`${chunk.startTime}-${i}`}
          position={position}
          velocity={chunk.velocity}
          startTime={chunk.startTime}
          lifetime={chunk.lifetime}
          size={size * 0.05} // 5% of rock size
        />
      ))}
    </group>
  );
}

interface ChunkDebrisProps {
  position: [number, number, number];
  velocity: Vector3;
  startTime: number;
  lifetime: number;
  size: number;
}

function ChunkDebris({ position, velocity, startTime, lifetime, size }: ChunkDebrisProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const age = state.clock.elapsedTime - startTime;
    const t = age / lifetime;

    // Physics: velocity + gravity (reuse module-level _chunkPos)
    const gravity = -1.5; // Units per second squared
    _chunkPos.set(
      position[0] + velocity.x * age,
      position[1] + velocity.y * age + 0.5 * gravity * age * age,
      position[2] + velocity.z * age
    );
    meshRef.current.position.copy(_chunkPos);

    // Fade out near end of lifetime
    const opacity = t < 0.7 ? 1.0 : 1.0 - (t - 0.7) / 0.3;
    if (meshRef.current.material instanceof MeshStandardMaterial) {
      meshRef.current.material.opacity = opacity;
    }

    // Tumble
    meshRef.current.rotation.x += 0.05;
    meshRef.current.rotation.y += 0.03;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color="#8b7355"
        roughness={0.9}
        metalness={0.1}
        transparent
        opacity={1}
      />
    </mesh>
  );
}
