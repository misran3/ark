'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface WormholeProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Portal Swirl Shader Material
 * Creates a hypnotic spiral pattern on the portal surface using:
 * - atan2 for spiral angle calculation
 * - length for distance-based gradients
 * - sine waves for animated swirling effect
 * - iridescent color mixing for soap-bubble-like appearance
 */
const PortalSwirlMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color(0.376, 0.651, 0.980), // #60a5fa (light blue)
    color2: new THREE.Color(0.231, 0.510, 0.961), // #3b82f6 (darker blue)
    color3: new THREE.Color(0.812, 0.871, 1.0),   // iridescent white
  },
  // Vertex shader
  /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  /* glsl */ `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;

    void main() {
      // Convert UV to normalized coordinates around center
      vec2 center = vec2(0.5, 0.5);
      vec2 toCenter = vUv - center;

      // Distance from center (0 = center, 1 = edge)
      float dist = length(toCenter);

      // Angle in radians using atan2 (spiral reference angle)
      float angle = atan(toCenter.y, toCenter.x);

      // Spiral pattern: combines angle, distance, and time
      // Creates hypnotic swirling effect
      float spiral = angle + dist * 10.0 - time * 0.5;
      float pattern = sin(spiral * 5.0) * 0.5 + 0.5;

      // Additional wave layer for complexity
      float wave = sin(angle * 3.0 + time * 0.3) * cos(dist * 6.28 - time * 0.2);
      pattern = mix(pattern, wave * 0.5 + 0.5, 0.3);

      // Gradient mixing: blue to darker blue with iridescent hints
      vec3 color = mix(color1, color2, pattern);

      // Iridescent sheen: appears strongest at medium distances
      float iridFactor = sin(dist * 3.14159) * 0.5 + 0.5; // bell curve
      color = mix(color, color3, iridFactor * 0.2 * (sin(time * 0.5) * 0.5 + 0.5));

      // Fade at edges (circular mask from center)
      // Smooth falloff from full opacity to fully transparent
      float alpha = smoothstep(0.5, 0.3, dist);

      // Add subtle brightness pulse
      float pulse = sin(time * 1.5) * 0.1 + 0.9;
      alpha *= pulse;

      gl_FragColor = vec4(color, alpha * 0.7);
    }
  `
);

// Register the custom shader material for JSX
extend({ PortalSwirlMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    portalSwirlMaterial: any;
  }
}

/**
 * Wormhole Threat Component
 * Visualizes missed financial opportunities as ethereal portals.
 *
 * Features:
 * - Shimmering torus ring (portal rim)
 * - Animated portal surface with spiral shader
 * - Orbiting edge ripple particles (40-60 count)
 * - Slow tumble rotation on 2 axes
 * - Hover state: expands 20%, particles orbit faster
 * - Click: portal collapse animation
 * - Outer glow with point light
 */
export default function Wormhole({
  position,
  size = 1,
  color = '#60a5fa',
  onHover,
  onClick,
}: WormholeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartRef = useRef(0);

  // Create edge ripple particles that orbit around the portal rim
  const particleSystem = useMemo(() => {
    const count = 50; // 40-60 particles for shimmer effect
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);

    const outerRadius = 2.5 * size; // Match torus outer radius
    const rimHeight = 0.3 * size;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      angles[i] = angle;

      // Position particles around the torus rim at random heights
      const x = Math.cos(angle) * outerRadius;
      const z = Math.sin(angle) * outerRadius;
      const y = (Math.random() - 0.5) * rimHeight;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    return { positions, angles, count, outerRadius, rimHeight };
  }, [size]);

  // Dispose of geometry on unmount
  useEffect(() => {
    return () => {
      // Cleanup handled by Three.js automatically
    };
  }, []);

  const handlePointerOver = useCallback(() => {
    if (isCollapsingRef.current) return;
    isHoveredRef.current = true;
    onHover?.(true);
  }, [onHover]);

  const handlePointerOut = useCallback(() => {
    isHoveredRef.current = false;
    onHover?.(false);
  }, [onHover]);

  const handleClick = useCallback(() => {
    if (isCollapsingRef.current) return;
    isCollapsingRef.current = true;
    collapseStartRef.current = performance.now();
    onClick?.();
  }, [onClick]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !portalRef.current) return;

    const time = clock.getElapsedTime();
    const collapseDuration = 0.6; // Collapse animation over 600ms

    // Calculate collapse progress (0 to 1 over 600ms)
    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      const elapsed = (performance.now() - collapseStartRef.current) / 1000;
      collapseProgress = Math.min(elapsed / collapseDuration, 1);

      // Reset after collapse completes (could trigger removal)
      if (collapseProgress >= 1) {
        // Component should be removed by parent
      }
    }

    // ===== PORTAL SURFACE SHADER =====
    // Update portal shader time uniform
    if (materialRef.current) {
      materialRef.current.time = time;
    }

    // ===== TORUS RING ANIMATION =====
    if (torusRef.current) {
      // Slow tumble rotation: ~0.1 rad/s on X and Y axes
      groupRef.current.rotation.x = time * 0.1;
      groupRef.current.rotation.y = time * 0.15;

      // On hover: torus scales up 20%
      const targetScale = isHoveredRef.current ? 1.2 : 1.0;
      torusRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 5 // Smooth lerp over 200ms
      );

      // Collapse animation: shrink ring inward
      if (collapseProgress > 0) {
        const collapseScale = 1 - collapseProgress * 0.8; // Shrink to 20% at end
        torusRef.current.scale.multiplyScalar(collapseScale);
      }
    }

    // ===== EDGE RIPPLE PARTICLES =====
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;
        const baseAngle = particleSystem.angles[i];

        // Particle orbital speed increases on hover
        const orbitSpeed = isHoveredRef.current ? 1.5 : 0.8;
        const currentAngle = baseAngle + time * orbitSpeed * 0.5;

        // Radial orbit around torus rim
        const orbitRadius = particleSystem.outerRadius;
        posArray[i3] = Math.cos(currentAngle) * orbitRadius;
        posArray[i3 + 2] = Math.sin(currentAngle) * orbitRadius;

        // Vertical wobble
        posArray[i3 + 1] = Math.sin(time * 2 + i) * particleSystem.rimHeight;

        // On collapse: particles scatter outward
        if (collapseProgress > 0) {
          const scatterAmount = collapseProgress * 3;
          posArray[i3] *= (1 + scatterAmount);
          posArray[i3 + 2] *= (1 + scatterAmount);
          // Fade out during collapse
          (particlesRef.current.material as THREE.PointsMaterial).opacity =
            1 - collapseProgress;
        }
      }

      posAttr.needsUpdate = true;
    }

    // ===== OUTER GLOW =====
    if (glowRef.current) {
      // Glow pulse more intense on hover
      const baseScale = isHoveredRef.current ? 1.4 : 1.2;
      const pulse = isHoveredRef.current
        ? Math.sin(time * 3) * 0.15
        : Math.sin(time) * 0.05;
      glowRef.current.scale.setScalar(baseScale + pulse);

      // Glow opacity
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHoveredRef.current ? 0.25 : 0.12;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Portal surface with swirling shader */}
      <mesh ref={portalRef} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5 * size, 64]} />
        <portalSwirlMaterial
          ref={materialRef}
          key="portal-swirl"
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Torus ring (portal rim) */}
      <mesh
        ref={torusRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <torusGeometry
          args={[
            2.5 * size,      // outerRadius
            0.3 * size,      // tubeRadius
            16,              // radialSegments
            64,              // tubularSegments
          ]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
          metalness={0.6}
          roughness={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Edge ripple particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleSystem.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12 * size}
          color="#ffffff"
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.2 * size, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light for ambient illumination */}
      <pointLight
        color={color}
        intensity={1.2}
        distance={12 * size}
        decay={2}
      />
    </group>
  );
}
