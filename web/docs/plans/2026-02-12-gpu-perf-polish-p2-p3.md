# GPU Performance Polish (P2 + P3) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Secondary GPU optimizations that reduce draw calls, eliminate per-frame CPU matrix work, and trim redundant shader passes — targeting an additional 15-25% frame time reduction on top of P0/P1 fixes.

**Architecture:** Three targeted changes: (1) move orrery debris ring animation from CPU matrix updates to a vertex shader, (2) reduce Ion Storm cloud layers and Wormhole portal layers to eliminate visually-redundant shader passes, (3) consolidate Enemy Cruiser running lights into a Points mesh. All changes preserve visual output.

**Tech Stack:** React Three Fiber, Three.js InstancedMesh, custom GLSL vertex shaders, @react-three/drei shaderMaterial

**Prerequisites:** The P0/P1 plan should be completed first, but these tasks are independent of each other and can be executed in any order.

---

## P2-A: Debris Ring Animation to Vertex Shader

**Problem:** `DebtDebrisRing` recomputes all 80 instance matrices on the CPU every frame (`dummy.position.set()` → `dummy.updateMatrix()` → `setMatrixAt()` × 80 → `needsUpdate = true`). The drift is a simple angular offset — trivially computable in a vertex shader.

**Solution:** Move the per-shard drift, rotation, and scale into the vertex shader. Store initial angle, radius, Y offset, scale, and rotation speeds as instance attributes. The CPU only updates the single `uTime` uniform per frame.

### Task 1: Rewrite DebtDebrisRing with GPU-Driven Animation

**Files:**
- Modify: `components/bridge/hologram/panels/orrery/DebtDebrisRing.tsx`

**Step 1: Replace the entire component with GPU-driven version**

Replace the full contents of DebtDebrisRing.tsx:

```tsx
'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Color,
  InstancedMesh,
  OctahedronGeometry,
  ShaderMaterial,
  AdditiveBlending,
  InstancedBufferAttribute,
} from 'three';

interface DebtDebrisRingProps {
  color: Color;
  beltRadius?: number;
  beltWidth?: number;
  count?: number;
}

const vertexShader = /* glsl */ `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aY;
  attribute float aScale;
  attribute vec2 aRotSpeed; // x = rotX speed, y = rotY speed

  uniform float uTime;
  varying float vFlicker;

  // Rotation helpers
  mat3 rotateX(float a) {
    float s = sin(a), c = cos(a);
    return mat3(1,0,0, 0,c,-s, 0,s,c);
  }
  mat3 rotateY(float a) {
    float s = sin(a), c = cos(a);
    return mat3(c,0,s, 0,1,0, -s,0,c);
  }

  void main() {
    // Drift angle over time (matches original: s.angle + t * 0.02)
    float driftAngle = aAngle + uTime * 0.02;

    // Shard self-rotation (matches original: s.rotX + t * 0.5, s.rotY + t * 0.3)
    mat3 rot = rotateX(aRotSpeed.x * uTime) * rotateY(aRotSpeed.y * uTime);
    vec3 localPos = rot * (position * aScale);

    // Orbital position
    float x = cos(driftAngle) * aRadius;
    float z = sin(driftAngle) * aRadius;
    vec3 worldPos = localPos + vec3(x, aY, z);

    // Flicker from spatial hash (same as before)
    vFlicker = sin(worldPos.x * 10.0 + worldPos.z * 7.0) * 0.5 + 0.5;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(worldPos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying float vFlicker;

  void main() {
    float flicker = sin(uTime * 3.0 + vFlicker * 6.28) * 0.3 + 0.7;
    float alpha = 0.35 * flicker;
    gl_FragColor = vec4(uColor * 0.8, alpha);
  }
`;

export function DebtDebrisRing({
  color,
  beltRadius = 5.0,
  beltWidth = 0.5,
  count = 80,
}: DebtDebrisRingProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<InstancedMesh>(null);

  const geo = useMemo(() => new OctahedronGeometry(0.06, 0), []);

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        wireframe: true,
      }),
    [color]
  );

  // Bake per-instance attributes (angles, radii, scales, rotation speeds)
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const ys = new Float32Array(count);
    const scales = new Float32Array(count);
    const rotSpeeds = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      angles[i] = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      radii[i] = beltRadius + (Math.random() - 0.5) * beltWidth;
      ys[i] = (Math.random() - 0.5) * 0.2;
      scales[i] = 0.5 + Math.random() * 1.5;
      rotSpeeds[i * 2] = 0.3 + Math.random() * 0.4;     // rotX speed (~0.5 avg)
      rotSpeeds[i * 2 + 1] = 0.2 + Math.random() * 0.2; // rotY speed (~0.3 avg)
    }

    mesh.geometry.setAttribute('aAngle', new InstancedBufferAttribute(angles, 1));
    mesh.geometry.setAttribute('aRadius', new InstancedBufferAttribute(radii, 1));
    mesh.geometry.setAttribute('aY', new InstancedBufferAttribute(ys, 1));
    mesh.geometry.setAttribute('aScale', new InstancedBufferAttribute(scales, 1));
    mesh.geometry.setAttribute('aRotSpeed', new InstancedBufferAttribute(rotSpeeds, 2));
  }, [count, beltRadius, beltWidth]);

  useFrame(({ clock }) => {
    // Single uniform update — all animation computed on GPU
    mat.uniforms.uTime.value = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} geometry={geo} material={mat} />
    </group>
  );
}
```

**Step 2: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Debris shards orbit and tumble identically to before. The drift speed (0.02 rad/s), self-rotation speeds (~0.5 and ~0.3), and flicker pattern are the same. The only difference: no `Object3D.updateMatrix()` calls per frame.

**Step 3: Commit**

```bash
git add components/bridge/hologram/panels/orrery/DebtDebrisRing.tsx
git commit -m "perf: debris ring animation moved to vertex shader (-80 matrix ops/frame) (P2)"
```

---

## P2-B: Reduce Ion Storm Clouds from 5 to 3

**Problem:** Ion Storm renders 5 nested icosahedron cloud spheres, each with its own `VolumetricGlowMaterial` instance. The 5 clouds overlap heavily — the middle layers contribute minimal visual difference since they're sandwiched between the outer and inner shells.

**Solution:** Reduce to 3 cloud layers (small, medium, large) with slightly boosted glow strength on the remaining layers to compensate for the removed ones. Saves 2 shader material instances and 2 draw calls.

### Task 2: Trim Ion Storm Cloud Layers

**Files:**
- Modify: `components/three/threats/IonStorm.tsx`

**Step 1: Update CLOUD_CONFIGS constant**

Find the `CLOUD_CONFIGS` constant (around lines 27-33). Replace with 3 entries instead of 5:

```typescript
const CLOUD_CONFIGS: CloudSphere[] = [
  { radiusMult: 0.5, noiseScale: 4.0, color: '#c084fc' },  // inner (was index 0)
  { radiusMult: 0.7, noiseScale: 3.0, color: '#a855f7' },  // mid (was index 2)
  { radiusMult: 0.9, noiseScale: 2.5, color: '#7c3aed' },  // outer (was index 4)
];
```

**Step 2: Boost glow strength on remaining clouds**

In the cloud mesh loop inside the JSX (around lines 391-411), find the `glowStrength` prop on the VolumetricGlowMaterial. Increase from the current values to compensate for fewer layers:

For each cloud in the loop, set `glowStrength` to:
- Index 0 (inner): `0.5` (was ~0.3)
- Index 1 (mid): `0.45` (was ~0.25)
- Index 2 (outer): `0.4` (was ~0.2)

**Step 3: Update cloud refs array**

If the component tracks cloud refs by index, ensure the ref array size matches the new 3-count. Search for any `cloudRefs.current[i]` access with hardcoded indices > 2 and remove them.

**Step 4: Update the useFrame cloud drift loop**

In the useFrame callback (around lines 225-234), the cloud drift loop iterates over cloud refs. Ensure it only iterates 3 times (matching new CLOUD_CONFIGS length). Since it likely uses `CLOUD_CONFIGS.length` or a forEach, this should be automatic.

**Step 5: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Ion Storm nebula looks nearly identical. The volumetric cloud silhouette is preserved — only the subtle intermediate density layers are removed.

**Step 6: Commit**

```bash
git add components/three/threats/IonStorm.tsx
git commit -m "perf: reduce ion storm clouds from 5 to 3 layers (-2 volumetric shaders) (P2)"
```

---

## P2-C: Reduce Wormhole Portal Layers from 4 to 2

**Problem:** The Wormhole renders 4 circle meshes with `PortalSwirlMaterial` stacked at slightly different sizes and depth layers. Each runs a complex fragment shader with polar coordinates, spiral math, wave patterns, and iridescence. The middle 2 layers contribute very little with additive blending since they're visually dominated by the front and back layers.

**Solution:** Keep only the outermost (largest) and innermost (smallest) portal layers. Adjust their opacity/depth parameters slightly to maintain the visual depth illusion.

### Task 3: Trim Wormhole Portal Layers

**Files:**
- Modify: `components/three/threats/Wormhole.tsx`

**Step 1: Reduce portal layer definitions**

Find the portal surface JSX section (4 circle meshes with PortalSwirlMaterial). Identify the 4 layers by their `circleGeometry` size args:

- Layer 1: `1.5 * size` (outermost) — KEEP
- Layer 2: `1.2 * size` — REMOVE
- Layer 3: `0.9 * size` — REMOVE
- Layer 4: `0.6 * size` (innermost) — KEEP

Delete the JSX for layers 2 and 3 (the `<mesh>` blocks with `circleGeometry` args `1.2 * size` and `0.9 * size`).

**Step 2: Adjust remaining layer opacity**

On the outer layer (1.5 * size), increase the base opacity slightly in the PortalSwirlMaterial to compensate for fewer layers:
- If there's an opacity uniform, boost by ~20%

On the inner layer (0.6 * size), boost the `depthLayer` uniform to create more visual contrast with the outer layer.

**Step 3: Update material refs**

If the useFrame callback updates portal layer materials by index (e.g., `portalMatRefs.current[0..3]`), reduce to only index 0 and 1. Remove references to the deleted layers.

**Step 4: Verify visually**

Run: `cd "/Users/benfaib/CMU Hackathon/snatched/web" && bun dev`
Expected: Wormhole portal still has the swirling, layered depth effect. The outer ring and inner vortex eye are preserved. Only the intermediate filling layers are gone.

**Step 5: Commit**

```bash
git add components/three/threats/Wormhole.tsx
git commit -m "perf: reduce wormhole portal from 4 to 2 layers (-2 complex shaders) (P2)"
```

---

## P3: Enemy Cruiser Running Lights → Points Mesh

> **Note:** This task may already be completed as part of the P0/P1 plan (Task 7). If Task 7 from the P0/P1 plan was executed, skip this section entirely. Check if `EnemyCruiser.tsx` already uses a `<points>` element for running lights.

### Task 4: Convert Running Lights (if not done in P1)

**Files:**
- Modify: `components/three/threats/EnemyCruiser.tsx`

**Step 1: Check current state**

Read `EnemyCruiser.tsx` and search for `<points` in the running lights section. If found, this task is already done — skip to Task 5.

If the file still has `LIGHT_CONFIGS.map(...)` rendering 8 individual `<mesh>` elements, proceed with the implementation from P0/P1 Plan Task 7.

**Step 2: Commit (if changes were made)**

```bash
git add components/three/threats/EnemyCruiser.tsx
git commit -m "perf: enemy cruiser running lights use single Points mesh (-7 draw calls) (P3)"
```

---

## Final Verification

### Task 5: Validate All P2/P3 Optimizations

**Step 1: Visual regression check**

Open the app and trigger each modified component:
- [ ] Orrery panel: Debris ring shards orbit and tumble, flicker shader active
- [ ] Ion Storm: Clouds drift with volumetric glow, lightning arcs present, rings rotate
- [ ] Wormhole: Portal swirls with depth, rim arcs flicker, edge particles orbit
- [ ] Enemy Cruiser: Running lights sweep sequentially (if P3 was applied)

**Step 2: Performance comparison**

Using browser devtools Performance tab, record 5 seconds of rendering with each modified component visible. Compare frame times:

Expected improvements:
| Component | Change | CPU Savings |
|-----------|--------|-------------|
| Debris Ring | Vertex shader animation | -80 matrix updates/frame |
| Ion Storm | 3 clouds instead of 5 | -2 volumetric shader draws |
| Wormhole | 2 portal layers instead of 4 | -2 complex shader draws |
| Enemy Cruiser | Points mesh (if applied) | -7 draw calls |

**Step 3: Commit verification message**

```bash
git log --oneline -10
```

Expected: Clean commit history with one commit per optimization task.
