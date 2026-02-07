'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import AsteroidTrail from './AsteroidTrail';
import './AsteroidMaterial';

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

  // Dispose geometries on unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      geometry.dispose();
      bracketGeometry.dispose();
    };
  }, [geometry, bracketGeometry]);

  const handlePointerOver = useCallback(() => {
    isHoveredRef.current = true;
    onHover?.(true);
  }, [onHover]);

  const handlePointerOut = useCallback(() => {
    isHoveredRef.current = false;
    onHover?.(false);
  }, [onHover]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    // Tumbling rotation with per-asteroid angular velocity
    if (meshRef.current) {
      meshRef.current.rotation.x += angularVelocity[0] * delta;
      meshRef.current.rotation.y += angularVelocity[1] * delta;
      meshRef.current.rotation.z += angularVelocity[2] * delta;
    }

    // Update shader time uniform
    if (materialRef.current) {
      materialRef.current.time = time;
    }

    // Glow pulse
    if (glowRef.current) {
      const baseScale = isHoveredRef.current ? 1.5 : 1.25;
      const pulse = isHoveredRef.current ? Math.sin(time * 5) * 0.15 : Math.sin(time * 1.5) * 0.05;
      glowRef.current.scale.setScalar(baseScale + pulse);

      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHoveredRef.current ? 0.18 : 0.08;
    }

    // Targeting brackets visibility and rotation
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current;
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
        onClick={onClick}
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
