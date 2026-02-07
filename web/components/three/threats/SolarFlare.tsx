'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SolarFlareProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Solar Flare threat visual: represents upcoming charges and auto-renewals.
 *
 * Features:
 * - Radiant core with pulsing opacity
 * - Corona particle system (120 particles radiating outward)
 * - Multiple expanding wave rings (countdown rings)
 * - Animated flare rays with length variation
 * - Outer glow with pulse
 * - Targeting brackets on hover
 * - Point light for local illumination
 */
export default function SolarFlare({
  position,
  size = 2,
  color = '#fbbf24',
  onHover,
  onClick,
}: SolarFlareProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Points>(null);
  const raysRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);

  // Corona particle system
  const coronaSystem = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    const maxRadii = new Float32Array(count);

    const goldColor = new THREE.Color('#fbbf24');
    const orangeColor = new THREE.Color('#f97316');
    const whiteColor = new THREE.Color('#fef3c7');

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = size * 0.3 + Math.random() * size * 0.7;
      speeds[i] = 0.3 + Math.random() * 0.5;
      maxRadii[i] = size * (1.0 + Math.random() * 0.8);

      const angle = angles[i];
      const r = radii[i];
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * size * 0.3;

      // Color gradient: white near core → gold → orange at edge
      const t = (r - size * 0.3) / (size * 0.7);
      let particleColor: THREE.Color;
      if (t < 0.3) {
        particleColor = new THREE.Color().lerpColors(whiteColor, goldColor, t / 0.3);
      } else {
        particleColor = new THREE.Color().lerpColors(goldColor, orangeColor, (t - 0.3) / 0.7);
      }
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, positions, colors, count, radii, angles, speeds, maxRadii };
  }, [size]);

  // Targeting bracket geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.8;
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

  useEffect(() => {
    return () => {
      coronaSystem.geometry.dispose();
      bracketGeometry.dispose();
    };
  }, [coronaSystem.geometry, bracketGeometry]);

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

    // Slow rotation
    groupRef.current.rotation.z += 0.015;

    // Core pulse
    if (coreRef.current) {
      const pulse = Math.sin(time * 3) * 0.2 + 0.8;
      const coreMat = coreRef.current.material as THREE.MeshBasicMaterial;
      coreMat.opacity = isHoveredRef.current ? pulse : pulse * 0.8;
      const coreScale = isHoveredRef.current ? 1.2 : 1.0;
      coreRef.current.scale.setScalar(coreScale + Math.sin(time * 4) * 0.05);
    }

    // Animate corona particles — radiate outward, respawn at core
    if (coronaRef.current) {
      const posAttr = coronaRef.current.geometry.attributes.position;
      const colAttr = coronaRef.current.geometry.attributes.color;
      const pos = posAttr.array as Float32Array;
      const col = colAttr.array as Float32Array;

      const goldColor = new THREE.Color('#fbbf24');
      const orangeColor = new THREE.Color('#f97316');
      const whiteColor = new THREE.Color('#fef3c7');

      for (let i = 0; i < coronaSystem.count; i++) {
        // Move outward
        coronaSystem.radii[i] += coronaSystem.speeds[i] * delta;

        // Respawn at core when reaching max
        if (coronaSystem.radii[i] > coronaSystem.maxRadii[i]) {
          coronaSystem.radii[i] = size * 0.3;
          coronaSystem.angles[i] = Math.random() * Math.PI * 2;
          coronaSystem.speeds[i] = 0.3 + Math.random() * 0.5;
        }

        const angle = coronaSystem.angles[i];
        const r = coronaSystem.radii[i];

        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = Math.sin(angle) * r;
        pos[i * 3 + 2] = Math.sin(time + i) * size * 0.05; // Slight Z wobble

        // Update color based on distance
        const t = (r - size * 0.3) / (coronaSystem.maxRadii[i] - size * 0.3);
        let particleColor: THREE.Color;
        if (t < 0.3) {
          particleColor = new THREE.Color().lerpColors(whiteColor, goldColor, t / 0.3);
        } else {
          particleColor = new THREE.Color().lerpColors(goldColor, orangeColor, (t - 0.3) / 0.7);
        }
        col[i * 3] = particleColor.r;
        col[i * 3 + 1] = particleColor.g;
        col[i * 3 + 2] = particleColor.b;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    // Animate flare rays — pulsing length
    if (raysRef.current) {
      raysRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const rayPulse = Math.sin(time * 3 + i * 0.8) * 0.3 + 0.7;
        const hoverBoost = isHoveredRef.current ? 1.3 : 1.0;
        mesh.scale.y = rayPulse * hoverBoost;

        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.2 + rayPulse * 0.15;
      });
    }

    // Animate expanding rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        // Each ring expands and fades on a staggered cycle
        const ringPhase = (time * 0.5 + i * 0.33) % 1.0;
        const ringScale = 0.8 + ringPhase * 0.6;
        mesh.scale.setScalar(ringScale);

        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - ringPhase) * 0.25;
      });
    }

    // Outer glow
    if (outerGlowRef.current) {
      const mat = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHoveredRef.current ? 0.1 : 0.05;
      const glowPulse = Math.sin(time * 2) * 0.05;
      outerGlowRef.current.scale.setScalar(1.0 + glowPulse);
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current;
      if (isHoveredRef.current) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }

    // Hover scale
    const targetScale = isHoveredRef.current ? 1.15 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5
    );
  });

  // Pre-compute ray angles
  const rayAngles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2),
    []
  );

  return (
    <group ref={groupRef} position={position}>
      {/* Radiant core */}
      <mesh
        ref={coreRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner bright core (white-hot center) */}
      <mesh>
        <sphereGeometry args={[size * 0.15, 12, 12]} />
        <meshBasicMaterial
          color="#fef3c7"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corona particles */}
      <points ref={coronaRef} geometry={coronaSystem.geometry}>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Animated flare rays */}
      <group ref={raysRef}>
        {rayAngles.map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * size * 0.7,
              Math.sin(angle) * size * 0.7,
              0,
            ]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <coneGeometry args={[0.08, size * 0.6, 4]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Expanding countdown rings */}
      <group ref={ringsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 1.0, 0.03, 8, 48]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Targeting brackets */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color={color} opacity={0.8} transparent />
        </lineSegments>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.6, 0.02, 8, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Point light */}
      <pointLight
        color={color}
        intensity={1.0}
        distance={size * 8}
        decay={2}
      />
    </group>
  );
}
