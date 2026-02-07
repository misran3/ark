'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IonStormProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Ion Storm threat visual: represents budget overspending surges.
 *
 * Features:
 * - 350 particles in vortex formation with purple-to-pink vertex colors
 * - Animated lightning arcs (always-on, intensify on hover)
 * - Outer nebula glow sphere with additive blending
 * - Core glow with pulsing intensity
 * - Targeting brackets on hover
 * - Point light for local illumination
 */
export default function IonStorm({
  position,
  size = 1.5,
  color = '#a855f7',
  onHover,
  onClick,
}: IonStormProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const arcsRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);

  // Particle system with vertex colors
  const particleSystem = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const orbitRadii = new Float32Array(count);
    const orbitAngles = new Float32Array(count);
    const orbitSpeeds = new Float32Array(count);
    const verticalOffsets = new Float32Array(count);

    const purpleColor = new THREE.Color('#a855f7');
    const pinkColor = new THREE.Color('#ec4899');

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      orbitRadii[i] = radius;
      orbitAngles[i] = theta;
      orbitSpeeds[i] = 0.3 + Math.random() * 0.7;
      verticalOffsets[i] = (Math.random() - 0.5) * size * 0.6;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Purple at center, pink at outer edge
      const t = radius / size;
      const particleColor = new THREE.Color().lerpColors(purpleColor, pinkColor, t);
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, positions, colors, count, orbitRadii, orbitAngles, orbitSpeeds, verticalOffsets };
  }, [size]);

  // Lightning arc geometry (6 arcs)
  const arcData = useMemo(() => {
    const arcCount = 6;
    const segmentsPerArc = 8;
    const arcs: Float32Array[] = [];

    for (let a = 0; a < arcCount; a++) {
      arcs.push(new Float32Array(segmentsPerArc * 2 * 3));
    }
    return { arcs, arcCount, segmentsPerArc };
  }, []);

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
      particleSystem.geometry.dispose();
      bracketGeometry.dispose();
    };
  }, [particleSystem.geometry, bracketGeometry]);

  const handlePointerOver = useCallback(() => {
    isHoveredRef.current = true;
    onHover?.(true);
  }, [onHover]);

  const handlePointerOut = useCallback(() => {
    isHoveredRef.current = false;
    onHover?.(false);
  }, [onHover]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !particlesRef.current) return;

    const time = clock.getElapsedTime();

    // Vortex rotation
    groupRef.current.rotation.y += 0.008;
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.15;

    // Animate particles in vortex pattern
    const posAttr = particlesRef.current.geometry.attributes.position;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < particleSystem.count; i++) {
      const i3 = i * 3;

      // Update orbit angle (faster near center = vortex)
      const speedMultiplier = 1 - (particleSystem.orbitRadii[i] / size) * 0.6;
      particleSystem.orbitAngles[i] += particleSystem.orbitSpeeds[i] * speedMultiplier * delta;

      const angle = particleSystem.orbitAngles[i];
      const radius = particleSystem.orbitRadii[i];
      const vertOff = particleSystem.verticalOffsets[i];

      // Vortex: particles orbit in XZ plane with Y offset + turbulence
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = vertOff + Math.sin(time * 2 + i * 0.1) * size * 0.08;
      pos[i3 + 2] = Math.sin(angle) * radius;
    }
    posAttr.needsUpdate = true;

    // Core glow pulse
    if (coreGlowRef.current) {
      const basePulse = Math.sin(time * 3) * 0.15 + 0.85;
      const mat = coreGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHoveredRef.current ? 0.5 * basePulse : 0.3 * basePulse;
      coreGlowRef.current.scale.setScalar(isHoveredRef.current ? 1.3 : 1.0);
    }

    // Outer glow
    if (outerGlowRef.current) {
      const mat = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHoveredRef.current ? 0.12 : 0.06;
      const glowPulse = Math.sin(time * 1.5) * 0.05;
      outerGlowRef.current.scale.setScalar(1.0 + glowPulse);
    }

    // Animated lightning arcs
    if (arcsRef.current) {
      const arcOpacity = isHoveredRef.current ? 0.6 : 0.2;

      arcsRef.current.children.forEach((child, arcIndex) => {
        if (!(child instanceof THREE.LineSegments)) return;

        const arcPos = child.geometry.attributes.position.array as Float32Array;
        const segCount = arcData.segmentsPerArc;

        // Generate new arc path occasionally for flickering effect
        if (Math.random() < 0.3) {
          const startTheta = (arcIndex / arcData.arcCount) * Math.PI * 2 + time * 0.5;
          const startRadius = size * (0.2 + Math.random() * 0.3);
          const endRadius = size * (0.6 + Math.random() * 0.4);
          const endTheta = startTheta + (Math.random() - 0.5) * Math.PI;

          for (let s = 0; s < segCount; s++) {
            const t = s / (segCount - 1);
            const nextT = (s + 1) / segCount;

            const r1 = startRadius + (endRadius - startRadius) * t;
            const a1 = startTheta + (endTheta - startTheta) * t;
            const jitter1 = (Math.random() - 0.5) * size * 0.15;

            const r2 = startRadius + (endRadius - startRadius) * nextT;
            const a2 = startTheta + (endTheta - startTheta) * nextT;
            const jitter2 = (Math.random() - 0.5) * size * 0.15;

            const idx = s * 6;
            arcPos[idx] = Math.cos(a1) * r1 + jitter1;
            arcPos[idx + 1] = (Math.random() - 0.5) * size * 0.3;
            arcPos[idx + 2] = Math.sin(a1) * r1 + jitter1;
            arcPos[idx + 3] = Math.cos(a2) * r2 + jitter2;
            arcPos[idx + 4] = (Math.random() - 0.5) * size * 0.3;
            arcPos[idx + 5] = Math.sin(a2) * r2 + jitter2;
          }
          child.geometry.attributes.position.needsUpdate = true;
        }

        const mat = child.material as THREE.LineBasicMaterial;
        mat.opacity = arcOpacity * (0.5 + Math.random() * 0.5);
      });
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current;
      if (isHoveredRef.current) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }

    // Hover scale
    const targetScale = isHoveredRef.current ? 1.1 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5
    );
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Particle vortex cloud */}
      <points
        ref={particlesRef}
        geometry={particleSystem.geometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Core glow */}
      <mesh ref={coreGlowRef}>
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer nebula glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[size * 1.4, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Animated lightning arcs */}
      <group ref={arcsRef}>
        {Array.from({ length: arcData.arcCount }).map((_, i) => (
          <lineSegments key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[arcData.arcs[i], 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ec4899"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        ))}
      </group>

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

      {/* Point light for local illumination */}
      <pointLight
        color={color}
        intensity={0.8}
        distance={size * 6}
        decay={2}
      />
    </group>
  );
}
