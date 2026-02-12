# GPU Performance Critical Fixes (P0 + P1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the 4 most expensive GPU bottlenecks across Ion Storm, Black Hole, Enemy Cruiser, and Solar Flare threat components — targeting 40-60% frame time reduction when these threats are visible.

**Architecture:** Each fix replaces a CPU-heavy or geometry-churning pattern with a GPU-native equivalent (vertex shaders, baked textures, merged geometry) while maintaining pixel-identical or imperceptibly-different visual output. All changes are localized to individual threat component files and their material/utility dependencies.

**Tech Stack:** React Three Fiber, Three.js BufferGeometry, custom GLSL vertex/fragment shaders, @react-three/drei shaderMaterial

---

## Performance Verification Setup

Before starting any task, add this temporary debug helper. Remove it after all optimizations are validated.

### Task 0: Add GPU Performance Monitor

**Files:**
- Create: `lib/debug/perf-monitor.ts`

**Step 1: Create the monitor**

```typescript
import * as THREE from 'three';

let _renderer: THREE.WebGLRenderer | null = null;

export function registerRenderer(renderer: THREE.WebGLRenderer) {
  _renderer = renderer;
}

export function logGPUStats(label: string) {
  if (!_renderer) return;
  const info = _renderer.info;
  console.log(`[GPU ${label}]`, {
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  });
}
```

**Step 2: Commit**

```bash
git add lib/debug/perf-monitor.ts
git commit -m "chore: add temporary GPU perf monitor for optimization work"
```

---

## P0-A: Ion Storm Lightning Arc Vertex Morphing

**Problem:** Ion Storm regenerates 12 TubeGeometry meshes every 12-20 frames (3-5x/sec). Each regeneration allocates new geometry, creates a CatmullRomCurve3, and disposes the old geometry — causing GC pressure and frame spikes.

**Solution:** Pre-generate 12 tube geometries once. On each "regeneration" cycle, morph the vertex positions of the existing geometry by updating the position buffer attribute directly. No new geometry allocation, no disposal, no GC.

### Task 1: Create `morphLightningArc` Utility

**Files:**
- Modify: `lib/utils/geometry.ts` (add new export)

**Step 1: Add the morphing function to geometry.ts**

Add after the existing `tubeFromPoints` function (after line 71):

```typescript
/**
 * Morph an existing TubeGeometry's vertices to follow a new lightning path.
 * Updates position attribute in-place — no new geometry allocation.
 * The tube must have been created with the same tubularSegments and radialSegments.
 */
export function morphTubeToPath(
  tube: THREE.TubeGeometry,
  newPoints: THREE.Vector3[],
  radius = 0.05
): void {
  const curve = new THREE.CatmullRomCurve3(newPoints);
  const pos = tube.attributes.position;
  const tubularSegments = tube.parameters.tubularSegments ?? 16;
  const radialSegments = tube.parameters.radialSegments ?? 4;

  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();

  // Compute Frenet frames and write vertex positions
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, P);
    curve.getTangentAt(t, T);

    // Minimal normal computation (stable for most arcs)
    if (Math.abs(T.y) > 0.99) {
      N.set(1, 0, 0);
    } else {
      N.set(0, 1, 0);
    }
    B.crossVectors(T, N).normalize();
    N.crossVectors(B, T).normalize();

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const idx = i * (radialSegments + 1) + j;

      pos.setXYZ(
        idx,
        P.x + radius * (cosT * N.x + sinT * B.x),
        P.y + radius * (cosT * N.y + sinT * B.y),
        P.z + radius * (cosT * N.z + sinT * B.z)
      );
    }
  }

  pos.needsUpdate = true;
}
```

**Step 2: Run the dev server to verify no import errors**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Compiles without errors

**Step 3: Commit**

```bash
git add lib/utils/geometry.ts
git commit -m "feat: add morphTubeToPath for in-place lightning arc updates"
```

### Task 2: Refactor IonStorm to Use Vertex Morphing

**Files:**
- Modify: `components/three/threats/IonStorm.tsx`

**Step 1: Update imports**

At line 9, add `morphTubeToPath` to the import:

```typescript
import { generateLightningPath, tubeFromPoints, morphTubeToPath } from '@/lib/utils/geometry';
```

**Step 2: Pre-generate arc geometries in useMemo**

Replace the current `arcRefs` approach. Find the outer/core arc refs (around lines 55-70) and replace with pre-generated geometry arrays. After the existing `bracketGeometry` useMemo block (around line 102), add:

```typescript
// Pre-generate arc geometries ONCE — will morph in place
const outerArcGeos = useMemo(() => {
  return Array.from({ length: OUTER_ARC_COUNT }, () => {
    const points = generateLightningPath(
      new THREE.Vector3(0, 0, size * 0.35),
      new THREE.Vector3(
        (Math.random() - 0.5) * size * 2,
        (Math.random() - 0.5) * size * 2,
        (Math.random() - 0.5) * size * 2
      ).normalize().multiplyScalar(size * 1.5),
      10,
      size * 0.3
    );
    return tubeFromPoints(points, 0.015, 16, 4);
  });
}, [size]);

const coreArcGeos = useMemo(() => {
  return Array.from({ length: CORE_ARC_COUNT }, () => {
    const points = generateLightningPath(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(
        (Math.random() - 0.5) * size,
        (Math.random() - 0.5) * size,
        (Math.random() - 0.5) * size
      ).normalize().multiplyScalar(size * 0.35),
      8,
      size * 0.15
    );
    return tubeFromPoints(points, 0.025, 12, 4);
  });
}, [size]);
```

Add a cleanup effect:
```typescript
useEffect(() => {
  return () => {
    outerArcGeos.forEach(g => g.dispose());
    coreArcGeos.forEach(g => g.dispose());
  };
}, [outerArcGeos, coreArcGeos]);
```

**Step 3: Replace arc regeneration in useFrame with morphing**

In the useFrame callback, find the lightning arc regeneration block (around lines 244-270). Replace the geometry disposal/creation with morphing:

Replace:
```typescript
// Old: Dispose old geometry, create new one
arcRef.geometry.dispose();
arcRef.geometry = tubeFromPoints(points, 0.015, 16, 4);
```

With:
```typescript
// New: Morph existing geometry in place (zero allocation)
morphTubeToPath(outerArcGeos[i], points, 0.015);
```

And similarly for core arcs:
```typescript
morphTubeToPath(coreArcGeos[i], points, 0.025);
```

**Step 4: Update JSX to use pre-generated geometries**

In the outer arcs group (around lines 429-446), replace the dynamic geometry refs with the pre-generated array:

```tsx
{outerArcGeos.map((geo, i) => (
  <mesh key={`outer-arc-${i}`} ref={el => { if (el) outerArcRefs.current[i] = el; }} geometry={geo}>
    <meshBasicMaterial
      color="#ec4899"
      transparent
      opacity={0.35}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      side={THREE.DoubleSide}
      toneMapped={false}
    />
  </mesh>
))}
```

Same pattern for core arcs with `coreArcGeos`.

**Step 5: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Ion Storm lightning arcs still flicker/jitter with the same visual character. Arcs may have slightly different random patterns but the effect is indistinguishable.

**Step 6: Commit**

```bash
git add components/three/threats/IonStorm.tsx lib/utils/geometry.ts
git commit -m "perf: ion storm arcs use vertex morphing instead of geometry regen (P0)"
```

---

## P0-B: Black Hole Accretion Disk GPU Physics

**Problem:** The accretion disk runs `sqrt()` + `sin()` + `cos()` on 600 particles every frame via CPU-side `onTick` callbacks. That's ~1800 trig operations per frame on the JS thread.

**Solution:** Replace the CPU-side `onTick` Keplerian physics with a custom ShaderMaterial that computes orbital positions entirely in the vertex shader. The particle system becomes a static Points mesh with per-vertex attributes (initial angle, radius, speed), and all orbital math runs on the GPU.

### Task 3: Create `AccretionDiskMaterial` Shader

**Files:**
- Create: `lib/materials/AccretionDiskMaterial.tsx`

**Step 1: Write the shader material**

```typescript
'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GPU-driven Keplerian accretion disk.
 * Each particle has: initial angle, radius, inward spiral speed.
 * Orbital velocity ∝ 1/√r (Kepler's third law).
 * All physics computed in vertex shader — zero CPU cost per frame.
 */
const AccretionDiskMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0.6, 0.4, 1.0),
    uColorInner: new THREE.Color(1.0, 0.8, 0.4),
    uEventHorizonRadius: 0.5,
    uOuterRadius: 2.0,
    uSpeedMult: 1.0,
    uSpiralRate: 0.15,
    uOpacity: 1.0,
    uPixelRatio: 1.0,
  },
  // vertex
  /* glsl */ `
    attribute float aInitAngle;
    attribute float aInitRadius;
    attribute float aSize;
    attribute float aPhase;
    uniform float uTime;
    uniform float uEventHorizonRadius;
    uniform float uOuterRadius;
    uniform float uSpeedMult;
    uniform float uSpiralRate;
    uniform float uPixelRatio;
    varying float vRadiusNorm;
    varying float vOpacity;

    void main() {
      // Spiral inward over time
      float radius = aInitRadius - uSpiralRate * uTime * uSpeedMult;

      // Wrap: when radius falls below event horizon, reset to outer edge
      float range = uOuterRadius - uEventHorizonRadius;
      radius = uEventHorizonRadius + mod(radius - uEventHorizonRadius, range);

      // Keplerian angular velocity: omega = 1.5 / sqrt(r)
      float omega = 1.5 / sqrt(max(radius, 0.1));
      float angle = aInitAngle + omega * uTime * uSpeedMult + aPhase;

      // Flat disk with slight vertical jitter baked into position.y
      vec3 pos = vec3(
        cos(angle) * radius,
        position.y,  // Pre-baked Y jitter from attribute
        sin(angle) * radius
      );

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);

      // Pass normalized radius for color gradient
      vRadiusNorm = (radius - uEventHorizonRadius) / range;
      vOpacity = smoothstep(0.0, 0.1, vRadiusNorm); // Fade near horizon
    }
  `,
  // fragment
  /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uColorInner;
    uniform float uOpacity;
    varying float vRadiusNorm;
    varying float vOpacity;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float softEdge = smoothstep(0.5, 0.15, d);

      // Inner particles glow hotter (gold), outer are cooler (purple)
      vec3 col = mix(uColorInner, uColor, vRadiusNorm);

      gl_FragColor = vec4(col, softEdge * vOpacity * uOpacity);
    }
  `
);

extend({ AccretionDiskMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    accretionDiskMaterial: any;
  }
}

export { AccretionDiskMaterial };
```

**Step 2: Commit**

```bash
git add lib/materials/AccretionDiskMaterial.tsx
git commit -m "feat: add AccretionDiskMaterial with GPU Keplerian orbit physics"
```

### Task 4: Create `AccretionDisk` Component

**Files:**
- Create: `components/three/threats/AccretionDisk.tsx`

**Step 1: Write the GPU-driven accretion disk component**

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import '@/lib/materials/AccretionDiskMaterial';

interface AccretionDiskProps {
  count: number;
  eventHorizonRadius: number;
  outerRadius: number;
  color: THREE.Color | string;
  colorInner: THREE.Color | string;
  spiralRate?: number;
  speedMult?: number;
  opacity?: number;
  /** Y-axis spread for disk thickness */
  diskHeight?: number;
  /** Base particle size */
  particleSize?: number;
}

export function AccretionDisk({
  count,
  eventHorizonRadius,
  outerRadius,
  color,
  colorInner,
  spiralRate = 0.15,
  speedMult = 1.0,
  opacity = 1.0,
  diskHeight = 0.15,
  particleSize = 3.0,
}: AccretionDiskProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const initAngles = new Float32Array(count);
    const initRadii = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const range = outerRadius - eventHorizonRadius;
    for (let i = 0; i < count; i++) {
      // Distribute across disk with slight bias toward outer edge
      const r = eventHorizonRadius + Math.random() * range;
      const angle = Math.random() * Math.PI * 2;

      // Y position is fixed vertical jitter (baked, not recomputed)
      positions[i * 3] = 0; // X computed in shader
      positions[i * 3 + 1] = (Math.random() - 0.5) * diskHeight;
      positions[i * 3 + 2] = 0; // Z computed in shader

      initAngles[i] = angle;
      initRadii[i] = r;
      sizes[i] = particleSize * (0.5 + Math.random() * 1.0);
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aInitAngle', new THREE.BufferAttribute(initAngles, 1));
    geo.setAttribute('aInitRadius', new THREE.BufferAttribute(initRadii, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    return { geometry: geo };
  }, [count, eventHorizonRadius, outerRadius, diskHeight, particleSize]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <accretionDiskMaterial
        ref={matRef}
        uColor={typeof color === 'string' ? new THREE.Color(color) : color}
        uColorInner={typeof colorInner === 'string' ? new THREE.Color(colorInner) : colorInner}
        uEventHorizonRadius={eventHorizonRadius}
        uOuterRadius={outerRadius}
        uSpeedMult={speedMult}
        uSpiralRate={spiralRate}
        uOpacity={opacity}
        uPixelRatio={viewport.dpr}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
```

**Step 2: Commit**

```bash
git add components/three/threats/AccretionDisk.tsx
git commit -m "feat: add AccretionDisk component with GPU-only Keplerian physics"
```

### Task 5: Wire AccretionDisk into BlackHole Component

**Files:**
- Modify: `components/three/threats/BlackHole.tsx`

**Step 1: Replace the two InstancedParticleSystem accretion disks**

Add import at top of BlackHole.tsx:
```typescript
import { AccretionDisk } from './AccretionDisk';
```

Remove the `accretionDiskTick` callback (lines 139-177) and `trailDiskTick` callback (lines 180-213). These are now dead code.

Remove the `diskOrbits` and `trailOrbits` useMemo blocks (lines 63-86) — the GPU shader handles all orbital init.

Remove the InstancedParticleSystem imports if no longer used elsewhere.

**Step 2: Replace JSX**

Find the two `<InstancedParticleSystem>` blocks for the accretion disk (around lines 387-416). Replace with:

```tsx
{/* Layer 3: Accretion Disk (GPU-driven Keplerian spiral) */}
<AccretionDisk
  count={400}
  eventHorizonRadius={eventHorizonRadius}
  outerRadius={size * 2.0}
  color="#7c3aed"
  colorInner="#fbbf24"
  spiralRate={0.15}
  speedMult={collapseProgress > 0 ? 3.0 : 1.0}
  opacity={collapseProgress > 0.67 ? Math.max(0, 1 - (collapseProgress - 0.67) * 3) : 1.0}
  diskHeight={0.15}
  particleSize={3.0}
/>
<AccretionDisk
  count={200}
  eventHorizonRadius={eventHorizonRadius}
  outerRadius={size * 2.0}
  color="#4c1d95"
  colorInner="#f59e0b"
  spiralRate={0.12}
  speedMult={collapseProgress > 0 ? 3.0 : 1.0}
  opacity={collapseProgress > 0.67 ? Math.max(0, 1 - (collapseProgress - 0.67) * 3) : 0.5}
  diskHeight={0.2}
  particleSize={2.5}
/>
```

**Step 3: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Accretion disk orbits the black hole with the same Keplerian spiral-inward motion. Colors gradient from gold (inner) to purple (outer). No CPU particle tick running.

**Step 4: Commit**

```bash
git add components/three/threats/BlackHole.tsx components/three/threats/AccretionDisk.tsx lib/materials/AccretionDiskMaterial.tsx
git commit -m "perf: black hole accretion disk uses GPU Keplerian physics (P0)"
```

---

## P1-A: Enemy Cruiser Hull Geometry Merge

**Problem:** The Enemy Cruiser renders 38-42 separate meshes. The hull alone is 11 individual meshes (cones, boxes) each causing a separate draw call, despite all sharing `MeshStandardMaterial` with similar properties.

**Solution:** Merge the 11 static hull meshes into a single BufferGeometry using `THREE.BufferGeometryUtils.mergeGeometries()`. This collapses 11 draw calls to 1. Also merge the 8 running light spheres into a single Points mesh.

### Task 6: Merge Static Hull Geometry

**Files:**
- Modify: `components/three/threats/EnemyCruiser.tsx`

**Step 1: Create merged hull geometry in useMemo**

Add import at top:
```typescript
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
```

After the `bracketGeometry` useMemo block, add a new useMemo that pre-builds the merged hull:

```typescript
const mergedHull = useMemo(() => {
  const parts: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();

  // Front nose cone
  const nose = new THREE.ConeGeometry(size * 0.22, size * 1.0, 8);
  m.makeRotationX(Math.PI / 2);
  m.setPosition(0, 0, size * 0.2);
  nose.applyMatrix4(m);
  parts.push(nose);

  // Rear engine cone
  const rear = new THREE.ConeGeometry(size * 0.22, size * 0.6, 8);
  m.makeRotationX(-Math.PI / 2);
  m.setPosition(0, 0, -size * 0.35);
  rear.applyMatrix4(m);
  parts.push(rear);

  // Port armor plate
  const portArmor = new THREE.BoxGeometry(size * 0.04, size * 0.18, size * 1.0);
  m.identity().setPosition(-size * 0.22, 0, -size * 0.05);
  portArmor.applyMatrix4(m);
  parts.push(portArmor);

  // Starboard armor plate
  const stbdArmor = new THREE.BoxGeometry(size * 0.04, size * 0.18, size * 1.0);
  m.identity().setPosition(size * 0.22, 0, -size * 0.05);
  stbdArmor.applyMatrix4(m);
  parts.push(stbdArmor);

  // Dorsal panel
  const dorsal = new THREE.BoxGeometry(size * 0.3, size * 0.03, size * 0.9);
  m.identity().setPosition(0, size * 0.1, -size * 0.05);
  dorsal.applyMatrix4(m);
  parts.push(dorsal);

  // Ventral panel
  const ventral = new THREE.BoxGeometry(size * 0.3, size * 0.03, size * 0.9);
  m.identity().setPosition(0, -size * 0.1, -size * 0.05);
  ventral.applyMatrix4(m);
  parts.push(ventral);

  // Port pylon
  const portPylon = new THREE.BoxGeometry(size * 0.25, size * 0.05, size * 0.08);
  m.makeRotationZ(0.26).setPosition(-size * 0.28, -size * 0.02, -size * 0.2);
  portPylon.applyMatrix4(m);
  parts.push(portPylon);

  // Starboard pylon
  const stbdPylon = new THREE.BoxGeometry(size * 0.25, size * 0.05, size * 0.08);
  m.makeRotationZ(-0.26).setPosition(size * 0.28, -size * 0.02, -size * 0.2);
  stbdPylon.applyMatrix4(m);
  parts.push(stbdPylon);

  // Bridge section
  const bridge = new THREE.BoxGeometry(size * 0.12, size * 0.06, size * 0.15);
  m.identity().setPosition(0, size * 0.1, size * 0.25);
  bridge.applyMatrix4(m);
  parts.push(bridge);

  const merged = mergeGeometries(parts, false);
  // Dispose temporaries
  parts.forEach(p => p.dispose());
  return merged!;
}, [size]);

// Cleanup
useEffect(() => {
  return () => { mergedHull.dispose(); };
}, [mergedHull]);
```

**Step 2: Replace 11 hull mesh JSX with single mesh**

Find the hull group (around lines 318-421 in original). Replace all the individual cone/box meshes with:

```tsx
<group ref={hullRef} onPointerOver={onOver} onPointerOut={onOut} onClick={handleClick}>
  <mesh geometry={mergedHull}>
    <meshStandardMaterial
      color="#1f2937"
      metalness={0.85}
      roughness={0.25}
      emissive={color}
      emissiveIntensity={hullEmissiveRef.current}
      toneMapped={false}
    />
  </mesh>
  {/* Bridge window lights remain separate (emissive points) */}
  <mesh position={[-size * 0.03, size * 0.12, size * 0.3]}>
    <sphereGeometry args={[size * 0.012, 6, 6]} />
    <meshBasicMaterial color="#93c5fd" toneMapped={false} />
  </mesh>
  <mesh position={[size * 0.03, size * 0.12, size * 0.3]}>
    <sphereGeometry args={[size * 0.012, 6, 6]} />
    <meshBasicMaterial color="#93c5fd" toneMapped={false} />
  </mesh>
</group>
```

This reduces hull draw calls from 11 to 3 (merged hull + 2 bridge lights).

**Step 3: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Enemy Cruiser looks identical. The hull silhouette, metallic sheen, and emissive glow are the same.

**Step 4: Commit**

```bash
git add components/three/threats/EnemyCruiser.tsx
git commit -m "perf: merge enemy cruiser hull into single geometry (-8 draw calls) (P1)"
```

### Task 7: Convert Running Lights to Points Mesh

**Files:**
- Modify: `components/three/threats/EnemyCruiser.tsx`

**Step 1: Create running lights geometry and material in useMemo**

Replace the 8 individual sphere meshes with a single Points mesh. Add after the `mergedHull` useMemo:

```typescript
const runningLightsGeo = useMemo(() => {
  const positions = new Float32Array(LIGHT_CONFIGS.length * 3);
  const phases = new Float32Array(LIGHT_CONFIGS.length);
  const colors = new Float32Array(LIGHT_CONFIGS.length * 3);

  LIGHT_CONFIGS.forEach((cfg, i) => {
    positions[i * 3] = cfg.position[0] * size;
    positions[i * 3 + 1] = cfg.position[1] * size;
    positions[i * 3 + 2] = cfg.position[2] * size;
    phases[i] = cfg.phase;
    const c = new THREE.Color(cfg.color);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  return geo;
}, [size]);

const runningLightsMat = useMemo(() => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSweepCycle: { value: 0 },
      uAlert: { value: 0 },
      uPixelRatio: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        vColor = aColor;
        vPhase = aPhase;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 4.0 * uPixelRatio * (200.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSweepCycle;
      uniform float uAlert;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.1, d);

        // Sweep blink (same logic as original per-light update)
        float dist = abs(vPhase - uSweepCycle);
        float brightness = mix(smoothstep(0.3, 0.0, dist) * 0.6, 0.8, uAlert);

        gl_FragColor = vec4(vColor * (0.15 + brightness), soft * (0.15 + brightness));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}, []);
```

**Step 2: Update useFrame to drive the Points material**

In the useFrame callback, replace the running lights loop (around lines 189-203) with:

```typescript
// Running lights — single uniform update instead of 8 mesh loops
if (runningLightsMat) {
  const sweepCycle = (time * 2) % (LIGHT_CONFIGS.length * 0.3);
  runningLightsMat.uniforms.uTime.value = time;
  runningLightsMat.uniforms.uSweepCycle.value = sweepCycle;
  runningLightsMat.uniforms.uAlert.value = hovered ? 1.0 : 0.0;
}
```

**Step 3: Replace JSX**

Remove the `LIGHT_CONFIGS.map(...)` mesh loop (around lines 632-648). Replace with:

```tsx
{/* Running lights — single Points draw call instead of 8 */}
<points geometry={runningLightsGeo} material={runningLightsMat} />
```

**Step 4: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Running lights still sweep sequentially. Alert mode (hover) still lights all at once.

**Step 5: Commit**

```bash
git add components/three/threats/EnemyCruiser.tsx
git commit -m "perf: enemy cruiser running lights use single Points mesh (-7 draw calls) (P1)"
```

---

## P1-B: Solar Flare FBM Bake to Scrolling Texture

**Problem:** `SolarSurfaceMaterial` runs 2 layers of FBM noise (4-octave + 3-octave = 7 total simplex noise evaluations per octave) per fragment per frame on a 2048-triangle sphere. Each simplex noise call is ~50 ALU ops, totaling ~350 ALU ops per fragment.

**Solution:** Pre-bake the FBM noise into two 512x512 DataTextures on mount (same pattern as NebulaBackground). The fragment shader scrolls UV coordinates through the baked textures instead of computing noise. Cost drops from ~350 to ~10 ALU ops per fragment.

### Task 8: Bake Solar FBM Textures

**Files:**
- Modify: `components/three/threats/SolarFlare.tsx`

**Step 1: Add texture baking utility**

Above the `SolarSurfaceMaterial` definition (before line 15), add:

```typescript
/**
 * Bake 3D simplex noise into a 2D DataTexture.
 * Samples noise at UV coordinates mapped to a sphere surface.
 * Returns texture with noise values in R channel (0-255).
 */
function bakeFBMTexture(
  resolution: number,
  scale: number,
  octaves: number,
  seed: number
): THREE.DataTexture {
  // Simple JS-side 3D noise approximation for baking
  // Uses the same hash-based approach as the GPU simplex
  const data = new Uint8Array(resolution * resolution * 4);

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const u = x / resolution;
      const v = y / resolution;

      // Map UV to spherical coordinates for seamless wrapping
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      const sx = Math.sin(phi) * Math.cos(theta) * scale;
      const sy = Math.sin(phi) * Math.sin(theta) * scale;
      const sz = Math.cos(phi) * scale;

      // Multi-octave value noise (sufficient for baked texture)
      let value = 0;
      let amplitude = 0.5;
      let freq = 1;
      for (let o = 0; o < octaves; o++) {
        const px = sx * freq + seed;
        const py = sy * freq + seed * 1.3;
        const pz = sz * freq + seed * 0.7;
        // Hash-based pseudo noise
        const h = Math.sin(px * 127.1 + py * 311.7 + pz * 74.7) * 43758.5453;
        value += (h - Math.floor(h)) * amplitude;
        amplitude *= 0.5;
        freq *= 2;
      }

      const byte = Math.floor(Math.min(1, Math.max(0, value)) * 255);
      const idx = (y * resolution + x) * 4;
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, resolution, resolution, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
```

**Step 2: Replace SolarSurfaceMaterial to use baked textures**

Replace the current `SolarSurfaceMaterial` definition (lines 15-67) with:

```typescript
const SolarSurfaceMaterial = shaderMaterial(
  {
    time: 0,
    emissiveIntensity: 5.0,
    uNoiseTex1: null as THREE.DataTexture | null,
    uNoiseTex2: null as THREE.DataTexture | null,
  },
  // vertex
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float time;
    uniform float emissiveIntensity;
    uniform sampler2D uNoiseTex1;
    uniform sampler2D uNoiseTex2;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vUv;

    void main() {
      // Scroll UVs at different speeds (replaces per-fragment FBM)
      vec2 uv1 = vUv + vec2(0.0, time * 0.05);
      vec2 uv2 = vUv * 1.5 - vec2(time * 0.03, time * 0.02);

      float n1 = texture2D(uNoiseTex1, uv1).r;
      float n2 = texture2D(uNoiseTex2, uv2).r;
      float combined = n1 * 0.6 + n2 * 0.4;

      // Same 3-stop gradient as before
      vec3 whiteHot = vec3(0.996, 0.953, 0.78);
      vec3 gold = vec3(0.984, 0.749, 0.141);
      vec3 orange = vec3(0.976, 0.451, 0.086);
      vec3 surface = combined > 0.5
        ? mix(gold, whiteHot, (combined - 0.5) * 2.0)
        : mix(orange, gold, combined * 2.0);

      // Fresnel rim
      float rim = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 2.0);
      surface += vec3(1.0) * rim * 0.6;

      gl_FragColor = vec4(surface * emissiveIntensity, 1.0);
    }
  `
);
```

**Step 3: Wire baked textures in the component**

Inside the SolarFlare component, add texture baking:

```typescript
const noiseTex1 = useMemo(() => bakeFBMTexture(512, 3.0, 4, 42.0), []);
const noiseTex2 = useMemo(() => bakeFBMTexture(512, 6.0, 3, 137.0), []);

useEffect(() => {
  return () => {
    noiseTex1.dispose();
    noiseTex2.dispose();
  };
}, [noiseTex1, noiseTex2]);
```

Update the solar surface mesh JSX to pass the textures:

```tsx
<mesh ref={surfaceRef} onPointerOver={onOver} onPointerOut={onOut} onClick={handleClick}>
  <sphereGeometry args={[solarRadius, 32, 32]} />
  <solarSurfaceMaterial
    key={SolarSurfaceMaterial.key}
    uNoiseTex1={noiseTex1}
    uNoiseTex2={noiseTex2}
    toneMapped={false}
  />
</mesh>
```

**Step 4: Remove the noiseGLSL import**

If `noiseGLSL` is only used by the old SolarSurfaceMaterial, remove it from the import line (around line 11). Keep `fresnelGLSL` and `gradientGLSL` if still used elsewhere in the file.

**Step 5: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Solar surface has the same white-hot → gold → orange color gradient with animated turbulence. The noise pattern may look slightly different (baked vs computed) but the visual quality and motion are equivalent.

**Step 6: Commit**

```bash
git add components/three/threats/SolarFlare.tsx
git commit -m "perf: solar flare uses baked FBM textures instead of per-fragment noise (P1)"
```

---

## Final Verification

### Task 9: Validate Performance Improvements

**Step 1: Verify all threats render correctly**

Manually test each threat type by navigating to scenes that show them. Confirm:
- [ ] Asteroid: unchanged (not modified in this plan)
- [ ] Ion Storm: Lightning arcs still flicker, clouds drift, rings rotate
- [ ] Black Hole: Accretion disk spirals inward, hawking radiation glows, wave rings pulse
- [ ] Solar Flare: Surface turbulence animates, prominences arc, countdown rings expand
- [ ] Enemy Cruiser: Hull silhouette intact, running lights sweep, turrets track
- [ ] Wormhole: unchanged (not modified in this plan)

**Step 2: Check draw call reduction**

Using browser devtools or the perf monitor from Task 0, compare before/after draw calls for each modified threat.

Expected reductions:
| Threat | Before | After | Saved |
|--------|--------|-------|-------|
| Ion Storm | 28-32 | 28-32 | 0 (same count, no alloc) |
| Black Hole | 15-18 | 13-16 | ~2 (InstancedParticle → Points) |
| Enemy Cruiser | 38-42 | 23-27 | ~15 |
| Solar Flare | 35-40 | 35-40 | 0 (shader cost, not draw calls) |

**Step 3: Remove perf monitor**

If the perf monitor from Task 0 is no longer needed:

```bash
rm lib/debug/perf-monitor.ts
git add -u lib/debug/perf-monitor.ts
git commit -m "chore: remove temporary GPU perf monitor"
```
