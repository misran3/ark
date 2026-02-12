'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import '@/lib/materials/VolumetricGlowMaterial';
import '@/lib/materials/EnergyFlowMaterial';
import { InstancedParticleSystem, type ParticleState } from '@/lib/particles';
import { generateLightningPath, tubeFromPoints } from '@/lib/utils/geometry';
import { useConsoleStore } from '@/lib/stores/console-store';

// Pre-allocated reusable temp objects
const _wormholeLerpTarget = new THREE.Vector3();

// ── Portal Swirl Shader (kept + enhanced with depth tinting) ──
const PortalSwirlMaterial = shaderMaterial(
  {
    time: 0,
    timeMultiplier: 1.0,
    depthLayer: 0.0, // 0=front, 1=deepest
    color1: new THREE.Color(0.376, 0.651, 0.98),
    color2: new THREE.Color(0.231, 0.51, 0.961),
    color3: new THREE.Color(0.812, 0.871, 1.0),
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float time;
    uniform float timeMultiplier;
    uniform float depthLayer;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 toCenter = vUv - center;
      float dist = length(toCenter);
      float angle = atan(toCenter.y, toCenter.x);

      // Spiral with depth-dependent speed (deeper layers rotate faster)
      float speedBoost = 1.0 + depthLayer * 0.5;
      float spiral = angle + dist * 10.0 - time * timeMultiplier * 0.5 * speedBoost;
      float pattern = sin(spiral * 5.0) * 0.5 + 0.5;

      float wave = sin(angle * 3.0 + time * timeMultiplier * 0.3)
                  * cos(dist * 6.28 - time * timeMultiplier * 0.2);
      pattern = mix(pattern, wave * 0.5 + 0.5, 0.3);

      vec3 color = mix(color1, color2, pattern);

      // Iridescent sheen
      float iridFactor = sin(dist * 3.14159) * 0.5 + 0.5;
      color = mix(color, color3, iridFactor * 0.2 * (sin(time * timeMultiplier * 0.5) * 0.5 + 0.5));

      // Depth darkening — deeper layers are dimmer (tunnel vanishing point)
      float depthDarken = 1.0 - depthLayer * 0.35;
      color *= depthDarken;

      // Edge fade
      float depthFalloff = smoothstep(0.0, 0.3, dist);
      color *= (0.5 + depthFalloff * 0.5);

      float alpha = smoothstep(0.5, 0.3, dist);
      float pulse = sin(time * timeMultiplier * 1.5) * 0.1 + 0.9;
      alpha *= pulse;

      gl_FragColor = vec4(color, alpha * 0.7);
    }
  `,
);

extend({ PortalSwirlMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    portalSwirlMaterial: any;
  }
}

interface WormholeProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Cinematic wormhole with 7-layer composition:
 * 1. Outer Glow Sphere (VolumetricGlowMaterial)
 * 2. Portal Rim (torus with EnergyFlowMaterial)
 * 3. Portal Surface (2 depth-layered swirl discs — parallax tunnel)
 * 4. Electrical Rim Arcs (generateLightningPath TubeGeometry)
 * 5. Edge Ripple Particles (InstancedParticleSystem orbiting rim)
 * 6. Through-Portal Vision (ghostly icon + Billboard text)
 * 7. Inflow Particle Streams (spiral toward center)
 */
export default function Wormhole({
  position,
  size = 1,
  color = '#60a5fa',
  onHover,
  onClick,
}: WormholeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outerGlowRef = useRef<any>(null);
  const rimRef = useRef<any>(null);
  const torusMeshRef = useRef<THREE.Mesh>(null);
  const portalRefs = useRef<(any | null)[]>([null, null]);
  const throughPortalRef = useRef<THREE.Group>(null);
  const ghostIconRef = useRef<THREE.Mesh>(null);
  const ghostHaloRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartRef = useRef(0);

  const isPanelOpen = useConsoleStore((s) => !!s.expandedPanel);

  // Electrical rim arc geometries (regenerate periodically)
  const frameCountRef = useRef(0);
  const arcGeometriesRef = useRef<THREE.TubeGeometry[]>([]);
  const [arcVersion, setArcVersion] = useState(0);

  const outerRadius = 2.5 * size;

  // Generate rim arc geometries
  const generateArcs = useCallback(() => {
    const arcs: THREE.TubeGeometry[] = [];
    const arcCount = 5;
    for (let a = 0; a < arcCount; a++) {
      const startAngle = Math.random() * Math.PI * 2;
      const arcLength = 0.3 + Math.random() * 0.5; // 30–80% of pi
      const endAngle = startAngle + arcLength;

      const start = new THREE.Vector3(
        Math.cos(startAngle) * outerRadius,
        (Math.random() - 0.5) * 0.4 * size,
        Math.sin(startAngle) * outerRadius,
      );
      const end = new THREE.Vector3(
        Math.cos(endAngle) * outerRadius,
        (Math.random() - 0.5) * 0.4 * size,
        Math.sin(endAngle) * outerRadius,
      );

      const path = generateLightningPath(start, end, 6, 0.3 * size);
      arcs.push(tubeFromPoints(path, 0.01, 16, 4));
    }
    return arcs;
  }, [outerRadius, size]);

  // Dispose old arcs on unmount
  useEffect(() => {
    return () => {
      arcGeometriesRef.current.forEach((g) => g.dispose());
    };
  }, []);

  // Targeting bracket geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 2.2;
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
    return () => { bracketGeometry.dispose(); };
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
    collapseStartRef.current = 0;
    onClick?.();
  }, [onClick]);

  // Edge ripple particles — orbit around torus rim
  const edgeRippleTick = useCallback(
    (data: ParticleState, delta: number, elapsed: number) => {
      const { positions, velocities, count } = data;
      const speed = isHoveredRef.current ? 1.5 : 0.8;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const baseAngle = (i / count) * Math.PI * 2;
        const currentAngle = baseAngle + elapsed * speed * 0.5;

        positions[i3] = Math.cos(currentAngle) * outerRadius;
        positions[i3 + 1] = Math.sin(elapsed * 2 + i) * 0.3 * size;
        positions[i3 + 2] = Math.sin(currentAngle) * outerRadius;

        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
      }
    },
    [outerRadius, size],
  );

  // Inflow particles — spiral inward toward center
  const inflowOrbits = useMemo(() => {
    const angles = new Float32Array(40);
    const radii = new Float32Array(40);
    for (let i = 0; i < 40; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = outerRadius * (0.4 + Math.random() * 0.6);
    }
    return { angles, radii };
  }, [outerRadius]);

  const inflowTick = useCallback(
    (data: ParticleState, delta: number) => {
      const { positions, velocities, count } = data;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let angle = inflowOrbits.angles[i];
        let radius = inflowOrbits.radii[i];

        angle += (1.2 / Math.sqrt(Math.max(radius, 0.1))) * delta;
        radius -= 0.4 * delta;

        if (radius < 0.1) {
          radius = outerRadius * (0.6 + Math.random() * 0.4);
          angle = Math.random() * Math.PI * 2;
        }

        inflowOrbits.angles[i] = angle;
        inflowOrbits.radii[i] = radius;

        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 0.2 * size;
        positions[i3 + 2] = Math.sin(angle) * radius;

        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
      }
    },
    [inflowOrbits, outerRadius, size],
  );

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    if (isPanelOpen && !isCollapsingRef.current) return;
    const time = clock.getElapsedTime();
    const hovered = isHoveredRef.current;

    // Set collapse start time
    if (isCollapsingRef.current && collapseStartRef.current === 0) {
      collapseStartRef.current = time;
    }

    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      collapseProgress = Math.min((time - collapseStartRef.current) / 1.8, 1);
    }

    // Slow tumble
    if (!isCollapsingRef.current) {
      groupRef.current.rotation.x = time * 0.1;
      groupRef.current.rotation.y = time * 0.15;
    }

    // ---- Layer 1: Outer Glow ----
    if (outerGlowRef.current) {
      outerGlowRef.current.time = time;
    }

    // ---- Layer 2: Portal Rim EnergyFlow ----
    if (rimRef.current) {
      rimRef.current.time = time;
    }

    // Torus hover scale
    if (torusMeshRef.current && !isCollapsingRef.current) {
      const targetScale = hovered ? 1.2 : 1.0;
      _wormholeLerpTarget.setScalar(targetScale);
      torusMeshRef.current.scale.lerp(_wormholeLerpTarget, delta * 5);
    }

    // ---- Layer 3: Portal Surface Shaders ----
    for (let layer = 0; layer < 2; layer++) {
      const mat = portalRefs.current[layer];
      if (mat) {
        mat.time = time;
        const collapseBoost = isCollapsingRef.current ? 3.0 : 1.0;
        mat.timeMultiplier = (hovered ? 2.0 : 1.0) * collapseBoost;
      }
    }

    // ---- Layer 4: Regenerate rim arcs ----
    frameCountRef.current++;
    if (frameCountRef.current % 40 === 0) {
      arcGeometriesRef.current.forEach((g) => g.dispose());
      arcGeometriesRef.current = generateArcs();
      setArcVersion((v) => v + 1);
    }

    // ---- Layer 6: Through-portal icon ----
    if (ghostIconRef.current) {
      ghostIconRef.current.rotation.y = time * 0.5;
      ghostIconRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }
    if (throughPortalRef.current) {
      throughPortalRef.current.position.y = Math.sin(time * 0.8) * 0.3;
      // Pulse opacity — direct ref updates instead of traverse()
      const portalOpacity = (hovered ? 0.5 : 0.25) + Math.sin(time * 2) * 0.1;
      if (ghostIconRef.current) {
        (ghostIconRef.current.material as THREE.MeshBasicMaterial).opacity = portalOpacity;
      }
      if (ghostHaloRef.current) {
        (ghostHaloRef.current.material as THREE.MeshBasicMaterial).opacity = portalOpacity;
      }
    }

    // ---- Collapse animation (1.8s) ----
    if (isCollapsingRef.current && collapseProgress < 1) {
      // Phase 1 (0–0.28): Swirl accelerates, rim starts shrinking
      if (collapseProgress < 0.28) {
        const p1 = collapseProgress / 0.28;
        if (torusMeshRef.current) {
          torusMeshRef.current.scale.setScalar(1 - p1 * 0.3);
        }
      }
      // Phase 2 (0.28–0.67): Rim contracts, particles scatter
      else if (collapseProgress < 0.67) {
        const p2 = (collapseProgress - 0.28) / 0.39;
        if (torusMeshRef.current) {
          torusMeshRef.current.scale.setScalar(0.7 - p2 * 0.5);
        }
      }
      // Phase 3 (0.67–1.0): Flash, everything fades
      else {
        const p3 = (collapseProgress - 0.67) / 0.33;
        if (torusMeshRef.current) {
          torusMeshRef.current.scale.setScalar(Math.max(0.01, 0.2 - p3 * 0.2));
        }
        if (flashRef.current) {
          flashRef.current.visible = true;
          flashRef.current.scale.setScalar(1 + p3 * 3);
          (flashRef.current.material as THREE.MeshBasicMaterial).opacity =
            (1 - p3) * 0.8;
        }
        if (outerGlowRef.current) {
          outerGlowRef.current.opacity = (1 - p3) * 0.5;
        }
      }
    }

    // Reset after collapse
    if (isCollapsingRef.current && collapseProgress >= 1) {
      isCollapsingRef.current = false;
      if (torusMeshRef.current) torusMeshRef.current.scale.setScalar(1);
      if (flashRef.current) flashRef.current.visible = false;
      if (outerGlowRef.current) outerGlowRef.current.opacity = 1.0;
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = hovered && !isCollapsingRef.current;
      if (hovered) {
        bracketsRef.current.rotation.z = time * 0.2;
      }
    }
  });

  // Depth layer configs: z-offset, radius scale, rotation speed multiplier
  const depthLayers = useMemo(
    () => [
      { z: 0, radiusScale: 1.0, depth: 0.0 },
      { z: -0.3 * size, radiusScale: 0.4, depth: 1.0 },
    ],
    [size],
  );

  return (
    <group ref={groupRef} position={position}>
      {/* ===== Layer 1: Outer Glow Sphere ===== */}
      <mesh>
        <sphereGeometry args={[3.2 * size, 16, 16]} />
        <volumetricGlowMaterial
          ref={outerGlowRef}
          color={color}
          glowStrength={0.2}
          noiseScale={1.0}
          noiseSpeed={0.3}
          rimPower={2.0}
          opacity={1.0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 2: Portal Rim (torus with EnergyFlow) ===== */}
      <mesh
        ref={torusMeshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <torusGeometry args={[outerRadius, 0.3 * size, 16, 64]} />
        <energyFlowMaterial
          ref={rimRef}
          color1={color}
          color2="#c4b5fd"
          flowSpeed={1.5}
          stripeCount={8.0}
          opacity={0.85}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 3: Portal Surface (2 depth-layered swirl discs) ===== */}
      {depthLayers.map((layer, idx) => (
        <mesh
          key={`portal-layer-${idx}`}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, layer.z, 0]}
        >
          <circleGeometry args={[1.5 * size * layer.radiusScale, 64]} />
          <portalSwirlMaterial
            ref={(ref: any) => {
              portalRefs.current[idx] = ref;
            }}
            depthLayer={layer.depth}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* ===== Layer 4: Electrical Rim Arcs ===== */}
      {arcGeometriesRef.current.map((geo, i) => (
        <mesh key={`arc-${i}-${arcVersion}`} geometry={geo}>
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ===== Layer 5: Edge Ripple Particles ===== */}
      <InstancedParticleSystem
        count={40}
        color="#ffffff"
        size={0.08 * size}
        velocityMin={[0, 0, 0]}
        velocityMax={[0, 0, 0]}
        gravity={[0, 0, 0]}
        lifespan={[5.0, 10.0]}
        emitRate={10}
        spawnRadius={outerRadius}
        loop
        onTick={edgeRippleTick}
      />

      {/* ===== Layer 6: Through-Portal Vision ===== */}
      <group ref={throughPortalRef} position={[0, 0, 0.1]}>
        {/* Ghostly octahedron icon floating inside portal */}
        <mesh ref={ghostIconRef}>
          <octahedronGeometry args={[0.3 * size, 0]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Background halo */}
        <mesh ref={ghostHaloRef} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2 * size, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.15}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Lost reward text */}
        <Billboard>
          <Text
            position={[0, -0.5 * size, 0.05]}
            fontSize={0.35 * size}
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

      {/* ===== Layer 7: Inflow Particle Streams ===== */}
      <InstancedParticleSystem
        count={20}
        color="#a5c5e8"
        colorEnd="#60a5fa"
        size={0.04 * size}
        velocityMin={[0, 0, 0]}
        velocityMax={[0, 0, 0]}
        gravity={[0, 0, 0]}
        lifespan={[3.0, 6.0]}
        emitRate={5}
        spawnRadius={outerRadius}
        loop
        onTick={inflowTick}
      />

      {/* ===== Interaction Overlays ===== */}

      {/* Collapse flash */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[1.5 * size, 16, 16]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Targeting brackets */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color={color} opacity={0.8} transparent />
        </lineSegments>
      </group>
    </group>
  );
}
