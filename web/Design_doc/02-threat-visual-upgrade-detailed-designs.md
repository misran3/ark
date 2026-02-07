# 02 - Threat Visual Upgrade: Detailed Designs

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current tacky threat visuals with cinematic, layered, shader-driven compositions across all 6 threat types.

**Architecture:** Each threat is rebuilt as a multi-layer composition using the foundation from `01-threat-visual-upgrade-technical-foundation.md`. Every threat shares the same interaction contract (position, size, color, onHover, onClick) but has a unique visual signature. Threats are organized as: outer atmosphere → mid detail layer → core → particle systems → interaction overlays.

**Tech Stack:** React Three Fiber, Three.js, custom GLSL shaders, InstancedParticleSystem, TrailRibbon, VolumetricGlowMaterial, EnergyFlowMaterial, @react-three/postprocessing (bloom)

**Prerequisite:** Complete all tasks in `01-threat-visual-upgrade-technical-foundation.md` first.

---

## Existing files being replaced

Each task rewrites ONE threat component file. The interface (props) stays the same so no parent code changes are needed.

| File | Threat | Financial meaning |
|------|--------|------------------|
| `web/components/three/threats/Asteroid.tsx` | Asteroid | Wasteful subscriptions |
| `web/components/three/threats/IonStorm.tsx` | Ion Storm | Budget overrun surges |
| `web/components/three/threats/SolarFlare.tsx` | Solar Flare | Upcoming charges / auto-renewals |
| `web/components/three/threats/BlackHole.tsx` | Black Hole | Debt spirals / compounding interest |
| `web/components/three/threats/Wormhole.tsx` | Wormhole | Missed financial opportunities |
| `web/components/three/threats/EnemyCruiser.tsx` | Enemy Cruiser | Fraudulent / suspicious charges |

---

## Task 1: Asteroid — "The Fiery Boulder"

**Files:**
- Rewrite: `web/components/three/threats/Asteroid.tsx`
- Keep: `web/components/three/threats/AsteroidMaterial.ts` (custom shader — enhance in place)
- Keep: `web/components/three/threats/AsteroidTrail.tsx` (replace internals)

### Visual Design

**Layer 1 — Outer Heat Haze (atmosphere)**
- Sphere at 1.4× asteroid radius
- `VolumetricGlowMaterial` with:
  - color: `#f97316` (orange)
  - noiseScale: 2.0, noiseSpeed: 0.8
  - rimPower: 2.5, glowStrength: 0.6
  - Additive blending, backside rendering
- Animates: gentle scale pulse (±5% at 1.5 Hz)

**Layer 2 — Rocky Shell (main body)**
- IcosahedronGeometry detail level 3 (320 faces → smooth enough for displacement)
- Vertex displacement via simplex noise (amplitude 0.25–0.4 × size, 2 octaves FBM)
- Seeded PRNG so each asteroid is unique but deterministic
- Custom fragment shader (enhance existing `AsteroidMaterial`):
  - **Base rock:** charcoal `#1a1a1a` with roughness 0.9
  - **Lava cracks:** Voronoi cell edges colored `#f97316` → `#dc2626`, emissive intensity 3.0
  - **Heat gradient:** hotter toward center using worldPosition distance
  - **Fresnel rim:** orange glow at glancing angles (power 3.0)
  - **Animated cracks:** Voronoi UV offset scrolls slowly so cracks pulse/shift

```glsl
// Key fragment shader logic (pseudo-code for the plan):
vec2 cell = voronoi(vWorldPosition.xz * 4.0 + time * 0.1);
float crackWidth = smoothstep(0.04, 0.0, cell.x); // thin bright lines
float heatFactor = 1.0 - smoothstep(0.3, 1.5, length(vWorldPosition));

vec3 rockColor = vec3(0.1, 0.1, 0.1);
vec3 lavaColor = mix(vec3(0.976, 0.451, 0.086), vec3(0.863, 0.149, 0.149), heatFactor);
vec3 surface = mix(rockColor, lavaColor, crackWidth * heatIntensity);

// Fresnel rim
float rim = fresnel(viewDir, normal, 3.0);
surface += vec3(0.976, 0.451, 0.086) * rim * 0.5;

// Emissive output (drives bloom in post-processing)
gl_FragColor = vec4(surface + lavaColor * crackWidth * emissiveStrength, 1.0);
```

**Layer 3 — Inner Core Glow**
- Small sphere at 0.4× size, fully inside the rock
- MeshBasicMaterial, color `#ff4500`, additive blending
- Opacity pulses 0.2–0.5 at 2 Hz
- Visible through the cracks in the rock shell

**Layer 4 — Particle Systems**
- **Ember Trail:** `InstancedParticleSystem`
  - count: 200
  - color: `#f97316` → colorEnd: `#1a1a1a`
  - velocityMin: [-0.3, -0.3, 0.5], velocityMax: [0.3, 0.3, 1.5]
  - lifespan: [1.0, 2.5], gravity: [0, -0.1, 0]
  - emitRate: 80/s
- **Smoke Trail:** `TrailRibbon`
  - color: `#f97316`, colorEnd: `#333333`
  - width: 0.2 × size, lifetime: 1.5s, maxPoints: 40
  - Attached to asteroid group ref
- **Molten Chunks** (new): `InstancedParticleSystem`
  - count: 15
  - size: 0.15, lifespan: [2.0, 4.0]
  - velocityMin: [-0.1, -0.1, 0.2], velocityMax: [0.1, 0.1, 0.5]
  - color: `#dc2626`, loop: true, emitRate: 3/s

**Layer 5 — Interaction Overlays**
- Targeting brackets: keep existing geometry, but add:
  - Distance readout text (optional, via Drei `<Text>`)
  - Bracket lines glow brighter on hover (opacity 0.4 → 0.9)
  - Scan ring: torus with `EnergyFlowMaterial` instead of plain color

**Animation:**
- Tumble rotation: random per-axis angular velocity (unchanged)
- Hover: scale 1.0 → 1.1, heat intensity 1.0 → 1.5, emissive 2.0 → 3.5
- Collapse: keep existing 3-phase animation, but add:
  - Phase 1: Inner core flares to white
  - Phase 2: Rock fragments fly outward (burst the instanced particles with high velocity)
  - Phase 3: Volumetric glow expands and fades

**Step 1: Rewrite the Asteroid component following design above**

Rewrite `web/components/three/threats/Asteroid.tsx` with the layered composition described above, importing `VolumetricGlowMaterial`, `InstancedParticleSystem`, and `TrailRibbon` from the foundation.

**Step 2: Verify visually in dev server**

```bash
cd web && bun dev
```

Navigate to command center, confirm asteroid renders with all layers.

**Step 3: Commit**

```bash
git add web/components/three/threats/Asteroid.tsx
git commit -m "feat(asteroid): rebuild with layered composition, voronoi cracks, GPU particles"
```

---

## Task 2: Ion Storm — "The Electric Maelstrom"

**Files:**
- Rewrite: `web/components/three/threats/IonStorm.tsx`

### Visual Design

**Layer 1 — Outer Electromagnetic Field**
- Sphere at 1.6× size
- `VolumetricGlowMaterial`:
  - color: `#a855f7` (purple)
  - noiseScale: 3.0, noiseSpeed: 1.2
  - rimPower: 2.0, glowStrength: 0.4
- Animates: scale wobbles with noise (organic pulsing)

**Layer 2 — Volumetric Nebula Cloud**
- 5 overlapping icosahedron meshes at random offsets within size radius
- Each uses `VolumetricGlowMaterial` with:
  - Colors cycling through: `#a855f7`, `#c084fc`, `#ec4899`
  - Different noiseScale per sphere (1.5, 2.0, 2.5, 3.0, 3.5)
  - Opacity: 0.08–0.15, animating
- Each sphere drifts in a gentle circular orbit (0.2 radius, different speeds)
- Creates dense, layered cloud feel

**Layer 3 — Core Energy Sphere**
- Sphere at 0.35× size
- Custom shader:
  - Animated FBM noise on surface (churning energy)
  - Color: white center fading to purple edge
  - Emissive intensity 4.0 (drives bloom hard)
  - Fresnel rim: bright white
- Pulses scale at 3 Hz

**Layer 4 — Lightning Arc System**
- **Outer Arcs (8 arcs):**
  - Generated using `generateLightningPath()` from utils
  - Rendered as `TubeGeometry` via `tubeFromPoints()` (radius 0.015)
  - Material: `EnergyFlowMaterial` with color1: `#ec4899`, color2: `#ffffff`
  - Regenerated every 3–5 frames (flickering effect)
  - Each arc: random start on inner sphere surface → random end on outer sphere
- **Core Arcs (4 arcs):**
  - From center outward, shorter
  - Thicker tubes (radius 0.025)
  - White-pink color cycling
  - Regenerate every 2–3 frames
- **Branch Arcs:**
  - Each outer arc has 30% chance per frame to spawn 1–2 branch arcs
  - Branches are half-length, thinner, dimmer

**Layer 5 — Vortex Particles**
- `InstancedParticleSystem`:
  - count: 500
  - Custom onTick: particles orbit in vortex pattern (not just random)
  - Angular velocity increases toward center
  - color: `#a855f7`, colorEnd: `#ec4899`
  - size: 0.06, lifespan: [2.0, 4.0]
- **Electric Sparks:** separate `InstancedParticleSystem`:
  - count: 60
  - Short lifespan [0.1, 0.3] — rapid pop
  - High velocity burst, white color
  - emitRate: 20/s (constant crackle)

**Layer 6 — Energy Shield Rings (new)**
- 2 torus rings at perpendicular angles (XY and XZ planes)
- `EnergyFlowMaterial` with purple/pink flow
- Slowly rotate (0.5 rad/s each on different axes)
- Opacity: 0.15 normally, 0.4 on hover

**Animation:**
- Group rotation: slow Y-axis spin + gentle X-axis wobble
- Lightning regeneration: continuous random regeneration
- Hover: arcs double in brightness, sparks triple emit rate, core pulses faster
- Collapse:
  - Phase 1 (0–0.3): Containment pulse — all arcs converge to center, flash
  - Phase 2 (0.3–0.65): Dispersal — particles and cloud spheres scatter outward
  - Phase 3 (0.65–1.0): Fade — everything goes transparent

**Step 1: Rewrite Ion Storm component**

Rewrite `web/components/three/threats/IonStorm.tsx` with the layered design above.

**Step 2: Verify in dev server**

**Step 3: Commit**

```bash
git add web/components/three/threats/IonStorm.tsx
git commit -m "feat(ion-storm): rebuild with volumetric clouds, tube lightning, vortex particles"
```

---

## Task 3: Solar Flare — "The Radiant Star"

**Files:**
- Rewrite: `web/components/three/threats/SolarFlare.tsx`

### Visual Design

**Layer 1 — Outer Corona (largest)**
- Sphere at 2.0× size
- `VolumetricGlowMaterial`:
  - color: `#fbbf24` (amber)
  - noiseScale: 1.5, noiseSpeed: 0.3
  - rimPower: 1.5, glowStrength: 0.3
- Very subtle, wide glow

**Layer 2 — Mid Corona**
- Sphere at 1.4× size
- `VolumetricGlowMaterial`:
  - color: `#f97316` (orange)
  - noiseScale: 2.5, noiseSpeed: 0.6
  - rimPower: 2.0, glowStrength: 0.5
- Slightly denser than outer

**Layer 3 — Solar Surface**
- Sphere at 0.4× size (the "sun")
- Custom shader material:
  - Animated FBM noise creates churning surface texture
  - Color: white-hot center `#fef3c7` → gold `#fbbf24` → orange `#f97316` at edges
  - Emissive intensity: 5.0 (drives strong bloom)
  - Fresnel: white rim glow
  - UV scrolling: two layers of noise at different speeds for turbulence

```glsl
// Solar surface shader concept:
float n1 = fbm(vWorldPosition * 3.0 + time * 0.2, 4);
float n2 = fbm(vWorldPosition * 6.0 - time * 0.15, 3);
float combined = n1 * 0.6 + n2 * 0.4;

vec3 surface = gradient3(
  vec3(0.996, 0.953, 0.78),  // white-hot
  vec3(0.984, 0.749, 0.141), // gold
  vec3(0.976, 0.451, 0.086), // orange
  combined
);

float rim = fresnel(viewDir, normal, 2.0);
surface += vec3(1.0, 1.0, 0.95) * rim * 0.6;
```

**Layer 4 — Magnetic Field Loop Arcs (prominences)**
- 6–8 arcs using `TubeGeometry` via `tubeFromPoints()`
- Each arc: starts on solar surface, arcs outward in a parabolic path, returns to surface
- Path generation: semicircular bezier with random height (0.5–1.2× size)
- Material: `EnergyFlowMaterial`
  - color1: `#fbbf24`, color2: `#fef3c7`
  - flowSpeed: 2.0 (energy visibly flows along arc)
  - Tube radius: 0.03–0.06
- **Particle streams along arcs:**
  - `InstancedParticleSystem` with custom onTick
  - Particles follow the arc path (sample curve at t + offset)
  - count: 30 per arc, small size (0.03)
  - color: `#fef3c7` → `#f97316`

**Layer 5 — Corona Particles**
- `InstancedParticleSystem`:
  - count: 250
  - Radiate outward from center
  - Respawn at core when reaching max radius
  - color: `#fef3c7` → colorEnd: `#f97316`
  - size: 0.08, lifespan: [1.5, 3.0]
  - emitRate: 100/s

**Layer 6 — Volumetric Flare Rays**
- 8–12 cone meshes radiating outward from center
- Each cone: narrow base (0.05), wide tip (0.02), length 0.4–0.8× size
- MeshBasicMaterial, color `#fbbf24`, additive blending
- Opacity animates with sine wave (each ray at different phase)
- On hover: rays extend 30% longer, brighten

**Layer 7 — Countdown Rings**
- 3 torus geometries at 1.0×, 1.2×, 1.4× size
- Each ring: different phase of expand-and-fade animation
- Material: gold, additive, opacity fades as ring expands
- Represents "time until charge hits"

**Layer 8 — Lens Flare**
- 4 small spheres at cardinal positions (±X, ±Y)
- Plus 2 anamorphic streak meshes (very thin, wide planes)
- All additive blending, pulsing opacity

**Animation:**
- Slow Z-rotation (entire group)
- Solar surface: noise scrolls continuously
- Arcs: regenerate path every 3–5 seconds (prominence eruption)
- Hover: everything intensifies 30%, arcs extend, particles speed up
- Collapse:
  - Phase 1 (0–0.32): CME — arcs extend to 2× length, core goes white, particles accelerate
  - Phase 2 (0.32–0.68): Collapse — core shrinks rapidly, arcs retract, particles scatter outward
  - Phase 3 (0.68–1.0): Afterglow — everything fades to transparent

**Step 1: Rewrite Solar Flare component**

**Step 2: Verify in dev server**

**Step 3: Commit**

```bash
git add web/components/three/threats/SolarFlare.tsx
git commit -m "feat(solar-flare): rebuild with churning surface shader, tube prominences, corona particles"
```

---

## Task 4: Black Hole — "The Gravity Well"

**Files:**
- Rewrite: `web/components/three/threats/BlackHole.tsx`

### Visual Design

**Layer 1 — Spacetime Distortion Field (outermost)**
- Sphere at 2.0× event horizon radius
- `GravitationalLensingMaterial`:
  - Inverse-square falloff distortion
  - Photon sphere ring highlight at 1.5× radius
  - Hawking radiation flicker at event horizon edge
  - All parameters animate based on hover/collapse state

**Layer 2 — Hawking Radiation Glow**
- Sphere at 1.3× event horizon radius
- `VolumetricGlowMaterial`:
  - color: `#3b82f6` (blue)
  - glowStrength: 0.15 (very subtle)
  - rimPower: 4.0 (tight edge glow)
  - Backside rendering
- On hover: glowStrength → 0.3

**Layer 3 — Accretion Disk**
- `InstancedParticleSystem`:
  - count: 1000
  - Custom onTick handles spiral physics:
    - Each particle has orbit radius and angle
    - Angular velocity increases as radius decreases (Keplerian)
    - Radius slowly decreases (spiraling inward)
    - Respawn at outer edge when reaching event horizon
  - Color temperature gradient:
    - Outer: `#4c1d95` (cool purple)
    - Mid: `#7c3aed` (bright purple)
    - Inner: `#3b82f6` (blue — hot)
    - Innermost: `#93c5fd` (white-blue — superheated)
  - size: 0.06 outer → 0.1 inner (brighter near horizon)
  - Disk confined to Y=±0.15 (flat pancake)
- **Disk Trail:** secondary `InstancedParticleSystem`
  - count: 500, smaller size, 50% opacity
  - Follows main disk but 1 frame behind (motion blur feel)

**Layer 4 — Event Horizon (void)**
- Sphere at base radius
- MeshBasicMaterial: pure black `#000000`, backside rendering
- This absorbs all light — nothing renders inside it
- On collapse: shrinks and develops blue edge glow

**Layer 5 — Gravitational Wave Pulses (new)**
- 2–3 torus rings expanding outward slowly
- Very thin (tube radius 0.01), large ring radius starting at 1.2× size
- Expand at 0.3 units/s, fade as they grow
- Color: `#4c1d95`, very low opacity (0.05–0.1)
- Represent the gravitational pull

**Layer 6 — Jet Streams (new, optional)**
- 2 cone meshes pointing up and down from center (polar jets)
- `VolumetricGlowMaterial`:
  - color: `#3b82f6`
  - Very narrow cones (half-angle ~10°)
  - Opacity: 0.15
- `InstancedParticleSystem` inside each cone:
  - count: 50 per jet
  - velocity: straight up/down, fast
  - color: `#93c5fd`
  - Represents matter ejection at poles

**Animation:**
- Accretion disk: continuous spiral motion
- Growth: event horizon slowly grows (2% per 10s — existing behavior)
- Hover: disk speed 1.5×, Hawking glow brightens, disk particles brighten
- Collapse:
  - Phase 1 (0–1s): Scanning beam + particle extraction brightening
  - Phase 2 (1–2s): Disk reversal — particles spiral outward, color shifts purple → gold
  - Phase 3 (2–3s): Implosion — everything crushes to center, flash, shockwave ring

**Step 1: Rewrite Black Hole component**

**Step 2: Verify in dev server**

**Step 3: Commit**

```bash
git add web/components/three/threats/BlackHole.tsx
git commit -m "feat(black-hole): rebuild with lensing shader, 1000-particle accretion disk, polar jets"
```

---

## Task 5: Wormhole — "The Lost Portal"

**Files:**
- Rewrite: `web/components/three/threats/Wormhole.tsx`

### Visual Design

**Layer 1 — Outer Glow Sphere**
- Sphere at 3.2× size
- `VolumetricGlowMaterial`:
  - color: `#60a5fa` (light blue)
  - glowStrength: 0.2
  - noiseScale: 1.0, noiseSpeed: 0.3
  - rimPower: 2.0

**Layer 2 — Portal Rim (torus)**
- Torus: outerRadius 2.5×size, tubeRadius 0.3×size
- `EnergyFlowMaterial`:
  - color1: `#60a5fa`, color2: `#c4b5fd` (lavender)
  - flowSpeed: 1.5
  - stripeCount: 8.0
  - Emissive intensity 0.8 (rim glows)
- Segment highlights: 4 brighter segments that rotate around the rim

**Layer 3 — Portal Surface (tunnel illusion)**
- Keep existing `PortalSwirlMaterial` shader — it's the best existing shader
- Enhance it:
  - Add depth layers: 4 concentric circle meshes at z=0, -0.1, -0.2, -0.3
  - Each layer: smaller radius, different rotation speed
  - Creates parallax depth effect (looks like you can see INTO the wormhole)
  - Innermost layer: darkest (tunnel vanishing point)

**Layer 4 — Electrical Rim Arcs (new)**
- 4–6 lightning arcs jumping around the torus rim
- Generated with `generateLightningPath()`
- Start and end points are on the torus surface (parameterized by angle)
- Rendered as thin tubes (radius 0.01)
- Material: white-blue, additive blending
- Regenerate every 5–10 frames

**Layer 5 — Edge Ripple Particles**
- `InstancedParticleSystem`:
  - count: 80
  - Custom onTick: orbit around torus rim
  - Angular speed: 0.8 normally, 1.5 on hover
  - color: `#ffffff`, size: 0.08×size
  - Some particles drift inward toward portal center (being "pulled in")

**Layer 6 — Through-Portal Vision**
- Keep existing Billboard text concept
- Enhance:
  - Add ghostly 3D icon (coin, star, or similar simple geometry)
  - Icon floats and rotates slowly inside portal
  - Emissive blue material, very transparent (0.3 opacity)
  - Pulses brighter on hover

**Layer 7 — Inflow Particle Streams (new)**
- `InstancedParticleSystem`:
  - count: 40
  - Particles spawn at outer radius, spiral inward toward center
  - Represent "things being pulled into" the wormhole
  - color: `#a5c5e8`, size: 0.04
  - Fade to transparent as they reach center

**Animation:**
- Slow tumble: X 0.1 rad/s, Y 0.15 rad/s (existing)
- Portal shader: continuous spiral animation
- Hover: shader accelerates 2×, torus scales 1.2×, rim arcs brighten
- Collapse:
  - Phase 1 (0–0.28): Swirl accelerates dramatically, rim shrinks
  - Phase 2 (0.28–0.67): Particles scatter outward, turn gold
  - Phase 3 (0.67–1.0): Flash, everything fades

**Step 1: Rewrite Wormhole component**

**Step 2: Verify in dev server**

**Step 3: Commit**

```bash
git add web/components/three/threats/Wormhole.tsx
git commit -m "feat(wormhole): rebuild with depth-layered portal, rim arcs, inflow particles"
```

---

## Task 6: Enemy Cruiser — "The Hostile Warship"

**Files:**
- Rewrite: `web/components/three/threats/EnemyCruiser.tsx`

### Visual Design

**Layer 1 — Outer Threat Aura**
- Sphere at 1.8× size
- `VolumetricGlowMaterial`:
  - color: `#991b1b` (dark red)
  - glowStrength: 0.15
  - noiseScale: 2.0
  - rimPower: 3.0
- Very subtle menacing haze

**Layer 2 — Hull Construction (multi-part)**

Instead of a single box, build from multiple primitives:

- **Main Fuselage:**
  - Elongated octahedron shape: 2 cones placed base-to-base
  - Front cone: taller (aggressive nose), rear cone: shorter (engine block)
  - Material: `MeshStandardMaterial`
    - color: `#1f2937` (dark gunmetal)
    - metalness: 0.85, roughness: 0.25
    - emissive: `#991b1b`, emissiveIntensity: 0.3

- **Armor Plates (4 panels):**
  - Thin box geometries attached to hull sides (port, starboard, dorsal, ventral)
  - Slightly offset from hull (0.02 gap visible)
  - Material: darker than hull, higher metalness
  - Creates paneled, industrial look

- **Wing Pylons:**
  - 2 angled box geometries extending from mid-hull
  - Slight swept-back angle (15°)
  - Weapon turrets mounted on wing tips

- **Bridge/Command Section:**
  - Small raised box on dorsal (top) surface
  - Slightly different color (lighter gray)
  - Tiny window lights (2–3 emissive dots)

**Layer 3 — Weapon Turrets (2 units)**
- Each turret:
  - Base: sphere (gimbal mount)
  - Barrel: cylinder protruding forward
  - Material: red emissive, metalness 0.7
  - **Rotation:** tracks mouse position on hover (existing behavior, keep)
  - **Charge Glow:**
    - Small sphere at barrel tip
    - Emissive intensity: 0.5 → 1.5 on hover
    - Color shifts from red → orange → white as intensity rises
  - **Weapon Capacitor Ring (new):**
    - Thin torus around turret base
    - `EnergyFlowMaterial`: red energy flowing around ring
    - Visible only on hover (charge-up effect)

**Layer 4 — Engine Section**
- 2 engine nacelles (cylinders) mounted on rear pylons
- Each engine:
  - **Thruster Bell:**
    - Cone geometry (open end facing backward)
    - Inner glow: `MeshBasicMaterial`, red, additive blending
    - Animated opacity pulsing (engine throttle feel)
  - **Exhaust Particles:**
    - `InstancedParticleSystem` per engine:
      - count: 150
      - velocityMin: [-0.15, -0.15, -0.8], velocityMax: [0.15, 0.15, -1.5]
      - color: `#dc2626`, colorEnd: `#1a1a1a`
      - size: 0.04, lifespan: [0.5, 1.5]
      - emitRate: 100/s
  - **Exhaust Trail:**
    - `TrailRibbon` per engine
    - color: `#dc2626`, colorEnd: `#330000`
    - width: 0.08, lifetime: 0.8s
  - **Heat Distortion (optional):**
    - Transparent cone behind engine
    - Very subtle refraction shader

**Layer 5 — Running Lights**
- 6–8 small emissive spheres at strategic points:
  - 2 front (port/starboard): red
  - 2 mid (dorsal): red, alternating blink
  - 2 rear: dark red
  - 2 wing tips: bright red, constant
- Blink pattern: sequential sweep (front → mid → rear → repeat)
- On hover: all lights go solid bright (alert mode)

**Layer 6 — Shield Effect (new, hover-only)**
- Hexagonal grid mesh (icosahedron wireframe)
- Slightly larger than hull (1.15× scale)
- `HolographicMaterial` (from foundation):
  - color: `#dc2626`
  - scanlineCount: 50
  - Very low opacity (0.08)
- On hover: flickers visible (opacity pulses 0.08 → 0.2)
- Brief flash when clicked (shield taking hit)

**Layer 7 — Targeting Laser (new, hover-only)**
- Thin cylinder from turret barrel tip toward camera
- MeshBasicMaterial: `#ff0000`, additive blending
- Opacity: 0.3, slight width pulsing
- Only visible when hovering

**Animation:**
- Evasive movement: compound sine waves on X/Y/Z (existing, keep enhanced version)
- Banking: rotation.z proportional to lateral velocity (existing)
- Hover: weapon charge glow, shield flicker, targeting laser, running lights alert
- Collapse:
  - Phase 1 (0–0.32): Laser impact — flash sphere, hull emissive flickers white
  - Phase 2 (0.32–0.6): Hull explosion — shockwave ring, armor plates fly off
  - Phase 3 (0.6–1.0): Retreat — ship tumbles backward, fades out

**Step 1: Rewrite Enemy Cruiser component**

**Step 2: Verify in dev server**

**Step 3: Commit**

```bash
git add web/components/three/threats/EnemyCruiser.tsx
git commit -m "feat(enemy-cruiser): rebuild with multi-part hull, shield effect, targeting laser, GPU exhaust"
```

---

## Task 7: Integration & Polish

**Files:**
- Modify: `web/app/command-center/page.tsx`

### Step 1: Add SceneEffects to Canvas

The post-processing pipeline makes ALL threats look dramatically better. Add `<SceneEffects />` inside the Canvas:

```typescript
import SceneEffects from '@/components/three/SceneEffects';

// Inside Canvas, after all scene objects:
<SceneEffects
  bloomIntensity={1.5}
  bloomRadius={0.85}
  chromaticOffset={0.0004}
  vignetteDarkness={0.45}
/>
```

### Step 2: Tune bloom per-threat

Each threat uses `toneMapped={false}` on its emissive materials. This ensures bloom picks them up. Verify that:
- Asteroid lava cracks glow through bloom
- Ion Storm lightning arcs bloom brightly
- Solar Flare core blooms intensely
- Black Hole Hawking radiation has subtle bloom
- Wormhole rim has medium bloom
- Enemy Cruiser engine exhaust blooms

### Step 3: Performance check

```bash
cd web && bun dev
```

Open Chrome DevTools → Performance → Record 5 seconds of animation.
Target: 60fps with all 6 threats visible simultaneously.

If below 60fps:
- Reduce particle counts (halve the InstancedParticleSystem counts)
- Reduce lightning arc regeneration frequency
- Lower post-processing resolution

### Step 4: Commit integration

```bash
git add web/app/command-center/page.tsx
git commit -m "feat(scene): integrate post-processing effects for cinematic threat rendering"
```

---

## Visual Quality Checklist

Before marking complete, verify each threat passes these checks:

### Asteroid
- [ ] Voronoi lava cracks visible and animated
- [ ] Fresnel rim glow at edges
- [ ] Ember particles trail behind
- [ ] Smoke ribbon trail visible
- [ ] Heat haze outer atmosphere renders
- [ ] Inner core visible through cracks
- [ ] Bloom makes cracks pop

### Ion Storm
- [ ] Volumetric cloud layers look like nebula (not flat spheres)
- [ ] Lightning arcs are tube geometry (not thin lines)
- [ ] Arcs branch occasionally
- [ ] Vortex particles orbit (not random float)
- [ ] Electric sparks crackle
- [ ] Energy shield rings rotate at perpendicular angles
- [ ] Core energy sphere churns with noise

### Solar Flare
- [ ] Solar surface has animated turbulence (not static color)
- [ ] Magnetic loop arcs rise and fall from surface
- [ ] Energy flows visibly along arc tubes
- [ ] Corona particles radiate outward
- [ ] Volumetric rays pulse at different phases
- [ ] Countdown rings expand and fade
- [ ] Lens flare elements present

### Black Hole
- [ ] Event horizon is perfectly black void
- [ ] Gravitational lensing distortion visible around edges
- [ ] Accretion disk particles spiral inward (not circular)
- [ ] Disk has color temperature gradient (purple → blue toward center)
- [ ] Particles accelerate near horizon
- [ ] Hawking radiation glow at event horizon edge
- [ ] Gravitational wave rings expand subtly

### Wormhole
- [ ] Portal has depth illusion (layered circles at different z)
- [ ] Swirl shader animates smoothly
- [ ] Torus rim has energy flow material (not plain color)
- [ ] Electrical arcs jump around rim
- [ ] Edge particles orbit rim
- [ ] Through-portal vision visible (text/icon)
- [ ] Inflow particles spiral into center

### Enemy Cruiser
- [ ] Hull is multi-part (not single box)
- [ ] Armor plates have visible gap from hull
- [ ] Turrets track mouse on hover
- [ ] Engine exhaust particles trail behind
- [ ] Engine trail ribbons visible
- [ ] Running lights blink in sequence
- [ ] Shield hexagonal mesh flickers on hover
- [ ] Weapon charge glow intensifies on hover

---

## Summary

| Task | Threat | Key upgrades |
|------|--------|-------------|
| 1 | Asteroid | Voronoi cracks, FBM displacement, 3-layer atmosphere, GPU embers |
| 2 | Ion Storm | Volumetric clouds, tube lightning with branching, vortex particles |
| 3 | Solar Flare | Churning surface shader, tube prominences, corona particles |
| 4 | Black Hole | Lensing shader, 1000-particle spiral disk, polar jets |
| 5 | Wormhole | Depth-layered portal, rim energy flow, electrical arcs |
| 6 | Enemy Cruiser | Multi-part hull, shield effect, targeting laser, GPU exhaust |
| 7 | Integration | Post-processing, bloom tuning, performance verification |
