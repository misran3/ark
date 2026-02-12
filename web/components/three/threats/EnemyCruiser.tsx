'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '@/lib/materials/VolumetricGlowMaterial';
import '@/lib/materials/EnergyFlowMaterial';
import '@/lib/materials/HolographicMaterial';
import { InstancedParticleSystem, TrailRibbon } from '@/lib/particles';

interface EnemyCruiserProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

// Running light positions: [x, y, z, blinkPhase]
const LIGHT_CONFIGS = [
  { pos: [-0.15, 0, 0.8], phase: 0.0, color: '#dc2626' },    // front-port
  { pos: [0.15, 0, 0.8], phase: 0.2, color: '#dc2626' },     // front-starboard
  { pos: [-0.2, 0.15, 0], phase: 0.4, color: '#dc2626' },    // mid-dorsal-port
  { pos: [0.2, 0.15, 0], phase: 0.6, color: '#dc2626' },     // mid-dorsal-starboard
  { pos: [-0.15, 0, -0.8], phase: 0.8, color: '#991b1b' },   // rear-port
  { pos: [0.15, 0, -0.8], phase: 1.0, color: '#991b1b' },    // rear-starboard
  { pos: [-0.5, 0, 0.1], phase: 0.0, color: '#dc2626' },     // wing-tip-port
  { pos: [0.5, 0, 0.1], phase: 0.0, color: '#dc2626' },      // wing-tip-starboard
];

/**
 * Cinematic enemy cruiser with 7-layer composition:
 * 1. Outer Threat Aura (VolumetricGlowMaterial)
 * 2. Multi-part Hull (fuselage + armor plates + wing pylons + bridge)
 * 3. Weapon Turrets with EnergyFlowMaterial capacitor rings
 * 4. Engine Section (InstancedParticleSystem + TrailRibbon per engine)
 * 5. Running Lights (sequential blink sweep)
 * 6. Shield Effect (HolographicMaterial, hover-only)
 * 7. Targeting Laser (hover-only)
 */
export default function EnemyCruiser({
  position,
  size = 1.2,
  color = '#991b1b',
  onHover,
  onClick,
}: EnemyCruiserProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hullRef = useRef<THREE.Mesh>(null);
  const leftTurretRef = useRef<THREE.Group>(null);
  const rightTurretRef = useRef<THREE.Group>(null);
  const leftCapRingRef = useRef<any>(null);
  const rightCapRingRef = useRef<any>(null);
  const leftChargeRef = useRef<THREE.Mesh>(null);
  const rightChargeRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<any>(null);
  const shieldMeshRef = useRef<THREE.Mesh>(null);
  const laserRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<any>(null);
  const lightRefs = useRef<(THREE.Mesh | null)[]>([]);
  const leftEngineGroupRef = useRef<THREE.Group>(null);
  const rightEngineGroupRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);
  const bracketsRef = useRef<THREE.Group>(null);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);
  // Cached materials for collapse fade — populated once at collapse start to avoid traverse() per frame
  const collapseMaterialsRef = useRef<THREE.Material[]>([]);

  // Targeting bracket geometry
  const bracketGeometry = useMemo(() => {
    const s = size * 1.8;
    const len = s * 0.35;
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

  useFrame(({ clock, mouse }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const hovered = isHoveredRef.current;

    // Set collapse start time
    if (isCollapsingRef.current && collapseStartTimeRef.current === 0) {
      collapseStartTimeRef.current = time;
    }

    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      collapseProgress = Math.min((time - collapseStartTimeRef.current) / 2.5, 1);
    }

    // Evasive movement (compound sine waves)
    if (!isCollapsingRef.current) {
      groupRef.current.position.x += (Math.sin(time * 1.5) * 0.08 + Math.sin(time * 3.7) * 0.04);
      groupRef.current.position.y += Math.cos(time * 2.1) * 0.03;
      groupRef.current.position.z += Math.sin(time * 0.8) * 0.02;

      // Banking proportional to lateral velocity
      const xVelocity = Math.cos(time * 1.5) * 1.5 * 0.08 + Math.cos(time * 3.7) * 3.7 * 0.04;
      groupRef.current.rotation.z = xVelocity * 0.3;
    }

    // ---- Layer 1: Threat Aura ----
    if (auraRef.current) {
      auraRef.current.time = time;
    }

    // ---- Layer 2: Hull emissive pulse ----
    if (hullRef.current && !isCollapsingRef.current) {
      const mat = hullRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = hovered
        ? 1.0 + Math.sin(time * 5) * 0.5
        : 0.3 + Math.sin(time * 2) * 0.15;
    }

    // ---- Layer 3: Turret tracking + charge glow ----
    if (hovered && !isCollapsingRef.current) {
      const cursorX = mouse.x * 2;
      const cursorY = mouse.y * 2;
      if (leftTurretRef.current) {
        leftTurretRef.current.rotation.y = cursorX * 0.5;
        leftTurretRef.current.rotation.x = cursorY * 0.3;
      }
      if (rightTurretRef.current) {
        rightTurretRef.current.rotation.y = cursorX * 0.5;
        rightTurretRef.current.rotation.x = cursorY * 0.3;
      }
    }

    // Weapon charge glow
    const chargeIntensity = hovered ? 1.5 : 0.5;
    if (leftChargeRef.current) {
      (leftChargeRef.current.material as THREE.MeshBasicMaterial).opacity =
        chargeIntensity * (0.5 + Math.sin(time * 6) * 0.3);
    }
    if (rightChargeRef.current) {
      (rightChargeRef.current.material as THREE.MeshBasicMaterial).opacity =
        chargeIntensity * (0.5 + Math.sin(time * 6 + 0.5) * 0.3);
    }

    // Capacitor ring materials
    if (leftCapRingRef.current) leftCapRingRef.current.time = time;
    if (rightCapRingRef.current) rightCapRingRef.current.time = time;

    // ---- Layer 5: Running lights ----
    const sweepCycle = (time * 2) % (LIGHT_CONFIGS.length * 0.3);
    for (let i = 0; i < lightRefs.current.length; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;
      const mat = light.material as THREE.MeshBasicMaterial;
      if (hovered) {
        // Alert mode: all bright
        mat.opacity = 0.8;
      } else {
        // Sequential sweep blink
        const lightPhase = LIGHT_CONFIGS[i].phase * LIGHT_CONFIGS.length * 0.3;
        const dist = Math.abs(sweepCycle - lightPhase);
        mat.opacity = dist < 0.3 ? 0.8 : 0.15;
      }
    }

    // ---- Layer 6: Shield effect ----
    if (shieldRef.current) {
      shieldRef.current.time = time;
      shieldRef.current.opacity = hovered
        ? 0.08 + Math.sin(time * 12) * 0.06 + 0.06
        : 0.0;
    }
    if (shieldMeshRef.current) {
      shieldMeshRef.current.visible = hovered;
    }

    // ---- Layer 7: Targeting laser ----
    if (laserRef.current) {
      laserRef.current.visible = hovered && !isCollapsingRef.current;
      if (hovered) {
        (laserRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.3 + Math.sin(time * 8) * 0.1;
      }
    }

    // ---- Collapse animation (2.5s) ----
    if (isCollapsingRef.current && collapseProgress < 1) {
      // Phase 1 (0–0.32): Laser impact — flash, hull flicker
      if (collapseProgress < 0.32) {
        const p1 = collapseProgress / 0.32;
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = true;
          flashSphereRef.current.scale.setScalar(1 + p1 * 2);
          (flashSphereRef.current.material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 1 - p1 * 1.5);
        }
        if (hullRef.current) {
          const mat = hullRef.current.material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(Math.random() > 0.5 ? 0xffffff : 0xdc2626);
        }
      }
      // Phase 2 (0.32–0.6): Shockwave, emissive flare
      else if (collapseProgress < 0.6) {
        const p2 = (collapseProgress - 0.32) / 0.28;
        if (flashSphereRef.current) flashSphereRef.current.visible = false;
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.visible = true;
          shockwaveRingRef.current.scale.setScalar(1 + p2 * 2);
          (shockwaveRingRef.current.material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 0.8 * (1 - p2));
        }
        if (hullRef.current) {
          const mat = hullRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.5 + p2 * 2.0;
        }
      }
      // Phase 3 (0.6–1.0): Retreat — ship tumbles backward, fades
      else {
        const p3 = (collapseProgress - 0.6) / 0.4;
        if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
        groupRef.current.rotation.x += p3 * 0.1;
        groupRef.current.position.z -= p3 * 0.1;

        // Fade all meshes — use cached materials instead of traverse() per frame
        if (collapseMaterialsRef.current.length === 0) {
          // Collect once at start of phase 3
          groupRef.current.traverse((node) => {
            if (node instanceof THREE.Mesh && node.material) {
              collapseMaterialsRef.current.push(node.material);
            }
          });
        }
        const opacity = 1 - p3;
        for (const mat of collapseMaterialsRef.current) {
          (mat as any).transparent = true;
          (mat as any).opacity = Math.min((mat as any).opacity ?? 1, opacity);
        }
      }
    }

    // Reset after collapse
    if (isCollapsingRef.current && collapseProgress >= 1) {
      isCollapsingRef.current = false;
      if (flashSphereRef.current) flashSphereRef.current.visible = false;
      if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = hovered && !isCollapsingRef.current;
      if (hovered) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* ===== Layer 1: Outer Threat Aura ===== */}
      <mesh>
        <sphereGeometry args={[size * 1.8, 16, 16]} />
        <volumetricGlowMaterial
          ref={auraRef}
          color={color}
          glowStrength={0.15}
          noiseScale={2.0}
          noiseSpeed={0.6}
          rimPower={3.0}
          opacity={1.0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Layer 2: Multi-part Hull ===== */}
      <group
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Main Fuselage — elongated octahedron (two cones base-to-base) */}
        {/* Front cone (aggressive nose) */}
        <mesh ref={hullRef} position={[0, 0, size * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[size * 0.22, size * 1.0, 8]} />
          <meshStandardMaterial
            color="#1f2937"
            metalness={0.85}
            roughness={0.25}
            emissive={color}
            emissiveIntensity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Rear cone (engine block) */}
        <mesh position={[0, 0, -size * 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[size * 0.22, size * 0.6, 8]} />
          <meshStandardMaterial
            color="#1f2937"
            metalness={0.85}
            roughness={0.25}
            emissive={color}
            emissiveIntensity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Armor Plates — 4 panels with gap from hull */}
        {/* Port */}
        <mesh position={[-size * 0.24, 0, 0.1]}>
          <boxGeometry args={[size * 0.04, size * 0.18, size * 1.0]} />
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} toneMapped={false} />
        </mesh>
        {/* Starboard */}
        <mesh position={[size * 0.24, 0, 0.1]}>
          <boxGeometry args={[size * 0.04, size * 0.18, size * 1.0]} />
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} toneMapped={false} />
        </mesh>
        {/* Dorsal */}
        <mesh position={[0, size * 0.18, 0.1]}>
          <boxGeometry args={[size * 0.3, size * 0.03, size * 0.9]} />
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} toneMapped={false} />
        </mesh>
        {/* Ventral */}
        <mesh position={[0, -size * 0.18, 0.1]}>
          <boxGeometry args={[size * 0.3, size * 0.03, size * 0.9]} />
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} toneMapped={false} />
        </mesh>

        {/* Wing Pylons — swept-back 15° */}
        <mesh position={[-size * 0.35, 0, size * 0.1]} rotation={[0, 0.26, 0]}>
          <boxGeometry args={[size * 0.25, size * 0.05, size * 0.08]} />
          <meshStandardMaterial
            color="#1f2937"
            metalness={0.8}
            roughness={0.3}
            emissive="#991b1b"
            emissiveIntensity={0.2}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[size * 0.35, 0, size * 0.1]} rotation={[0, -0.26, 0]}>
          <boxGeometry args={[size * 0.25, size * 0.05, size * 0.08]} />
          <meshStandardMaterial
            color="#1f2937"
            metalness={0.8}
            roughness={0.3}
            emissive="#991b1b"
            emissiveIntensity={0.2}
            toneMapped={false}
          />
        </mesh>

        {/* Bridge / Command Section — raised dorsal box */}
        <mesh position={[0, size * 0.22, size * 0.15]}>
          <boxGeometry args={[size * 0.12, size * 0.06, size * 0.15]} />
          <meshStandardMaterial
            color="#374151"
            metalness={0.7}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
        {/* Bridge window lights */}
        <mesh position={[-size * 0.03, size * 0.25, size * 0.22]}>
          <sphereGeometry args={[size * 0.012, 6, 6]} />
          <meshBasicMaterial
            color="#93c5fd"
            toneMapped={false}
          />
        </mesh>
        <mesh position={[size * 0.03, size * 0.25, size * 0.22]}>
          <sphereGeometry args={[size * 0.012, 6, 6]} />
          <meshBasicMaterial
            color="#93c5fd"
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ===== Layer 3: Weapon Turrets ===== */}
      {/* Left turret */}
      <group ref={leftTurretRef} position={[size * -0.35, size * 0.08, size * 0.35]}>
        {/* Gimbal base */}
        <mesh>
          <sphereGeometry args={[size * 0.07, 10, 10]} />
          <meshStandardMaterial
            color="#991b1b"
            emissive="#dc2626"
            emissiveIntensity={0.5}
            metalness={0.7}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0, size * 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.025, size * 0.035, size * 0.15, 8]} />
          <meshStandardMaterial
            color="#1f2937"
            emissive="#dc2626"
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>
        {/* Charge glow sphere at barrel tip */}
        <mesh ref={leftChargeRef} position={[0, 0, size * 0.2]}>
          <sphereGeometry args={[size * 0.03, 8, 8]} />
          <meshBasicMaterial
            color="#ff4400"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Capacitor ring (hover charge effect) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 0.09, 0.008, 6, 24]} />
          <energyFlowMaterial
            ref={leftCapRingRef}
            color1="#dc2626"
            color2="#ff6600"
            flowSpeed={3.0}
            stripeCount={4.0}
            opacity={0.6}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Right turret */}
      <group ref={rightTurretRef} position={[size * 0.35, size * 0.08, size * 0.35]}>
        <mesh>
          <sphereGeometry args={[size * 0.07, 10, 10]} />
          <meshStandardMaterial
            color="#991b1b"
            emissive="#dc2626"
            emissiveIntensity={0.5}
            metalness={0.7}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, size * 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.025, size * 0.035, size * 0.15, 8]} />
          <meshStandardMaterial
            color="#1f2937"
            emissive="#dc2626"
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={rightChargeRef} position={[0, 0, size * 0.2]}>
          <sphereGeometry args={[size * 0.03, 8, 8]} />
          <meshBasicMaterial
            color="#ff4400"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 0.09, 0.008, 6, 24]} />
          <energyFlowMaterial
            ref={rightCapRingRef}
            color1="#dc2626"
            color2="#ff6600"
            flowSpeed={3.0}
            stripeCount={4.0}
            opacity={0.6}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ===== Layer 4: Engine Section ===== */}
      {/* Left engine nacelle */}
      <group ref={leftEngineGroupRef} position={[size * -0.35, size * -0.1, size * -0.4]}>
        {/* Engine body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.1, size * 0.12, size * 0.35, 10]} />
          <meshStandardMaterial
            color="#1f2937"
            emissive="#991b1b"
            emissiveIntensity={0.4}
            metalness={0.8}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
        {/* Thruster bell glow */}
        <mesh position={[0, 0, -size * 0.2]}>
          <sphereGeometry args={[size * 0.11, 10, 10]} />
          <meshBasicMaterial
            color="#dc2626"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Exhaust particles */}
        <group position={[0, 0, -size * 0.2]}>
          <InstancedParticleSystem
            count={75}
            color="#dc2626"
            colorEnd="#1a1a1a"
            velocityMin={[-0.15, -0.15, -0.8]}
            velocityMax={[0.15, 0.15, -1.5]}
            lifespan={[0.5, 1.5]}
            emitRate={50}
            size={size * 0.04}
            spawnRadius={size * 0.08}
            loop
          />
        </group>
        {/* Exhaust trail ribbon */}
        <TrailRibbon
          targetRef={leftEngineGroupRef}
          color="#dc2626"
          colorEnd="#330000"
          width={size * 0.08}
          lifetime={0.8}
          maxPoints={30}
          opacity={0.5}
        />
      </group>

      {/* Right engine nacelle */}
      <group ref={rightEngineGroupRef} position={[size * 0.35, size * -0.1, size * -0.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.1, size * 0.12, size * 0.35, 10]} />
          <meshStandardMaterial
            color="#1f2937"
            emissive="#991b1b"
            emissiveIntensity={0.4}
            metalness={0.8}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, -size * 0.2]}>
          <sphereGeometry args={[size * 0.11, 10, 10]} />
          <meshBasicMaterial
            color="#dc2626"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <group position={[0, 0, -size * 0.2]}>
          <InstancedParticleSystem
            count={75}
            color="#dc2626"
            colorEnd="#1a1a1a"
            velocityMin={[-0.15, -0.15, -0.8]}
            velocityMax={[0.15, 0.15, -1.5]}
            lifespan={[0.5, 1.5]}
            emitRate={50}
            size={size * 0.04}
            spawnRadius={size * 0.08}
            loop
          />
        </group>
        <TrailRibbon
          targetRef={rightEngineGroupRef}
          color="#dc2626"
          colorEnd="#330000"
          width={size * 0.08}
          lifetime={0.8}
          maxPoints={30}
          opacity={0.5}
        />
      </group>

      {/* ===== Layer 5: Running Lights ===== */}
      {LIGHT_CONFIGS.map((cfg, i) => (
        <mesh
          key={`light-${i}`}
          ref={(ref) => { lightRefs.current[i] = ref; }}
          position={[cfg.pos[0] * size, cfg.pos[1] * size, cfg.pos[2] * size]}
        >
          <sphereGeometry args={[size * 0.025, 6, 6]} />
          <meshBasicMaterial
            color={cfg.color}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ===== Layer 6: Shield Effect (hover-only) ===== */}
      <mesh ref={shieldMeshRef} visible={false} scale={1.15}>
        <icosahedronGeometry args={[size * 0.6, 1]} />
        <holographicMaterial
          ref={shieldRef}
          color="#dc2626"
          scanlineCount={50.0}
          flickerSpeed={8.0}
          opacity={0.0}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
          wireframe
        />
      </mesh>

      {/* ===== Layer 7: Targeting Laser (hover-only) ===== */}
      <mesh ref={laserRef} visible={false} position={[0, 0, size * 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[size * 0.005, size * 0.005, size * 3.0, 6]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ===== Interaction Overlays ===== */}

      {/* Flash sphere — collapse phase 1 */}
      <mesh ref={flashSphereRef} visible={false}>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Shockwave ring — collapse phase 2 */}
      <mesh ref={shockwaveRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.8, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Targeting brackets + scan ring */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color="#dc2626" opacity={0.8} transparent />
        </lineSegments>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.8, 0.02, 8, 32]} />
          <meshBasicMaterial
            color="#dc2626"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
