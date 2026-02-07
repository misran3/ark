'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SolarFlareProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

interface TendrilData {
  geometry: THREE.BufferGeometry;
  baseAngle: number;
  positions: Float32Array;
}

interface TendrilSystem {
  tendrils: TendrilData[];
  count: number;
  pointsPerTendril: number;
}

/**
 * Solar Flare threat visual: represents upcoming charges and auto-renewals.
 *
 * Features:
 * - Radiant core with pulsing opacity
 * - Corona particle system (120 particles radiating outward)
 * - Multiple expanding wave rings (countdown rings)
 * - Animated flare rays with length variation
 * - Outer glow with pulse
 * - Targeting brackets on hover
 * - Point light for local illumination
 */
export default function SolarFlare({
  position,
  size = 2,
  color = '#fbbf24',
  onHover,
  onClick,
}: SolarFlareProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const outerGlow2Ref = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Points>(null);
  const coronaTrailRef = useRef<THREE.Points>(null);
  const raysRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const bracketsRef = useRef<THREE.Group>(null);
  const lensFlareRef = useRef<THREE.Group>(null);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const tendrillGroupRef = useRef<THREE.Group>(null);
  const isHoveredRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);

  // Corona particle system
  const coronaSystem = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    const maxRadii = new Float32Array(count);

    const goldColor = new THREE.Color('#fbbf24');
    const orangeColor = new THREE.Color('#f97316');
    const whiteColor = new THREE.Color('#fef3c7');

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = size * 0.3 + Math.random() * size * 0.7;
      speeds[i] = 0.3 + Math.random() * 0.5;
      maxRadii[i] = size * (1.0 + Math.random() * 0.8);

      const angle = angles[i];
      const r = radii[i];
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * size * 0.3;

      // Color gradient: white near core → gold → orange at edge
      const t = (r - size * 0.3) / (size * 0.7);
      let particleColor: THREE.Color;
      if (t < 0.3) {
        particleColor = new THREE.Color().lerpColors(whiteColor, goldColor, t / 0.3);
      } else {
        particleColor = new THREE.Color().lerpColors(goldColor, orangeColor, (t - 0.3) / 0.7);
      }
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Corona trail system (for particle trails)
    const trailPositions = new Float32Array(count * 3);
    const trailColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      trailPositions[i * 3] = positions[i * 3];
      trailPositions[i * 3 + 1] = positions[i * 3 + 1];
      trailPositions[i * 3 + 2] = positions[i * 3 + 2];
      trailColors[i * 3] = colors[i * 3] * 0.6;
      trailColors[i * 3 + 1] = colors[i * 3 + 1] * 0.6;
      trailColors[i * 3 + 2] = colors[i * 3 + 2] * 0.6;
    }
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    return { geometry, positions, colors, count, radii, angles, speeds, maxRadii, trailGeometry, trailPositions, trailColors };
  }, [size]);

  // Plasma tendril system
  const tendrilSystem = useMemo(() => {
    const count = 6;
    const pointsPerTendril = 12;
    const tendrils: TendrilData[] = [];

    for (let t = 0; t < count; t++) {
      const baseAngle = (t / count) * Math.PI * 2;
      const positions = new Float32Array(pointsPerTendril * 3);

      // Initialize positions along the tendril path
      for (let p = 0; p < pointsPerTendril; p++) {
        const progress = p / (pointsPerTendril - 1);
        const radius = size * 0.3 + progress * (size * 0.9);
        positions[p * 3] = Math.cos(baseAngle) * radius;
        positions[p * 3 + 1] = Math.sin(baseAngle) * radius;
        positions[p * 3 + 2] = 0;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      tendrils.push({ geometry, baseAngle, positions });
    }

    return { tendrils, count, pointsPerTendril };
  }, [size]);

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
      coronaSystem.geometry.dispose();
      coronaSystem.trailGeometry.dispose();
      bracketGeometry.dispose();
      tendrilSystem.tendrils.forEach(tendril => {
        tendril.geometry.dispose();
      });
    };
  }, [coronaSystem.geometry, coronaSystem.trailGeometry, bracketGeometry, tendrilSystem.tendrils]);

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

    // Update collapse timer
    if (isCollapsingRef.current) {
      collapseStartTimeRef.current += delta;
    }

    const elapsed = collapseStartTimeRef.current;
    const progress = Math.min(elapsed / 2.5, 1.0);

    // Slow rotation
    groupRef.current.rotation.z += 0.015;

    // Core animation with collapse phases
    if (coreRef.current) {
      let corePulse = Math.sin(time * 3) * 0.2 + 0.8;
      let coreScale = isHoveredRef.current ? 1.2 : 1.0;
      coreScale += Math.sin(time * 4) * 0.05;

      const coreMat = coreRef.current.material as THREE.MeshBasicMaterial;

      if (isCollapsingRef.current) {
        if (progress < 0.32) {
          // Phase 1: CME - core brightens and scales up
          corePulse = 1.0 + (progress / 0.32) * 0.5;
          coreScale = 1.0 + (progress / 0.32) * 0.5;
          const whiteColor = new THREE.Color('#ffffff');
          const goldColor = new THREE.Color('#fbbf24');
          coreMat.color.lerpColors(goldColor, whiteColor, progress / 0.32);
        } else if (progress < 0.68) {
          // Phase 2: Collapse - core shrinks rapidly
          const collapseProgress = (progress - 0.32) / 0.36;
          coreScale = 1.5 * (1.0 - collapseProgress * collapseProgress);
          corePulse = 1.5 * (1.0 - collapseProgress);
          const whiteColor = new THREE.Color('#ffffff');
          const goldColor = new THREE.Color('#fbbf24');
          coreMat.color.lerpColors(whiteColor, goldColor, collapseProgress);
        } else {
          // Phase 3: Afterglow - fade out
          const afterglowProgress = (progress - 0.68) / 0.32;
          coreScale = 0.1 * (1.0 - afterglowProgress);
          corePulse = 0.1 * (1.0 - afterglowProgress);
        }
      }

      coreMat.opacity = corePulse;
      coreRef.current.scale.setScalar(Math.max(0.01, coreScale));
    }

    // Animate corona particles — radiate outward, respawn at core
    if (coronaRef.current && coronaTrailRef.current) {
      const posAttr = coronaRef.current.geometry.attributes.position;
      const colAttr = coronaRef.current.geometry.attributes.color;
      const trailPosAttr = coronaTrailRef.current.geometry.attributes.position;
      const trailColAttr = coronaTrailRef.current.geometry.attributes.color;

      const pos = posAttr.array as Float32Array;
      const col = colAttr.array as Float32Array;
      const trailPos = trailPosAttr.array as Float32Array;
      const trailCol = trailColAttr.array as Float32Array;

      const goldColor = new THREE.Color('#fbbf24');
      const orangeColor = new THREE.Color('#f97316');
      const whiteColor = new THREE.Color('#fef3c7');

      for (let i = 0; i < coronaSystem.count; i++) {
        // Copy current position to trail before updating
        trailPos[i * 3] = pos[i * 3];
        trailPos[i * 3 + 1] = pos[i * 3 + 1];
        trailPos[i * 3 + 2] = pos[i * 3 + 2];
        trailCol[i * 3] = col[i * 3] * 0.6;
        trailCol[i * 3 + 1] = col[i * 3 + 1] * 0.6;
        trailCol[i * 3 + 2] = col[i * 3 + 2] * 0.6;

        // Move outward
        let speed = coronaSystem.speeds[i];
        if (isCollapsingRef.current) {
          if (progress < 0.32) {
            // Phase 1: accelerate outward
            speed *= 3;
          } else if (progress < 0.68) {
            // Phase 2: scatter far outward
            coronaSystem.radii[i] = (size * 0.3 + Math.random() * size * 0.7) + (progress - 0.32) / 0.36 * size * 3;
            speed = 0;
          } else {
            // Phase 3: fade out
            const fadeProgress = (progress - 0.68) / 0.32;
            const coronaMat = coronaRef.current.material as THREE.PointsMaterial;
            const coronaTrailMat = coronaTrailRef.current.material as THREE.PointsMaterial;
            coronaMat.opacity = Math.max(0, 0.7 * (1 - fadeProgress));
            coronaTrailMat.opacity = Math.max(0, 0.28 * (1 - fadeProgress));
          }
        }

        if (progress < 0.68 || !isCollapsingRef.current) {
          coronaSystem.radii[i] += speed * delta;
        }

        // Respawn at core when reaching max
        if (coronaSystem.radii[i] > coronaSystem.maxRadii[i]) {
          coronaSystem.radii[i] = size * 0.3;
          coronaSystem.angles[i] = Math.random() * Math.PI * 2;
          coronaSystem.speeds[i] = 0.3 + Math.random() * 0.5;
        }

        const angle = coronaSystem.angles[i];
        const r = coronaSystem.radii[i];

        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = Math.sin(angle) * r;
        pos[i * 3 + 2] = Math.sin(time + i) * size * 0.05; // Slight Z wobble

        // Update color based on distance
        const t = (r - size * 0.3) / (coronaSystem.maxRadii[i] - size * 0.3);
        let particleColor: THREE.Color;
        if (t < 0.3) {
          particleColor = new THREE.Color().lerpColors(whiteColor, goldColor, t / 0.3);
        } else {
          particleColor = new THREE.Color().lerpColors(goldColor, orangeColor, (t - 0.3) / 0.7);
        }
        col[i * 3] = particleColor.r;
        col[i * 3 + 1] = particleColor.g;
        col[i * 3 + 2] = particleColor.b;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      trailPosAttr.needsUpdate = true;
      trailColAttr.needsUpdate = true;
    }

    // Animate plasma tendrils
    if (tendrillGroupRef.current) {
      const tendrillGroup = tendrillGroupRef.current;
      tendrilSystem.tendrils.forEach((tendril, idx) => {
        const positions = tendril.positions;
        const frequency = 1.0 + idx * 0.3;
        const phase = time * frequency;

        let lengthMultiplier = 1.0;
        let waveFreq = 1.0;
        let tendrillOpacity = 0.6;

        if (isCollapsingRef.current) {
          if (progress < 0.32) {
            // Phase 1: extend to maximum length
            lengthMultiplier = 1.0 + (progress / 0.32) * 0.5;
            waveFreq = 1.0 + (progress / 0.32) * 1.0;
          } else if (progress < 0.68) {
            // Phase 2: retract and fade
            lengthMultiplier = 1.5 * (1.0 - (progress - 0.32) / 0.36);
            tendrillOpacity = 0.6 * (1.0 - (progress - 0.32) / 0.36);
          } else {
            // Phase 3: fully fade
            lengthMultiplier = 0;
            tendrillOpacity = 0;
          }
        } else {
          // Normal hover behavior
          if (isHoveredRef.current) {
            lengthMultiplier = 1.3;
            waveFreq = 2.0;
          }
        }

        // Update tendril positions
        for (let p = 0; p < tendrilSystem.pointsPerTendril; p++) {
          const progressAlongTendril = p / (tendrilSystem.pointsPerTendril - 1);
          const baseRadius = size * 0.3 + progressAlongTendril * size * 0.9;
          const radius = baseRadius * lengthMultiplier;

          // Wave perpendicular to tendril direction
          const waveAmplitude = 0.15 * size;
          const wave = Math.sin(phase * waveFreq + p * 0.5) * waveAmplitude;

          const angle = tendril.baseAngle;
          const perpAngle = angle + Math.PI / 2;

          positions[p * 3] = Math.cos(angle) * radius + Math.cos(perpAngle) * wave;
          positions[p * 3 + 1] = Math.sin(angle) * radius + Math.sin(perpAngle) * wave;
          positions[p * 3 + 2] = Math.sin(time + idx) * size * 0.05;
        }

        const line = tendrillGroup.children[idx] as THREE.Line;
        if (line) {
          const attr = line.geometry.attributes.position;
          attr.needsUpdate = true;

          // Update material opacity
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = tendrillOpacity;

          // Pulse tendril length
          const pulseFactor = Math.sin(phase * 0.5) * 0.3 + 0.7;
          line.scale.y = pulseFactor * lengthMultiplier;
        }
      });
    }

    // Animate flare rays — pulsing length
    if (raysRef.current) {
      raysRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        let rayPulse = Math.sin(time * 3 + i * 0.8) * 0.3 + 0.7;
        let hoverBoost = isHoveredRef.current ? 1.3 : 1.0;

        if (isCollapsingRef.current) {
          if (progress < 0.32) {
            // Phase 1: extend to maximum
            rayPulse = 1.0 + (progress / 0.32) * 0.5;
          } else if (progress < 0.68) {
            // Phase 2: shorten and fade
            rayPulse = 1.5 * (1.0 - (progress - 0.32) / 0.36);
          } else {
            // Phase 3: fade out
            rayPulse = 0.1 * (1.0 - (progress - 0.68) / 0.32);
          }
        }

        mesh.scale.y = rayPulse * hoverBoost;

        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.2 + rayPulse * 0.15;
      });
    }

    // Animate expanding rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        let ringPhase = (time * 0.5 + i * 0.33) % 1.0;

        if (isCollapsingRef.current) {
          // Rings expand faster during phase 1
          if (progress < 0.32) {
            ringPhase = (time * 1.0 + i * 0.33) % 1.0;
          } else {
            // Rings fade during collapse
            ringPhase = 0;
          }
        }

        const ringScale = 0.8 + ringPhase * 0.6;
        mesh.scale.setScalar(ringScale);

        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - ringPhase) * 0.25;
      });
    }

    // Outer glow (primary)
    if (outerGlowRef.current) {
      const mat = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      let glowOpacity = isHoveredRef.current ? 0.1 : 0.05;

      if (isCollapsingRef.current && progress > 0.68) {
        // Phase 3: fade outer glow
        const afterglowProgress = (progress - 0.68) / 0.32;
        glowOpacity = Math.max(0, glowOpacity * (1.0 - afterglowProgress));
      }

      mat.opacity = glowOpacity;
      const glowPulse = Math.sin(time * 2) * 0.05;
      outerGlowRef.current.scale.setScalar(1.0 + glowPulse);
    }

    // Outer glow (secondary, larger)
    if (outerGlow2Ref.current) {
      const mat = outerGlow2Ref.current.material as THREE.MeshBasicMaterial;
      let glowOpacity = isHoveredRef.current ? 0.05 : 0.03;

      if (isCollapsingRef.current && progress > 0.68) {
        const afterglowProgress = (progress - 0.68) / 0.32;
        glowOpacity = Math.max(0, glowOpacity * (1.0 - afterglowProgress));
      }

      mat.opacity = glowOpacity;
      const glowPulse = Math.sin(time * 1.6) * 0.03;
      outerGlow2Ref.current.scale.setScalar(2.0 + glowPulse);
    }

    // Lens flare dots
    if (lensFlareRef.current) {
      lensFlareRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const basePulse = Math.sin(time * 2 + i * Math.PI / 2) * 0.2 + 0.4;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = basePulse;

        if (isCollapsingRef.current && progress > 0.68) {
          const afterglowProgress = (progress - 0.68) / 0.32;
          mat.opacity = Math.max(0, basePulse * (1.0 - afterglowProgress));
        }
      });
    }

    // Flash sphere (appears during collapse)
    if (flashSphereRef.current) {
      if (isCollapsingRef.current) {
        flashSphereRef.current.visible = true;
        let flashOpacity = 0;
        let flashScale = 1.0;

        if (progress < 0.32) {
          // Phase 1: flash starts to appear
          flashOpacity = (progress / 0.32) * 0.8;
          flashScale = 1.0 + (progress / 0.32) * 0.3;
        } else if (progress < 0.68) {
          // Phase 2: flash peaks then fades
          const collapseProgress = (progress - 0.32) / 0.36;
          flashOpacity = 0.8 * (1.0 - collapseProgress * collapseProgress);
          flashScale = 1.3;
        } else {
          // Phase 3: flash fades completely
          const afterglowProgress = (progress - 0.68) / 0.32;
          flashOpacity = Math.max(0, 0.8 * (1.0 - afterglowProgress));
          flashScale = 1.0;
        }

        const mat = flashSphereRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = flashOpacity;
        flashSphereRef.current.scale.setScalar(flashScale);
      } else {
        flashSphereRef.current.visible = false;
      }
    }

    // Targeting brackets
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current && !isCollapsingRef.current;
      if (isHoveredRef.current) {
        bracketsRef.current.rotation.z = time * 0.3;
      }
    }

    // Hover scale
    const targetScale = isHoveredRef.current ? 1.15 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5
    );
  });

  // Pre-compute ray angles
  const rayAngles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2),
    []
  );

  return (
    <group ref={groupRef} position={position}>
      {/* Radiant core */}
      <mesh
        ref={coreRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner bright core (white-hot center) */}
      <mesh>
        <sphereGeometry args={[size * 0.15, 12, 12]} />
        <meshBasicMaterial
          color="#fef3c7"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Plasma tendrils */}
      <group ref={tendrillGroupRef}>
        {tendrilSystem.tendrils.map((tendril, i) => (
          <lineSegments key={i} geometry={tendril.geometry}>
            <lineBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        ))}
      </group>

      {/* Corona particles */}
      <points ref={coronaRef} geometry={coronaSystem.geometry}>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Corona particle trail */}
      <points ref={coronaTrailRef} geometry={coronaSystem.trailGeometry}>
        <pointsMaterial
          size={0.072}
          vertexColors
          transparent
          opacity={0.28}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Animated flare rays */}
      <group ref={raysRef}>
        {rayAngles.map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * size * 0.7,
              Math.sin(angle) * size * 0.7,
              0,
            ]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <coneGeometry args={[0.08, size * 0.6, 4]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Expanding countdown rings */}
      <group ref={ringsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 1.0, 0.03, 8, 48]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer glow (primary) */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow (secondary, larger) */}
      <mesh ref={outerGlow2Ref}>
        <sphereGeometry args={[size * 2.0, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Lens flare dots */}
      <group ref={lensFlareRef}>
        {[
          [size * 1.2, 0, 0],
          [-size * 1.2, 0, 0],
          [0, size * 1.2, 0],
          [0, -size * 1.2, 0],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[size * 0.08, 8, 8]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Flash sphere (collapse animation) */}
      <mesh ref={flashSphereRef} visible={false}>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
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

      {/* Point light */}
      <pointLight
        color={color}
        intensity={1.0}
        distance={size * 8}
        decay={2}
      />
    </group>
  );
}
