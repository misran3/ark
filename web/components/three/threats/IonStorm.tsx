'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '@/lib/materials/VolumetricGlowMaterial';
import '@/lib/materials/EnergyFlowMaterial';
import { InstancedParticleSystem, type ParticleState } from '@/lib/particles';
import { generateLightningPath, tubeFromPoints, morphTubeToPath } from '@/lib/utils/geometry';
import { useConsoleStore } from '@/lib/stores/console-store';

interface IonStormProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

// Nebula cloud sphere config
interface CloudSphere {
  radiusMult: number;
  noiseScale: number;
  color: string;
  orbitSpeed: number;
  orbitPhase: number;
  glowStrength: number;
}

const CLOUD_CONFIGS: CloudSphere[] = [
  { radiusMult: 0.5, noiseScale: 1.5, color: '#a855f7', orbitSpeed: 0.3, orbitPhase: 0, glowStrength: 0.5 },
  { radiusMult: 0.7, noiseScale: 2.5, color: '#ec4899', orbitSpeed: 0.5, orbitPhase: 2.5, glowStrength: 0.45 },
  { radiusMult: 0.9, noiseScale: 3.5, color: '#c084fc', orbitSpeed: 0.45, orbitPhase: 5.0, glowStrength: 0.4 },
];

const OUTER_ARC_COUNT = 8;
const CORE_ARC_COUNT = 4;

/**
 * Ion Storm — "The Electric Maelstrom"
 * 6-layer composition:
 * 1. Outer Electromagnetic Field (VolumetricGlowMaterial)
 * 2. Volumetric Nebula Cloud (3 overlapping spheres)
 * 3. Core Energy Sphere (custom FBM shader)
 * 4. Lightning Arc System (TubeGeometry via generateLightningPath)
 * 5. Vortex Particles + Electric Sparks
 * 6. Energy Shield Rings (EnergyFlowMaterial)
 */
export default function IonStorm({
  position,
  size = 1.5,
  color = '#a855f7',
  onHover,
  onClick,
}: IonStormProps) {
  const groupRef = useRef<THREE.Group>(null);
  const emFieldRef = useRef<any>(null);
  const emFieldMeshRef = useRef<THREE.Mesh>(null);
  const cloudRefs = useRef<(any)[]>([]);
  const cloudMeshRefs = useRef<THREE.Mesh[]>([]);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerArcsGroupRef = useRef<THREE.Group>(null);
  const coreArcsGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<any>(null);
  const ring2Ref = useRef<any>(null);
  const ring1MeshRef = useRef<THREE.Mesh>(null);
  const ring2MeshRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);

  const isPanelOpen = useConsoleStore((s) => !!s.expandedPanel);

  // Frame counter for arc regeneration
  const frameCountRef = useRef(0);

  // Lightning arc mesh refs (geometry is pre-generated, morphed in-place)
  const outerArcMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const coreArcMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Targeting bracket geometry
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

  // Pre-generate arc geometries ONCE — will morph in place
  const outerArcGeos = useMemo(() => {
    return Array.from({ length: OUTER_ARC_COUNT }, (_, i) => {
      const theta = (i / OUTER_ARC_COUNT) * Math.PI * 2;
      const phi = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.6;
      const innerR = size * 0.35;
      const outerR = size * 1.0;
      const start = new THREE.Vector3(
        innerR * Math.sin(phi) * Math.cos(theta),
        innerR * Math.cos(phi),
        innerR * Math.sin(phi) * Math.sin(theta)
      );
      const end = new THREE.Vector3(
        outerR * Math.sin(phi) * Math.cos(theta + 0.5),
        outerR * Math.cos(phi),
        outerR * Math.sin(phi) * Math.sin(theta + 0.5)
      );
      const points = generateLightningPath(start, end, 10, size * 0.15);
      return tubeFromPoints(points, 0.015, 16, 4);
    });
  }, [size]);

  const coreArcGeos = useMemo(() => {
    return Array.from({ length: CORE_ARC_COUNT }, (_, i) => {
      const theta = (i / CORE_ARC_COUNT) * Math.PI * 2;
      const phi = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.4;
      const endR = size * 0.5;
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(
        endR * Math.sin(phi) * Math.cos(theta),
        endR * Math.cos(phi),
        endR * Math.sin(phi) * Math.sin(theta)
      );
      const points = generateLightningPath(start, end, 8, size * 0.1);
      return tubeFromPoints(points, 0.025, 12, 4);
    });
  }, [size]);

  useEffect(() => {
    return () => {
      bracketGeometry.dispose();
      outerArcGeos.forEach(g => g.dispose());
      coreArcGeos.forEach(g => g.dispose());
    };
  }, [bracketGeometry, outerArcGeos, coreArcGeos]);

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

  // Generate lightning path points (for morphing existing geometry in-place)
  const generateOuterArcPath = useCallback((arcIndex: number, time: number) => {
    const innerR = size * 0.35;
    const outerR = size * 1.0;
    const theta1 = (arcIndex / OUTER_ARC_COUNT) * Math.PI * 2 + time * 0.3;
    const phi1 = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.6;
    const theta2 = theta1 + (Math.random() - 0.5) * Math.PI;
    const phi2 = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.6;

    const start = new THREE.Vector3(
      innerR * Math.sin(phi1) * Math.cos(theta1),
      innerR * Math.cos(phi1),
      innerR * Math.sin(phi1) * Math.sin(theta1)
    );
    const end = new THREE.Vector3(
      outerR * Math.sin(phi2) * Math.cos(theta2),
      outerR * Math.cos(phi2),
      outerR * Math.sin(phi2) * Math.sin(theta2)
    );

    return generateLightningPath(start, end, 10, size * 0.15);
  }, [size]);

  const generateCoreArcPath = useCallback((arcIndex: number, time: number) => {
    const endR = size * 0.5;
    const theta = (arcIndex / CORE_ARC_COUNT) * Math.PI * 2 + time * 0.2;
    const phi = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.4;

    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(
      endR * Math.sin(phi) * Math.cos(theta),
      endR * Math.cos(phi),
      endR * Math.sin(phi) * Math.sin(theta)
    );

    return generateLightningPath(start, end, 8, size * 0.1);
  }, [size]);

  // Vortex particle custom tick — orbit in vortex pattern
  const vortexTick = useCallback((data: ParticleState, delta: number, elapsed: number) => {
    const { positions, velocities, lifetimes, maxLifetimes, count } = data;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (lifetimes[i] < 0) continue;

      const x = positions[i3];
      const z = positions[i3 + 2];
      const r = Math.sqrt(x * x + z * z) + 0.01;
      const angle = Math.atan2(z, x);

      // Angular velocity increases toward center (vortex)
      const angularSpeed = 1.5 / (r + 0.5);
      const newAngle = angle + angularSpeed * delta;

      // Slowly spiral inward
      const newR = r - 0.02 * delta;
      positions[i3] = Math.cos(newAngle) * Math.max(0.1, newR);
      positions[i3 + 2] = Math.sin(newAngle) * Math.max(0.1, newR);

      // Gentle vertical oscillation
      positions[i3 + 1] += Math.sin(elapsed * 2 + i * 0.3) * 0.002;
    }
  }, []);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    if (isPanelOpen && !isCollapsingRef.current) {
      if (emFieldRef.current) emFieldRef.current.time = time;
      cloudRefs.current.forEach((r) => { if (r) r.time = time; });
      if (ring1Ref.current) ring1Ref.current.time = time;
      if (ring2Ref.current) ring2Ref.current.time = time;
      return;
    }

    const hovered = isHoveredRef.current;
    frameCountRef.current++;

    // Collapse progress
    if (isCollapsingRef.current && collapseStartTimeRef.current === 0) {
      collapseStartTimeRef.current = time;
    }
    let cp = 0;
    if (isCollapsingRef.current) {
      cp = Math.min((time - collapseStartTimeRef.current) / 2.5, 1);
    }

    // Group rotation: slow Y spin + gentle X wobble
    groupRef.current.rotation.y += 0.008;
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.15;

    // ---- Layer 1: Outer EM Field ----
    if (emFieldRef.current) {
      emFieldRef.current.time = time;
    }
    if (emFieldMeshRef.current && !isCollapsingRef.current) {
      const wobble = 1.0 + Math.sin(time * 1.2) * 0.03 + Math.sin(time * 2.1) * 0.02;
      emFieldMeshRef.current.scale.setScalar(wobble);
    }

    // ---- Layer 2: Nebula Clouds ----
    CLOUD_CONFIGS.forEach((cfg, i) => {
      const matRef = cloudRefs.current[i];
      const meshRef = cloudMeshRefs.current[i];
      if (matRef) matRef.time = time;
      if (meshRef && !isCollapsingRef.current) {
        const driftX = Math.cos(time * cfg.orbitSpeed + cfg.orbitPhase) * 0.2;
        const driftZ = Math.sin(time * cfg.orbitSpeed + cfg.orbitPhase) * 0.2;
        meshRef.position.set(driftX, 0, driftZ);
      }
    });

    // ---- Layer 3: Core Energy Sphere ----
    if (coreRef.current && !isCollapsingRef.current) {
      const corePulse = 1.0 + Math.sin(time * 3 * Math.PI * 2) * 0.08;
      coreRef.current.scale.setScalar(corePulse);
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 0.7 : 0.5;
    }

    // ---- Layer 4: Lightning Arcs — morph existing geometry in place (zero allocation) ----
    const outerRegenRate = hovered ? 12 : 20;
    const coreRegenRate = hovered ? 8 : 16;

    if (frameCountRef.current % outerRegenRate === 0) {
      for (let i = 0; i < OUTER_ARC_COUNT; i++) {
        const points = generateOuterArcPath(i, time);
        morphTubeToPath(outerArcGeos[i], points, 0.015);
      }
    }

    if (frameCountRef.current % coreRegenRate === 0) {
      for (let i = 0; i < CORE_ARC_COUNT; i++) {
        const points = generateCoreArcPath(i, time);
        morphTubeToPath(coreArcGeos[i], points, 0.025);
      }
    }

    // Update arc opacity based on hover state
    const outerOpacity = hovered ? 0.7 : 0.35;
    const coreOpacity = hovered ? 0.6 : 0.3;
    for (let i = 0; i < OUTER_ARC_COUNT; i++) {
      const mesh = outerArcMeshRefs.current[i];
      if (mesh?.material) (mesh.material as THREE.MeshBasicMaterial).opacity = outerOpacity;
    }
    for (let i = 0; i < CORE_ARC_COUNT; i++) {
      const mesh = coreArcMeshRefs.current[i];
      if (mesh?.material) (mesh.material as THREE.MeshBasicMaterial).opacity = coreOpacity;
    }

    // ---- Layer 6: Shield Rings ----
    if (ring1Ref.current) ring1Ref.current.time = time;
    if (ring2Ref.current) ring2Ref.current.time = time;
    if (ring1MeshRef.current) ring1MeshRef.current.rotation.z += 0.5 * delta;
    if (ring2MeshRef.current) ring2MeshRef.current.rotation.x += 0.5 * delta;

    // Ring opacity
    const ringOpacity = hovered ? 0.4 : 0.15;
    if (ring1Ref.current) ring1Ref.current.opacity = ringOpacity;
    if (ring2Ref.current) ring2Ref.current.opacity = ringOpacity;

    // ---- Collapse Animation ----
    if (isCollapsingRef.current && cp < 1) {
      if (cp < 0.3) {
        // Phase 1: Containment pulse — arcs converge, core brightens
        const p1 = cp / 0.3;
        if (coreRef.current) {
          coreRef.current.scale.setScalar(1 + p1 * 1.5);
          (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + p1 * 0.5;
        }
        if (flashRef.current) {
          flashRef.current.visible = true;
          flashRef.current.scale.setScalar(1 + p1 * 2);
          (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - p1);
        }
      } else if (cp < 0.65) {
        // Phase 2: Dispersal — clouds scatter, particles fly out
        const p2 = (cp - 0.3) / 0.35;
        if (flashRef.current) flashRef.current.visible = false;

        CLOUD_CONFIGS.forEach((_, i) => {
          const mesh = cloudMeshRefs.current[i];
          if (mesh) {
            mesh.scale.setScalar(1 + p2 * 3);
            const mat = mesh.material as any;
            if (mat && mat.opacity !== undefined) mat.opacity = 0.12 * (1 - p2);
          }
        });

        if (coreRef.current) {
          coreRef.current.scale.setScalar(2.5 * (1 - p2));
          (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 1.0 * (1 - p2);
        }

        if (emFieldMeshRef.current) {
          emFieldMeshRef.current.scale.setScalar(1 + p2 * 2);
        }
      } else {
        // Phase 3: Fade — everything goes transparent
        const p3 = (cp - 0.65) / 0.35;
        if (emFieldRef.current) emFieldRef.current.opacity = (1 - p3);
        if (coreRef.current) {
          (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    }

    // Reset after collapse
    if (isCollapsingRef.current && cp >= 1) {
      isCollapsingRef.current = false;
      if (coreRef.current) {
        coreRef.current.scale.setScalar(1);
        (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5;
      }
      if (emFieldRef.current) emFieldRef.current.opacity = 1.0;
      if (emFieldMeshRef.current) emFieldMeshRef.current.scale.setScalar(1);
      CLOUD_CONFIGS.forEach((_, i) => {
        const mesh = cloudMeshRefs.current[i];
        if (mesh) mesh.scale.setScalar(1);
      });
    }

    // Brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = hovered && cp === 0;
      if (hovered) bracketsRef.current.rotation.z = time * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* ===== Layer 1: Outer Electromagnetic Field ===== */}
      <mesh
        ref={emFieldMeshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[size * 1.6, 16, 16]} />
        <volumetricGlowMaterial
          ref={emFieldRef}
          color={color}
          noiseScale={3.0}
          noiseSpeed={1.2}
          rimPower={2.0}
          glowStrength={0.4}
          opacity={1.0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 2: Volumetric Nebula Cloud (3 spheres) ===== */}
      {CLOUD_CONFIGS.map((cfg, i) => (
        <mesh
          key={`cloud-${i}`}
          ref={(el) => { if (el) cloudMeshRefs.current[i] = el; }}
        >
          <icosahedronGeometry args={[size * cfg.radiusMult, 2]} />
          <volumetricGlowMaterial
            ref={(el: any) => { if (el) cloudRefs.current[i] = el; }}
            color={cfg.color}
            noiseScale={cfg.noiseScale}
            noiseSpeed={0.6}
            rimPower={2.0}
            glowStrength={cfg.glowStrength}
            opacity={0.12}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ===== Layer 3: Core Energy Sphere ===== */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[size * 0.35, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 4: Lightning Arc System ===== */}

      {/* Outer arcs (8) — pre-generated geometry, morphed in place */}
      <group ref={outerArcsGroupRef}>
        {outerArcGeos.map((geo, i) => (
          <mesh
            key={`outer-arc-${i}`}
            ref={(el) => { outerArcMeshRefs.current[i] = el; }}
            geometry={geo}
          >
            <meshBasicMaterial
              color="#ec4899"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Core arcs (4) — thicker, white-pink, morphed in place */}
      <group ref={coreArcsGroupRef}>
        {coreArcGeos.map((geo, i) => (
          <mesh
            key={`core-arc-${i}`}
            ref={(el) => { coreArcMeshRefs.current[i] = el; }}
            geometry={geo}
          >
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* ===== Layer 5: Vortex Particles + Electric Sparks ===== */}

      {/* Vortex particles — orbiting in vortex pattern */}
      <InstancedParticleSystem
        count={200}
        color="#a855f7"
        colorEnd="#ec4899"
        size={0.06}
        lifespan={[2.0, 4.0]}
        spawnRadius={size * 0.8}
        emitRate={50}
        loop
        onTick={vortexTick}
      />

      {/* Electric sparks — rapid pop, white, short lifespan */}
      <InstancedParticleSystem
        count={30}
        color="#ffffff"
        size={0.04}
        lifespan={[0.1, 0.3]}
        velocityMin={[-2, -2, -2]}
        velocityMax={[2, 2, 2]}
        spawnRadius={size * 0.5}
        emitRate={10}
        loop
      />

      {/* ===== Layer 6: Energy Shield Rings ===== */}

      {/* Ring 1 — XY plane */}
      <mesh ref={ring1MeshRef}>
        <torusGeometry args={[size * 1.2, 0.04, 8, 48]} />
        <energyFlowMaterial
          ref={ring1Ref}
          color1="#a855f7"
          color2="#ec4899"
          flowSpeed={1.5}
          stripeCount={8.0}
          opacity={0.15}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 2 — XZ plane (perpendicular) */}
      <mesh ref={ring2MeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.2, 0.04, 8, 48]} />
        <energyFlowMaterial
          ref={ring2Ref}
          color1="#c084fc"
          color2="#ec4899"
          flowSpeed={1.5}
          stripeCount={8.0}
          opacity={0.15}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ===== Interaction: Flash sphere + Brackets ===== */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

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
