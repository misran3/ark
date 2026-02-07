'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from '@/lib/seeded-random';

const DUST_COUNT = 200;

const dustVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aVelocity;
  attribute float aAlpha;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uBoundsMin;
  uniform vec3 uBoundsMax;

  varying float vAlpha;

  void main() {
    // Drift position: wrap around bounds
    vec3 bounds = uBoundsMax - uBoundsMin;
    vec3 pos = position + aVelocity * uTime;
    pos = uBoundsMin + mod(pos - uBoundsMin, bounds);

    vAlpha = aAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 3.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dustFragmentShader = /* glsl */ `
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

    // Pale blue-white dust
    vec3 dustColor = vec3(0.7, 0.75, 0.85);

    gl_FragColor = vec4(dustColor, alpha * vAlpha);
  }
`;

/**
 * SpaceDust — 200 sparse, dim, slowly-drifting particles.
 * Creates subtle depth and motion between the cockpit and far background.
 * GPU-driven drift via vertex shader, wraps at bounds.
 */
export function SpaceDust() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const boundsMin = useMemo(() => new THREE.Vector3(-600, -400, -800), []);
  const boundsMax = useMemo(() => new THREE.Vector3(600, 400, -100), []);

  const { positions, sizes, velocities, alphas } = useMemo(() => {
    const rand = createSeededRandom(42); // fixed seed, separate from starfield

    const positions = new Float32Array(DUST_COUNT * 3);
    const sizes = new Float32Array(DUST_COUNT);
    const velocities = new Float32Array(DUST_COUNT * 3);
    const alphas = new Float32Array(DUST_COUNT);

    for (let i = 0; i < DUST_COUNT; i++) {
      // Random position within bounds
      positions[i * 3] = boundsMin.x + rand() * (boundsMax.x - boundsMin.x);
      positions[i * 3 + 1] = boundsMin.y + rand() * (boundsMax.y - boundsMin.y);
      positions[i * 3 + 2] = boundsMin.z + rand() * (boundsMax.z - boundsMin.z);

      // Slow random velocity (0.5-1.5 units/sec, random direction)
      const speed = 0.5 + rand() * 1.0;
      const theta = rand() * Math.PI * 2;
      const phi = rand() * Math.PI;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed * 0.3; // less Z drift

      // Size: 2-6 pixels
      sizes[i] = 2 + rand() * 4;

      // Alpha: 0.15-0.3, dimmer for more distant spawn positions
      const depthFrac = (positions[i * 3 + 2] - boundsMin.z) / (boundsMax.z - boundsMin.z);
      alphas[i] = 0.15 + depthFrac * 0.15;
    }

    return { positions, sizes, velocities, alphas };
  }, [boundsMin, boundsMax]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aVelocity" args={[velocities, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
          uBoundsMin: { value: boundsMin },
          uBoundsMax: { value: boundsMax },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
