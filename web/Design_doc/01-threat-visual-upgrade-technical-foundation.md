# 01 - Threat Visual Upgrade: Technical Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the shader library, custom materials, GPU particle systems, post-processing pipeline, and utility helpers that all 6 upgraded threat visuals will share.

**Architecture:** A modular foundation of reusable shader chunks, material classes, particle emitters, and geometry utilities. Each piece is self-contained and composable. Threats import what they need rather than duplicating code.

**Tech Stack:** React Three Fiber, Three.js, @react-three/drei, @react-three/postprocessing, postprocessing, GLSL

---

## Phase 1: Shader Foundation

### Task 1: Noise Function GLSL Library

**Files:**
- Create: `web/lib/shaders/noise.glsl.ts`

This is the single most reused piece across every threat. Exported as a raw string so it can be injected into any vertex or fragment shader.

**Step 1: Create the noise library**

Create `web/lib/shaders/noise.glsl.ts`:

```typescript
/**
 * GLSL noise functions exported as a string.
 *
 * Usage inside a shaderMaterial fragment/vertex shader:
 *   import { noiseGLSL } from '@/lib/shaders/noise.glsl';
 *   const fragmentShader = `${noiseGLSL}\n void main() { ... }`;
 *
 * Provides:
 *   float snoise(vec3 v)       - Simplex 3D noise (-1..1)
 *   float fbm(vec3 p, int oct) - Fractional Brownian Motion
 *   vec2  voronoi(vec2 x)      - Voronoi cell noise (distance, cell id)
 *   vec3  curlNoise(vec3 p)    - Curl noise for particle flow fields
 */
export const noiseGLSL = /* glsl */ `
  // ---- Simplex 3D Noise ----
  vec4 _permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 _taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = _permute(_permute(_permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x2_ = x_ * ns.x + ns.yyyy;
    vec4 y2_ = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x2_) - abs(y2_);
    vec4 b0 = vec4(x2_.xy, y2_.xy);
    vec4 b1 = vec4(x2_.zw, y2_.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = _taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  // ---- Fractional Brownian Motion ----
  float fbm(vec3 p, int octaves){
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 8; i++){
      if(i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // ---- Voronoi Cell Noise ----
  vec2 voronoi(vec2 x){
    vec2 n = floor(x);
    vec2 f = fract(x);
    vec2 mg, mr;
    float md = 8.0;
    for(int j=-1;j<=1;j++){
      for(int i=-1;i<=1;i++){
        vec2 g = vec2(float(i),float(j));
        vec2 o = vec2(
          fract(sin(dot(n+g,vec2(12.9898,78.233)))*43758.5453),
          fract(sin(dot(n+g,vec2(39.3461,11.135)))*43758.5453)
        );
        vec2 r = g + o - f;
        float d = dot(r,r);
        if(d < md){ md = d; mr = r; mg = g; }
      }
    }
    return vec2(md, fract(sin(dot(n+mg,vec2(12.9898,78.233)))*43758.5453));
  }

  // ---- Curl Noise ----
  vec3 curlNoise(vec3 p){
    const float e = 0.1;
    float n1=snoise(vec3(p.x,p.y+e,p.z));
    float n2=snoise(vec3(p.x,p.y-e,p.z));
    float n3=snoise(vec3(p.x,p.y,p.z+e));
    float n4=snoise(vec3(p.x,p.y,p.z-e));
    float n5=snoise(vec3(p.x+e,p.y,p.z));
    float n6=snoise(vec3(p.x-e,p.y,p.z));
    return normalize(vec3(n1-n2, n3-n4, n5-n6)/(2.0*e));
  }
`;
```

**Step 2: Verify it compiles by importing in a scratch test**

```bash
cd web && bun run -e "import('./lib/shaders/noise.glsl.ts').then(m => console.log('OK, length:', m.noiseGLSL.length))"
```

Expected: `OK, length: <some number>`

**Step 3: Commit**

```bash
git add web/lib/shaders/noise.glsl.ts
git commit -m "feat(shaders): add GLSL noise library (simplex, fbm, voronoi, curl)"
```

---

### Task 2: Common Shader Chunks

**Files:**
- Create: `web/lib/shaders/common.glsl.ts`
- Create: `web/lib/shaders/index.ts`

**Step 1: Create common shader chunks**

Create `web/lib/shaders/common.glsl.ts`:

```typescript
/**
 * Reusable GLSL shader snippets.
 * Import the ones you need and concatenate into your shader source.
 */

/** Fresnel rim-lighting — brighter at glancing angles */
export const fresnelGLSL = /* glsl */ `
  float fresnel(vec3 viewDir, vec3 normal, float power){
    return pow(1.0 - abs(dot(viewDir, normal)), power);
  }
`;

/** 3-stop color gradient */
export const gradientGLSL = /* glsl */ `
  vec3 gradient3(vec3 c1, vec3 c2, vec3 c3, float t){
    return t < 0.5 ? mix(c1, c2, t*2.0) : mix(c2, c3, (t-0.5)*2.0);
  }
`;

/** Heat distortion UV warp (requires snoise) */
export const heatDistortionGLSL = /* glsl */ `
  vec2 heatDistort(vec2 uv, float time, float strength){
    float n1 = snoise(vec3(uv*3.0, time*0.5));
    float n2 = snoise(vec3(uv*5.0, time*0.3));
    return uv + vec2(n1, n2) * strength;
  }
`;

/** Pulsing glow factor — pass elapsed time and desired frequency */
export const pulseGLSL = /* glsl */ `
  float pulse(float time, float freq, float minVal, float maxVal){
    float t = sin(time * freq * 6.28318) * 0.5 + 0.5;
    return mix(minVal, maxVal, t);
  }
`;

/** Rotate a 2D vector by angle (radians) */
export const rotate2dGLSL = /* glsl */ `
  vec2 rotate2d(vec2 v, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return vec2(v.x*c - v.y*s, v.x*s + v.y*c);
  }
`;
```

**Step 2: Create barrel export**

Create `web/lib/shaders/index.ts`:

```typescript
export { noiseGLSL } from './noise.glsl';
export {
  fresnelGLSL,
  gradientGLSL,
  heatDistortionGLSL,
  pulseGLSL,
  rotate2dGLSL,
} from './common.glsl';
```

**Step 3: Commit**

```bash
git add web/lib/shaders/
git commit -m "feat(shaders): add common GLSL chunks and barrel export"
```

---

## Phase 2: Custom Materials

### Task 3: Volumetric Glow Material

**Files:**
- Create: `web/lib/materials/VolumetricGlowMaterial.tsx`

This material makes nebula clouds, glow spheres, and energy fields look cinematic. Used by Ion Storm, Solar Flare, and Black Hole.

**Step 1: Create the material**

Create `web/lib/materials/VolumetricGlowMaterial.tsx`:

```typescript
'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL, fresnelGLSL } from '@/lib/shaders';

const VolumetricGlowMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.4, 0.6, 1.0),
    glowStrength: 1.0,
    noiseScale: 1.0,
    noiseSpeed: 0.5,
    rimPower: 3.0,
    opacity: 1.0,
  },
  // vertex
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vViewPosition = -mv.xyz;
      vWorldPosition = (modelMatrix * vec4(position,1.0)).xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  // fragment
  `${noiseGLSL}\n${fresnelGLSL}\n` + /* glsl */ `
    uniform float time;
    uniform vec3 color;
    uniform float glowStrength;
    uniform float noiseScale;
    uniform float noiseSpeed;
    uniform float rimPower;
    uniform float opacity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    void main(){
      vec3 viewDir = normalize(vViewPosition);
      vec3 n = normalize(vNormal);
      float rim = fresnel(viewDir, n, rimPower);
      vec3 np = vWorldPosition * noiseScale + vec3(0.0, time*noiseSpeed, 0.0);
      float noise = snoise(np)*0.5+0.5;
      float depth = 1.0 - pow(abs(dot(viewDir,n)), 2.0);
      float alpha = (rim*0.5 + depth*0.5) * noise * glowStrength * opacity;
      vec3 fc = color * (1.0 + rim*0.5);
      gl_FragColor = vec4(fc, alpha);
    }
  `
);

extend({ VolumetricGlowMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    volumetricGlowMaterial: any;
  }
}

export { VolumetricGlowMaterial };
```

**Step 2: Commit**

```bash
git add web/lib/materials/VolumetricGlowMaterial.tsx
git commit -m "feat(materials): add volumetric glow shader material"
```

---

### Task 4: Energy Flow Material

**Files:**
- Create: `web/lib/materials/EnergyFlowMaterial.tsx`

Animated flowing energy stripes. Used for weapon charges (Enemy Cruiser), wormhole rim, solar flare arcs.

**Step 1: Create the material**

Create `web/lib/materials/EnergyFlowMaterial.tsx`:

```typescript
'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { fresnelGLSL } from '@/lib/shaders';

const EnergyFlowMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color(0.4, 0.6, 1.0),
    color2: new THREE.Color(1.0, 1.0, 1.0),
    flowSpeed: 1.0,
    flowDirection: new THREE.Vector2(0, 1),
    pulseFrequency: 2.0,
    stripeCount: 5.0,
    opacity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main(){
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vViewPosition = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  `${fresnelGLSL}\n` + /* glsl */ `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float flowSpeed;
    uniform vec2 flowDirection;
    uniform float pulseFrequency;
    uniform float stripeCount;
    uniform float opacity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main(){
      vec2 flowUv = vUv + flowDirection * time * flowSpeed;
      float stripes = sin(flowUv.y * stripeCount * 6.28318) * 0.5 + 0.5;
      float pulse = sin(time * pulseFrequency) * 0.3 + 0.7;
      vec3 fc = mix(color1, color2, stripes * pulse);
      vec3 viewDir = normalize(vViewPosition);
      float rim = fresnel(viewDir, normalize(vNormal), 2.0);
      float alpha = (stripes * 0.7 + rim * 0.3) * pulse * opacity;
      gl_FragColor = vec4(fc, alpha);
    }
  `
);

extend({ EnergyFlowMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    energyFlowMaterial: any;
  }
}

export { EnergyFlowMaterial };
```

**Step 2: Commit**

```bash
git add web/lib/materials/EnergyFlowMaterial.tsx
git commit -m "feat(materials): add energy flow shader material"
```

---

### Task 5: Gravitational Lensing Material

**Files:**
- Create: `web/lib/materials/GravitationalLensingMaterial.tsx`

Used exclusively by the Black Hole for spacetime warping.

**Step 1: Create the material**

Create `web/lib/materials/GravitationalLensingMaterial.tsx`:

```typescript
'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

const GravitationalLensingMaterial = shaderMaterial(
  {
    time: 0,
    blackHoleRadius: 1.0,
    distortionStrength: 0.3,
    ringColor: new THREE.Color(0.3, 0.1, 0.6),
    hawkingColor: new THREE.Color(0.2, 0.4, 1.0),
  },
  /* glsl */ `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main(){
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vViewPosition = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform float time;
    uniform float blackHoleRadius;
    uniform float distortionStrength;
    uniform vec3 ringColor;
    uniform vec3 hawkingColor;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main(){
      float dist = length(vPosition);
      vec3 viewDir = normalize(vViewPosition);
      vec3 n = normalize(vNormal);

      // Gravitational falloff — inverse-square
      float lensStrength = 1.0 / (dist*dist + 0.5);
      float warp = lensStrength * distortionStrength;

      // Ring highlight at photon sphere (~1.5× radius)
      float ringDist = abs(dist - blackHoleRadius * 1.5);
      float ring = smoothstep(0.3, 0.0, ringDist) * 0.8;

      // Hawking radiation glow at event horizon edge
      float edgeDist = abs(dist - blackHoleRadius * 1.05);
      float hawking = smoothstep(0.2, 0.0, edgeDist) * 0.4;
      hawking *= (sin(time * 3.0 + dist * 8.0) * 0.3 + 0.7); // flicker

      // Fresnel rim
      float rim = pow(1.0 - abs(dot(viewDir, n)), 4.0);

      vec3 fc = ringColor * ring + hawkingColor * (hawking + rim * 0.2);
      float alpha = (ring + hawking + rim * 0.15) * warp * 2.0;
      alpha = clamp(alpha, 0.0, 0.8);

      gl_FragColor = vec4(fc, alpha);
    }
  `
);

extend({ GravitationalLensingMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    gravitationalLensingMaterial: any;
  }
}

export { GravitationalLensingMaterial };
```

**Step 2: Commit**

```bash
git add web/lib/materials/GravitationalLensingMaterial.tsx
git commit -m "feat(materials): add gravitational lensing shader material"
```

---

### Task 6: Materials Barrel Export

**Files:**
- Create: `web/lib/materials/index.ts`

**Step 1: Create barrel**

Create `web/lib/materials/index.ts`:

```typescript
export { VolumetricGlowMaterial } from './VolumetricGlowMaterial';
export { EnergyFlowMaterial } from './EnergyFlowMaterial';
export { GravitationalLensingMaterial } from './GravitationalLensingMaterial';
```

**Step 2: Commit**

```bash
git add web/lib/materials/index.ts
git commit -m "feat(materials): add barrel export"
```

---

## Phase 3: GPU Particle System

### Task 7: Instanced Particle Emitter

**Files:**
- Create: `web/lib/particles/InstancedParticleSystem.tsx`

This replaces all the manual Float32Array particle code across threats with a single reusable, high-performance component. Uses THREE.InstancedMesh for GPU instancing — supports thousands of particles at 60fps.

**Step 1: Create the component**

Create `web/lib/particles/InstancedParticleSystem.tsx`:

```typescript
'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleConfig {
  /** Number of particles */
  count: number;
  /** Base size of each particle sprite */
  size?: number;
  /** [min, max] lifetime in seconds */
  lifespan?: [number, number];
  /** Min and max initial velocity components */
  velocityMin?: [number, number, number];
  velocityMax?: [number, number, number];
  /** Spawn region radius */
  spawnRadius?: number;
  /** Continuous force (e.g. gravity) */
  gravity?: [number, number, number];
  /** Particles emitted per second (0 = burst all at start) */
  emitRate?: number;
  /** Loop particles (respawn after death) */
  loop?: boolean;
}

export interface InstancedParticleSystemProps extends ParticleConfig {
  /** Starting color */
  color?: THREE.ColorRepresentation;
  /** Ending color (fades to this over lifetime) */
  colorEnd?: THREE.ColorRepresentation;
  /** THREE.Blending mode */
  blending?: THREE.Blending;
  /** Custom per-frame updater — mutate matrices directly */
  onTick?: (data: ParticleState, delta: number, elapsed: number) => void;
}

export interface ParticleState {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  count: number;
  mesh: THREE.InstancedMesh;
}

const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();

export default function InstancedParticleSystem({
  count,
  size = 0.08,
  lifespan = [1.0, 2.5],
  velocityMin = [-0.5, -0.5, -0.5],
  velocityMax = [0.5, 0.5, 0.5],
  spawnRadius = 0.2,
  gravity = [0, 0, 0],
  emitRate = 0,
  loop = true,
  color = '#ffffff',
  colorEnd,
  blending = THREE.AdditiveBlending,
  onTick,
}: InstancedParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const emitAccRef = useRef(0);

  const state = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const maxLifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Stagger spawns so they don't all appear at once
      lifetimes[i] = emitRate > 0 ? -(Math.random() * (count / Math.max(emitRate, 1))) : 0;
      maxLifetimes[i] = lifespan[0] + Math.random() * (lifespan[1] - lifespan[0]);

      // Random position in spawn sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * spawnRadius;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Random velocity in range
      velocities[i * 3] = velocityMin[0] + Math.random() * (velocityMax[0] - velocityMin[0]);
      velocities[i * 3 + 1] = velocityMin[1] + Math.random() * (velocityMax[1] - velocityMin[1]);
      velocities[i * 3 + 2] = velocityMin[2] + Math.random() * (velocityMax[2] - velocityMin[2]);
    }

    return { positions, velocities, lifetimes, maxLifetimes, count } as Omit<ParticleState, 'mesh'>;
  }, [count, lifespan, velocityMin, velocityMax, spawnRadius, emitRate]);

  const startColor = useMemo(() => new THREE.Color(color), [color]);
  const endColor = useMemo(() => (colorEnd ? new THREE.Color(colorEnd) : null), [colorEnd]);

  // Geometry: small plane quad (billboard-friendly)
  const geo = useMemo(() => new THREE.PlaneGeometry(size, size), [size]);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: startColor,
        transparent: true,
        depthWrite: false,
        blending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [startColor, blending]
  );

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame(({ clock, camera }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();
    const { positions, velocities, lifetimes, maxLifetimes } = state;

    // Let external code do custom work
    if (onTick) {
      onTick({ ...state, mesh } as ParticleState, delta, elapsed);
    }

    for (let i = 0; i < count; i++) {
      lifetimes[i] += delta;
      const life = lifetimes[i];
      const maxLife = maxLifetimes[i];

      if (life < 0) {
        // Not yet born — hide
        _matrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, _matrix);
        continue;
      }

      if (life >= maxLife) {
        if (loop) {
          // Respawn
          lifetimes[i] = 0;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.random() * spawnRadius;
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);
          velocities[i * 3] = velocityMin[0] + Math.random() * (velocityMax[0] - velocityMin[0]);
          velocities[i * 3 + 1] = velocityMin[1] + Math.random() * (velocityMax[1] - velocityMin[1]);
          velocities[i * 3 + 2] = velocityMin[2] + Math.random() * (velocityMax[2] - velocityMin[2]);
          maxLifetimes[i] = lifespan[0] + Math.random() * (lifespan[1] - lifespan[0]);
        } else {
          _matrix.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, _matrix);
          continue;
        }
      }

      const t = life / maxLife; // 0 → 1

      // Physics
      positions[i * 3] += velocities[i * 3] * delta;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;
      velocities[i * 3] += gravity[0] * delta;
      velocities[i * 3 + 1] += gravity[1] * delta;
      velocities[i * 3 + 2] += gravity[2] * delta;

      // Billboard toward camera
      _position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const scaleFactor = (1.0 - t * 0.6); // Shrink over life
      _scale.setScalar(scaleFactor);

      _matrix.identity();
      _matrix.lookAt(_position, camera.position, camera.up);
      _matrix.setPosition(_position);
      _matrix.scale(_scale);
      mesh.setMatrixAt(i, _matrix);

      // Color fade
      if (endColor) {
        _color.copy(startColor).lerp(endColor, t);
      } else {
        _color.copy(startColor).multiplyScalar(1.0 - t * 0.5);
      }
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}
```

**Step 2: Commit**

```bash
git add web/lib/particles/InstancedParticleSystem.tsx
git commit -m "feat(particles): add GPU-instanced particle system component"
```

---

### Task 8: Particle Trail Ribbon

**Files:**
- Create: `web/lib/particles/TrailRibbon.tsx`
- Create: `web/lib/particles/index.ts`

Creates smooth ribbon trails behind moving objects. Used by Asteroid (fire trail), Enemy Cruiser (engine exhaust), Solar Flare (CME arcs).

**Step 1: Create the ribbon component**

Create `web/lib/particles/TrailRibbon.tsx`:

```typescript
'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrailRibbonProps {
  /** Ref to the object being trailed */
  targetRef: React.RefObject<THREE.Object3D | null>;
  /** Max trail points stored */
  maxPoints?: number;
  /** How long each point lives (seconds) */
  lifetime?: number;
  /** Ribbon half-width */
  width?: number;
  /** Head color */
  color?: THREE.ColorRepresentation;
  /** Tail color */
  colorEnd?: THREE.ColorRepresentation;
  opacity?: number;
}

export default function TrailRibbon({
  targetRef,
  maxPoints = 60,
  lifetime = 1.0,
  width = 0.15,
  color = '#ffffff',
  colorEnd,
  opacity = 0.6,
}: TrailRibbonProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const headColor = useMemo(() => new THREE.Color(color), [color]);
  const tailColor = useMemo(() => (colorEnd ? new THREE.Color(colorEnd) : headColor.clone().multiplyScalar(0.2)), [colorEnd, headColor]);

  // Ring-buffer of world positions + ages
  const trail = useRef<{ pos: THREE.Vector3; age: number }[]>([]);
  const lastPos = useRef(new THREE.Vector3());

  // Pre-allocate geometry buffers (2 verts per point for ribbon)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 2 * 3);
    const colors = new Float32Array(maxPoints * 2 * 3);
    const indices: number[] = [];

    for (let i = 0; i < maxPoints - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    return geo;
  }, [maxPoints]);

  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  useFrame(({ camera }, delta) => {
    if (!targetRef.current || !meshRef.current) return;

    const wp = new THREE.Vector3();
    targetRef.current.getWorldPosition(wp);

    // Only record if moved enough
    if (wp.distanceTo(lastPos.current) > 0.01) {
      trail.current.unshift({ pos: wp.clone(), age: 0 });
      lastPos.current.copy(wp);
      if (trail.current.length > maxPoints) trail.current.pop();
    }

    // Age and cull
    trail.current = trail.current.filter(p => { p.age += delta; return p.age < lifetime; });

    // Write geometry
    const posArr = geometry.attributes.position.array as Float32Array;
    const colArr = geometry.attributes.color.array as Float32Array;
    const up = camera.up.clone();
    const _c = new THREE.Color();

    for (let i = 0; i < maxPoints; i++) {
      if (i < trail.current.length) {
        const pt = trail.current[i];
        const t = pt.age / lifetime;
        const w = width * (1.0 - t);

        // Direction for ribbon expansion
        let dir = up;
        if (i < trail.current.length - 1) {
          dir = new THREE.Vector3().subVectors(trail.current[i + 1].pos, pt.pos).normalize();
          dir.cross(new THREE.Vector3().subVectors(camera.position, pt.pos).normalize()).normalize();
        }
        const off = dir.clone().multiplyScalar(w);

        const idx = i * 6;
        posArr[idx] = pt.pos.x - off.x;
        posArr[idx + 1] = pt.pos.y - off.y;
        posArr[idx + 2] = pt.pos.z - off.z;
        posArr[idx + 3] = pt.pos.x + off.x;
        posArr[idx + 4] = pt.pos.y + off.y;
        posArr[idx + 5] = pt.pos.z + off.z;

        _c.copy(headColor).lerp(tailColor, t);
        colArr[idx] = _c.r; colArr[idx + 1] = _c.g; colArr[idx + 2] = _c.b;
        colArr[idx + 3] = _c.r; colArr[idx + 4] = _c.g; colArr[idx + 5] = _c.b;
      } else {
        const idx = i * 6;
        posArr[idx] = posArr[idx + 1] = posArr[idx + 2] = 0;
        posArr[idx + 3] = posArr[idx + 4] = posArr[idx + 5] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
```

**Step 2: Create barrel export**

Create `web/lib/particles/index.ts`:

```typescript
export { default as InstancedParticleSystem } from './InstancedParticleSystem';
export type { ParticleConfig, ParticleState, InstancedParticleSystemProps } from './InstancedParticleSystem';
export { default as TrailRibbon } from './TrailRibbon';
```

**Step 3: Commit**

```bash
git add web/lib/particles/
git commit -m "feat(particles): add trail ribbon component and barrel export"
```

---

## Phase 4: Post-Processing Pipeline

### Task 9: Scene Effects Component

**Files:**
- Create: `web/components/three/SceneEffects.tsx`

**Step 1: Install dependencies**

```bash
cd web && bun add @react-three/postprocessing postprocessing
```

**Step 2: Create the component**

Create `web/components/three/SceneEffects.tsx`:

```typescript
'use client';

/**
 * Drop this inside <Canvas> after all scene objects.
 *
 *   <Canvas>
 *     <Scene />
 *     <SceneEffects />
 *   </Canvas>
 */

import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface SceneEffectsProps {
  /** Bloom glow intensity (0 = off) */
  bloomIntensity?: number;
  /** Bloom radius spread */
  bloomRadius?: number;
  /** Chromatic aberration pixel offset */
  chromaticOffset?: number;
  /** Edge vignette darkness */
  vignetteDarkness?: number;
}

export default function SceneEffects({
  bloomIntensity = 1.5,
  bloomRadius = 0.85,
  chromaticOffset = 0.0004,
  vignetteDarkness = 0.45,
}: SceneEffectsProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        radius={bloomRadius}
        blendFunction={BlendFunction.ADD}
      />
      <ChromaticAberration
        offset={[chromaticOffset, chromaticOffset]}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        offset={0.5}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
```

**Step 3: Commit**

```bash
git add web/components/three/SceneEffects.tsx web/package.json web/bun.lockb
git commit -m "feat(effects): add post-processing pipeline (bloom, chromatic aberration, vignette)"
```

---

## Phase 5: Geometry & Animation Utilities

### Task 10: Geometry Helpers

**Files:**
- Create: `web/lib/utils/geometry.ts`

**Step 1: Create geometry utilities**

Create `web/lib/utils/geometry.ts`:

```typescript
import * as THREE from 'three';

/**
 * Displace every vertex of a geometry along its normal.
 * Returns a NEW geometry (original untouched).
 */
export function displaceGeometry(
  base: THREE.BufferGeometry,
  displaceFn: (vertex: THREE.Vector3, index: number) => number,
  strength = 1.0
): THREE.BufferGeometry {
  const geo = base.clone();
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const d = displaceFn(v, i);
    v.add(n.multiplyScalar(d * strength));
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Generate a jagged lightning-bolt path between two points.
 * Each intermediate point is jittered perpendicular to the main axis.
 */
export function generateLightningPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments = 8,
  jitter = 0.5
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [start.clone()];
  const mainDir = new THREE.Vector3().subVectors(end, start);

  // Pick an arbitrary perpendicular basis
  const up = Math.abs(mainDir.y) < 0.99
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const perp1 = new THREE.Vector3().crossVectors(mainDir, up).normalize();
  const perp2 = new THREE.Vector3().crossVectors(mainDir, perp1).normalize();

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    p.add(perp1.clone().multiplyScalar((Math.random() - 0.5) * jitter));
    p.add(perp2.clone().multiplyScalar((Math.random() - 0.5) * jitter));
    pts.push(p);
  }

  pts.push(end.clone());
  return pts;
}

/**
 * Create a THREE.TubeGeometry from a set of points.
 */
export function tubeFromPoints(
  points: THREE.Vector3[],
  radius = 0.05,
  tubularSegments = 32,
  radialSegments = 6
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}
```

**Step 2: Commit**

```bash
git add web/lib/utils/geometry.ts
git commit -m "feat(utils): add geometry helpers (displacement, lightning paths, tubes)"
```

---

### Task 11: Animation & Math Utilities

**Files:**
- Create: `web/lib/utils/animation.ts`
- Create: `web/lib/utils/index.ts`

**Step 1: Create animation utilities**

Create `web/lib/utils/animation.ts`:

```typescript
/** Easing functions — all take t in [0,1] and return [0,1] */
export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => --t * t * t + 1,
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  inExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outElastic: (t: number) => {
    const c = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
  },
};

/** Linearly interpolate with optional easing */
export function lerp(from: number, to: number, t: number, fn = ease.linear): number {
  return from + (to - from) * fn(Math.max(0, Math.min(1, t)));
}

/** Smooth-step (Hermite interpolation) */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Remap value from one range to another */
export function remap(v: number, inLow: number, inHigh: number, outLow: number, outHigh: number): number {
  return outLow + ((v - inLow) / (inHigh - inLow)) * (outHigh - outLow);
}

/** Clamp between min and max */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Ping-pong between 0 and 1 */
export function pingPong(t: number): number {
  const m = t % 2;
  return m > 1 ? 2 - m : m;
}
```

**Step 2: Create barrel export**

Create `web/lib/utils/index.ts`:

```typescript
export * from './geometry';
export * from './animation';
```

**Step 3: Commit**

```bash
git add web/lib/utils/
git commit -m "feat(utils): add animation easing and math utilities"
```

---

## Phase 6: Verify Foundation

### Task 12: Smoke Test

**Step 1: Verify all imports resolve**

```bash
cd web && bun run -e "
  import('./lib/shaders/index.ts').then(m => console.log('shaders:', Object.keys(m).length, 'exports'));
  import('./lib/materials/index.ts').then(m => console.log('materials:', Object.keys(m).length, 'exports'));
  import('./lib/particles/index.ts').then(m => console.log('particles:', Object.keys(m).length, 'exports'));
  import('./lib/utils/index.ts').then(m => console.log('utils:', Object.keys(m).length, 'exports'));
"
```

Expected: 4 lines of output with non-zero export counts.

**Step 2: Verify dev server starts without errors**

```bash
cd web && timeout 15 bun dev 2>&1 | head -20
```

Expected: "Ready" message without shader/import errors.

**Step 3: Final commit if any fixups were needed**

```bash
git add -A && git commit -m "fix: address smoke-test issues in foundation layer"
```

---

## Summary

| Task | What it creates | Used by |
|------|----------------|---------|
| 1 | Noise GLSL (simplex, fbm, voronoi, curl) | All threats |
| 2 | Common GLSL chunks (fresnel, gradient, heat) | All threats |
| 3 | VolumetricGlowMaterial | Ion Storm, Solar Flare, Black Hole |
| 4 | EnergyFlowMaterial | Enemy Cruiser, Wormhole, Solar Flare |
| 5 | GravitationalLensingMaterial | Black Hole |
| 6 | Materials barrel export | — |
| 7 | InstancedParticleSystem | All threats |
| 8 | TrailRibbon | Asteroid, Enemy Cruiser, Solar Flare |
| 9 | SceneEffects (post-processing) | Global |
| 10 | Geometry helpers | Asteroid, Ion Storm, Enemy Cruiser |
| 11 | Animation/math utilities | All threats |
| 12 | Smoke test | — |

**Next:** Proceed to **02-threat-visual-upgrade-detailed-designs.md** to apply this foundation to each threat.
