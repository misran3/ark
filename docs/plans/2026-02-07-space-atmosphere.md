# Space Atmosphere Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the flat-black space outside the cockpit window into a cinematic, layered environment with a blue planet, nebula backdrop, minimal drift particles, and grounded lens effects.

**Architecture:** Four independent visual layers added to the existing R3F scene: (1) nebula shader planes behind the starfield, (2) blue gas-giant planet replacing the Sun, (3) sparse drifting dust particles in the mid-field, (4) subtle anamorphic lens flare + lens dirt overlay. All layers are purely visual — no gameplay coupling, no lighting changes beyond removing the Sun's PointLight.

**Tech Stack:** React Three Fiber, Three.js ShaderMaterial (custom GLSL), @react-three/postprocessing (existing), seeded-random utility (existing)

---

## Task 1: Create Planet Component (Replace Sun)

**Files:**
- Create: `web/components/viewport/Planet.tsx`
- Modify: `web/components/viewport/Viewport3D.tsx:4-6,21,43-48`

**Context:** The current `Sun.tsx` renders a procedural sphere with fire-turbulence shader, PointLight, and solar flare coupling. We replace it with a blue gas-giant planet — same position `[300, 100, -800]`, same sphere radius `200`, but entirely new shader. No PointLight. No solar flare props. The existing `Sun.tsx` file stays untouched (we just stop importing it).

**Step 1: Create `web/components/viewport/Planet.tsx`**

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const planetVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const planetFragmentShader = /* glsl */ `
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  // FBM noise for cloud swirls
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Slowly rotating UV for cloud drift
    float rotation = uTime * 0.01;
    vec2 rotatedUv = vec2(
      vUv.x + rotation,
      vUv.y
    );

    // Ocean blue base - latitude-banded
    vec3 deepBlue = vec3(0.118, 0.227, 0.373);   // #1e3a5f
    vec3 brightBlue = vec3(0.145, 0.388, 0.922);  // #2563eb
    float latBand = smoothstep(0.2, 0.8, vUv.y);
    vec3 baseColor = mix(deepBlue, brightBlue, latBand * 0.6 + 0.2);

    // Gray cloud swirls
    vec3 cloudGray1 = vec3(0.42, 0.45, 0.50);   // #6b7280
    vec3 cloudGray2 = vec3(0.61, 0.64, 0.66);   // #9ca3af

    // Multi-scale cloud pattern
    float clouds1 = fbm(rotatedUv * vec2(4.0, 6.0) + vec2(0.0, uTime * 0.003));
    float clouds2 = fbm(rotatedUv * vec2(8.0, 3.0) - vec2(uTime * 0.005, 0.0));
    float cloudMask = smoothstep(0.35, 0.65, clouds1 * 0.6 + clouds2 * 0.4);

    // Blend clouds onto surface
    vec3 cloudColor = mix(cloudGray1, cloudGray2, clouds2);
    vec3 surfaceColor = mix(baseColor, cloudColor, cloudMask * 0.55);

    // Fresnel atmosphere rim - pale cyan glow
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    fresnel = pow(fresnel, 3.0);
    vec3 atmosphereColor = vec3(0.4, 0.75, 0.85); // pale cyan-teal
    surfaceColor = mix(surfaceColor, atmosphereColor, fresnel * 0.7);

    // Boost rim brightness for bloom pickup
    float rimGlow = pow(fresnel, 5.0) * 1.5;
    surfaceColor += atmosphereColor * rimGlow;

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

export function Planet() {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={[300, 100, -800]}>
      <sphereGeometry args={[200, 32, 32]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={planetVertexShader}
        fragmentShader={planetFragmentShader}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
```

**Step 2: Update `web/components/viewport/Viewport3D.tsx`**

Replace the Sun import and usage with Planet:

- Line 5: Change `import { Sun } from './Sun';` → `import { Planet } from './Planet';`
- Line 21: Delete `const hasSolarFlare = threats.some((t) => t.type === 'solar_flare');`
- Lines 43-48: Replace the Sun JSX block:
  ```tsx
  {/* Blue planet backdrop */}
  <Planet />
  ```

**Step 3: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`

Open browser and confirm:
- Blue sphere with gray cloud swirls visible at the Sun's old position
- Pale cyan atmosphere rim glow visible (picked up by bloom)
- Clouds slowly rotate/drift
- No PointLight artifacts — scene should be slightly dimmer than before (ambient-only)
- Threats still render and glow correctly (they have their own emissive materials)

**Step 4: Commit**

```bash
git add web/components/viewport/Planet.tsx web/components/viewport/Viewport3D.tsx
git commit -m "feat: replace Sun with blue gas-giant Planet

- New Planet.tsx with FBM cloud swirl shader (ocean blue + gray bands)
- Fresnel atmosphere rim in pale cyan for bloom pickup
- Slow Y-rotation via UV offset (~0.01 rad/s)
- Remove PointLight and solar flare coupling from viewport
- Ambient light (0.2) unchanged"
```

---

## Task 2: Create Nebula Background

**Files:**
- Create: `web/components/viewport/NebulaBackground.tsx`
- Modify: `web/components/viewport/Viewport3D.tsx`

**Context:** 2-3 large billboard quads positioned behind the starfield (z: -1900 to -2000) with FBM noise-based gas cloud shaders in cool tones (deep blues, teals, muted purples). Very dim (max alpha ~0.3-0.4), nearly imperceptible animation. Additive blending to layer with starfield.

**Step 1: Create `web/components/viewport/NebulaBackground.tsx`**

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
  uniform float uSeed;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p + uSeed, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Very slow drift
    vec2 uv = vUv + vec2(uTime * 0.002, uTime * 0.001);

    // Layered cloud shapes
    float n1 = fbm(uv * 2.0);
    float n2 = fbm(uv * 3.5 + 5.0);
    float n3 = fbm(uv * 1.5 + 10.0);

    // Color mixing driven by noise layers
    vec3 color = mix(uColor1, uColor2, smoothstep(0.3, 0.7, n1));
    color = mix(color, uColor3, smoothstep(0.4, 0.8, n2) * 0.5);

    // Alpha: fade edges to transparent, keep dim overall
    float alpha = smoothstep(0.3, 0.6, n1) * smoothstep(0.25, 0.55, n3);
    alpha *= 0.35; // max brightness cap

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
}

function NebulaPlane({ position, scale, color1, color2, color3, seed }: NebulaPlaneProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uColor3: { value: new THREE.Color(color3) },
      uSeed: { value: seed },
    }),
    [color1, color2, color3, seed],
  );

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

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
 * NebulaBackground — 3 overlapping shader planes behind the starfield.
 * Cool-toned gas clouds (blues, teals, muted purple) with near-imperceptible drift.
 * Max alpha ~0.35, additive blending for natural layering.
 */
export function NebulaBackground() {
  return (
    <group>
      {/* Large central cloud — deep blue + teal */}
      <NebulaPlane
        position={[-200, 50, -1950]}
        scale={[1200, 800, 1]}
        color1="#0f172a"
        color2="#115e59"
        color3="#1e3a5f"
        seed={1.0}
      />
      {/* Upper-right wisp — teal + purple */}
      <NebulaPlane
        position={[400, 300, -1980]}
        scale={[900, 600, 1]}
        color1="#0d9488"
        color2="#2e1065"
        color3="#1e3a5f"
        seed={2.0}
      />
      {/* Lower-left accent — deep blue + muted purple */}
      <NebulaPlane
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
```

**Step 2: Add NebulaBackground to Viewport3D**

In `web/components/viewport/Viewport3D.tsx`:
- Add import: `import { NebulaBackground } from './NebulaBackground';`
- Add `<NebulaBackground />` as the first child inside `<Canvas>`, before the ambient light:
  ```tsx
  {/* Deep space nebula clouds */}
  <NebulaBackground />
  ```

**Step 3: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`

Confirm:
- Faint colored gas clouds visible behind stars (blues, teals, muted purples)
- Clouds are very dim — never brighter than a subtle tint on the black background
- Stars render cleanly in front of the nebula
- Edges of nebula planes fade smoothly (no hard quad edges visible)
- Near-imperceptible drift if you watch for 10+ seconds

**Step 4: Commit**

```bash
git add web/components/viewport/NebulaBackground.tsx web/components/viewport/Viewport3D.tsx
git commit -m "feat: add nebula background behind starfield

- 3 overlapping FBM shader planes at z: -1920 to -1980
- Cool tones: deep blue, teal, muted purple
- Max alpha 0.35, additive blending, edge fadeout
- Near-imperceptible drift animation (~0.002 units/sec)"
```

---

## Task 3: Create Space Dust Particles

**Files:**
- Create: `web/components/viewport/SpaceDust.tsx`
- Modify: `web/components/viewport/Viewport3D.tsx`

**Context:** ~200 sparse, dim, slowly-drifting particles in the mid-field (z: -100 to -800). GPU-driven drift via vertex shader. Reuses the soft-circle technique from `StarfieldBackground.tsx`. Uses `createSeededRandom` for deterministic layout.

**Step 1: Create `web/components/viewport/SpaceDust.tsx`**

```tsx
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
```

**Step 2: Add SpaceDust to Viewport3D**

In `web/components/viewport/Viewport3D.tsx`:
- Add import: `import { SpaceDust } from './SpaceDust';`
- Add `<SpaceDust />` after the Planet, before ThreatsLayer:
  ```tsx
  {/* Sparse drifting dust particles */}
  <SpaceDust />
  ```

**Step 3: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`

Confirm:
- Very faint, sparse particles slowly drifting through the mid-field
- Particles are barely visible — you have to look for them
- No particles appear in front of threats or canopy (z bounds keep them behind)
- Particles wrap smoothly without popping
- No performance impact visible in DevTools

**Step 4: Commit**

```bash
git add web/components/viewport/SpaceDust.tsx web/components/viewport/Viewport3D.tsx
git commit -m "feat: add sparse space dust drift particles

- 200 GPU-driven particles in z: -100 to -800
- Vertex shader drift with boundary wrapping
- Dim pale blue-white (alpha 0.15-0.3), additive blending
- Depth-based brightness: closer = slightly brighter
- Seeded PRNG (seed=42) for deterministic layout"
```

---

## Task 4: Create Anamorphic Lens Flare

**Files:**
- Create: `web/components/viewport/LensFlare.tsx`
- Modify: `web/components/viewport/Viewport3D.tsx`

**Context:** Subtle horizontal anamorphic streaks emanating from the planet's screen position. Rendered as a billboard mesh that tracks the planet's projected position. Pale blue, additive, very low alpha. Fades when planet is near viewport edges.

**Step 1: Create `web/components/viewport/LensFlare.tsx`**

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PLANET_WORLD_POS = new THREE.Vector3(300, 100, -800);

const flareVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flareFragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // Horizontal anamorphic streak: wide in X, tight in Y
    float dx = (vUv.x - 0.5) * 2.0;
    float dy = (vUv.y - 0.5) * 2.0;

    // Elliptical falloff: wide horizontal, narrow vertical
    float dist = sqrt(dx * dx + dy * dy * 16.0);
    float alpha = smoothstep(1.0, 0.0, dist);
    alpha = pow(alpha, 2.0);

    // Pale blue-white
    vec3 color = vec3(0.5, 0.7, 0.9);

    gl_FragColor = vec4(color, alpha * uOpacity * 0.12);
  }
`;

/**
 * LensFlare — subtle anamorphic horizontal streaks from the planet.
 * Tracks the planet's screen-space position. Fades at viewport edges.
 */
export function LensFlare() {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const projected = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!meshRef.current || !shaderRef.current) return;

    // Project planet position to NDC (-1 to 1)
    projected.copy(PLANET_WORLD_POS);
    projected.project(camera);

    // Check if planet is behind camera
    if (projected.z > 1) {
      shaderRef.current.uniforms.uOpacity.value = 0;
      return;
    }

    // Fade at viewport edges
    const edgeX = 1.0 - Math.abs(projected.x);
    const edgeY = 1.0 - Math.abs(projected.y);
    const edgeFade = Math.max(0, Math.min(edgeX, edgeY));
    const opacity = Math.pow(Math.min(edgeFade * 2, 1), 2);

    shaderRef.current.uniforms.uOpacity.value = opacity;

    // Position the flare mesh at the planet's projected world position
    // Use a Z slightly in front of canopy struts so it layers correctly
    meshRef.current.position.set(
      PLANET_WORLD_POS.x,
      PLANET_WORLD_POS.y,
      PLANET_WORLD_POS.z + 50,
    );
    meshRef.current.lookAt(camera.position);
  });

  return (
    <mesh ref={meshRef}>
      {/* Wide horizontal, narrow vertical */}
      <planeGeometry args={[600, 80]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={{
          uOpacity: { value: 1 },
        }}
        vertexShader={flareVertexShader}
        fragmentShader={flareFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
```

**Step 2: Add LensFlare to Viewport3D**

In `web/components/viewport/Viewport3D.tsx`:
- Add import: `import { LensFlare } from './LensFlare';`
- Add `<LensFlare />` after the Planet:
  ```tsx
  <LensFlare />
  ```

**Step 3: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`

Confirm:
- Faint horizontal pale-blue streak visible crossing the planet
- Streak is very subtle (alpha ~0.12 max) — a gentle cinematic touch
- Streak fades when planet is near viewport edges
- Bloom picks up the flare and gives it a soft glow
- No interference with threats or HUD elements

**Step 4: Commit**

```bash
git add web/components/viewport/LensFlare.tsx web/components/viewport/Viewport3D.tsx
git commit -m "feat: add anamorphic lens flare from planet

- Billboard mesh tracking planet screen position
- Horizontal elliptical falloff (anamorphic stretch)
- Pale blue, alpha 0.12, additive blending
- Fades at viewport edges, hidden when behind camera"
```

---

## Task 5: Create Lens Dirt Overlay

**Files:**
- Create: `web/components/bridge/cockpit/glass/LensDirt.tsx`
- Modify: `web/components/bridge/cockpit/ViewportGlass.tsx:4,17-19`

**Context:** A fullscreen shader overlay in the viewport glass stack that simulates faint smudges/dust on the cockpit glass. Only visible where bright objects bloom through. Very subtle (alpha ~0.05-0.08). This is a 2D CSS/DOM layer, not an R3F component — it lives alongside GlassBevel, GlassSurface, etc.

First, check how the existing glass layers are styled:

**Step 1: Read an existing glass layer to match the pattern**

Read `web/components/bridge/cockpit/glass/GlassSurface.tsx` and `web/components/bridge/cockpit/glass/GlassBevel.tsx` to understand the CSS layer pattern (absolute positioning, z-index, pointer-events-none).

**Step 2: Create `web/components/bridge/cockpit/glass/LensDirt.tsx`**

This should match the existing glass layer pattern — a `div` with absolute positioning, pointer-events-none, and a CSS-based visual effect. Use a canvas element with noise-generated smudge texture, composited with `mix-blend-mode: screen` so it only shows through bright areas.

```tsx
'use client';

import { useRef, useEffect } from 'react';

/**
 * LensDirt — faint smudge overlay on cockpit glass.
 * Screen blend mode so it only reveals through bright bloom areas.
 * Generates a noise-based smudge texture on a canvas element.
 */
export function LensDirt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;

    // Generate noise-based smudge pattern
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;

        // Multi-scale noise approximation
        const nx = x / w;
        const ny = y / h;
        const n1 = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        const n2 = Math.sin(nx * 47.123 + ny * 93.456) * 23421.631;
        const noise1 = (n1 - Math.floor(n1));
        const noise2 = (n2 - Math.floor(n2));

        // Create sparse smudge-like blobs
        const combined = noise1 * 0.6 + noise2 * 0.4;
        const smudge = Math.pow(Math.max(combined - 0.55, 0) * 4, 2);

        // Warm white tint
        const brightness = smudge * 255;
        data[i] = brightness * 0.9;      // R
        data[i + 1] = brightness * 0.92;  // G
        data[i + 2] = brightness;          // B
        data[i + 3] = brightness * 0.4;   // A — very low opacity
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 5,
        mixBlendMode: 'screen',
        opacity: 0.06,
      }}
    />
  );
}
```

**Step 3: Add LensDirt to ViewportGlass**

In `web/components/bridge/cockpit/ViewportGlass.tsx`:
- Add import: `import { LensDirt } from './glass/LensDirt';`
- Add `<LensDirt />` as the last child:
  ```tsx
  export function ViewportGlass() {
    return (
      <>
        <GlassBevel />
        <GlassSurface />
        <ParallaxReflection />
        <NearFieldParticles />
        <LensDirt />
      </>
    );
  }
  ```

**Step 4: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`

Confirm:
- Very faint smudge texture visible only where bright objects (planet rim, threat glows) shine through
- Screen blend mode means pure black areas show nothing — smudges only appear over light
- Opacity 0.06 keeps it barely perceptible
- No interference with HUD interactions (pointer-events-none)

**Step 5: Commit**

```bash
git add web/components/bridge/cockpit/glass/LensDirt.tsx web/components/bridge/cockpit/ViewportGlass.tsx
git commit -m "feat: add lens dirt overlay to cockpit glass

- Canvas-generated noise smudge texture (512x512)
- Screen blend mode: only visible through bright bloom areas
- Opacity 0.06 for barely-perceptible film
- Pointer-events-none, z-index 5 in glass stack"
```

---

## Task 6: Final Integration Pass & Visual Tuning

**Files:**
- Modify: `web/components/viewport/Viewport3D.tsx` (verify final state)

**Context:** Verify the complete scene renders correctly with all layers. Check render order, z-fighting, performance. Adjust values if needed.

**Step 1: Read the final Viewport3D.tsx and verify scene order**

The final `Viewport3D.tsx` should have this scene order inside `<Canvas>`:
```tsx
<NebulaBackground />       {/* z: -1920 to -1980 */}
<StarfieldBackground />     {/* z: -850 to -1850 */}
<Planet />                  {/* z: -800 */}
<LensFlare />               {/* z: -750 (billboard) */}
<SpaceDust />               {/* z: -100 to -800 */}
<ambientLight intensity={0.2} />
<ThreatsLayer threats={threats} />
<CanopyStruts />
<HologramOverlay>...</HologramOverlay>
<SceneEffects />
```

**Step 2: Run dev server and check performance**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`

Open browser DevTools → Performance tab:
- Frame time should remain under 16ms (60fps)
- No new draw calls beyond the expected 5-6 additions (3 nebula planes, 1 planet, 1 dust points, 1 flare plane)
- GPU memory stable

**Step 3: Visual checklist**

- [ ] Nebula clouds visible behind stars, cool-toned, very dim
- [ ] Blue planet with gray swirls, cyan atmosphere rim glowing via bloom
- [ ] No PointLight from old Sun (scene lit by ambient only)
- [ ] Faint anamorphic streak across planet
- [ ] Sparse dust particles drifting slowly in mid-field
- [ ] Lens dirt only visible over bright objects
- [ ] Threats render correctly — no z-fighting, no visual regressions
- [ ] Canopy struts still render correctly
- [ ] HUD elements fully interactive (no pointer-event blocking)
- [ ] Bloom, chromatic aberration, vignette all working as before

**Step 4: Commit final state if any adjustments were needed**

```bash
git add -A
git commit -m "chore: tune space atmosphere layer integration

- Verify render order and z-depth structure
- Confirm no z-fighting between new layers
- Performance verified under 16ms frame time"
```

---

## Summary

| Task | Component | Type | Draw Calls Added |
|------|-----------|------|-----------------|
| 1 | Planet.tsx | Rewrite Sun → Planet | 0 net (replaces Sun) |
| 2 | NebulaBackground.tsx | New background layer | +3 (shader planes) |
| 3 | SpaceDust.tsx | New particle layer | +1 (Points) |
| 4 | LensFlare.tsx | New cinematic effect | +1 (billboard) |
| 5 | LensDirt.tsx | New glass overlay | +0 (DOM canvas, not R3F) |
| 6 | Integration pass | Verification | +0 |

**Total new draw calls:** ~5 additional R3F draw calls. Negligible performance impact.

**Files created:** 5 (`Planet.tsx`, `NebulaBackground.tsx`, `SpaceDust.tsx`, `LensFlare.tsx`, `LensDirt.tsx`)
**Files modified:** 2 (`Viewport3D.tsx`, `ViewportGlass.tsx`)
**Files untouched:** `Sun.tsx` (kept but no longer imported), `StarfieldBackground.tsx`, `SceneEffects.tsx`, `CanopyStruts.tsx`
