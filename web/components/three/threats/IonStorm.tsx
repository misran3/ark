'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Clock } from 'three';

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
  const particleTrailRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const arcsRef = useRef<THREE.Group>(null);
  const plasmaSpheresRef = useRef<THREE.Mesh[]>([]);
  const flashRef = useRef<THREE.Mesh>(null);
  const coreArcsRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);

  // Particle system with vertex colors
  const particleSystem = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const orbitRadii = new Float32Array(count);
    const orbitAngles = new Float32Array(count);
    const orbitSpeeds = new Float32Array(count);
    const verticalOffsets = new Float32Array(count);
    const initialOrbitRadii = new Float32Array(count);

    const purpleColor = new THREE.Color('#a855f7');
    const pinkColor = new THREE.Color('#ec4899');

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      orbitRadii[i] = radius;
      initialOrbitRadii[i] = radius;
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

    return { geometry, positions, colors, count, orbitRadii, orbitAngles, orbitSpeeds, verticalOffsets, initialOrbitRadii };
  }, [size]);

  // Lightning arc geometry (6 outer arcs + 2-3 core arcs)
  const arcData = useMemo(() => {
    const outerArcCount = 6;
    const coreArcCount = 3;
    const segmentsPerArc = 12;
    const arcs: Float32Array[] = [];
    const coreArcs: Float32Array[] = [];

    for (let a = 0; a < outerArcCount; a++) {
      arcs.push(new Float32Array(segmentsPerArc * 2 * 3));
    }
    for (let a = 0; a < coreArcCount; a++) {
      coreArcs.push(new Float32Array(segmentsPerArc * 2 * 3));
    }
    return { arcs, coreArcs, outerArcCount, coreArcCount, segmentsPerArc };
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

  // Plasma cloud geometry
  const plasmaGeometry = useMemo(() => {
    const count = 4;
    const spheres: { geometry: THREE.BufferGeometry; radius: number; offsetX: number; offsetY: number; offsetZ: number; driftRadius: number; driftSpeed: number }[] = [];
    const colors = ['#a855f7', '#c084fc', '#ec4899'];

    for (let i = 0; i < count; i++) {
      const radius = size * (0.3 + Math.random() * 0.2);
      const offsetX = (Math.random() - 0.5) * size;
      const offsetY = (Math.random() - 0.5) * size * 0.6;
      const offsetZ = (Math.random() - 0.5) * size;
      const driftRadius = 0.2;
      const driftSpeed = 0.5 + Math.random() * 1.0;

      const geo = new THREE.IcosahedronGeometry(radius, 8);
      spheres.push({ geometry: geo, radius, offsetX, offsetY, offsetZ, driftRadius, driftSpeed });
    }

    return { spheres, count };
  }, [size]);

  // Trail particle geometry
  const trailGeometry = useMemo(() => {
    const count = particleSystem.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Initialize with particle colors dimmed
    const purpleColor = new THREE.Color('#a855f7');
    const pinkColor = new THREE.Color('#ec4899');

    for (let i = 0; i < count; i++) {
      const t = particleSystem.initialOrbitRadii[i] / size;
      const particleColor = new THREE.Color().lerpColors(purpleColor, pinkColor, t);
      colors[i * 3] = particleColor.r * 0.6;
      colors[i * 3 + 1] = particleColor.g * 0.6;
      colors[i * 3 + 2] = particleColor.b * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, positions, colors, count };
  }, [particleSystem.count, particleSystem.initialOrbitRadii, size]);

  useEffect(() => {
    return () => {
      particleSystem.geometry.dispose();
      bracketGeometry.dispose();
      trailGeometry.geometry.dispose();
      plasmaGeometry.spheres.forEach((sphere) => sphere.geometry.dispose());
      arcData.arcs.forEach(() => {}); // arcs are disposed with lineSegments
      arcData.coreArcs.forEach(() => {}); // coreArcs are disposed with lineSegments
    };
  }, [particleSystem.geometry, bracketGeometry, trailGeometry.geometry, plasmaGeometry, arcData]);

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
    if (!groupRef.current || !particlesRef.current) return;

    const time = clock.getElapsedTime();

    // Calculate collapse progress
    let collapseProgress = 0;
    if (isCollapsingRef.current) {
      if (collapseStartTimeRef.current === 0) {
        collapseStartTimeRef.current = time;
      }
      const elapsed = time - collapseStartTimeRef.current;
      collapseProgress = Math.min(elapsed / 2.0, 1.0);
      if (collapseProgress >= 1.0) {
        isCollapsingRef.current = false;
      }
    }

    // Vortex rotation
    groupRef.current.rotation.y += 0.008;
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.15;

    // Animate particles in vortex pattern
    const posAttr = particlesRef.current.geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
    const pointsOpacity = particlesRef.current.material as THREE.PointsMaterial;

    // Copy current positions to trail before updating
    if (particleTrailRef.current && collapseProgress === 0) {
      const trailPos = particleTrailRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;
        trailPos[i3] = pos[i3];
        trailPos[i3 + 1] = pos[i3 + 1];
        trailPos[i3 + 2] = pos[i3 + 2];
      }
      particleTrailRef.current.geometry.attributes.position.needsUpdate = true;
    }

    for (let i = 0; i < particleSystem.count; i++) {
      const i3 = i * 3;

      let radius = particleSystem.orbitRadii[i];
      const initialRadius = particleSystem.initialOrbitRadii[i];

      // Apply collapse phases
      if (collapseProgress > 0) {
        if (collapseProgress < 0.3) {
          // Phase 1 (0-0.3): Containment Pulse - tighten particles inward
          const phase1Progress = collapseProgress / 0.3;
          radius = initialRadius * (1 - phase1Progress * 0.5);
        } else if (collapseProgress < 0.65) {
          // Phase 2 (0.3-0.65): Dispersal - scatter particles outward
          const phase2Progress = (collapseProgress - 0.3) / 0.35;
          radius = initialRadius * (1 + phase2Progress * 3);
        } else {
          // Phase 3 (0.65-1.0): Fade Out - scatter to large radius
          const phase3Progress = (collapseProgress - 0.65) / 0.35;
          radius = initialRadius * (1 + (0.35 + phase3Progress * 4));
        }
      }

      // Update orbit angle (faster near center = vortex)
      const speedMultiplier = 1 - (radius / size) * 0.6;
      particleSystem.orbitAngles[i] += particleSystem.orbitSpeeds[i] * speedMultiplier * delta;

      const angle = particleSystem.orbitAngles[i];
      const vertOff = particleSystem.verticalOffsets[i];

      // Vortex: particles orbit in XZ plane with Y offset + turbulence
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = vertOff + Math.sin(time * 2 + i * 0.1) * size * 0.08;
      pos[i3 + 2] = Math.sin(angle) * radius;
    }
    posAttr.needsUpdate = true;

    // Particle opacity during collapse
    if (collapseProgress > 0.65) {
      const phase3Progress = (collapseProgress - 0.65) / 0.35;
      pointsOpacity.opacity = 0.7 * (1 - phase3Progress);
    } else {
      pointsOpacity.opacity = 0.7;
    }

    // Core glow pulse and collapse animation
    if (coreGlowRef.current) {
      let coreOpacity = 0.3;
      let coreScale = 1.0;

      if (collapseProgress > 0) {
        if (collapseProgress < 0.3) {
          // Phase 1: expand and brighten
          const phase1Progress = collapseProgress / 0.3;
          coreScale = 1.0 + phase1Progress * 1.5;
          coreOpacity = 0.3 + phase1Progress * 0.5;
        } else if (collapseProgress < 0.65) {
          // Phase 2: maintain then dim
          const phase2Progress = (collapseProgress - 0.3) / 0.35;
          coreScale = 2.5 * (1 - phase2Progress * 0.2);
          coreOpacity = 0.8 * (1 - phase2Progress);
        } else {
          // Phase 3: fade
          coreOpacity = 0;
          coreScale = 1.0;
        }
      } else {
        const basePulse = Math.sin(time * 3) * 0.15 + 0.85;
        coreOpacity = isHoveredRef.current ? 0.5 * basePulse : 0.3 * basePulse;
        coreScale = isHoveredRef.current ? 1.3 : 1.0;
      }

      const mat = coreGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = coreOpacity;
      coreGlowRef.current.scale.setScalar(coreScale);
    }

    // Flash sphere for containment pulse
    if (flashRef.current) {
      if (collapseProgress > 0 && collapseProgress < 0.3) {
        flashRef.current.visible = true;
        const phase1Progress = collapseProgress / 0.3;
        flashRef.current.scale.setScalar(1.0 + phase1Progress * 2.0);
        const flashMat = flashRef.current.material as THREE.MeshBasicMaterial;
        flashMat.opacity = 0.6 * (1 - phase1Progress);
      } else {
        flashRef.current.visible = false;
      }
    }

    // Outer glow
    if (outerGlowRef.current) {
      const mat = outerGlowRef.current.material as THREE.MeshBasicMaterial;

      if (collapseProgress > 0.65) {
        const phase3Progress = (collapseProgress - 0.65) / 0.35;
        mat.opacity = 0.06 * (1 - phase3Progress);
      } else {
        mat.opacity = isHoveredRef.current ? 0.12 : 0.06;
      }

      const glowPulse = Math.sin(time * 1.5) * 0.05;
      outerGlowRef.current.scale.setScalar(1.0 + glowPulse);
    }

    // Plasma spheres
    if (plasmaGeometry.spheres.length > 0) {
      plasmaGeometry.spheres.forEach((sphere, idx) => {
        if (idx >= plasmaSpheresRef.current.length) return;

        const mesh = plasmaSpheresRef.current[idx];
        const phase = (idx / plasmaGeometry.count) * Math.PI * 2;
        const driftX = Math.cos(time * sphere.driftSpeed + phase) * sphere.driftRadius;
        const driftZ = Math.sin(time * sphere.driftSpeed + phase) * sphere.driftRadius;

        mesh.position.set(sphere.offsetX + driftX, sphere.offsetY, sphere.offsetZ + driftZ);

        const mat = mesh.material as THREE.MeshBasicMaterial;
        const baseSine = Math.sin(time * 2 + idx * Math.PI / 2);
        let opacity = 0.04 + (baseSine * 0.5 + 0.5) * 0.08;

        // Scatter plasma clouds during dispersal
        if (collapseProgress > 0.6 && collapseProgress < 1.0) {
          const dispersalProgress = (collapseProgress - 0.6) / 0.4;
          const scatterDistance = 3.0 * dispersalProgress;
          mesh.scale.setScalar(1.0 + scatterDistance);
          opacity *= (1 - dispersalProgress);
        } else {
          mesh.scale.setScalar(1.0);
        }

        mat.opacity = opacity;
      });
    }

    // Animated lightning arcs (outer arcs)
    if (arcsRef.current) {
      let arcOpacity = isHoveredRef.current ? 0.6 : 0.2;

      // During phase 1 of collapse, intensify arcs
      if (collapseProgress > 0 && collapseProgress < 0.3) {
        arcOpacity = 0.8;
      } else if (collapseProgress > 0.3 && collapseProgress < 0.65) {
        // Phase 2: fade arcs
        const phase2Progress = (collapseProgress - 0.3) / 0.35;
        arcOpacity = 0.8 * (1 - phase2Progress);
      } else if (collapseProgress >= 0.65) {
        arcOpacity = 0;
      }

      arcsRef.current.children.forEach((child, arcIndex) => {
        if (!(child instanceof THREE.LineSegments)) return;

        const arcPos = child.geometry.attributes.position.array as Float32Array;
        const segCount = arcData.segmentsPerArc;

        // Generate new arc path - 10% chance normally, every frame during phase 1
        const shouldRegenerate = (collapseProgress > 0 && collapseProgress < 0.3) || Math.random() < 0.3;

        if (shouldRegenerate) {
          const startTheta = (arcIndex / arcData.outerArcCount) * Math.PI * 2 + time * 0.5;
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

    // Core arcs (emanate from center)
    if (coreArcsRef.current) {
      let coreArcOpacity = isHoveredRef.current ? 0.3 : 0.1;

      if (collapseProgress > 0 && collapseProgress < 0.3) {
        coreArcOpacity = 0.9;
      } else if (collapseProgress > 0.3 && collapseProgress < 0.65) {
        const phase2Progress = (collapseProgress - 0.3) / 0.35;
        coreArcOpacity = 0.9 * (1 - phase2Progress);
      } else if (collapseProgress >= 0.65) {
        coreArcOpacity = 0;
      }

      coreArcsRef.current.children.forEach((child, arcIndex) => {
        if (!(child instanceof THREE.LineSegments)) return;

        const arcPos = child.geometry.attributes.position.array as Float32Array;
        const segCount = arcData.segmentsPerArc;

        const shouldRegenerate = (collapseProgress > 0 && collapseProgress < 0.3) || Math.random() < 0.2;

        if (shouldRegenerate) {
          const endTheta = (arcIndex / arcData.coreArcCount) * Math.PI * 2 + time * 0.3;
          const endRadius = size * (0.8 + Math.random() * 0.4);

          for (let s = 0; s < segCount; s++) {
            const t = s / (segCount - 1);
            const nextT = (s + 1) / segCount;

            const r1 = endRadius * t;
            const a1 = endTheta;
            const jitter1 = (Math.random() - 0.5) * size * 0.1;

            const r2 = endRadius * nextT;
            const a2 = endTheta;
            const jitter2 = (Math.random() - 0.5) * size * 0.1;

            const idx = s * 6;
            arcPos[idx] = Math.cos(a1) * r1 + jitter1;
            arcPos[idx + 1] = (Math.random() - 0.5) * size * 0.2;
            arcPos[idx + 2] = Math.sin(a1) * r1 + jitter1;
            arcPos[idx + 3] = Math.cos(a2) * r2 + jitter2;
            arcPos[idx + 4] = (Math.random() - 0.5) * size * 0.2;
            arcPos[idx + 5] = Math.sin(a2) * r2 + jitter2;
          }
          child.geometry.attributes.position.needsUpdate = true;
        }

        const mat = child.material as THREE.LineBasicMaterial;
        // Mix white-pink color
        const colorMix = 0.3 + Math.sin(time * 4 + arcIndex) * 0.7;
        const white = new THREE.Color(0xffffff);
        const pink = new THREE.Color('#ec4899');
        const mixedColor = new THREE.Color().lerpColors(white, pink, colorMix);
        mat.color = mixedColor;
        mat.opacity = coreArcOpacity * (0.5 + Math.random() * 0.5);
      });
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current && collapseProgress === 0;
      if (isHoveredRef.current && collapseProgress === 0) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }

    // Hover scale
    const targetScale = isHoveredRef.current && collapseProgress === 0 ? 1.1 : 1.0;
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
        onClick={handleClick}
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

      {/* Particle trail effect */}
      <points
        ref={particleTrailRef}
        geometry={trailGeometry.geometry}
      >
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Plasma cloud spheres */}
      {plasmaGeometry.spheres.map((sphere, i) => (
        <mesh
          key={`plasma-${i}`}
          ref={(el) => {
            if (el) plasmaSpheresRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[sphere.radius, 12, 12]} />
          <meshBasicMaterial
            color={['#a855f7', '#c084fc', '#ec4899'][i % 3]}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

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

      {/* Flash sphere for containment pulse */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.6}
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
        {Array.from({ length: arcData.outerArcCount }).map((_, i) => (
          <lineSegments key={`arc-${i}`}>
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

      {/* Core arcs (emanate from center) */}
      <group ref={coreArcsRef}>
        {Array.from({ length: arcData.coreArcCount }).map((_, i) => (
          <lineSegments key={`core-arc-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[arcData.coreArcs[i], 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ffffff"
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
