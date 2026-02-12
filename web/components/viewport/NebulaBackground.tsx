'use client';

import { useRef, useMemo, useEffect, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── JS-side noise functions (matching the original GLSL, run once on mount) ───

function hash(px: number, py: number, seed: number): number {
  const dot = (px + seed) * 127.1 + (py + seed) * 311.7;
  const sinVal = Math.sin(dot) * 43758.5453123;
  return sinVal - Math.floor(sinVal);
}

function noise(px: number, py: number, seed: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  let fx = px - ix;
  let fy = py - iy;
  fx = fx * fx * (3.0 - 2.0 * fx);
  fy = fy * fy * (3.0 - 2.0 * fy);

  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);

  const ab = a + (b - a) * fx;
  const cd = c + (d - c) * fx;
  return ab + (cd - ab) * fy;
}

function fbm(px: number, py: number, seed: number): number {
  let value = 0;
  let amplitude = 0.5;
  let x = px;
  let y = py;
  for (let i = 0; i < 2; i++) {
    value += amplitude * noise(x, y, seed);
    x *= 2;
    y *= 2;
    amplitude *= 0.5;
  }
  return value;
}

const TEX_SIZE = 256;

/**
 * Bake 3 noise layers into a single RGBA DataTexture.
 * R = fbm(uv * 2.0), G = fbm(uv * 3.5 + 5.0), B = fbm(uv * 1.5 + 10.0)
 */
function generateNebulaTexture(seed: number): THREE.DataTexture {
  const data = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);

  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const u = x / TEX_SIZE;
      const v = y / TEX_SIZE;

      const n1 = fbm(u * 2.0, v * 2.0, seed);
      const n2 = fbm(u * 3.5 + 5.0, v * 3.5 + 5.0, seed);
      const n3 = fbm(u * 1.5 + 10.0, v * 1.5 + 10.0, seed);

      const idx = (y * TEX_SIZE + x) * 4;
      data[idx] = Math.round(n1 * 255);
      data[idx + 1] = Math.round(n2 * 255);
      data[idx + 2] = Math.round(n3 * 255);
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, TEX_SIZE, TEX_SIZE, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ─── Simplified shader: sample pre-baked texture instead of computing FBM ───

const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform sampler2D uNoiseTex;

  varying vec2 vUv;

  void main() {
    // Very slow drift (same as original)
    vec2 uv = vUv + vec2(uTime * 0.002, uTime * 0.001);

    // Sample pre-baked noise layers from texture RGB channels
    vec3 noiseSample = texture2D(uNoiseTex, uv).rgb;
    float n1 = noiseSample.r;
    float n2 = noiseSample.g;
    float n3 = noiseSample.b;

    // Color mixing driven by noise layers (same as original)
    vec3 color = mix(uColor1, uColor2, smoothstep(0.3, 0.7, n1));
    color = mix(color, uColor3, smoothstep(0.4, 0.8, n2) * 0.5);

    // Alpha: fade edges to transparent, keep dim overall
    float alpha = smoothstep(0.3, 0.6, n1) * smoothstep(0.25, 0.55, n3);
    alpha *= 0.35;

    // Fade out at quad edges
    float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x)
                   * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    alpha *= edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

interface NebulaPlaneProps {
  position: [number, number, number];
  scale: [number, number, number];
  color1: string;
  color2: string;
  color3: string;
  seed: number;
  shaderRef: RefObject<THREE.ShaderMaterial | null>;
}

function NebulaPlane({ position, scale, color1, color2, color3, seed, shaderRef }: NebulaPlaneProps) {
  const noiseTex = useMemo(() => generateNebulaTexture(seed), [seed]);

  useEffect(() => {
    return () => { noiseTex.dispose(); };
  }, [noiseTex]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uColor3: { value: new THREE.Color(color3) },
      uNoiseTex: { value: noiseTex },
    }),
    [color1, color2, color3, noiseTex],
  );

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * NebulaBackground — 3 overlapping planes with pre-baked noise textures.
 * Cool-toned gas clouds (blues, teals, muted purple) with near-imperceptible drift.
 * Noise is computed once on mount, not per-frame.
 */
export function NebulaBackground() {
  const mat1 = useRef<THREE.ShaderMaterial>(null);
  const mat2 = useRef<THREE.ShaderMaterial>(null);
  const mat3 = useRef<THREE.ShaderMaterial>(null);

  // Single useFrame for all 3 nebula planes
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (mat1.current) mat1.current.uniforms.uTime.value = t;
    if (mat2.current) mat2.current.uniforms.uTime.value = t;
    if (mat3.current) mat3.current.uniforms.uTime.value = t;
  });

  return (
    <group>
      {/* Large central cloud — deep blue + teal */}
      <NebulaPlane
        shaderRef={mat1}
        position={[-200, 50, -1950]}
        scale={[1200, 800, 1]}
        color1="#0f172a"
        color2="#115e59"
        color3="#1e3a5f"
        seed={1.0}
      />
      {/* Upper-right wisp — teal + purple */}
      <NebulaPlane
        shaderRef={mat2}
        position={[400, 300, -1980]}
        scale={[900, 600, 1]}
        color1="#0d9488"
        color2="#2e1065"
        color3="#1e3a5f"
        seed={2.0}
      />
      {/* Lower-left accent — deep blue + muted purple */}
      <NebulaPlane
        shaderRef={mat3}
        position={[-350, -200, -1920]}
        scale={[800, 500, 1]}
        color1="#0f172a"
        color2="#4c1d95"
        color3="#115e59"
        seed={3.0}
      />
    </group>
  );
}
