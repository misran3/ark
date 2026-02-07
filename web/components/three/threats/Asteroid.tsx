'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import AsteroidTrail from './AsteroidTrail';
import './AsteroidMaterial';

// Easing function for smooth animations
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

interface AsteroidProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  label?: string;
  seed?: number;
  angularVelocity?: [number, number, number];
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Procedurally generated asteroid with:
 * - IcosahedronGeometry + seeded simplex noise displacement
 * - Custom shader material with lava cracks, heat gradient, fresnel glow
 * - Fire trail particle system
 * - Per-asteroid random tumbling
 * - Sci-fi corner targeting brackets on hover
 */
export default function Asteroid({
  position,
  size = 1,
  color = '#ff5733',
  label = 'THREAT',
  seed = 42,
  angularVelocity = [0.3, 0.5, 0.2],
  onHover,
  onClick,
}: AsteroidProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const isHoveredRef = useRef(false);
  const bracketsRef = useRef<THREE.Group>(null);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);
  const fragmentParticlesRef = useRef<THREE.Points>(null);
  const trailParticlesRef = useRef<THREE.Points>(null);

  // Generate procedural asteroid geometry with seeded simplex noise
  const geometry = useMemo(() => {
    // Seeded PRNG for deterministic generation
    let s = seed;
    const seededRandom = () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const noise3D = createNoise3D(seededRandom);

    const detail = size > 1.5 ? 2 : 1; // Higher detail for larger asteroids
    const geo = new THREE.IcosahedronGeometry(size, detail);
    const posAttr = geo.getAttribute('position');
    const normal = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      // Normalize to get direction, then apply noise displacement
      normal.set(x, y, z).normalize();
      const noiseVal = noise3D(x * 1.5, y * 1.5, z * 1.5);
      const distortion = 1 + noiseVal * 0.3; // +/- 30% variation

      posAttr.setXYZ(i, x * distortion, y * distortion, z * distortion);
    }

    geo.computeVertexNormals();
    return geo;
  }, [size, seed]);

  // Pre-compute targeting bracket line geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.6; // bracket extent
    const len = s * 0.3; // bracket arm length
    const points: number[] = [];

    // Four corners, each with 2 lines (forming an L-bracket)
    const corners = [
      [-s, s, 0], [s, s, 0], [s, -s, 0], [-s, -s, 0],
    ];
    const dirs = [
      [[1, 0, 0], [0, -1, 0]], // top-left: right + down
      [[-1, 0, 0], [0, -1, 0]], // top-right: left + down
      [[-1, 0, 0], [0, 1, 0]], // bottom-right: left + up
      [[1, 0, 0], [0, 1, 0]], // bottom-left: right + up
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

  // Fragment particle system for collapse animation
  const fragmentParticleSystem = useMemo(() => {
    const count = 100; // 100 fragment particles
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const maxLifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // All start at origin
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random radial direction with speed 2-5 units/s
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;

      // Initial color: orange
      colors[i * 3] = 0.976; // r
      colors[i * 3 + 1] = 0.451; // g
      colors[i * 3 + 2] = 0.086; // b

      // Lifetimes for fading out over the animation
      lifetimes[i] = 0;
      maxLifetimes[i] = 0.8 + Math.random() * 0.4; // 0.8-1.2s lifespan
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry: geo, positions, colors, velocities, lifetimes, maxLifetimes, count };
  }, []);

  // Trail particle system for fragment particles
  const trailParticleSystem = useMemo(() => {
    const count = 100; // Match fragment count
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Darker orange for trail
      colors[i * 3] = 0.976 * 0.5;
      colors[i * 3 + 1] = 0.451 * 0.5;
      colors[i * 3 + 2] = 0.086 * 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry: geo, positions, count };
  }, []);

  // Dispose geometries on unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      geometry.dispose();
      bracketGeometry.dispose();
      fragmentParticleSystem.geometry.dispose();
      trailParticleSystem.geometry.dispose();
    };
  }, [geometry, bracketGeometry, fragmentParticleSystem.geometry, trailParticleSystem.geometry]);

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
      collapseStartTimeRef.current = 0; // Will be set on first frame
      onClick?.();
    }
  }, [onClick]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    // Set collapse start time on first frame
    if (isCollapsingRef.current && collapseStartTimeRef.current === 0) {
      collapseStartTimeRef.current = time;
    }

    // Calculate collapse progress (0 to 1 over 2 seconds)
    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      const elapsedTime = time - collapseStartTimeRef.current;
      collapseProgress = Math.min(elapsedTime / 2.0, 1);
    }

    // Tumbling rotation with per-asteroid angular velocity (freeze during collapse)
    if (meshRef.current && !isCollapsingRef.current) {
      meshRef.current.rotation.x += angularVelocity[0] * delta;
      meshRef.current.rotation.y += angularVelocity[1] * delta;
      meshRef.current.rotation.z += angularVelocity[2] * delta;
    }

    // Update shader time uniform
    if (materialRef.current) {
      materialRef.current.time = time;

      // Phase 1 (0-0.5s): Increase heat and emissive strength
      if (collapseProgress < 0.25) {
        const phase1Progress = collapseProgress / 0.25;
        materialRef.current.heatIntensity = 1.0 + phase1Progress * 2.0; // 1.0 -> 3.0
        materialRef.current.emissiveStrength = 2.0 + phase1Progress * 3.0; // 2.0 -> 5.0
      } else if (collapseProgress < 1) {
        // Keep at max during phases 2 & 3, then fade out
        const postPhase1 = (collapseProgress - 0.25) / 0.75;
        materialRef.current.heatIntensity = 3.0 * (1 - postPhase1 * 0.5);
        materialRef.current.emissiveStrength = 5.0 * Math.max(0, 1 - postPhase1);
      } else {
        // Not collapsing: respond to hover
        if (isHoveredRef.current) {
          materialRef.current.heatIntensity = 1.5;
          materialRef.current.emissiveStrength = 3.0;
        } else {
          materialRef.current.heatIntensity = 1.0;
          materialRef.current.emissiveStrength = 2.0;
        }
      }
    }

    // ===== COLLAPSE PHASES =====
    if (isCollapsingRef.current && collapseProgress < 1) {
      // Phase 1 (0-0.25s / 0-0.5s): Impact Flash
      if (collapseProgress < 0.25) {
        const phase1Progress = collapseProgress / 0.25;

        // Flash sphere animation
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = true;
          flashSphereRef.current.scale.setScalar(1 + phase1Progress);
          const flashMat = flashSphereRef.current.material as THREE.MeshBasicMaterial;
          flashMat.opacity = 1 - phase1Progress;
        }
      }
      // Phase 2 (0.25-0.6s / 0.5-1.2s): Fracture & Fragment Burst
      else if (collapseProgress < 0.6) {
        const phase2Progress = (collapseProgress - 0.25) / 0.35;

        // Asteroid scales down rapidly
        if (meshRef.current) {
          meshRef.current.scale.setScalar(Math.max(0.1, 1 - phase2Progress * 0.9));
        }

        // Shockwave ring
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.visible = true;
          shockwaveRingRef.current.scale.setScalar(1 + phase2Progress * 2);
          const shockMat = shockwaveRingRef.current.material as THREE.MeshBasicMaterial;
          shockMat.opacity = Math.max(0, 0.8 * (1 - phase2Progress));
        }

        // Fragment particles: activate and burst outward
        if (fragmentParticlesRef.current) {
          fragmentParticlesRef.current.visible = true;
          const posAttr = fragmentParticlesRef.current.geometry.attributes.position;
          const colorAttr = fragmentParticlesRef.current.geometry.attributes.color;
          const pos = posAttr.array as Float32Array;
          const col = colorAttr.array as Float32Array;

          for (let i = 0; i < fragmentParticleSystem.count; i++) {
            const i3 = i * 3;
            const lifetime = fragmentParticleSystem.lifetimes[i];

            // Update lifetime
            fragmentParticleSystem.lifetimes[i] = lifetime + delta;

            // Update position along velocity
            pos[i3] += fragmentParticleSystem.velocities[i * 3] * delta;
            pos[i3 + 1] += fragmentParticleSystem.velocities[i * 3 + 1] * delta;
            pos[i3 + 2] += fragmentParticleSystem.velocities[i * 3 + 2] * delta;

            // Fade color from orange to gray
            const t = Math.min(1, lifetime / fragmentParticleSystem.maxLifetimes[i]);
            col[i3] = 0.976 * (1 - t * 0.8);
            col[i3 + 1] = 0.451 * (1 - t * 0.3);
            col[i3 + 2] = 0.086 + t * 0.2;
          }

          posAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;
        }

        // Update trail particles
        if (trailParticlesRef.current) {
          const trailPosAttr = trailParticlesRef.current.geometry.attributes.position;
          const fragPosAttr = fragmentParticlesRef.current?.geometry.attributes.position;
          if (fragPosAttr) {
            const trailPos = trailPosAttr.array as Float32Array;
            const fragPos = fragPosAttr.array as Float32Array;

            for (let i = 0; i < fragmentParticleSystem.count; i++) {
              const i3 = i * 3;
              // Trail at 70% of main position, lagging behind
              trailPos[i3] = fragPos[i3] * 0.7;
              trailPos[i3 + 1] = fragPos[i3 + 1] * 0.7;
              trailPos[i3 + 2] = fragPos[i3 + 2] * 0.7;
            }

            trailPosAttr.needsUpdate = true;
          }
        }
      }
      // Phase 3 (0.6-1s / 1.2-2.0s): Disintegration
      else {
        const phase3Progress = (collapseProgress - 0.6) / 0.4;

        // Fragments continue flying and fading
        if (fragmentParticlesRef.current) {
          const posAttr = fragmentParticlesRef.current.geometry.attributes.position;
          const colorAttr = fragmentParticlesRef.current.geometry.attributes.color;
          const pos = posAttr.array as Float32Array;
          const col = colorAttr.array as Float32Array;

          for (let i = 0; i < fragmentParticleSystem.count; i++) {
            const i3 = i * 3;
            const lifetime = fragmentParticleSystem.lifetimes[i];

            // Update lifetime
            fragmentParticleSystem.lifetimes[i] = lifetime + delta;

            // Continue movement
            pos[i3] += fragmentParticleSystem.velocities[i * 3] * delta;
            pos[i3 + 1] += fragmentParticleSystem.velocities[i * 3 + 1] * delta;
            pos[i3 + 2] += fragmentParticleSystem.velocities[i * 3 + 2] * delta;

            // Final fade out
            const t = Math.min(1, lifetime / fragmentParticleSystem.maxLifetimes[i]);
            const finalOpacity = Math.max(0, 1 - phase3Progress * 1.5);
            col[i3] = 0.976 * (1 - t * 0.8) * finalOpacity;
            col[i3 + 1] = 0.451 * (1 - t * 0.3) * finalOpacity;
            col[i3 + 2] = (0.086 + t * 0.2) * finalOpacity;
          }

          posAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;
          fragmentParticlesRef.current.visible = phase3Progress < 1;
        }

        // Outer glow expands and fades
        if (glowRef.current) {
          glowRef.current.scale.setScalar((1.25 + phase3Progress * 0.75) * easeOutQuad(phase3Progress));
          const mat = glowRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.08 * (1 - phase3Progress);
        }
      }
    } else if (!isCollapsingRef.current) {
      // Normal state: glow pulse and hover effects
      if (meshRef.current) {
        // Scale expansion on hover
        const targetScale = isHoveredRef.current ? 1.1 : 1.0;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
      }

      if (glowRef.current) {
        const baseScale = isHoveredRef.current ? 1.5 : 1.25;
        const pulse = isHoveredRef.current ? Math.sin(time * 5) * 0.15 : Math.sin(time * 1.5) * 0.05;
        glowRef.current.scale.setScalar(baseScale + pulse);

        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = isHoveredRef.current ? 0.18 : 0.08;
      }

      // Hide collapse elements
      if (flashSphereRef.current) flashSphereRef.current.visible = false;
      if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
      if (fragmentParticlesRef.current) fragmentParticlesRef.current.visible = false;
    }

    // Reset collapse when animation finishes
    if (isCollapsingRef.current && collapseProgress >= 1) {
      isCollapsingRef.current = false;
    }

    // Targeting brackets visibility and rotation
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current && !isCollapsingRef.current;
      if (isHoveredRef.current) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Fire trail - emits from local origin, drifts backward */}
      <AsteroidTrail count={80} spread={size * 0.35} size={size * 0.06} />

      {/* Outer emissive glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main asteroid body with custom shader */}
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
          emissiveStrength={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Flash sphere - white flash during impact (phase 1) */}
      <mesh ref={flashSphereRef} visible={false}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shockwave ring - expands and fades during phase 2 */}
      <mesh
        ref={shockwaveRingRef}
        visible={false}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[size * 1.2, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#ff5733"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Fragment particles - burst outward during phase 2-3 */}
      <points
        ref={fragmentParticlesRef}
        geometry={fragmentParticleSystem.geometry}
        visible={false}
      >
        <pointsMaterial
          size={size * 0.15}
          vertexColors
          transparent
          opacity={1}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Fragment particle trail - 70% brightness and size */}
      <points
        ref={trailParticlesRef}
        geometry={trailParticleSystem.geometry}
        visible={false}
      >
        <pointsMaterial
          size={size * 0.1}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Sci-fi corner targeting brackets */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color={color} opacity={0.8} transparent />
        </lineSegments>
        {/* Scan ring - torus rotating around asteroid */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.4, 0.02, 8, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
