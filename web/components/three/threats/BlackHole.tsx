'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '@/lib/materials/GravitationalLensingMaterial';
import '@/lib/materials/VolumetricGlowMaterial';
import { InstancedParticleSystem } from '@/lib/particles';
import { AccretionDisk } from './AccretionDisk';
import { useConsoleStore } from '@/lib/stores/console-store';

interface BlackHoleProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Cinematic black hole with 6-layer composition:
 * 1. Spacetime Distortion Field (GravitationalLensingMaterial)
 * 2. Hawking Radiation Glow (VolumetricGlowMaterial)
 * 3. Accretion Disk (1000-particle Keplerian spiral + 500 trail particles)
 * 4. Event Horizon (pure black void)
 * 5. Gravitational Wave Pulses (expanding torus rings)
 * 6. Polar Jet Streams (volumetric cones + particles)
 */
export default function BlackHole({
  position,
  size = 1.5,
  color = '#4c1d95',
  onHover,
  onClick,
}: BlackHoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lensingRef = useRef<any>(null);
  const hawkingRef = useRef<any>(null);
  const eventHorizonRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);
  const scanBeamRef = useRef<THREE.Mesh>(null);

  // Gravitational wave pulse rings
  const waveRing0Ref = useRef<THREE.Mesh>(null);
  const waveRing1Ref = useRef<THREE.Mesh>(null);
  const waveRing2Ref = useRef<THREE.Mesh>(null);

  // Jet stream material refs
  const jetTopRef = useRef<any>(null);
  const jetBottomRef = useRef<any>(null);

  // Growth state — black hole grows 2% per 10s
  const growthStartTimeRef = useRef(0);
  const growthScaleRef = useRef(1.0);

  const isPanelOpen = useConsoleStore((s) => !!s.expandedPanel);

  const eventHorizonRadius = size * 0.8;
  const diskOuterRadius = eventHorizonRadius * 2.5;

  // Targeting bracket geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.8;
    const len = s * 0.35;
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

  useEffect(() => {
    return () => {
      bracketGeometry.dispose();
    };
  }, [bracketGeometry]);

  const handlePointerOver = useCallback(() => {
    isHoveredRef.current = true;
    onHover?.(true);
  }, [onHover]);

  const handlePointerOut = useCallback(() => {
    isHoveredRef.current = false;
    onHover?.(false);
  }, [onHover]);

  const handleClick = useCallback(() => {
    if (!isCollapsingRef.current) {
      isCollapsingRef.current = true;
      collapseStartTimeRef.current = 0;
      onClick?.();
    }
  }, [onClick]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    if (isPanelOpen && !isCollapsingRef.current) {
      if (lensingRef.current) lensingRef.current.time = time;
      if (hawkingRef.current) hawkingRef.current.time = time;
      if (jetTopRef.current) jetTopRef.current.time = time;
      if (jetBottomRef.current) jetBottomRef.current.time = time;
      return;
    }
    const hovered = isHoveredRef.current;

    // Set collapse start time on first frame
    if (isCollapsingRef.current && collapseStartTimeRef.current === 0) {
      collapseStartTimeRef.current = time;
    }

    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      collapseProgress = Math.min((time - collapseStartTimeRef.current) / 3.0, 1);
    }

    // Growth: 2% per 10s (freeze during collapse)
    if (!isCollapsingRef.current) {
      const growthTime = time - growthStartTimeRef.current;
      growthScaleRef.current = 1.0 + (growthTime / 10.0) * 0.02;
    }

    // ---- Layer 1: GravitationalLensingMaterial ----
    if (lensingRef.current) {
      lensingRef.current.time = time;
      lensingRef.current.distortionStrength = hovered ? 0.5 : 0.3;
    }

    // ---- Layer 2: Hawking Radiation ----
    if (hawkingRef.current) {
      hawkingRef.current.time = time;
      if (!isCollapsingRef.current) {
        hawkingRef.current.glowStrength = hovered ? 0.3 : 0.15;
      }
    }

    // ---- Layer 4: Event Horizon growth ----
    if (eventHorizonRef.current && !isCollapsingRef.current) {
      eventHorizonRef.current.scale.setScalar(growthScaleRef.current);
    }

    // ---- Layer 5: Gravitational Wave Pulses ----
    const waveRings = [waveRing0Ref, waveRing1Ref, waveRing2Ref];
    for (let w = 0; w < 3; w++) {
      const ring = waveRings[w].current;
      if (!ring) continue;
      // Each ring offset by 1/3 of cycle period (9s full cycle)
      const cycleTime = ((time + w * 3.0) % 9.0) / 9.0;
      ring.scale.setScalar(1.0 + cycleTime * 3.0);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.1 * (1 - cycleTime);
    }

    // ---- Layer 6: Jet stream materials ----
    if (jetTopRef.current) jetTopRef.current.time = time;
    if (jetBottomRef.current) jetBottomRef.current.time = time;

    // ---- Collapse animation (3s total) ----
    if (isCollapsingRef.current && collapseProgress < 1) {
      // Phase 1 (0–0.33): Scanning beam + particle extraction brightening
      if (collapseProgress < 0.33) {
        const p1 = collapseProgress / 0.33;
        if (scanBeamRef.current) {
          scanBeamRef.current.visible = true;
          scanBeamRef.current.rotation.z = p1 * Math.PI * 2;
          (scanBeamRef.current.material as THREE.MeshBasicMaterial).opacity =
            0.8 * (1 - p1 * 0.3);
        }
        if (hawkingRef.current) {
          hawkingRef.current.glowStrength = 0.15 + p1 * 0.5;
        }
      }
      // Phase 2 (0.33–0.67): Disk reversal, color shift to gold
      else if (collapseProgress < 0.67) {
        const p2 = (collapseProgress - 0.33) / 0.34;
        if (scanBeamRef.current) scanBeamRef.current.visible = false;
        if (lensingRef.current) {
          lensingRef.current.distortionStrength = 0.5 + p2 * 0.5;
        }
      }
      // Phase 3 (0.67–1.0): Implosion — flash + shockwave
      else {
        const p3 = (collapseProgress - 0.67) / 0.33;
        if (eventHorizonRef.current) {
          eventHorizonRef.current.scale.setScalar(Math.max(0.05, 1 - p3 * 0.95));
        }
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = true;
          flashSphereRef.current.scale.setScalar(1 + p3 * 3);
          (flashSphereRef.current.material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 1 - p3 * 1.5);
        }
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.visible = true;
          shockwaveRingRef.current.scale.setScalar(1 + p3 * 4);
          (shockwaveRingRef.current.material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 0.8 * (1 - p3));
        }
        if (hawkingRef.current) {
          hawkingRef.current.opacity = (1 - p3) * 0.6;
        }
      }
    }

    // Reset after collapse completes
    if (isCollapsingRef.current && collapseProgress >= 1) {
      isCollapsingRef.current = false;
      if (eventHorizonRef.current) eventHorizonRef.current.scale.setScalar(1);
      if (flashSphereRef.current) flashSphereRef.current.visible = false;
      if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
      if (scanBeamRef.current) scanBeamRef.current.visible = false;
      if (hawkingRef.current) hawkingRef.current.opacity = 1.0;
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = hovered && !isCollapsingRef.current;
      if (hovered) {
        bracketsRef.current.rotation.z = time * 0.3;
        const pulse = 0.5 + Math.sin(time * 2 * Math.PI) * 0.5;
        bracketsRef.current.scale.setScalar(1 + pulse * 0.15);
      }
    }

    // Gentle whole-group rotation
    if (!isCollapsingRef.current) {
      groupRef.current.rotation.z += 0.001;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* ===== Layer 1: Spacetime Distortion Field ===== */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[eventHorizonRadius * 2.0, 24, 24]} />
        <gravitationalLensingMaterial
          ref={lensingRef}
          blackHoleRadius={eventHorizonRadius}
          distortionStrength={0.3}
          ringColor={color}
          hawkingColor="#3b82f6"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 2: Hawking Radiation Glow ===== */}
      <mesh>
        <sphereGeometry args={[eventHorizonRadius * 1.3, 16, 16]} />
        <volumetricGlowMaterial
          ref={hawkingRef}
          color="#3b82f6"
          glowStrength={0.15}
          noiseScale={3.0}
          noiseSpeed={0.5}
          rimPower={4.0}
          opacity={1.0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 3: Accretion Disk (GPU-driven Keplerian spiral) ===== */}
      <AccretionDisk
        count={400}
        eventHorizonRadius={eventHorizonRadius}
        outerRadius={diskOuterRadius}
        color="#7c3aed"
        colorInner="#fbbf24"
        spiralRate={0.15}
        speedMult={1.0}
        opacity={1.0}
        diskHeight={0.15}
        particleSize={3.0}
      />
      <AccretionDisk
        count={200}
        eventHorizonRadius={eventHorizonRadius}
        outerRadius={diskOuterRadius}
        color="#4c1d95"
        colorInner="#f59e0b"
        spiralRate={0.12}
        speedMult={1.0}
        opacity={0.5}
        diskHeight={0.2}
        particleSize={2.5}
      />

      {/* ===== Layer 4: Event Horizon (void) ===== */}
      <mesh ref={eventHorizonRef}>
        <sphereGeometry args={[eventHorizonRadius, 24, 24]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} toneMapped={false} />
      </mesh>

      {/* ===== Layer 5: Gravitational Wave Pulse Rings ===== */}
      <mesh ref={waveRing0Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.2, 0.01, 8, 64]} />
        <meshBasicMaterial
          color="#4c1d95"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={waveRing1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.2, 0.01, 8, 64]} />
        <meshBasicMaterial
          color="#4c1d95"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={waveRing2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.2, 0.01, 8, 64]} />
        <meshBasicMaterial
          color="#4c1d95"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 6: Polar Jet Streams ===== */}

      {/* Top jet cone (volumetric glow) */}
      <mesh position={[0, eventHorizonRadius * 1.5, 0]}>
        <coneGeometry args={[eventHorizonRadius * 0.2, eventHorizonRadius * 2.0, 12, 1, true]} />
        <volumetricGlowMaterial
          ref={jetTopRef}
          color="#3b82f6"
          glowStrength={0.3}
          noiseScale={4.0}
          noiseSpeed={1.5}
          rimPower={2.0}
          opacity={0.15}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Bottom jet cone (volumetric glow) */}
      <mesh position={[0, -eventHorizonRadius * 1.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[eventHorizonRadius * 0.2, eventHorizonRadius * 2.0, 12, 1, true]} />
        <volumetricGlowMaterial
          ref={jetBottomRef}
          color="#3b82f6"
          glowStrength={0.3}
          noiseScale={4.0}
          noiseSpeed={1.5}
          rimPower={2.0}
          opacity={0.15}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Top jet particles */}
      <group position={[0, eventHorizonRadius * 0.5, 0]}>
        <InstancedParticleSystem
          count={25}
          color="#93c5fd"
          colorEnd="#3b82f6"
          velocityMin={[-0.05, 1.5, -0.05]}
          velocityMax={[0.05, 3.0, 0.05]}
          lifespan={[0.5, 1.5]}
          emitRate={20}
          size={eventHorizonRadius * 0.04}
          spawnRadius={eventHorizonRadius * 0.15}
          loop
        />
      </group>

      {/* Bottom jet particles */}
      <group position={[0, -eventHorizonRadius * 0.5, 0]}>
        <InstancedParticleSystem
          count={25}
          color="#93c5fd"
          colorEnd="#3b82f6"
          velocityMin={[-0.05, -3.0, -0.05]}
          velocityMax={[0.05, -1.5, 0.05]}
          lifespan={[0.5, 1.5]}
          emitRate={20}
          size={eventHorizonRadius * 0.04}
          spawnRadius={eventHorizonRadius * 0.15}
          loop
        />
      </group>

      {/* ===== Interaction Overlays ===== */}

      {/* Scanning beam — collapse phase 1 */}
      <mesh ref={scanBeamRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, size * 4, 12]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Flash sphere — collapse phase 3 */}
      <mesh ref={flashSphereRef} visible={false}>
        <sphereGeometry args={[eventHorizonRadius, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Shockwave ring — collapse phase 3 */}
      <mesh ref={shockwaveRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[eventHorizonRadius, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Targeting brackets + warning ring */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color="#ef4444" opacity={0.8} transparent />
        </lineSegments>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.6, 0.02, 8, 32]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
