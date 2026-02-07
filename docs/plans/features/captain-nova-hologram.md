# Feature Spec: Captain Nova Hologram

**Feature ID:** `NOVA-001`
**Category:** Captain Nova System
**Priority:** P0 (Must-have for MVP)
**Status:** 🔵 Needs Polish
**Current Version:** 0.4 (Basic shader exists)
**Target Version:** 1.0

---

## Overview

Captain Nova is the visual and emotional centerpiece of the entire experience. She's a holographic AI officer who materializes on the bridge, provides financial guidance, and acts as the personality of the system. Her appearance must be **stunning, futuristic, and alive** — users should feel like they're interacting with an actual sentient being.

**The Core Magic:** A combination of custom Three.js shaders, procedural animation, and subtle imperfections that make her feel real despite being obviously artificial.

---

## Visual Specification

### Physical Form

**Character Design:**
- **Species:** Humanoid female, clearly artificial (not trying to pass as human)
- **Height:** ~1.8 units in Three.js space (appears life-sized when viewed from camera)
- **Proportion:** Realistic human proportions, standing upright with confident posture
- **Uniform:** Futuristic officer uniform (geometric, clean lines, aurora accents)
- **Hair:** Short, practical style (swept back, no loose strands)

**Model Asset:**
- Format: GLTF/GLB
- Polygon count: 8,000-15,000 triangles (optimized for real-time)
- Rigged: Yes (humanoid skeleton for animation)
- Textures: Base color, normal map, emissive map (aurora highlights)

### Holographic Shader System

The shader is what makes her feel holographic, not just a 3D model.

#### **Shader Components:**

**1. Base Transparency**
```glsl
// Fragment shader
uniform float hologramOpacity; // 0.7-0.9
vec4 finalColor = vec4(color.rgb, color.a * hologramOpacity);
```
- Overall transparency: 70-90% (she's see-through but clearly visible)
- Allows starfield to show through subtly

**2. Scanline Effect**
```glsl
// Horizontal lines scrolling from bottom to top
float scanlineSpeed = 0.5; // units per second
float scanlineFrequency = 80.0; // lines per unit height
float scanline = sin(vUv.y * scanlineFrequency + time * scanlineSpeed);
scanline = smoothstep(0.3, 0.7, scanline); // Sharpen lines

// Modulate opacity based on scanline
finalColor.a *= mix(0.85, 1.0, scanline);
```
- Creates subtle horizontal banding that moves upward
- Mimics CRT/hologram projection artifacts

**3. Chromatic Aberration (Edge Glow)**
```glsl
// RGB split on edges (Fresnel-based)
vec3 normal = normalize(vNormal);
vec3 viewDir = normalize(cameraPosition - vWorldPosition);
float fresnel = 1.0 - dot(normal, viewDir);
fresnel = pow(fresnel, 2.5); // Sharpen edge falloff

// Sample texture with slight RGB offset on edges
vec2 rOffset = vec2(fresnel * 0.01, 0.0);
vec2 gOffset = vec2(0.0, 0.0);
vec2 bOffset = vec2(-fresnel * 0.01, 0.0);

float r = texture2D(map, vUv + rOffset).r;
float g = texture2D(map, vUv + gOffset).g;
float b = texture2D(map, vUv + bOffset).b;

vec3 chromatic = vec3(r, g, b);
```
- Edges of silhouette split into RGB colors (like bad hologram calibration)
- Creates ethereal glow around her form

**4. Glitch Effect (Occasional)**
```glsl
// Random horizontal displacement
uniform float glitchIntensity; // 0.0-1.0, driven by CPU randomness
float glitchOffset = noise(floor(vUv.y * 20.0) + time * 10.0) * glitchIntensity;
vec2 glitchedUV = vUv + vec2(glitchOffset * 0.05, 0.0);

// Use glitched UVs 2% of the time
vec2 finalUV = mix(vUv, glitchedUV, step(0.98, random(time)));
```
- Randomly displaces horizontal slices (like signal interference)
- Happens ~1-2 times per 10 seconds, lasts 2-4 frames

**5. Aurora Gradient Flow**
```glsl
// Subtle aurora colors flowing through the hologram
uniform vec3 auroraPrimary;
uniform vec3 auroraSecondary;

float flowNoise = noise(vUv * 3.0 + time * 0.2);
vec3 auroraGradient = mix(auroraPrimary, auroraSecondary, flowNoise);

// Blend aurora into base color (subtle, 10-15% strength)
finalColor.rgb = mix(finalColor.rgb, auroraGradient, 0.12);
```
- Tints the hologram with shifting aurora colors
- Creates cohesion with overall UI theme

**6. Fresnel Glow (Edge Lighting)**
```glsl
// Bright glow on silhouette edges
vec3 glowColor = auroraPrimary;
float glowIntensity = fresnel * 1.5;

// Add glow to final color
finalColor.rgb += glowColor * glowIntensity * 0.3;
```
- Bright aurora-colored rim light on edges
- Makes her "pop" against dark background

**7. Particle Noise (Internal)**
```glsl
// Tiny flickering pixels inside the hologram
float particleNoise = noise(vUv * 100.0 + time * 2.0);
particleNoise = step(0.98, particleNoise); // Only brightest 2%

finalColor.rgb += vec3(particleNoise * 0.5); // Subtle white flickers
```
- Simulates data "pixelation" like Star Trek holograms
- Adds tactile detail, prevents her from looking too smooth

### Animation System

#### **Idle Breathing (Always Active)**

**Breathing Cycle:**
- Duration: 4 seconds (inhale 2s, exhale 2s)
- Movement: Chest/shoulders rise and fall subtly
- Implementation: Sine wave applied to skeleton bones

```typescript
// In useFrame loop
const breathingScale = 1 + Math.sin(time * Math.PI / 2) * 0.02; // ±2%
chestBone.scale.y = breathingScale;
shoulderBones.forEach(bone => {
  bone.position.y += Math.sin(time * Math.PI / 2) * 0.01;
});
```

**Weight Shift (Every 8-12 seconds):**
- Subtle shift from one leg to another
- Prevents "statue" feeling
- Implementation: Random trigger, GSAP animation on hip bone

```typescript
// Randomly every 8-12s
const shiftDirection = Math.random() > 0.5 ? 1 : -1;
gsap.to(hipBone.rotation, {
  z: shiftDirection * 0.05, // ~3 degrees
  duration: 1.5,
  ease: 'power2.inOut'
});
```

#### **Eye System (Gaze Tracking)**

**Default State:**
- Eyes looking at camera (directly at user)
- Subtle blinks every 3-6 seconds (random interval)

**Active State (when speaking or user interacts):**
- Eyes track cursor position (within 30-degree cone)
- Occasional glances at threats in space (when mentioning them)
- Blink rate increases slightly (looks more alert)

**Implementation:**
```typescript
// Eye tracking
const cursorWorldPos = unproject(mousePos);
const lookTarget = new THREE.Vector3();
lookTarget.lerpVectors(novaPosition, cursorWorldPos, 0.3); // 30% toward cursor

headBone.lookAt(lookTarget);
eyeBones.forEach(eye => eye.lookAt(lookTarget));
```

#### **Mouth Animation Sync** (See `mouth-sync-animation.md`)
- Driven by phoneme data from text-to-speech
- Details in separate feature spec

#### **Gesture System** (Future Phase)

**Gestures to Implement:**
- **Point:** Extends arm to point at threat/panel (when referencing)
- **Salute:** Brief salute when user first arrives
- **Concern:** Hand to chin when discussing critical threats
- **Relief:** Slight nod and smile when threat deflected

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `@react-three/fiber` (^9.5.0) - React integration
- `@react-three/drei` (^10.7.7) - useGLTF, useAnimations
- `three` (^0.182.0) - Core Three.js
- `gsap` (^3.14.2) - Gesture animations

**Required Assets:**
- `public/models/captain-nova.glb` - Character model
- `public/textures/nova-emissive.jpg` - Emissive map (aurora highlights)

### Shader Implementation

**File Structure:**
```
components/
  three/
    shaders/
      HologramMaterial.ts      // Custom ShaderMaterial
      hologramVertex.glsl      // Vertex shader
      hologramFragment.glsl    // Fragment shader
```

**Material Setup:**
```typescript
const hologramMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    hologramOpacity: { value: 0.8 },
    glitchIntensity: { value: 0.0 },
    auroraPrimary: { value: new THREE.Color(auroraColors[0]) },
    auroraSecondary: { value: new THREE.Color(auroraColors[1]) },
    map: { value: baseTexture },
    normalMap: { value: normalTexture },
    emissiveMap: { value: emissiveTexture }
  },
  vertexShader: hologramVertexShader,
  fragmentShader: hologramFragmentShader,
  transparent: true,
  side: THREE.FrontSide,
  depthWrite: false // Prevent z-fighting with transparency
});
```

### Performance Optimization

**Required Optimizations:**
1. **LOD System:** If camera far away (z > 15), reduce polygon count
2. **Frustum Culling:** Don't render if off-screen
3. **Shader Complexity:** Disable particle noise on low-end devices
4. **Animation Throttling:** Update skeleton at 30fps, not 60fps (imperceptible)
5. **Texture Compression:** Use KTX2 compressed textures

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Hologram looks translucent but clearly visible
- [ ] Scanlines are subtle (visible but not distracting)
- [ ] Chromatic aberration visible on edges (RGB split)
- [ ] Glitch effect happens occasionally (not constantly)
- [ ] Aurora gradient flows naturally through form
- [ ] Fresnel glow makes silhouette pop against background
- [ ] No harsh edges or aliasing on silhouette
- [ ] Textures are sharp (not blurry)

### ✅ Animation Quality

- [ ] Breathing feels natural, not robotic
- [ ] Weight shifts are subtle (user might not consciously notice)
- [ ] Eyes track cursor smoothly (no jerky movement)
- [ ] Blinks look natural (quick, not slow fade)
- [ ] No animation popping or sudden jumps
- [ ] Idle animations loop seamlessly

### ✅ Performance

- [ ] Runs at 60fps on target hardware
- [ ] Shader compilation time < 200ms on first load
- [ ] Model loads in < 1s on broadband
- [ ] No frame drops during glitch effects
- [ ] Memory usage stable (no leaks)

### ✅ Integration

- [ ] Aurora colors sync with global color system
- [ ] Hologram responds to global time (same clock as starfield)
- [ ] Material updates when aurora colors change
- [ ] Works in both Bridge and Command Center views
- [ ] Scales/positions correctly during zoom transition

### ✅ Edge Cases

- [ ] Looks good when aurora is purple, cyan, green, mint
- [ ] Doesn't flicker on low-end GPUs
- [ ] Degrades gracefully if shaders not supported (solid fallback)
- [ ] Works on different aspect ratios (16:9, 21:9, 4:3)
- [ ] Doesn't clip through floor or walls

---

## Design Alternatives Considered

### Alternative 1: Sprite-Based Hologram (2D)
**Approach:** Use animated sprite sheet, not 3D model
**Pros:** Lower performance cost, easier to create
**Cons:** Breaks 3D immersion, can't do true perspective
**Decision:** ❌ Rejected - not impressive enough

### Alternative 2: Video Hologram
**Approach:** Play video of real actress with shader applied
**Pros:** Ultra-realistic motion, no rigging needed
**Cons:** Huge file size, can't dynamically animate, uncanny valley risk
**Decision:** ❌ Rejected - too rigid, can't respond to events

### Alternative 3: Simple 3D Model (No Shader)
**Approach:** Basic 3D character with transparency, no custom shader
**Pros:** Simplest implementation, widely compatible
**Cons:** Looks like a regular game character, not holographic
**Decision:** ❌ Rejected - doesn't achieve "stunning" goal

### Alternative 4: Custom Shader + 3D Model (SELECTED)
**Approach:** High-quality 3D model with custom holographic shader
**Pros:** Best visual quality, fully controllable, impressive tech showcase
**Cons:** Complex shader development, performance consideration
**Decision:** ✅ **Selected** - achieves "breathtaking" requirement

---

## Open Questions

### Resolved
- ✅ Q: Should she be stylized or realistic?
  - A: Stylized - clearly artificial, not trying to be human

- ✅ Q: What color is her uniform?
  - A: Dark navy/black base with aurora-colored accents

- ✅ Q: Should she have a projection base (cone of light)?
  - A: Yes - adds to hologram feel, shows she's being projected

### Unresolved
- ⚠️ Q: Should she have a name badge or rank insignia?
  - A: Defer to UI design phase

- ⚠️ Q: Does she need facial expressions (smile, frown)?
  - A: Nice-to-have, but jaw movement (mouth sync) is priority

- ⚠️ Q: Where does the 3D model come from? Current code uses primitive geometry (capsule + sphere).
  - A: Need to source or commission a GLTF model. Until then, shader work and animation specs are blocked on model acquisition. Consider a stylized low-poly approach that doesn't require a professional character artist.

---

## Implementation Checklist

### Phase 1: Model Acquisition
- [ ] Source or commission Captain Nova 3D model
- [ ] Ensure model is rigged (humanoid skeleton)
- [ ] Create emissive texture map (aurora highlights)
- [ ] Export as optimized GLB (< 2MB)

### Phase 2: Shader Development
- [ ] Write vertex shader (basic pass-through + normal calc)
- [ ] Write fragment shader (transparency, scanlines, chromatic aberration)
- [ ] Add glitch effect (random horizontal displacement)
- [ ] Add aurora gradient flow
- [ ] Add Fresnel rim lighting
- [ ] Add particle noise

### Phase 3: Animation System
- [ ] Implement breathing animation (sine wave on chest)
- [ ] Implement weight shift (random GSAP on hips)
- [ ] Implement eye tracking (lookAt cursor)
- [ ] Implement blink animation (morph target or bone)
- [ ] Sync all animations to global time

### Phase 4: Integration
- [ ] Load model in ThreeScene component
- [ ] Apply hologram shader to model material
- [ ] Position Nova in scene (left side of viewport)
- [ ] Connect to aurora color system
- [ ] Add projection base (cone of light beneath her)

### Phase 5: Polish
- [ ] Optimize shader performance
- [ ] Add LOD system
- [ ] Test on low-end hardware
- [ ] Adjust opacity/glow values for readability
- [ ] Fine-tune animation timing

### Phase 6: Testing
- [ ] Visual QA across browsers
- [ ] Performance profiling (60fps check)
- [ ] Test with all aurora color phases
- [ ] Test during zoom transitions
- [ ] Accessibility review (not critical for decorative element)

### Phase 7: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark captain-nova-hologram as complete`

---

## Related Features

- `NOVA-002`: Text-to-Speech Engine (voice)
- `NOVA-003`: Mouth Animation Sync (lip sync)
- `NOVA-004`: Eye Tracking System (detailed gaze)
- `NOVA-005`: Gesture System (pointing, saluting)
- `UI-003`: Captain Nova UI Panel (speech bubble)

---

## Visual Reference

**Inspiration Sources:**
- Cortana (Halo) - translucent blue hologram aesthetic
- Joi (Blade Runner 2049) - glitch effects, chromatic aberration
- Star Trek holograms - scanline artifacts, particle noise
- Cyberpunk 2077 - neon edge glow, futuristic uniform design

**Key Difference:**
We're combining the best of all these — translucent but detailed, glitchy but stable, futuristic but warm (aurora colors vs cold blue).

---

## Completion Protocol

When this feature's implementation is finished and all acceptance criteria pass, the implementing agent **must** update the following documents before considering the work done:

1. **This feature spec** — Set `Status` to 🟢 Complete (or 🔵 Needs Polish if partially done), update `Current Version`, and add a row to the Revision History table.
2. **Master Document** (`docs/plans/MASTER-synesthesiapay-bridge.md`) — Update this feature's row in the Feature Catalog to reflect the new status.
3. **Implementation Guide** (`docs/plans/IMPLEMENTATION-GUIDE.md`) — Record any learnings, update phase progress tracking, and note actual vs estimated time if a build guide was created.

These documentation updates should be committed separately from code changes. See the Implementation Guide's [Status Updates](../IMPLEMENTATION-GUIDE.md#status-updates) section for detailed instructions.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.4 | 2026-02-06 | Initial implementation (basic shader) |
| 1.0 | TBD | Full spec implementation |

---

**Status:** Ready for model acquisition and shader development.
