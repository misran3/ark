'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnemyCruiserProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

/**
 * Procedurally generated hostile enemy cruiser with:
 * - Hull (elongated box) + nose cone (cone geometry)
 * - 2 engine pods (cylinders) with red particle exhaust trails
 * - Rotating weapon turrets (spheres/cylinders)
 * - Red emissive pulsing glow + hostile running lights
 * - Lateral weaving approach pattern
 * - Turret tracking toward cursor on hover
 * - Red targeting brackets/reticle on hover
 * - Multi-phase click deflection animation (2.5s total)
 * - Enhanced aggressive evasive movement with multi-axis weaving
 * - Weapon charge glow intensification during hover
 * - Particle trail for engine exhaust
 */
export default function EnemyCruiser({
  position,
  size = 1.2,
  color = '#991b1b', // Crimson red
  onHover,
  onClick,
}: EnemyCruiserProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hullRef = useRef<THREE.Mesh>(null);
  const noseRef = useRef<THREE.Mesh>(null);
  const leftEngineRef = useRef<THREE.Group>(null);
  const rightEngineRef = useRef<THREE.Group>(null);
  const leftTurretRef = useRef<THREE.Group>(null);
  const rightTurretRef = useRef<THREE.Group>(null);
  const runningLightsRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);

  // Collapse animation state (for click deflection)
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);

  // Hover effects
  const bracketsRef = useRef<THREE.Group>(null);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);

  // Pre-compute targeting bracket geometry (red variant for enemy cruiser)
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

  // Engine trail component - reuses AsteroidTrail pattern but with red colors
  const EngineTrail = useMemo(() => {
    return function EngineTrailComponent({ count = 60, spread = 0.3, size: trailSize = 0.05 }) {
      const pointsRef = useRef<THREE.Points>(null);
      const trailPointsRef = useRef<THREE.Points>(null);
      const lifetimesRef = useRef<Float32Array>(null!);
      const velocitiesRef = useRef<Float32Array>(null!);
      const maxLifetimesRef = useRef<Float32Array>(null!);
      const prevPositionsRef = useRef<Float32Array>(null!);

      const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const lifetimes = new Float32Array(count);
        const velocities = new Float32Array(count * 3);
        const maxLifetimes = new Float32Array(count);
        const prevPositions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
          lifetimes[i] = -Math.random() * 1.5;
          maxLifetimes[i] = 1.0 + Math.random() * 0.8;

          velocities[i * 3] = (Math.random() - 0.5) * spread;
          velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
          velocities[i * 3 + 2] = 0.4 + Math.random() * 0.6;

          // Red color (#dc2626)
          colors[i * 3] = 0.86;
          colors[i * 3 + 1] = 0.15;
          colors[i * 3 + 2] = 0.15;

          sizes[i] = trailSize * (0.5 + Math.random() * 0.5);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        lifetimesRef.current = lifetimes;
        velocitiesRef.current = velocities;
        maxLifetimesRef.current = maxLifetimes;
        prevPositionsRef.current = prevPositions;

        return geo;
      }, [count, spread, trailSize]);

      // Trail geometry
      const trailGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
          colors[i * 3] = 0.60;
          colors[i * 3 + 1] = 0.08;
          colors[i * 3 + 2] = 0.08;
          sizes[i] = trailSize * 0.6 * (0.5 + Math.random() * 0.5);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geo;
      }, [count, trailSize]);

      useEffect(() => {
        return () => {
          geometry.dispose();
          trailGeometry.dispose();
        };
      }, [geometry, trailGeometry]);

      useFrame((_, delta) => {
        if (!geometry) return;

        const posAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        const sizeAttr = geometry.attributes.size;
        const pos = posAttr.array as Float32Array;
        const col = colorAttr.array as Float32Array;
        const sz = sizeAttr.array as Float32Array;
        const lifetimes = lifetimesRef.current;
        const velocities = velocitiesRef.current;
        const maxLifetimes = maxLifetimesRef.current;

        for (let i = 0; i < count; i++) {
          lifetimes[i] += delta;

          if (lifetimes[i] >= maxLifetimes[i]) {
            lifetimes[i] = 0;
            pos[i * 3] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

            velocities[i * 3] = (Math.random() - 0.5) * spread;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
            velocities[i * 3 + 2] = 0.4 + Math.random() * 0.6;

            maxLifetimes[i] = 1.0 + Math.random() * 0.8;
          }

          if (lifetimes[i] < 0) continue;

          const t = lifetimes[i] / maxLifetimes[i];

          // Store previous position
          prevPositionsRef.current[i * 3] = pos[i * 3];
          prevPositionsRef.current[i * 3 + 1] = pos[i * 3 + 1];
          prevPositionsRef.current[i * 3 + 2] = pos[i * 3 + 2];

          pos[i * 3] += velocities[i * 3] * delta;
          pos[i * 3 + 1] += velocities[i * 3 + 1] * delta;
          pos[i * 3 + 2] += velocities[i * 3 + 2] * delta;

          // Red -> dark red -> near-black
          if (t < 0.5) {
            const p = t / 0.5;
            col[i * 3] = 0.86 - p * 0.36;
            col[i * 3 + 1] = 0.15 - p * 0.05;
            col[i * 3 + 2] = 0.15 - p * 0.05;
          } else {
            const p = (t - 0.5) / 0.5;
            col[i * 3] = 0.5 - p * 0.5;
            col[i * 3 + 1] = 0.1 - p * 0.1;
            col[i * 3 + 2] = 0.1 - p * 0.1;
          }

          sz[i] = trailSize * (1.0 - t * 0.6) * (lifetimes[i] > 0 ? 1 : 0);
        }

        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;

        // Update trail geometry
        if (trailPointsRef.current) {
          const trailPosAttr = trailPointsRef.current.geometry.attributes.position;
          const trailPos = trailPosAttr.array as Float32Array;
          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            trailPos[i3] = prevPositionsRef.current[i3];
            trailPos[i3 + 1] = prevPositionsRef.current[i3 + 1];
            trailPos[i3 + 2] = prevPositionsRef.current[i3 + 2];
          }
          trailPosAttr.needsUpdate = true;
        }
      });

      return (
        <>
          <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
              vertexColors
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              sizeAttenuation
              size={trailSize}
            />
          </points>
          <points ref={trailPointsRef} geometry={trailGeometry}>
            <pointsMaterial
              vertexColors
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              sizeAttenuation
              size={trailSize * 0.6}
              opacity={0.3}
            />
          </points>
        </>
      );
    };
  }, []);

  // Dispose bracket geometry on unmount
  useEffect(() => {
    return () => {
      bracketGeometry.dispose();
    };
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
    const elapsedTime = time - collapseStartTimeRef.current;

    // Multi-axis enhanced aggressive evasive movement
    if (groupRef.current.position && !isCollapsingRef.current) {
      // X: compound sine waves (more erratic)
      groupRef.current.position.x += (Math.sin(time * 1.5) * 0.08 + Math.sin(time * 3.7) * 0.04);
      // Y: cosine for varied pattern
      groupRef.current.position.y += Math.cos(time * 2.1) * 0.03;
      // Z: slight forward/backward oscillation
      groupRef.current.position.z += Math.sin(time * 0.8) * 0.02;

      // Banking: rotation.z tilts with lateral movement (proportional to X velocity)
      const xVelocity = Math.cos(time * 1.5) * 1.5 * 0.08 + Math.cos(time * 3.7) * 3.7 * 0.04;
      groupRef.current.rotation.z = xVelocity * 0.3;
    }

    // ===== COLLAPSE ANIMATION (2.5s total) =====
    if (isCollapsingRef.current && elapsedTime < 2.5) {
      const progress = elapsedTime / 2.5; // 0 to 1

      // Phase 1 (0-0.8s): Laser Impact
      if (progress < 0.32) {
        const phase1Progress = progress / 0.32;

        // Flash sphere appears and scales
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = true;
          flashSphereRef.current.scale.setScalar(1 + phase1Progress * 2);
          const flashMaterial = flashSphereRef.current.material as THREE.MeshBasicMaterial;
          flashMaterial.opacity = Math.max(0, 1 - phase1Progress * 1.5);
        }

        // Hull material flickers emissive white (alternating frames)
        if (hullRef.current && hullRef.current.material) {
          const mat = hullRef.current.material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(Math.random() > 0.5 ? 0xffffff : 0xdc2626);
        }
      }
      // Phase 2 (0.8-1.5s): Hull Explosion
      else if (progress < 0.6) {
        const phase2Progress = (progress - 0.32) / 0.28;

        // Explosion particle system (done via shockwave)
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.visible = true;
          shockwaveRingRef.current.scale.setScalar(1 + phase2Progress * 2);
          const shockMaterial = shockwaveRingRef.current.material as THREE.MeshBasicMaterial;
          shockMaterial.opacity = Math.max(0, 0.8 * (1 - phase2Progress));
        }

        // Hull sections visually separate (translate outward)
        if (hullRef.current) {
          const separation = phase2Progress * 0.3;
          hullRef.current.position.z += separation;
          hullRef.current.material = new THREE.MeshStandardMaterial({
            color: '#1f2937',
            emissive: '#dc2626',
            emissiveIntensity: 0.5 + phase2Progress * 0.5,
            metalness: 0.8,
            roughness: 0.3,
            toneMapped: false,
          });
        }

        // Hide flash sphere
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = false;
        }
      }
      // Phase 3 (1.5-2.5s): Retreat/Destroy
      else {
        const phase3Progress = (progress - 0.6) / 0.4;

        // Ship tumbles backward
        if (groupRef.current) {
          groupRef.current.rotation.x += phase3Progress * 0.1;
          groupRef.current.position.z -= phase3Progress * 0.1;
        }

        // Ship fades out (opacity decreases)
        if (groupRef.current) {
          const opacity = 1 - phase3Progress;
          groupRef.current.traverse((node) => {
            if (node instanceof THREE.Mesh && node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach((mat: any) => {
                  mat.transparent = true;
                  mat.opacity = opacity;
                });
              } else {
                (node.material as any).transparent = true;
                (node.material as any).opacity = opacity;
              }
            }
          });
        }

        // Hide effects
        if (flashSphereRef.current) flashSphereRef.current.visible = false;
        if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
      }
    } else if (!isCollapsingRef.current) {
      // Normal operation (not collapsing)
      // Rotate turrets toward cursor position
      if (isHoveredRef.current && (leftTurretRef.current || rightTurretRef.current)) {
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

      // Pulsing red glow on hull and engine materials
      if (hullRef.current && hullRef.current.material) {
        const mat = hullRef.current.material as THREE.MeshStandardMaterial;
        const pulseIntensity = isHoveredRef.current ? 1.0 + Math.sin(time * 5) * 0.5 : 0.5 + Math.sin(time * 2) * 0.3;
        mat.emissiveIntensity = pulseIntensity;
      }

      // Red running lights pulsing
      if (runningLightsRef.current) {
        runningLightsRef.current.children.forEach((light) => {
          if ((light as THREE.Mesh).material) {
            const mat = (light as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.opacity = 0.3 + Math.sin(time * 3 + Math.random()) * 0.3;
          }
        });
      }

      // Weapon turret sphere emissive intensity ramps from 0.5 → 1.5 on hover
      if (leftTurretRef.current && rightTurretRef.current) {
        const turretIntensity = isHoveredRef.current ? 1.5 : 0.5;
        leftTurretRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissiveIntensity' in mesh.material) {
            (mesh.material as any).emissiveIntensity = turretIntensity;
          }
        });
        rightTurretRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissiveIntensity' in mesh.material) {
            (mesh.material as any).emissiveIntensity = turretIntensity;
          }
        });
      }

      // Engine pod glow intensifies on hover
      if (leftEngineRef.current && rightEngineRef.current) {
        const engineGlowIntensity = isHoveredRef.current ? 1.0 : 0.6;
        leftEngineRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissiveIntensity' in mesh.material) {
            (mesh.material as any).emissiveIntensity = engineGlowIntensity;
          }
        });
        rightEngineRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissiveIntensity' in mesh.material) {
            (mesh.material as any).emissiveIntensity = engineGlowIntensity;
          }
        });
      }
    }

    // Targeting brackets on hover with rotating reticle
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current && !isCollapsingRef.current;
      if (isHoveredRef.current && !isCollapsingRef.current) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }

    // When collapse finishes
    if (isCollapsingRef.current && elapsedTime >= 2.5) {
      isCollapsingRef.current = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main ship hull - dark gray with red accents */}
      <group
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Hull body - elongated box */}
        <mesh ref={hullRef} position={[0, 0, 0]}>
          <boxGeometry args={[size * 0.4, size * 0.3, size * 1.8]} />
          <meshStandardMaterial
            color="#1f2937"
            emissive={color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Nose cone - cone geometry pointing forward */}
        <mesh ref={noseRef} position={[0, 0, size * 1.0]}>
          <coneGeometry args={[size * 0.25, size * 0.6, 16]} />
          <meshStandardMaterial
            color="#991b1b"
            emissive="#dc2626"
            emissiveIntensity={0.6}
            metalness={0.7}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>

        {/* Left engine pod */}
        <group ref={leftEngineRef} position={[size * -0.35, size * -0.15, size * -0.3]}>
          <mesh>
            <cylinderGeometry args={[size * 0.12, size * 0.12, size * 0.4, 12]} />
            <meshStandardMaterial
              color="#1f2937"
              emissive="#991b1b"
              emissiveIntensity={0.6}
              metalness={0.8}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          {/* Engine glow */}
          <mesh position={[0, 0, size * 0.25]}>
            <sphereGeometry args={[size * 0.15, 12, 12]} />
            <meshBasicMaterial
              color="#dc2626"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Engine trail */}
          <EngineTrail count={50} spread={0.25} size={0.04} />
        </group>

        {/* Right engine pod */}
        <group ref={rightEngineRef} position={[size * 0.35, size * -0.15, size * -0.3]}>
          <mesh>
            <cylinderGeometry args={[size * 0.12, size * 0.12, size * 0.4, 12]} />
            <meshStandardMaterial
              color="#1f2937"
              emissive="#991b1b"
              emissiveIntensity={0.6}
              metalness={0.8}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          {/* Engine glow */}
          <mesh position={[0, 0, size * 0.25]}>
            <sphereGeometry args={[size * 0.15, 12, 12]} />
            <meshBasicMaterial
              color="#dc2626"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Engine trail */}
          <EngineTrail count={50} spread={0.25} size={0.04} />
        </group>

        {/* Left weapon turret */}
        <group ref={leftTurretRef} position={[size * -0.35, size * 0.2, size * 0.3]}>
          <mesh>
            <sphereGeometry args={[size * 0.08, 12, 12]} />
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
          <mesh position={[0, 0, size * 0.1]}>
            <cylinderGeometry args={[size * 0.04, size * 0.04, size * 0.15, 8]} />
            <meshStandardMaterial
              color="#1f2937"
              emissive="#dc2626"
              emissiveIntensity={0.4}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Right weapon turret */}
        <group ref={rightTurretRef} position={[size * 0.35, size * 0.2, size * 0.3]}>
          <mesh>
            <sphereGeometry args={[size * 0.08, 12, 12]} />
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
          <mesh position={[0, 0, size * 0.1]}>
            <cylinderGeometry args={[size * 0.04, size * 0.04, size * 0.15, 8]} />
            <meshStandardMaterial
              color="#1f2937"
              emissive="#dc2626"
              emissiveIntensity={0.4}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Red running lights (pulsing spheres) */}
        <group ref={runningLightsRef}>
          {/* Front lights */}
          <mesh position={[size * -0.15, 0, size * 0.8]}>
            <sphereGeometry args={[size * 0.05, 8, 8]} />
            <meshBasicMaterial
              color="#dc2626"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[size * 0.15, 0, size * 0.8]}>
            <sphereGeometry args={[size * 0.05, 8, 8]} />
            <meshBasicMaterial
              color="#dc2626"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Mid lights */}
          <mesh position={[size * -0.2, size * 0.15, 0]}>
            <sphereGeometry args={[size * 0.04, 8, 8]} />
            <meshBasicMaterial
              color="#dc2626"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[size * 0.2, size * 0.15, 0]}>
            <sphereGeometry args={[size * 0.04, 8, 8]} />
            <meshBasicMaterial
              color="#dc2626"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Rear lights */}
          <mesh position={[size * -0.15, 0, size * -0.8]}>
            <sphereGeometry args={[size * 0.05, 8, 8]} />
            <meshBasicMaterial
              color="#991b1b"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[size * 0.15, 0, size * -0.8]}>
            <sphereGeometry args={[size * 0.05, 8, 8]} />
            <meshBasicMaterial
              color="#991b1b"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* Outer hostile glow sphere */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Red targeting brackets/reticle on hover */}
      <group ref={bracketsRef} visible={false}>
        <lineSegments geometry={bracketGeometry}>
          <lineBasicMaterial color="#dc2626" opacity={0.8} transparent />
        </lineSegments>
        {/* Rotating torus scan ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.8, 0.02, 8, 32]} />
          <meshBasicMaterial
            color="#dc2626"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Flash sphere - white flash during laser impact at phase 1 */}
      <mesh ref={flashSphereRef} visible={false}>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shockwave ring - torus that expands and fades during phase 2 */}
      <mesh ref={shockwaveRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.8, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
