'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import '@/lib/materials/VolumetricGlowMaterial';
import '@/lib/materials/EnergyFlowMaterial';
import { InstancedParticleSystem } from '@/lib/particles';
import { noiseGLSL, fresnelGLSL, gradientGLSL } from '@/lib/shaders';
import { tubeFromPoints } from '@/lib/utils/geometry';

// ---- Custom Solar Surface Shader Material ----
const SolarSurfaceMaterial = shaderMaterial(
  {
    time: 0,
    emissiveIntensity: 5.0,
  },
  // vertex
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPosition = wp.xyz;
      vViewDir = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  `${noiseGLSL}\n${fresnelGLSL}\n${gradientGLSL}\n` + /* glsl */ `
    uniform float time;
    uniform float emissiveIntensity;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    void main() {
      // Two layers of FBM noise at different speeds for turbulence
      float n1 = fbm(vWorldPosition * 3.0 + vec3(0.0, time * 0.2, 0.0), 4) * 0.5 + 0.5;
      float n2 = fbm(vWorldPosition * 6.0 - vec3(time * 0.15, 0.0, time * 0.1), 3) * 0.5 + 0.5;
      float combined = n1 * 0.6 + n2 * 0.4;

      // 3-stop gradient: white-hot → gold → orange
      vec3 surface = gradient3(
        vec3(0.996, 0.953, 0.78),   // #fef3c7 white-hot
        vec3(0.984, 0.749, 0.141),  // #fbbf24 gold
        vec3(0.976, 0.451, 0.086),  // #f97316 orange
        combined
      );

      // Fresnel rim — white glow
      float rim = fresnel(normalize(vViewDir), normalize(vNormal), 2.0);
      surface += vec3(1.0, 1.0, 0.95) * rim * 0.6;

      // Apply emissive intensity for bloom pickup
      surface *= emissiveIntensity;

      gl_FragColor = vec4(surface, 1.0);
    }
  `
);

extend({ SolarSurfaceMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    solarSurfaceMaterial: any;
  }
}

// ---- Component ----

interface SolarFlareProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

// Generate a parabolic arc path from surface point, arcing outward, returning to surface
function generateProminenceArc(
  solarRadius: number,
  arcIndex: number,
  arcCount: number,
  height: number,
  segments = 12
): THREE.Vector3[] {
  const baseAngle = (arcIndex / arcCount) * Math.PI * 2;
  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = baseAngle + (t - 0.5) * 0.6; // Spread ~0.6 radians
    const r = solarRadius + Math.sin(t * Math.PI) * height;

    pts.push(new THREE.Vector3(
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      Math.sin(t * Math.PI) * height * 0.3, // slight Z curve
    ));
  }

  return pts;
}

/**
 * Solar Flare — "The Radiant Star"
 * 8-layer composition:
 * 1. Outer Corona (VolumetricGlowMaterial, 2.0× size)
 * 2. Mid Corona (VolumetricGlowMaterial, 1.4× size)
 * 3. Solar Surface (custom FBM shader, 0.4× size)
 * 4. Magnetic Field Loop Arcs (TubeGeometry prominences)
 * 5. Corona Particles (InstancedParticleSystem, radiate outward)
 * 6. Volumetric Flare Rays (cone meshes)
 * 7. Countdown Rings (expanding torus)
 * 8. Lens Flare (spheres + anamorphic streaks)
 */
export default function SolarFlare({
  position,
  size = 2,
  color = '#fbbf24',
  onHover,
  onClick,
}: SolarFlareProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outerCoronaRef = useRef<any>(null);
  const midCoronaRef = useRef<any>(null);
  const surfaceRef = useRef<any>(null);
  const surfaceMeshRef = useRef<THREE.Mesh>(null);
  const raysRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const lensFlareRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);

  // Prominence arc tube geometries — regenerate periodically
  const arcTimerRef = useRef(0);
  const [arcGeos, setArcGeos] = useState<THREE.TubeGeometry[]>([]);
  const arcEnergyRefs = useRef<any[]>([]);

  const ARC_COUNT = 7;
  const solarRadius = size * 0.4;

  // Generate initial prominence arcs
  const regenerateArcs = useCallback(() => {
    const newGeos: THREE.TubeGeometry[] = [];
    for (let i = 0; i < ARC_COUNT; i++) {
      const height = (0.5 + Math.random() * 0.7) * size;
      const pts = generateProminenceArc(solarRadius, i, ARC_COUNT, height);
      const geo = tubeFromPoints(pts, 0.03 + Math.random() * 0.03, 20, 5);
      newGeos.push(geo);
    }
    return newGeos;
  }, [solarRadius, size, ARC_COUNT]);

  // Bracket geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.8;
    const len = s * 0.3;
    const points: number[] = [];
    const corners = [[-s, s, 0], [s, s, 0], [s, -s, 0], [-s, -s, 0]];
    const dirs = [
      [[1, 0, 0], [0, -1, 0]], [[-1, 0, 0], [0, -1, 0]],
      [[-1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, 1, 0]],
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

  // Ray angles for volumetric flare rays
  const rayData = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      angle: (i / 10) * Math.PI * 2,
      length: (0.4 + Math.random() * 0.4) * size,
      phase: Math.random() * Math.PI * 2,
    })),
    [size]
  );

  useEffect(() => {
    return () => {
      bracketGeometry.dispose();
      arcGeos.forEach(g => g.dispose());
    };
  }, [bracketGeometry, arcGeos]);

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
    const hovered = isHoveredRef.current;

    // Collapse
    if (isCollapsingRef.current && collapseStartTimeRef.current === 0) {
      collapseStartTimeRef.current = time;
    }
    let cp = 0;
    if (isCollapsingRef.current) {
      cp = Math.min((time - collapseStartTimeRef.current) / 2.5, 1);
    }

    // Slow Z-rotation
    groupRef.current.rotation.z += 0.015;

    // ---- Layer 1 & 2: Corona materials ----
    if (outerCoronaRef.current) outerCoronaRef.current.time = time;
    if (midCoronaRef.current) midCoronaRef.current.time = time;

    // ---- Layer 3: Solar surface shader ----
    if (surfaceRef.current) {
      surfaceRef.current.time = time;
      surfaceRef.current.emissiveIntensity = hovered ? 6.5 : 5.0;
    }

    // ---- Layer 4: Prominence arcs — regenerate every 4 seconds ----
    arcTimerRef.current += delta;
    if (arcTimerRef.current > 4.0) {
      arcTimerRef.current = 0;
      arcGeos.forEach(g => g.dispose());
      setArcGeos(regenerateArcs());
    }

    // Update arc energy flow materials
    arcEnergyRefs.current.forEach(ref => {
      if (ref) ref.time = time;
    });

    // ---- Layer 6: Volumetric Flare Rays ----
    if (raysRef.current) {
      raysRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const data = rayData[i];
        const pulse = Math.sin(time * 2 + data.phase) * 0.3 + 0.7;
        const lengthScale = hovered ? 1.3 : 1.0;
        mesh.scale.y = pulse * lengthScale;
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + pulse * 0.1;
      });
    }

    // ---- Layer 7: Countdown Rings ----
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const ringPhase = (time * 0.5 + i * 0.33) % 1.0;
        mesh.scale.setScalar(1.0 + ringPhase * 0.4);
        (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - ringPhase) * 0.2;
      });
    }

    // ---- Layer 8: Lens Flare ----
    if (lensFlareRef.current) {
      lensFlareRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(time * 2.5 + i * 1.2) * 0.15 + 0.25;
      });
    }

    // ---- Collapse ----
    if (isCollapsingRef.current && cp < 1) {
      if (cp < 0.32) {
        // Phase 1: CME — arcs extend, core goes white, particles accelerate
        const p1 = cp / 0.32;
        if (surfaceRef.current) {
          surfaceRef.current.emissiveIntensity = 5.0 + p1 * 5.0;
        }
        if (surfaceMeshRef.current) {
          surfaceMeshRef.current.scale.setScalar(1 + p1 * 0.3);
        }
      } else if (cp < 0.68) {
        // Phase 2: Collapse — core shrinks, arcs retract
        const p2 = (cp - 0.32) / 0.36;
        if (surfaceMeshRef.current) {
          surfaceMeshRef.current.scale.setScalar(1.3 * (1 - p2 * 0.9));
        }
        if (surfaceRef.current) {
          surfaceRef.current.emissiveIntensity = 10.0 * (1 - p2);
        }
      } else {
        // Phase 3: Afterglow — everything fades
        const p3 = (cp - 0.68) / 0.32;
        if (outerCoronaRef.current) outerCoronaRef.current.opacity = (1 - p3);
        if (midCoronaRef.current) midCoronaRef.current.opacity = (1 - p3);
        if (surfaceMeshRef.current) surfaceMeshRef.current.visible = false;
      }
    }

    // Reset
    if (isCollapsingRef.current && cp >= 1) {
      isCollapsingRef.current = false;
      if (surfaceMeshRef.current) {
        surfaceMeshRef.current.visible = true;
        surfaceMeshRef.current.scale.setScalar(1);
      }
      if (surfaceRef.current) surfaceRef.current.emissiveIntensity = 5.0;
      if (outerCoronaRef.current) outerCoronaRef.current.opacity = 1.0;
      if (midCoronaRef.current) midCoronaRef.current.opacity = 1.0;
    }

    // Brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = hovered && cp === 0;
      if (hovered) bracketsRef.current.rotation.z = time * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* ===== Layer 1: Outer Corona ===== */}
      <mesh>
        <sphereGeometry args={[size * 2.0, 24, 24]} />
        <volumetricGlowMaterial
          ref={outerCoronaRef}
          color="#fbbf24"
          noiseScale={1.5}
          noiseSpeed={0.3}
          rimPower={1.5}
          glowStrength={0.3}
          opacity={1.0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 2: Mid Corona ===== */}
      <mesh>
        <sphereGeometry args={[size * 1.4, 24, 24]} />
        <volumetricGlowMaterial
          ref={midCoronaRef}
          color="#f97316"
          noiseScale={2.5}
          noiseSpeed={0.6}
          rimPower={2.0}
          glowStrength={0.5}
          opacity={1.0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 3: Solar Surface ===== */}
      <mesh
        ref={surfaceMeshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[solarRadius, 32, 32]} />
        <solarSurfaceMaterial
          ref={surfaceRef}
          key={SolarSurfaceMaterial.key}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 4: Magnetic Field Loop Arcs (prominences) ===== */}
      {arcGeos.map((geo, i) => (
        <mesh key={`arc-${i}`} geometry={geo}>
          <energyFlowMaterial
            ref={(el: any) => { if (el) arcEnergyRefs.current[i] = el; }}
            color1="#fbbf24"
            color2="#fef3c7"
            flowSpeed={2.0}
            stripeCount={4.0}
            opacity={0.7}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ===== Layer 5: Corona Particles ===== */}
      <InstancedParticleSystem
        count={250}
        color="#fef3c7"
        colorEnd="#f97316"
        size={0.08}
        lifespan={[1.5, 3.0]}
        velocityMin={[-0.3, -0.3, -0.3]}
        velocityMax={[0.3, 0.3, 0.3]}
        spawnRadius={solarRadius * 1.2}
        emitRate={100}
        loop
      />

      {/* ===== Layer 6: Volumetric Flare Rays ===== */}
      <group ref={raysRef}>
        {rayData.map((data, i) => (
          <mesh
            key={`ray-${i}`}
            position={[
              Math.cos(data.angle) * (solarRadius + data.length * 0.5),
              Math.sin(data.angle) * (solarRadius + data.length * 0.5),
              0,
            ]}
            rotation={[0, 0, data.angle - Math.PI / 2]}
          >
            <coneGeometry args={[0.02, data.length, 4, 1, true]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* ===== Layer 7: Countdown Rings ===== */}
      <group ref={ringsRef}>
        {[1.0, 1.2, 1.4].map((scale, i) => (
          <mesh key={`ring-${i}`} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * scale, 0.02, 8, 48]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* ===== Layer 8: Lens Flare ===== */}
      <group ref={lensFlareRef}>
        {/* 4 cardinal dots */}
        {[
          [size * 1.2, 0, 0],
          [-size * 1.2, 0, 0],
          [0, size * 1.2, 0],
          [0, -size * 1.2, 0],
        ].map((pos, i) => (
          <mesh key={`lens-dot-${i}`} position={pos as [number, number, number]}>
            <sphereGeometry args={[size * 0.06, 8, 8]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        {/* 2 anamorphic streaks (thin wide planes) */}
        <mesh rotation={[0, 0, 0]}>
          <planeGeometry args={[size * 3, size * 0.04]} />
          <meshBasicMaterial
            color="#fef3c7"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[size * 2.5, size * 0.03]} />
          <meshBasicMaterial
            color="#fef3c7"
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Flash sphere (collapse) */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
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
    </group>
  );
}
