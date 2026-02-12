'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Background elements update at 15fps to save GPU/CPU power.
 * The drift is so slow (0.002 units/sec) that 15fps is imperceptible.
 */
const BG_FPS = 15;

// ─── JS-side noise (baked once on mount into DataTextures) ───

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

// ─── Merged shader: 3 nebula layers in a single draw call ───
//
// Original: 3 overlapping planes (3 draw calls, 3× overdraw with alpha blending)
// Merged:   1 plane sampling 3 noise textures with per-layer UV transforms
//
// UV math: each original plane had a different world-space position/scale.
// The merged plane covers the combined bounding box. Per-layer UVs are computed
// from the merged UV via: layerUV = (mergedUV - 0.5) * scale + offset
//
// Merged plane: center=[25, 75, -1950], size=[1650, 1050]
// Layer 1: center=[-200, 50], size=[1200, 800] → scale=(1.375, 1.3125), offset=(0.6875, 0.53125)
// Layer 2: center=[400, 300],  size=[900,  600] → scale=(1.833, 1.75),   offset=(0.0833, 0.125)
// Layer 3: center=[-350,-200], size=[800,  500] → scale=(2.0625, 2.1),   offset=(0.96875, 1.05)

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoiseTex1;
  uniform sampler2D uNoiseTex2;
  uniform sampler2D uNoiseTex3;

  varying vec2 vUv;

  // Per-layer UV transforms (merged plane → original plane UV space)
  const vec2 UV_SCALE_1  = vec2(1.375, 1.3125);
  const vec2 UV_OFFSET_1 = vec2(0.6875, 0.53125);
  const vec2 UV_SCALE_2  = vec2(1.833, 1.75);
  const vec2 UV_OFFSET_2 = vec2(0.0833, 0.125);
  const vec2 UV_SCALE_3  = vec2(2.0625, 2.1);
  const vec2 UV_OFFSET_3 = vec2(0.96875, 1.05);

  // Per-layer colors
  const vec3 C1A = vec3(0.059, 0.090, 0.165); // deep blue  #0f172a
  const vec3 C1B = vec3(0.067, 0.369, 0.349); // teal       #115e59
  const vec3 C1C = vec3(0.118, 0.227, 0.373); // blue       #1e3a5f

  const vec3 C2A = vec3(0.051, 0.580, 0.533); // teal       #0d9488
  const vec3 C2B = vec3(0.180, 0.063, 0.396); // purple     #2e1065
  const vec3 C2C = vec3(0.118, 0.227, 0.373); // blue       #1e3a5f

  const vec3 C3A = vec3(0.059, 0.090, 0.165); // deep blue  #0f172a
  const vec3 C3B = vec3(0.298, 0.114, 0.584); // purple     #4c1d95
  const vec3 C3C = vec3(0.067, 0.369, 0.349); // teal       #115e59

  vec4 computeLayer(sampler2D noiseTex, vec2 uvScale, vec2 uvOffset, vec3 col1, vec3 col2, vec3 col3) {
    vec2 layerUv = (vUv - 0.5) * uvScale + uvOffset;

    // Edge fade for this layer's region
    float edgeFade = smoothstep(0.0, 0.2, layerUv.x) * smoothstep(1.0, 0.8, layerUv.x)
                   * smoothstep(0.0, 0.2, layerUv.y) * smoothstep(1.0, 0.8, layerUv.y);
    if (edgeFade < 0.001) return vec4(0.0);

    // Drifted UV for noise sampling
    vec2 uv = layerUv + vec2(uTime * 0.002, uTime * 0.001);
    vec3 n = texture2D(noiseTex, uv).rgb;

    // Color mixing from noise layers
    vec3 color = mix(col1, col2, smoothstep(0.3, 0.7, n.r));
    color = mix(color, col3, smoothstep(0.4, 0.8, n.g) * 0.5);

    // Alpha from noise
    float alpha = smoothstep(0.3, 0.6, n.r) * smoothstep(0.25, 0.55, n.b);
    alpha *= 0.35 * edgeFade;

    return vec4(color, alpha);
  }

  void main() {
    vec4 l1 = computeLayer(uNoiseTex1, UV_SCALE_1, UV_OFFSET_1, C1A, C1B, C1C);
    vec4 l2 = computeLayer(uNoiseTex2, UV_SCALE_2, UV_OFFSET_2, C2A, C2B, C2C);
    vec4 l3 = computeLayer(uNoiseTex3, UV_SCALE_3, UV_OFFSET_3, C3A, C3B, C3C);

    // Premultiply each layer and sum (emulates additive blend of 3 separate draws)
    vec3 color = l1.rgb * l1.a + l2.rgb * l2.a + l3.rgb * l3.a;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * NebulaBackground — single merged plane with 3 noise layers.
 *
 * Previous: 3 overlapping <mesh> with alpha blending (3 draw calls, 3× overdraw)
 * Now: 1 <mesh> sampling 3 pre-baked noise textures in one fragment shader pass.
 *
 * Time updates quantized to 15fps — imperceptible at 0.002 units/sec drift.
 */
export function NebulaBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { tex1, tex2, tex3 } = useMemo(() => ({
    tex1: generateNebulaTexture(1.0),
    tex2: generateNebulaTexture(2.0),
    tex3: generateNebulaTexture(3.0),
  }), []);

  useEffect(() => {
    return () => { tex1.dispose(); tex2.dispose(); tex3.dispose(); };
  }, [tex1, tex2, tex3]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const qt = Math.floor(clock.getElapsedTime() * BG_FPS) / BG_FPS;
    if (matRef.current.uniforms.uTime.value === qt) return;
    matRef.current.uniforms.uTime.value = qt;
  });

  return (
    <mesh position={[25, 75, -1950]} scale={[1650, 1050, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={{
          uTime: { value: 0 },
          uNoiseTex1: { value: tex1 },
          uNoiseTex2: { value: tex2 },
          uNoiseTex3: { value: tex3 },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
