'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial, Text, Billboard } from '@react-three/drei';
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
 * - Depth illusion: darkening toward center for tunnel effect
 */
const PortalSwirlMaterial = shaderMaterial(
  {
    time: 0,
    timeMultiplier: 1.0, // Hover state acceleration
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
    uniform float timeMultiplier;
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
      // Creates hypnotic swirling effect, accelerated on hover
      float spiral = angle + dist * 10.0 - time * timeMultiplier * 0.5;
      float pattern = sin(spiral * 5.0) * 0.5 + 0.5;

      // Additional wave layer for complexity
      float wave = sin(angle * 3.0 + time * timeMultiplier * 0.3) * cos(dist * 6.28 - time * timeMultiplier * 0.2);
      pattern = mix(pattern, wave * 0.5 + 0.5, 0.3);

      // Gradient mixing: blue to darker blue with iridescent hints
      vec3 color = mix(color1, color2, pattern);

      // Iridescent sheen: appears strongest at medium distances
      float iridFactor = sin(dist * 3.14159) * 0.5 + 0.5; // bell curve
      color = mix(color, color3, iridFactor * 0.2 * (sin(time * timeMultiplier * 0.5) * 0.5 + 0.5));

      // Depth illusion: darken toward center to create tunnel effect
      float depthFalloff = smoothstep(0.0, 0.3, dist);
      color *= (0.5 + depthFalloff * 0.5); // Darkens toward center

      // Fade at edges (circular mask from center)
      // Smooth falloff from full opacity to fully transparent
      float alpha = smoothstep(0.5, 0.3, dist);

      // Add subtle brightness pulse
      float pulse = sin(time * timeMultiplier * 1.5) * 0.1 + 0.9;
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
 * - Shimmering torus ring (portal rim) with targeting brackets on hover
 * - Animated portal surface with spiral shader (accelerates on hover)
 * - Through-portal vision: ghostly lost reward text floating inside portal
 * - Orbiting edge ripple particles with faint trails
 * - Particle trail effect for visual richness
 * - Slow tumble rotation on 2 axes
 * - Enhanced hover state: 20% scale expansion, faster particle orbit, shader acceleration
 * - Multi-phase collapse animation (1.8s total): swirl → scatter → fade
 * - Outer glow with dynamic pulsation
 * - Depth illusion shader (darkening toward center)
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
  const flashRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const trailParticlesRef = useRef<THREE.Points>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const throughPortalRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartRef = useRef(0);
  const particleTrailRef = useRef<Float32Array | null>(null);
  const particlePrevPosRef = useRef<Float32Array | null>(null);

  // Create edge ripple particles that orbit around the portal rim
  const particleSystem = useMemo(() => {
    const count = 50; // 40-60 particles for shimmer effect
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const trailPositions = new Float32Array(count * 3); // For trail effect

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

      // Initialize trail positions same as main positions
      trailPositions[i * 3] = x;
      trailPositions[i * 3 + 1] = y;
      trailPositions[i * 3 + 2] = z;
    }

    // Store trail positions for particle trail effect
    particleTrailRef.current = trailPositions;
    particlePrevPosRef.current = new Float32Array(positions);

    return { positions, angles, count, outerRadius, rimHeight };
  }, [size]);

  // Pre-compute targeting bracket geometry (blue variant for wormhole)
  const bracketGeometry = useMemo(() => {
    const s = size * 2.2; // bracket extent around portal
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

  // Dispose of geometry on unmount
  useEffect(() => {
    return () => {
      bracketGeometry.dispose();
    };
  }, [bracketGeometry]);

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
    const collapseDuration = 1.8; // Multi-phase collapse over 1800ms

    // Calculate collapse progress (0 to 1 over 1800ms)
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
    // Update portal shader time uniform with acceleration on hover
    if (materialRef.current) {
      materialRef.current.time = time;
      // Accelerate on hover OR during collapse
      const collapseShaderBoost = isCollapsingRef.current ? 3.0 : 1.0;
      materialRef.current.timeMultiplier = (isHoveredRef.current ? 2.0 : 1.0) * collapseShaderBoost;
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

      // Multi-phase collapse animation:
      // Phase 1 (0-0.28): Swirl accelerates, ring starts shrinking
      // Phase 2 (0.28-0.67): Ring contracts, particles change color/scatter
      // Phase 3 (0.67-1.0): Final flash, particles fade completely
      if (collapseProgress > 0) {
        let collapseScale = 1.0;

        if (collapseProgress < 0.28) {
          // Phase 1: gentle shrink (0-20%)
          collapseScale = 1 - collapseProgress * 0.72;
        } else if (collapseProgress < 0.67) {
          // Phase 2: accelerated shrink + squeeze (20%-80%)
          const phase2Progress = (collapseProgress - 0.28) / 0.39;
          collapseScale = (1 - 0.72) - phase2Progress * 0.2; // Shrink to 8% by end
        } else {
          // Phase 3: final fade (80%-100%)
          collapseScale = 0.08 - (collapseProgress - 0.67) * 0.08;
        }

        torusRef.current.scale.setScalar(Math.max(collapseScale, 0.001));
      }
    }

    // ===== EDGE RIPPLE PARTICLES =====
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const material = particlesRef.current.material as THREE.PointsMaterial;

      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;
        const baseAngle = particleSystem.angles[i];

        // Store previous position for trail
        if (particlePrevPosRef.current) {
          particlePrevPosRef.current[i3] = posArray[i3];
          particlePrevPosRef.current[i3 + 1] = posArray[i3 + 1];
          particlePrevPosRef.current[i3 + 2] = posArray[i3 + 2];
        }

        let orbitSpeed = isHoveredRef.current ? 1.5 : 0.8;
        let currentAngle = baseAngle + time * orbitSpeed * 0.5;
        let orbitRadius = particleSystem.outerRadius;
        let rimHeight = particleSystem.rimHeight;

        // Multi-phase collapse particle behavior
        if (collapseProgress > 0) {
          if (collapseProgress < 0.28) {
            // Phase 1: normal orbit continues
            orbitSpeed *= (1 + collapseProgress * 5); // Swirl accelerates
          } else if (collapseProgress < 0.67) {
            // Phase 2: particles change color intensity (gold shimmer) and scatter
            const phase2Progress = (collapseProgress - 0.28) / 0.39;
            orbitSpeed *= (1 + 5); // Maximum speed
            orbitRadius *= (1 + phase2Progress * 1.5); // Radiate outward

            // Vertical scatter
            rimHeight *= (1 + phase2Progress * 2);
          } else {
            // Phase 3: final scatter and fade
            orbitRadius *= (1 + 1.5 + (collapseProgress - 0.67) * 2);
            rimHeight *= (1 + 2 + (collapseProgress - 0.67) * 3);
          }
        }

        // Calculate current particle position
        currentAngle = baseAngle + time * orbitSpeed * 0.5;
        posArray[i3] = Math.cos(currentAngle) * orbitRadius;
        posArray[i3 + 2] = Math.sin(currentAngle) * orbitRadius;

        // Vertical wobble with escape velocity on collapse
        let wobble = Math.sin(time * 2 + i) * rimHeight;
        posArray[i3 + 1] = wobble;

        // Particle opacity and color during collapse
        if (collapseProgress > 0) {
          if (collapseProgress < 0.28) {
            material.opacity = 0.7;
            material.color.setHex(0xffffff);
          } else if (collapseProgress < 0.67) {
            // Phase 2: shift to gold
            const phase2Progress = (collapseProgress - 0.28) / 0.39;
            material.opacity = 0.7;
            material.color.lerpColors(
              new THREE.Color(0xffffff),
              new THREE.Color(0xfbbf24), // Gold
              phase2Progress
            );
          } else {
            // Phase 3: fade to transparent
            const phase3Progress = (collapseProgress - 0.67) / 0.33;
            material.opacity = 0.7 * (1 - phase3Progress);
            material.color.setHex(0xfbbf24); // Stay gold
          }
        } else {
          material.opacity = 0.7;
          material.color.setHex(0xffffff);
        }
      }

      posAttr.needsUpdate = true;
    }

    // ===== PARTICLE TRAIL EFFECT =====
    if (trailParticlesRef.current && particlePrevPosRef.current) {
      const trailAttr = trailParticlesRef.current.geometry.attributes.position;
      const trailArray = trailAttr.array as Float32Array;

      // Copy trail positions from previous frame
      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;
        trailArray[i3] = particlePrevPosRef.current[i3];
        trailArray[i3 + 1] = particlePrevPosRef.current[i3 + 1];
        trailArray[i3 + 2] = particlePrevPosRef.current[i3 + 2];
      }

      trailAttr.needsUpdate = true;
    }

    // ===== THROUGH-PORTAL VISION (LOST REWARD) =====
    if (throughPortalRef.current) {
      // Float upward gently and pulse
      const floatAmount = Math.sin(time * 0.8) * 0.3;
      throughPortalRef.current.position.y = floatAmount;

      // Pulse opacity on hover, dim when not hovering
      const targetOpacity = isHoveredRef.current ? 0.6 : 0.3;
      const pulse = Math.sin(time * 2) * 0.1;
      const opacity = targetOpacity + pulse;

      // Update background halo opacity (first child is mesh)
      if (throughPortalRef.current.children.length > 0) {
        const bgMesh = throughPortalRef.current.children[0] as any;
        if (bgMesh.material) {
          bgMesh.material.opacity = opacity;
        }
      }
    }

    // ===== OUTER GLOW =====
    if (glowRef.current) {
      // Glow pulse more intense and dramatic on hover
      const baseScale = isHoveredRef.current ? 1.5 : 1.2;
      const pulseFreq = isHoveredRef.current ? 1.0 : 0.5; // 1s cycle on hover
      const pulse = isHoveredRef.current
        ? Math.sin(time * pulseFreq * Math.PI) * 0.2
        : Math.sin(time * 0.5) * 0.05;
      glowRef.current.scale.setScalar(baseScale + pulse);

      // Glow opacity
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHoveredRef.current ? 0.3 : 0.12;
    }

    // ===== COLLAPSE FLASH =====
    if (flashRef.current) {
      if (collapseProgress > 0.6 && collapseProgress < 0.85) {
        flashRef.current.visible = true;
        const flashProgress = (collapseProgress - 0.6) / 0.25;
        flashRef.current.scale.setScalar(1 + flashProgress * 3);
        const mat = flashRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - flashProgress) * 0.8;
      } else {
        flashRef.current.visible = false;
      }
    }

    // ===== TARGETING BRACKETS =====
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current;
      if (isHoveredRef.current) {
        // Subtle rotation of brackets for dynamic feel
        bracketsRef.current.rotation.z = time * 0.2;
      }
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

      {/* Through-portal vision: ghostly lost reward visualization */}
      <group ref={throughPortalRef} position={[0, 0, 0.1]}>
        {/* Background halo for text */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2 * size, 32]} />
          <meshBasicMaterial
            color={0x60a5fa}
            transparent
            opacity={0.15}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Lost reward text (example: "+450 pts" / "$13.50") */}
        <Billboard>
          <Text
            position={[0, 0, 0.05]}
            fontSize={0.4 * size}
            color={0x60a5fa}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02 * size}
            outlineColor={0xffffff}
            material-transparent
            material-opacity={0.6}
            material-depthWrite={false}
            material-toneMapped={false}
          >
            +450 pts
          </Text>
        </Billboard>
      </group>

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

      {/* Sci-fi corner targeting brackets (blue variant for wormhole) */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color={color} opacity={0.8} transparent />
        </lineSegments>
      </group>

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

      {/* Particle trail effect - faint blue-white trails */}
      <points ref={trailParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleTrailRef.current || new Float32Array(particleSystem.count * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06 * size}
          color="#a5c5e8"
          transparent
          opacity={0.3}
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

      {/* Blue flash on collapse */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[1.5 * size, 16, 16]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
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
