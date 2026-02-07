# Three.js Memory Management & Disposal Strategy

## Overview

This document explains how we handle Three.js resource disposal and memory management in the SynesthesiaPay Bridge application.

## Core Principle: React Three Fiber Auto-Disposal

**We rely on React Three Fiber's automatic disposal system.**

R3F automatically disposes of:
- ✅ Geometries created via JSX (`<sphereGeometry />`)
- ✅ Materials created via JSX (`<meshBasicMaterial />`)
- ✅ Textures loaded via `useTexture` hook
- ✅ GLTF models loaded via `useGLTF` hook
- ✅ Objects added to the scene graph

**When disposal happens:**
- Component unmounts
- Props change causing object recreation
- Parent group is removed from scene

## Manual Disposal Required For

1. **Manually created geometries/materials** (not via JSX)
2. **Custom shaders with dynamic uniforms**
3. **InstancedMesh with large instance counts**
4. **Textures loaded outside R3F hooks**

## Current Implementation

### Starfield Background (`web/components/viewport/StarfieldBackground.tsx`)

**Resources:**
- `InstancedMesh` with 800 instances
- `sphereGeometry` (shared across instances)
- `meshBasicMaterial` (shared across instances)
- Single reused `Object3D` for matrix updates

**Disposal strategy:**
- ✅ R3F auto-disposes geometry and material
- ✅ Single `Object3D` reused (no per-frame allocation)
- ✅ No manual cleanup needed

**Performance note:** Matrix updates happen in `useFrame` but reuse the same `Object3D` instance, preventing garbage collection pressure.

### Sun Component (`web/components/viewport/Sun.tsx`)

**Resources:**
- `sphereGeometry` (64x64 segments)
- Custom `shaderMaterial` with 4 uniforms
- `pointLight` for scene illumination

**Disposal strategy:**
- ✅ R3F auto-disposes geometry
- ✅ R3F auto-disposes shader material
- ✅ Uniforms are simple values (no textures/resources)
- ✅ No manual cleanup needed

**Uniform updates:** Uniforms updated in `useFrame` don't require disposal - they're just value updates.

### Threat Objects (`web/components/viewport/ThreatObject.tsx`)

**Resources:**
- Various geometries (icosahedron, octahedron, tetrahedron)
- `meshStandardMaterial` per threat
- `meshBasicMaterial` for glow halo
- `pointLight` per threat

**Disposal strategy:**
- ✅ R3F auto-disposes all geometries
- ✅ R3F auto-disposes all materials
- ✅ Lights removed when component unmounts
- ✅ No manual cleanup needed

### Scene Effects (`web/components/three/SceneEffects.tsx`)

**Resources:**
- Post-processing effects (Bloom, ChromaticAberration, Vignette)
- Render targets created by `@react-three/postprocessing`

**Disposal strategy:**
- ✅ `@react-three/postprocessing` handles disposal
- ✅ No manual cleanup needed

## When to Add Manual Disposal

Add `useEffect` cleanup if:

1. **Creating Three.js objects outside JSX:**
   ```typescript
   useEffect(() => {
     const geometry = new THREE.BoxGeometry();
     const material = new THREE.MeshBasicMaterial();

     return () => {
       geometry.dispose();
       material.dispose();
     };
   }, []);
   ```

2. **Loading textures manually:**
   ```typescript
   useEffect(() => {
     const texture = textureLoader.load('/path/to/texture.jpg');

     return () => {
       texture.dispose();
     };
   }, []);
   ```

3. **Large custom buffers:**
   ```typescript
   useEffect(() => {
     const buffer = new THREE.BufferAttribute(new Float32Array(10000), 3);

     return () => {
       buffer.array = null; // Free typed array
     };
   }, []);
   ```

## Monitoring Memory Usage

To verify no memory leaks:

1. **Chrome DevTools:**
   - Performance tab → Memory
   - Record for 2 minutes of interaction
   - Check heap size doesn't grow continuously

2. **Three.js Stats:**
   - Add `<Stats />` from `@react-three/drei`
   - Monitor: geometries, textures, programs (shaders)
   - Numbers should be stable, not growing

3. **Memory Snapshots:**
   - Take snapshot before/after component mount/unmount
   - Search for "Geometry", "Material", "Texture"
   - Detached objects indicate leaks

## Best Practices

1. ✅ **Prefer JSX-created objects** - automatic disposal
2. ✅ **Use R3F hooks** (`useTexture`, `useGLTF`) - automatic disposal
3. ✅ **Reuse objects** - single `Object3D` for matrix updates
4. ✅ **Minimize manual `new THREE.*`** - if you must, add cleanup
5. ✅ **Profile before optimizing** - verify leaks exist before adding disposal code

## Current Status

**Memory audit:** No leaks detected in current implementation (as of 2026-02-07)

All components follow R3F auto-disposal patterns. No manual disposal currently needed.

## Future Considerations

- If adding procedural geometry generation, add manual disposal
- If loading user-uploaded textures, add cleanup
- If implementing LOD system, manage geometry swapping carefully
