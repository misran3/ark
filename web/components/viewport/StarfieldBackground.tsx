'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from '@/lib/seeded-random';

const STAR_COUNT = 800;

// --- GLSL Shaders ---

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aTwinklePhase;
  attribute float aTwinkleSpeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vAlpha;

  void main() {
    // Multi-frequency twinkle: each star has its own speed + phase
    float twinkle = sin(uTime * aTwinkleSpeed + aTwinklePhase) * 0.3 + 0.7;
    vAlpha = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size attenuation: smaller with distance, capped
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;

  void main() {
    // Soft circular dot via distance from point center
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    // Smooth alpha falloff at edges
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

    // Capped brightness: slightly blue-white, not pure white
    vec3 starColor = vec3(0.85, 0.88, 0.95);

    gl_FragColor = vec4(starColor, alpha * vAlpha);
  }
`;

/**
 * GPU-accelerated starfield using Points geometry.
 *
 * Performance:
 * - 800 vertices (1 per star) vs 51,200 triangles (old InstancedMesh approach)
 * - All twinkling computed in vertex shader (GPU)
 * - CPU work: 1 uniform update per frame (uTime)
 * - Seeded PRNG: unique layout per page load, stable within session
 *
 * Visual features:
 * - Per-star size variation (most tiny, ~5% hero stars)
 * - Multi-frequency twinkle (0.2-0.8 Hz per star)
 * - Soft circular dots with alpha falloff
 * - Brightness capped at 0.85-0.95 (not pure white)
 */
export function StarfieldBackground() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, twinklePhases, twinkleSpeeds } = useMemo(() => {
    const rand = createSeededRandom();

    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const twinklePhases = new Float32Array(STAR_COUNT);
    const twinkleSpeeds = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Spherical shell distribution for even sky coverage
      // Random direction on hemisphere facing camera (-Z)
      const theta = rand() * Math.PI * 2;              // azimuth: full circle
      const phi = Math.acos(1 - rand());                 // polar: forward hemisphere (0 to 90°)
      const r = 900 + rand() * 900;                     // radius: 900 to 1800

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);      // x
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);  // y
      positions[i * 3 + 2] = -r * Math.cos(phi);                   // z: always behind camera

      // Size: 95% small (8-18), 5% hero (22-35)
      const isHero = rand() < 0.05;
      sizes[i] = isHero ? 22 + rand() * 13 : 8 + rand() * 10;

      // Per-star twinkle phase (0 to 2pi) and speed (0.2 to 0.8 Hz)
      twinklePhases[i] = rand() * Math.PI * 2;
      twinkleSpeeds[i] = 0.2 + rand() * 0.6;
    }

    return { positions, sizes, twinklePhases, twinkleSpeeds };
  }, []);

  // Single uniform update per frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aTwinklePhase"
          args={[twinklePhases, 1]}
        />
        <bufferAttribute
          attach="attributes-aTwinkleSpeed"
          args={[twinkleSpeeds, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
