'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BlackHoleProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

// Easing functions for smooth animations
const easeInQuad = (t: number) => t * t;
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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
  const trailPointsRef = useRef<THREE.Points>(null);
  const isHoveredRef = useRef(false);
  const bracketsRef = useRef<THREE.Group>(null);
  const isCollapsingRef = useRef(false);
  const collapseStartTimeRef = useRef(0);
  const scanningBeamRef = useRef<THREE.Mesh>(null);
  const flashSphereRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);

  // Growth state - black hole grows over time (2% per 10 seconds)
  const growthStartTimeRef = useRef(0);
  const growthScaleRef = useRef(1.0);

  // Base size (will be scaled by growth)
  const baseEventHorizonRadius = size * 0.8;
  const eventHorizonRadius = baseEventHorizonRadius * growthScaleRef.current;
  const diskOuterRadius = eventHorizonRadius * 1.5;
  const diskThickness = 0.3;

  // Create accretion disk particle system with trail tracking
  const particleSystem = useMemo(() => {
    const count = Math.floor(400 + Math.random() * 200); // 400-600 particles
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const spiralAngles = new Float32Array(count);
    const spiralRadii = new Float32Array(count);
    const trailX = new Float32Array(count); // Previous position for trail
    const trailY = new Float32Array(count);
    const trailZ = new Float32Array(count);
    const trailPositions = new Float32Array(count * 3); // Trail geometry positions

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

      // Initialize trail at same position
      trailX[i] = positions[i * 3];
      trailY[i] = positions[i * 3 + 1];
      trailZ[i] = positions[i * 3 + 2];

      // Initialize trail geometry positions
      trailPositions[i * 3] = positions[i * 3];
      trailPositions[i * 3 + 1] = positions[i * 3 + 1];
      trailPositions[i * 3 + 2] = positions[i * 3 + 2];

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

    // Create trail geometry
    const trailGeometry = new THREE.BufferGeometry();
    const trailColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      trailColors[i * 3] = colors[i * 3] * 0.6;
      trailColors[i * 3 + 1] = colors[i * 3 + 1] * 0.6;
      trailColors[i * 3 + 2] = colors[i * 3 + 2] * 0.6;
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    return { geometry, positions, colors, velocities, count, spiralAngles, spiralRadii, trailX, trailY, trailZ, trailGeometry, trailPositions, trailColors };
  }, [baseEventHorizonRadius, diskOuterRadius, diskThickness]);

  // Gravitational lensing distortion shader material
  const lensingMaterial = useMemo(() => {
    const vertexShader = `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 blackHoleCenter;
      uniform float blackHoleRadius;
      uniform float distortionStrength;
      varying vec3 vPosition;

      void main() {
        vec3 toBlackHole = blackHoleCenter - vPosition;
        float dist = length(toBlackHole);

        // Inverse square law for gravitational lensing
        float lensStrength = 1.0 / (dist * dist + 0.5);
        float distortion = lensStrength * distortionStrength;

        // Create a chromatic aberration-like effect
        vec3 direction = normalize(toBlackHole);
        float warpAmount = distortion * 0.1;

        // Output as a distortion map (visualized as a purple glow)
        float intensity = smoothstep(blackHoleRadius * 3.0, blackHoleRadius * 1.0, dist);
        gl_FragColor = vec4(vec3(0.6, 0.2, 0.8) * intensity * warpAmount, intensity * 0.3);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        blackHoleCenter: { value: new THREE.Vector3(0, 0, 0) },
        blackHoleRadius: { value: eventHorizonRadius },
        distortionStrength: { value: 0.3 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [eventHorizonRadius]);

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
      particleSystem.trailGeometry.dispose();
    };
  }, [bracketGeometry, particleSystem.geometry, particleSystem.trailGeometry]);

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

    // Update growth scale (2% per 10 seconds) - but freeze during collapse
    if (!isCollapsingRef.current) {
      const growthTime = time - growthStartTimeRef.current;
      growthScaleRef.current = 1.0 + (growthTime / 10.0) * 0.02;
    }

    // Update particle positions for accretion disk
    const posAttr = accretionDiskRef.current.geometry.attributes.position;
    const colorAttr = accretionDiskRef.current.geometry.attributes.color;
    const pos = posAttr.array as Float32Array;
    const col = colorAttr.array as Float32Array;

    // Update trail positions
    const trailPosAttr = trailPointsRef.current?.geometry.attributes.position;
    const trailPos = trailPosAttr?.array as Float32Array | undefined;
    const trailColorAttr = trailPointsRef.current?.geometry.attributes.color;
    const trailCol = trailColorAttr?.array as Float32Array | undefined;

    const purpleColor = new THREE.Color('#4c1d95');
    const blueColor = new THREE.Color('#1e3a8a');
    const goldColor = new THREE.Color('#fbbf24');

    // If collapsing, animate the collapse sequence (3s total)
    if (isCollapsingRef.current && elapsedTime < 3.0) {
      const progress = elapsedTime / 3.0; // 0 to 1

      if (progress < 1.0 / 3.0) {
        // Phase 1 (0-1s): Scanning beam & particle extraction
        const phase1Progress = progress / (1.0 / 3.0);
        const scanningBeamRotation = phase1Progress * Math.PI * 2;

        // Update scanning beam visibility and rotation
        if (scanningBeamRef.current) {
          scanningBeamRef.current.visible = true;
          scanningBeamRef.current.rotation.z = scanningBeamRotation;
          const beamMaterial = scanningBeamRef.current.material as THREE.MeshBasicMaterial;
          beamMaterial.opacity = 0.8 * (1 - phase1Progress * 0.3); // Fade out over phase 1
        }

        for (let i = 0; i < particleSystem.count; i++) {
          const i3 = i * 3;
          const angle = particleSystem.spiralAngles[i];
          const radius = particleSystem.spiralRadii[i];
          const y = (Math.random() - 0.5) * diskThickness * 0.1;

          pos[i3] = Math.cos(angle) * radius;
          pos[i3 + 1] = y;
          pos[i3 + 2] = Math.sin(angle) * radius;

          // Update trail
          if (trailPos) {
            trailPos[i3] = particleSystem.trailX[i];
            trailPos[i3 + 1] = particleSystem.trailY[i];
            trailPos[i3 + 2] = particleSystem.trailZ[i];
          }

          // Particles start brightening
          const colorLerp = 1 - (radius / diskOuterRadius) * 0.5;
          const particleColor = new THREE.Color().lerpColors(blueColor, purpleColor, colorLerp);
          const brightFactor = 1 + phase1Progress * 0.5;
          col[i3] = Math.min(1, particleColor.r * brightFactor);
          col[i3 + 1] = Math.min(1, particleColor.g * brightFactor);
          col[i3 + 2] = Math.min(1, particleColor.b * brightFactor);

          // Trail colors darker
          if (trailCol) {
            trailCol[i3] = Math.min(1, particleColor.r * brightFactor * 0.5);
            trailCol[i3 + 1] = Math.min(1, particleColor.g * brightFactor * 0.5);
            trailCol[i3 + 2] = Math.min(1, particleColor.b * brightFactor * 0.5);
          }
        }

        if (trailColorAttr) trailColorAttr.needsUpdate = true;
        if (trailPosAttr) trailPosAttr.needsUpdate = true;
      } else if (progress < 2.0 / 3.0) {
        // Phase 2 (1-2s): Accretion disk reversal & color shift to gold
        const phase2Progress = (progress - 1.0 / 3.0) / (1.0 / 3.0);

        // Hide scanning beam in phase 2
        if (scanningBeamRef.current) {
          scanningBeamRef.current.visible = false;
        }

        for (let i = 0; i < particleSystem.count; i++) {
          const i3 = i * 3;

          // Store previous position for trail
          particleSystem.trailX[i] = pos[i3];
          particleSystem.trailY[i] = pos[i3 + 1];
          particleSystem.trailZ[i] = pos[i3 + 2];

          // Reverse spiral direction
          const angle = particleSystem.spiralAngles[i] - phase2Progress * Math.PI * 4;
          const radius = diskOuterRadius * (1 - phase2Progress * 0.5);

          pos[i3] = Math.cos(angle) * radius;
          pos[i3 + 2] = Math.sin(angle) * radius;

          // Update trail
          if (trailPos) {
            trailPos[i3] = particleSystem.trailX[i];
            trailPos[i3 + 1] = particleSystem.trailY[i];
            trailPos[i3 + 2] = particleSystem.trailZ[i];
          }

          // Color shift: purple/blue -> gold
          const mixedColor = new THREE.Color().lerpColors(blueColor, goldColor, phase2Progress);
          col[i3] = mixedColor.r;
          col[i3 + 1] = mixedColor.g;
          col[i3 + 2] = mixedColor.b;

          // Trail colors darker
          if (trailCol) {
            trailCol[i3] = mixedColor.r * 0.5;
            trailCol[i3 + 1] = mixedColor.g * 0.5;
            trailCol[i3 + 2] = mixedColor.b * 0.5;
          }
        }

        if (trailColorAttr) trailColorAttr.needsUpdate = true;
        if (trailPosAttr) trailPosAttr.needsUpdate = true;
      } else {
        // Phase 3 (2-3s): Final implosion - flash + shockwave
        const phase3Progress = (progress - 2.0 / 3.0) / (1.0 / 3.0);

        // Flash sphere: appears at ~2.5s and quickly scales up then fades
        if (flashSphereRef.current) {
          flashSphereRef.current.visible = elapsedTime >= 2.5;
          if (elapsedTime >= 2.5) {
            const flashProgress = Math.min(1, (elapsedTime - 2.5) / 0.3); // 0.3s duration
            flashSphereRef.current.scale.setScalar(1 + flashProgress * 2);
            const flashMaterial = flashSphereRef.current.material as THREE.MeshBasicMaterial;
            flashMaterial.opacity = Math.max(0, 1 - flashProgress * 1.5);
          }
        }

        // Shockwave ring: expands and fades during phase 3
        if (shockwaveRingRef.current) {
          shockwaveRingRef.current.visible = elapsedTime >= 2.5;
          if (elapsedTime >= 2.5) {
            const shockwaveProgress = Math.min(1, (elapsedTime - 2.5) / 0.4); // 0.4s duration
            shockwaveRingRef.current.scale.setScalar(1 + shockwaveProgress * 3);
            const shockwaveMaterial = shockwaveRingRef.current.material as THREE.MeshBasicMaterial;
            shockwaveMaterial.opacity = Math.max(0, 0.8 * (1 - shockwaveProgress));
          }
        }

        for (let i = 0; i < particleSystem.count; i++) {
          const i3 = i * 3;

          // Store previous position for trail
          particleSystem.trailX[i] = pos[i3];
          particleSystem.trailY[i] = pos[i3 + 1];
          particleSystem.trailZ[i] = pos[i3 + 2];

          // Rapid collapse toward center
          const angle = particleSystem.spiralAngles[i] + phase3Progress * Math.PI * 6;
          const radius = diskOuterRadius * (1 - phase3Progress * 0.95);

          pos[i3] = Math.cos(angle) * radius;
          pos[i3 + 2] = Math.sin(angle) * radius;

          // Update trail
          if (trailPos) {
            trailPos[i3] = particleSystem.trailX[i];
            trailPos[i3 + 1] = particleSystem.trailY[i];
            trailPos[i3 + 2] = particleSystem.trailZ[i];
          }

          // Fade gold particles
          col[i3] = goldColor.r * (1 - phase3Progress);
          col[i3 + 1] = goldColor.g * (1 - phase3Progress);
          col[i3 + 2] = goldColor.b * (1 - phase3Progress);

          // Trail colors darker
          if (trailCol) {
            trailCol[i3] = goldColor.r * (1 - phase3Progress) * 0.5;
            trailCol[i3 + 1] = goldColor.g * (1 - phase3Progress) * 0.5;
            trailCol[i3 + 2] = goldColor.b * (1 - phase3Progress) * 0.5;
          }
        }

        if (trailColorAttr) trailColorAttr.needsUpdate = true;
        if (trailPosAttr) trailPosAttr.needsUpdate = true;
      }

      // Shrink event horizon during collapse
      if (eventHorizonRef.current) {
        const horizonScale = 1 - (elapsedTime / 1.5) * 0.75;
        eventHorizonRef.current.scale.setScalar(Math.max(0.1, horizonScale));

        // Add blue glow edge to event horizon during collapse
        const glowIntensity = (elapsedTime / 3.0) * 0.3;
        const glowMaterial = eventHorizonRef.current.material as THREE.MeshBasicMaterial;
        glowMaterial.color.setHSL(0.65, 1, Math.min(0.4, 0.2 + glowIntensity));
      }

      // Create implosion flash around 2.5s mark
      if (elapsedTime >= 2.5 && elapsedTime < 2.6 && groupRef.current) {
        // Add a white flash sphere for visual impact (done in render section)
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Hide collapse-only elements during collapse
      if (scanningBeamRef.current && !scanningBeamRef.current.visible) {
        scanningBeamRef.current.visible = false;
      }
      if (flashSphereRef.current && !flashSphereRef.current.visible) {
        flashSphereRef.current.visible = false;
      }
      if (shockwaveRingRef.current && !shockwaveRingRef.current.visible) {
        shockwaveRingRef.current.visible = false;
      }
    } else if (!isCollapsingRef.current) {
      // Normal spiral motion (not collapsing)
      const hoverSpeedMultiplier = isHoveredRef.current ? 1.5 : 1.0;

      for (let i = 0; i < particleSystem.count; i++) {
        const i3 = i * 3;

        // Store previous position for trail
        particleSystem.trailX[i] = pos[i3];
        particleSystem.trailY[i] = pos[i3 + 1];
        particleSystem.trailZ[i] = pos[i3 + 2];

        // Current radius and angle
        let radius = particleSystem.spiralRadii[i];
        let angle = particleSystem.spiralAngles[i];

        // Logarithmic spiral inward with hover speed boost
        const speedFactor = 1 - radius / diskOuterRadius;
        const spiralSpeed = (0.3 + speedFactor * 0.7) * hoverSpeedMultiplier;
        const inwardSpeed = (0.8 + speedFactor * 0.5) * hoverSpeedMultiplier;

        // Update angle
        angle += spiralSpeed * delta;
        particleSystem.spiralAngles[i] = angle;

        // Update radius
        radius -= inwardSpeed * delta;

        // Respawn at outer edge if reached inner radius
        if (radius < eventHorizonRadius * 1.1) {
          radius = diskOuterRadius;
          angle = Math.random() * Math.PI * 2;
          particleSystem.spiralAngles[i] = angle;
        }

        particleSystem.spiralRadii[i] = radius;

        // Update position in flat disk
        const y = (Math.random() - 0.5) * diskThickness * 0.1;
        pos[i3] = Math.cos(angle) * radius;
        pos[i3 + 1] = y;
        pos[i3 + 2] = Math.sin(angle) * radius;

        // Update trail
        if (trailPos) {
          trailPos[i3] = particleSystem.trailX[i];
          trailPos[i3 + 1] = particleSystem.trailY[i];
          trailPos[i3 + 2] = particleSystem.trailZ[i];
        }

        // Update color: outer = purple, inner = blue, brightened on hover
        const colorLerp = 1 - (radius / diskOuterRadius) * 0.5;
        const particleColor = new THREE.Color().lerpColors(blueColor, purpleColor, colorLerp);

        if (isHoveredRef.current) {
          // Brighten particles on hover
          col[i3] = Math.min(1, particleColor.r * 1.3);
          col[i3 + 1] = Math.min(1, particleColor.g * 1.3);
          col[i3 + 2] = Math.min(1, particleColor.b * 1.3);
        } else {
          col[i3] = particleColor.r;
          col[i3 + 1] = particleColor.g;
          col[i3 + 2] = particleColor.b;
        }

        // Trail colors darker
        if (trailCol) {
          if (isHoveredRef.current) {
            trailCol[i3] = Math.min(1, particleColor.r * 1.3 * 0.5);
            trailCol[i3 + 1] = Math.min(1, particleColor.g * 1.3 * 0.5);
            trailCol[i3 + 2] = Math.min(1, particleColor.b * 1.3 * 0.5);
          } else {
            trailCol[i3] = particleColor.r * 0.5;
            trailCol[i3 + 1] = particleColor.g * 0.5;
            trailCol[i3 + 2] = particleColor.b * 0.5;
          }
        }
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      if (trailColorAttr) trailColorAttr.needsUpdate = true;
      if (trailPosAttr) trailPosAttr.needsUpdate = true;

      // Reset event horizon if it was scaled down
      if (eventHorizonRef.current) {
        eventHorizonRef.current.scale.setScalar(growthScaleRef.current);
        const glowMaterial = eventHorizonRef.current.material as THREE.MeshBasicMaterial;
        glowMaterial.color.setHex(0x000000);
      }

      // Hide collapse-only elements when not collapsing
      if (scanningBeamRef.current) scanningBeamRef.current.visible = false;
      if (flashSphereRef.current) flashSphereRef.current.visible = false;
      if (shockwaveRingRef.current) shockwaveRingRef.current.visible = false;
    }

    // Update lensing material with current black hole position
    if (lensingMaterial) {
      lensingMaterial.uniforms.blackHoleRadius.value = eventHorizonRadius;
      lensingMaterial.uniforms.distortionStrength.value = isHoveredRef.current ? 0.4 : 0.3;
    }

    // Pulsating targeting brackets on hover
    if (bracketsRef.current) {
      bracketsRef.current.visible = isHoveredRef.current && !isCollapsingRef.current;
      if (isHoveredRef.current) {
        // Rotation + pulsing scale
        bracketsRef.current.rotation.z = time * 0.3;
        const pulse = 0.5 + Math.sin(time * 2 * Math.PI) * 0.5; // 1s cycle
        bracketsRef.current.scale.setScalar(1 + pulse * 0.15);
      }
    }

    // Gentle rotation of entire group (only when not collapsing)
    if (!isCollapsingRef.current) {
      groupRef.current.rotation.z += 0.001;
    }

    // When collapse finishes, stop animation
    if (isCollapsingRef.current && elapsedTime >= 3.0) {
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
          size={isHoveredRef.current ? 0.12 : 0.08}
          vertexColors
          transparent
          opacity={isHoveredRef.current ? 0.85 : 0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Particle trails - motion blur effect */}
      <points
        ref={trailPointsRef}
        geometry={particleSystem.trailGeometry}
      >
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.3}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Scanning beam - bright blue beam during collapse phase 1 */}
      <mesh
        ref={scanningBeamRef}
        visible={false}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Flash sphere - white flash during implosion at ~2.5s */}
      <mesh
        ref={flashSphereRef}
        visible={false}
      >
        <sphereGeometry args={[baseEventHorizonRadius, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shockwave ring - torus that expands and fades during phase 3 */}
      <mesh
        ref={shockwaveRingRef}
        visible={false}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[baseEventHorizonRadius * 0.8, 0.15, 16, 64]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Event horizon - pure black void sphere with growth scaling */}
      <mesh
        ref={eventHorizonRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={growthScaleRef.current}
      >
        <sphereGeometry args={[baseEventHorizonRadius, 32, 32]} />
        <meshBasicMaterial
          color={0x000000}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Gravitational lensing distortion sphere - creates space warping effect */}
      <mesh scale={growthScaleRef.current * 1.4}>
        <sphereGeometry args={[baseEventHorizonRadius, 32, 32]} />
        <primitive object={lensingMaterial} />
      </mesh>

      {/* Outer glow - Hawking radiation (subtle blue glow) */}
      <mesh scale={growthScaleRef.current}>
        <sphereGeometry args={[baseEventHorizonRadius * 1.3, 16, 16]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={isHoveredRef.current ? 0.1 : 0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sci-fi corner targeting brackets - visible on hover with pulsing */}
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
            opacity={isHoveredRef.current ? 0.6 : 0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Subtle point light for Hawking radiation glow */}
      <pointLight
        color="#3b82f6"
        intensity={isHoveredRef.current ? 0.25 : 0.15}
        distance={baseEventHorizonRadius * 4}
      />
    </group>
  );
}
