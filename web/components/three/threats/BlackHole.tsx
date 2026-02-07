'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easeInQuad, easeOutQuad } from '@/lib/easing';

interface BlackHoleProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Black Hole threat visual: represents debt spirals and compounding interest.
 *
 * Features:
 * - Event horizon (perfectly black void sphere)
 * - Accretion disk (400-600 particles spiraling inward with Purple→Blue gradient)
 * - Outer glow (subtle Hawking radiation)
 * - Hover state: intensified disk + targeting brackets
 * - Click interaction: singularity collapse animation (accretion disk reversal + implosion)
 *
 * The accretion disk particles follow a logarithmic spiral inward, with speed
 * increasing as they approach the event horizon. Particles fade as they reach
 * the event horizon and respawn at the outer edge.
 */
export default function BlackHole({
  position,
  size = 1.5,
  color = '#4c1d95', // Purple-600
  onHover,
  onClick,
}: BlackHoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const eventHorizonRef = useRef<THREE.Mesh>(null);
  const accretionDiskRef = useRef<THREE.Points>(null);
  const isHoveredRef = useRef(false);
  const bracketsRef = useRef<THREE.Group>(null);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);

  // Event horizon radius (based on threat size)
  const eventHorizonRadius = size * 0.8;
  const diskOuterRadius = eventHorizonRadius * 1.5;
  const diskThickness = 0.3;

  // Create accretion disk particle system
  const particleSystem = useMemo(() => {
    const count = Math.floor(400 + Math.random() * 200); // 400-600 particles
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const spiralAngles = new Float32Array(count);
    const spiralRadii = new Float32Array(count);

    // Purple (#4c1d95) to Blue (#1e3a8a) gradient
    const purpleColor = new THREE.Color('#4c1d95');
    const blueColor = new THREE.Color('#1e3a8a');

    for (let i = 0; i < count; i++) {
      // Initialize particles at outer disk edge in logarithmic spiral
      spiralAngles[i] = Math.random() * Math.PI * 2;
      spiralRadii[i] = diskOuterRadius;

      // Position particles in a flat disk (small thickness variation)
      const angle = spiralAngles[i];
      const radius = spiralRadii[i];
      const y = (Math.random() - 0.5) * diskThickness;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Initialize velocities for spiral motion (will be updated per frame)
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      // Color gradient: outer = purple, inner = blue
      const colorLerp = 1 - (radius / diskOuterRadius) * 0.5;
      const particleColor = new THREE.Color().lerpColors(blueColor, purpleColor, colorLerp);
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }

    // Create geometry with attributes
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, positions, colors, velocities, count, spiralAngles, spiralRadii };
  }, [eventHorizonRadius, diskOuterRadius, diskThickness]);

  // Pre-compute targeting bracket geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.8;
    const len = s * 0.35;
    const points: number[] = [];

    const corners = [
      [-s, s, 0],
      [s, s, 0],
      [s, -s, 0],
      [-s, -s, 0],
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

  // Dispose geometries on unmount
  useEffect(() => {
    return () => {
      bracketGeometry.dispose();
      particleSystem.geometry.dispose();
    };
  }, [bracketGeometry, particleSystem.geometry]);

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
    if (!groupRef.current || !accretionDiskRef.current) return;

    const time = clock.getElapsedTime();
    const elapsedTime = time - collapseStartTimeRef.current;

    // Update particle positions for accretion disk
    const posAttr = accretionDiskRef.current.geometry.attributes.position;
    const colorAttr = accretionDiskRef.current.geometry.attributes.color;
    const pos = posAttr.array as Float32Array;
    const col = colorAttr.array as Float32Array;

    // If collapsing, animate the collapse sequence (0-3s total)
    if (isCollapsingRef.current && elapsedTime < 3.0) {
      const progress = elapsedTime / 3.0; // 0 to 1

      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;

        if (progress < 0.5) {
          // Phase 1 (0-0.5s): Particles spiral outward and color shifts purple->gold
          const phase1Progress = progress / 0.5;
          const angle = particleSystem.spiralAngles[i] + phase1Progress * Math.PI * 4;
          const radius = diskOuterRadius + phase1Progress * diskOuterRadius * 0.5;

          pos[i3] = Math.cos(angle) * radius;
          pos[i3 + 2] = Math.sin(angle) * radius;

          // Color shift: purple/blue -> gold
          const goldColor = new THREE.Color('#fbbf24');
          const blueColor = new THREE.Color('#1e3a8a');
          const mixedColor = new THREE.Color().lerpColors(blueColor, goldColor, phase1Progress);
          col[i * 3] = mixedColor.r;
          col[i * 3 + 1] = mixedColor.g;
          col[i * 3 + 2] = mixedColor.b;
        } else {
          // Phase 2 (0.5-1.0s): Particles collapse inward toward center
          const phase2Progress = (progress - 0.5) / 0.5;
          const angle = particleSystem.spiralAngles[i] + (0.5 * Math.PI * 4 + phase2Progress * Math.PI * 6);
          const radius = diskOuterRadius * (1 - phase2Progress * 0.95);

          pos[i3] = Math.cos(angle) * radius;
          pos[i3 + 2] = Math.sin(angle) * radius;

          // Fade gold particles
          const goldColor = new THREE.Color('#fbbf24');
          col[i * 3] = goldColor.r * (1 - phase2Progress);
          col[i * 3 + 1] = goldColor.g * (1 - phase2Progress);
          col[i * 3 + 2] = goldColor.b * (1 - phase2Progress);
        }
      }

      // Shrink event horizon during collapse
      if (eventHorizonRef.current) {
        const horizonScale = 1 - (elapsedTime / 1.5) * 0.75;
        eventHorizonRef.current.scale.setScalar(Math.max(0.1, horizonScale));

        // Add blue glow edge to event horizon during collapse
        const glowIntensity = (elapsedTime / 3.0) * 0.3;
        const glowMaterial = eventHorizonRef.current.material as THREE.MeshBasicMaterial;
        // Use HSL to brighten color during collapse (creates glow effect)
        glowMaterial.color.setHSL(0.65, 1, Math.min(0.4, 0.2 + glowIntensity));
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    } else if (!isCollapsingRef.current) {
      // Normal spiral motion (not collapsing)
      const purpleColor = new THREE.Color('#4c1d95');
      const blueColor = new THREE.Color('#1e3a8a');

      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;

        // Current radius and angle
        let radius = particleSystem.spiralRadii[i];
        let angle = particleSystem.spiralAngles[i];

        // Logarithmic spiral inward
        // Particles spiral faster as they approach center
        const speedFactor = 1 - radius / diskOuterRadius; // 0 at outer edge, 1 at center
        const spiralSpeed = 0.3 + speedFactor * 0.7; // Speed increases toward center
        const inwardSpeed = 0.8 + speedFactor * 0.5; // Inward acceleration

        // Update angle (rotation around disk)
        angle += spiralSpeed * delta;
        particleSystem.spiralAngles[i] = angle;

        // Update radius (spiral inward)
        radius -= inwardSpeed * delta;

        // Respawn at outer edge if reached inner radius
        if (radius < eventHorizonRadius * 1.1) {
          radius = diskOuterRadius;
          angle = Math.random() * Math.PI * 2;
          particleSystem.spiralAngles[i] = angle;
        }

        particleSystem.spiralRadii[i] = radius;

        // Update position in flat disk
        const y = (Math.random() - 0.5) * diskThickness * 0.1; // Small Y variation
        pos[i3] = Math.cos(angle) * radius;
        pos[i3 + 1] = y;
        pos[i3 + 2] = Math.sin(angle) * radius;

        // Update color: outer = purple, inner = blue
        const colorLerp = 1 - (radius / diskOuterRadius) * 0.5;
        const particleColor = new THREE.Color().lerpColors(blueColor, purpleColor, colorLerp);
        col[i3] = particleColor.r;
        col[i3 + 1] = particleColor.g;
        col[i3 + 2] = particleColor.b;
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Reset event horizon if it was scaled down
      if (eventHorizonRef.current) {
        eventHorizonRef.current.scale.setScalar(1);
        const glowMaterial = eventHorizonRef.current.material as THREE.MeshBasicMaterial;
        glowMaterial.color.setHex(0x000000);
      }
    }

    // Targeting brackets visibility and rotation
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current && !isCollapsingRef.current;
      if (isHoveredRef.current) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }

    // Gentle rotation of entire group
    if (!isCollapsingRef.current) {
      groupRef.current.rotation.z += 0.001;
    }

    // When collapse finishes, remove the component
    if (isCollapsingRef.current && elapsedTime >= 3.0) {
      // Could emit callback here to remove threat from scene
      // For now, keep it visible but stop animation
      isCollapsingRef.current = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Accretion disk - particles spiraling inward */}
      <points
        ref={accretionDiskRef}
        geometry={particleSystem.geometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Event horizon - pure black void sphere */}
      <mesh
        ref={eventHorizonRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[eventHorizonRadius, 32, 32]} />
        <meshBasicMaterial
          color={0x000000}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow - Hawking radiation (subtle blue glow) */}
      <mesh>
        <sphereGeometry args={[eventHorizonRadius * 1.3, 16, 16]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sci-fi corner targeting brackets - visible on hover */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color="#ef4444" opacity={0.8} transparent />
        </lineSegments>
        {/* Pulsing warning ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.6, 0.02, 8, 32]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Subtle point light for Hawking radiation glow */}
      <pointLight
        color="#3b82f6"
        intensity={0.15}
        distance={eventHorizonRadius * 4}
      />
    </group>
  );
}
