# Feature Spec: Asteroid Threat System

**Feature ID:** `THREAT-001`
**Category:** Threat System
**Priority:** P0 (Must-have for MVP)
**Status:** 🔵 Needs Polish
**Current Version:** 0.5 (Basic implementation exists)
**Target Version:** 1.0

---

## Overview

Asteroids are the most common threat type, representing **wasteful subscriptions and unused services** that drain money passively. They appear as tumbling, fiery space rocks drifting toward the player's position, creating a sense of urgent danger. When deflected, they explode in a satisfying burst of particles and redirect funds to savings shields.

**The Core Magic:** Each asteroid feels unique (procedural generation), visually threatening (fire trail, ominous glow), and satisfying to destroy (particle physics, sound, shield feedback).

---

## Visual Specification

### Default Appearance (Distant)

**Shape & Geometry:**
- Irregular rocky form (no two asteroids identical)
- Procedurally generated from icosphere base:
  - Start: 20-face icosphere (low poly base)
  - Apply: Simplex noise to vertices (distortion: 0.2-0.5 units)
  - Result: Unique, craggy asteroid shape
- Size: Varies by threat severity
  - Small: 1.5 units diameter ($10-50/mo subscriptions)
  - Medium: 2.5 units diameter ($50-150/mo services)
  - Large: 4.0 units diameter ($150+ recurring charges)

**Material & Texture:**
- Base color: Charcoal gray (#1a1a1a)
- Surface features:
  - Deep orange-red cracks (lava veins): `#f97316` → `#dc2626`
  - Emissive map: Cracks glow with intensity 2.0
  - Roughness: 0.9 (very rough, rocky)
  - Metalness: 0.1 (slight mineral shimmer)
- Normal map: Deep crater details

**Color Gradient (Heat):**
```glsl
// Fragment shader - hotter toward center
float distanceFromCenter = length(vWorldPosition - asteroidCenter);
float heatFactor = 1.0 - smoothstep(0.5, 2.0, distanceFromCenter);

vec3 coldColor = vec3(0.1, 0.1, 0.1); // Charcoal
vec3 hotColor = vec3(0.976, 0.451, 0.086); // #f97316 orange

vec3 surfaceColor = mix(coldColor, hotColor, heatFactor * emissiveStrength);
```

**Particle Trail:**
- Emits from rear surface (direction opposite to velocity)
- Particle system:
  - Count: 50-100 particles active
  - Spawn rate: 10 particles/second
  - Lifetime: 1.5-2.5 seconds (random)
  - Color: Orange → Red → Dark gray (fade out)
  - Size: 0.1 units (small embers)
  - Physics: Drift backward, slight randomness, fade over time
- Trail creates sense of motion even when asteroid moves slowly

### Movement Behavior

**Spawning:**
- Initial position: Random point in sphere (radius 1000-1200 units from camera)
- Initial rotation: Random 3-axis rotation
- Initial velocity: Vector toward camera position
- Speed: Based on urgency
  - Low urgency (30+ days until charge): 0.5 units/second
  - Medium urgency (7-30 days): 1.0 units/second
  - High urgency (< 7 days): 2.0 units/second

**Flight Path:**
- Direction: Straight line toward camera (no arc, feels inevitable)
- Rotation: Tumbles on all 3 axes
  - X-axis: Random angular velocity (0.2-0.5 rad/s)
  - Y-axis: Random angular velocity (0.3-0.7 rad/s)
  - Z-axis: Random angular velocity (0.1-0.4 rad/s)
- No course correction (feels dumb, predictable, but threatening)

**Distance Zones:**
```
Zone 1 (800-1200 units): Distant - barely visible, no UI
Zone 2 (400-800 units):  Mid-range - visible, faint glow
Zone 3 (100-400 units):  Close - targeting available, bright glow
Zone 4 (< 100 units):    Critical - red alert, screen shake
```

### Hover State (Zone 3+)

**Trigger:** Cursor within 50px of asteroid screen position, asteroid in Zone 3+

**Visual Changes:**
1. **Targeting Brackets:**
   - Four corner brackets snap to bounding box
   - Color: Aurora primary (animated glow pulse)
   - Thickness: 2px, gap: 10px
   - Animation: Brackets "lock on" over 200ms

2. **Holographic Scan Ring:**
   - Torus shape rotating around asteroid
   - Radius: 1.2x asteroid size
   - Rotation: 2s per full revolution
   - Color: Aurora secondary with 50% opacity
   - Effect: Suggests scanning/analyzing

3. **Info Panel:**
   - Appears to right of asteroid (or left if asteroid on right side)
   - Glassmorphism panel with aurora border
   - Content:
     ```
     ☄️ GYM MEMBERSHIP
     Zero usage — 47 days dormant
     IMPACT: $49.99/mo
     DISTANCE: 284 units • 5 days
     [DEFLECT] button (pulsing)
     ```
   - Fade in: 150ms
   - Position: Follows asteroid (sticky to screen position)

4. **Glow Intensification:**
   - Emissive intensity increases: 2.0 → 3.5
   - Cracks glow brighter
   - Particle trail increases density (2x spawn rate)

5. **Captain Nova Reaction:**
   - Nova's eyes glance toward the asteroid
   - If speaking, might mention it: "Commander, that dormant gym subscription is approaching fast."

### Click Interaction: Deflection Sequence

**Phase 1: Targeting Laser (0-150ms)**

1. **Laser Beam Fires:**
   - Origin: Bottom-center of screen (player's "ship")
   - Target: Asteroid center
   - Visual:
     - Core beam: Bright aurora primary, 5px wide
     - Glow: Radial gradient blur, 20px wide, 30% opacity
     - Particles: 20 small particles travel along beam path
   - Sound: "Pew" laser sound (pitched aurora tone)

2. **Hit Impact:**
   - Asteroid flashes white (additive blend) for 2 frames
   - Shockwave ring expands from impact point (aurora colored)

**Phase 2: Explosion (150-500ms)**

1. **Core Explosion:**
   - Asteroid mesh visibility → 0 (instantly)
   - Replace with particle burst:
     - Count: 200-300 particles
     - Initial velocity: Radial outward (explosion sphere)
     - Speed: 5-10 units/second (random per particle)
     - Drag: 0.95 (particles slow down over time)
     - Color: Orange → Red → Black (fade over lifetime)
     - Size: 0.2-0.5 units (random)
     - Lifetime: 0.8-1.2 seconds

2. **Shockwave:**
   - Expanding sphere from asteroid position
   - Radius: 0 → 10 units over 400ms
   - Material: Additive blend, aurora gradient
   - Opacity: 80% → 0% as it expands

3. **Money Particles (Debris):**
   - Spawn: 10-15 glowing orbs (green/gold)
   - Behavior: Float upward toward top of screen
   - Destination: Shield status panel (top-right)
   - Flight time: 800ms
   - Trail: Faint sparkle trail

**Phase 3: Shield Update (500-1000ms)**

1. **Shield Bar Animation:**
   - Target bar: "Warp Fuel" (Savings) shield
   - Current value: e.g., 62%
   - New value: e.g., 70% (+8%)
   - Animation:
     - Bar fills smoothly over 500ms
     - Glow pulse when reaching new value
     - "+$49.99/mo" floats up from bar (toast message)

2. **Captain Nova Response:**
   - Speaks (voice synthesis):
     > "Direct hit, Commander. $49.99 per month redirected to Warp Fuel reserves."
   - Animation: Brief approving nod
   - Speech bubble appears with text

**Phase 4: Cleanup (1000ms+)**

- Particle system stops emitting
- All particles fade out by 1500ms
- Asteroid removed from threat array
- Targeting brackets disappear
- Info panel fades out

### Critical Proximity State (Zone 4)

**Trigger:** Asteroid reaches distance < 100 units

**Warning Effects:**
1. **Screen Border Pulse:**
   - Red vignette pulses from edges (2s cycle)
   - Intensity: 30% opacity at peak

2. **Klaxon Sound:**
   - Low, ominous warning tone (bwaaaah)
   - Plays once when entering Zone 4
   - Doesn't repeat (not annoying)

3. **Captain Nova Warning:**
   - Speaks urgently:
     > "Commander, immediate action required! That subscription charge is about to hit!"
   - Eyes locked on asteroid, pointing gesture

4. **Auto-Highlight:**
   - Targeting brackets appear automatically (don't need hover)
   - DEFLECT button highlighted in red

### Impact State (Distance = 0, Not Deflected)

**Collision Sequence:**

1. **Screen Shake:**
   - Camera jolts backward (0.3 units)
   - Brief rotation wobble (±2 degrees)
   - Duration: 300ms

2. **Shield Loss:**
   - Shield bar drops by damage amount
   - Bar flashes red
   - Crack appears in shield graphic (visual damage)

3. **Impact Flash:**
   - Full-screen white flash (additive) for 50ms
   - Fades to red tint (200ms)
   - Returns to normal (300ms)

4. **Captain Nova Reaction:**
   - Winces, raises arm (defensive gesture)
   - Speaks:
     > "Impact confirmed. Recreation Deck shields down to 54%. We need to tighten spending, Commander."

5. **Asteroid Removal:**
   - Asteroid continues past camera (flies behind)
   - Fades out over 500ms
   - Removed from scene

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `three` (^0.182.0) - Core 3D rendering
- `@react-three/fiber` (^9.5.0) - React integration
- `simplex-noise` (^4.0.0) - Procedural asteroid generation
- `gsap` (^3.14.2) - Particle animation tweening

**Required Assets:**
- `textures/asteroid-normal.jpg` - Normal map for surface detail
- `textures/particle.png` - Particle sprite (circular gradient)
- `audio/laser-fire.mp3` - Laser sound effect
- `audio/explosion.mp3` - Explosion sound effect
- `audio/klaxon.mp3` - Warning klaxon

### Procedural Generation

**Asteroid Geometry Creation:**
```typescript
function generateAsteroid(size: number, seed: number): THREE.BufferGeometry {
  const simplex = new SimplexNoise(seed);
  const geometry = new THREE.IcosahedronGeometry(size, 1); // 20 faces, 1 subdivision

  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Apply noise distortion
    const noiseValue = simplex.noise3D(x * 2, y * 2, z * 2);
    const distortion = 1 + noiseValue * 0.3; // ±30% variation

    positions.setXYZ(i, x * distortion, y * distortion, z * distortion);
  }

  geometry.computeVertexNormals(); // Recalculate normals after distortion
  return geometry;
}
```

**Usage:**
```typescript
// Each asteroid gets unique seed
const asteroidGeometry = generateAsteroid(2.5, Date.now() + asteroidId);
```

### Particle System Architecture

**ParticlePool Pattern:**
```typescript
class ParticlePool {
  particles: THREE.Points;
  activeCount: number = 0;
  maxParticles: number = 500;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
  }

  emit(position: THREE.Vector3, velocity: THREE.Vector3, color: THREE.Color, lifetime: number) {
    if (this.activeCount >= this.maxParticles) return; // Pool full

    // Set particle attributes
    const index = this.activeCount;
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const colors = this.particles.geometry.attributes.color.array as Float32Array;

    positions[index * 3] = position.x;
    positions[index * 3 + 1] = position.y;
    positions[index * 3 + 2] = position.z;

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;

    this.activeCount++;

    // Animate particle (GSAP)
    gsap.to(positions, {
      [index * 3]: position.x + velocity.x * lifetime,
      [index * 3 + 1]: position.y + velocity.y * lifetime,
      [index * 3 + 2]: position.z + velocity.z * lifetime,
      duration: lifetime,
      onUpdate: () => {
        this.particles.geometry.attributes.position.needsUpdate = true;
      },
      onComplete: () => {
        this.activeCount--; // Return to pool
      }
    });
  }
}
```

**Why Pool?** Prevents creating/destroying hundreds of objects (GC pressure).

### State Management

**Threat Store (Zustand):**
```typescript
interface Threat {
  id: string;
  type: 'asteroid' | 'ion-storm' | 'solar-flare' | 'black-hole' | 'wormhole';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  size: number;
  data: {
    name: string; // "GYM MEMBERSHIP"
    description: string; // "Zero usage — 47 days dormant"
    impact: string; // "$49.99/mo"
    daysUntil: number;
  };
  seed: number; // For procedural generation
}

interface ThreatStore {
  threats: Threat[];
  hoveredThreat: string | null;

  addThreat: (threat: Threat) => void;
  removeThreat: (id: string) => void;
  updateThreat: (id: string, updates: Partial<Threat>) => void;
  deflectThreat: (id: string) => void; // Trigger explosion
}
```

### Performance Optimization

**Required Optimizations:**
1. **Instancing:** If > 10 asteroids on screen, use InstancedMesh
2. **LOD:** Reduce polygon count for distant asteroids (Zone 1-2)
3. **Particle Pooling:** Reuse particle geometry (see ParticlePool above)
4. **Frustum Culling:** Don't update off-screen asteroids
5. **Occlusion:** If asteroid behind another, reduce update rate

**Performance Targets:**
- 60fps with 5 asteroids on screen
- < 5ms per frame for all asteroid updates
- < 10 draw calls total for particle systems

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Each asteroid looks unique (no two identical)
- [ ] Fire trail creates sense of motion
- [ ] Tumbling rotation feels natural (not spinning too fast)
- [ ] Glow intensity appropriate (visible but not blinding)
- [ ] Targeting brackets lock on smoothly
- [ ] Info panel readable and well-positioned
- [ ] Explosion feels powerful (good particle count, timing)
- [ ] Money particles travel smoothly to shield bar

### ✅ Interaction Quality

- [ ] Click hitbox accurate (can click asteroid reliably)
- [ ] Laser fires immediately on click (no lag)
- [ ] Explosion timing feels satisfying (not too fast or slow)
- [ ] Shield bar update is clear and noticeable
- [ ] Captain Nova response synced with action
- [ ] Can't double-deflect (prevent spamming same asteroid)

### ✅ Urgency Communication

- [ ] Distance to impact is clear from visual cues
- [ ] Zone 4 warning is noticeable but not annoying
- [ ] Larger asteroids feel more threatening
- [ ] Faster asteroids create more tension
- [ ] Impact consequence is meaningful (shield drop is significant)

### ✅ Performance

- [ ] 60fps maintained with 5 asteroids
- [ ] No frame drops during explosion (particle burst)
- [ ] Memory stable (no leaks from particle creation)
- [ ] Procedural generation is instant (< 10ms per asteroid)

### ✅ Data Integration

- [ ] Asteroid spawns when real transaction data indicates wasteful subscription
- [ ] Impact value matches actual subscription cost
- [ ] Days until impact matches actual billing cycle
- [ ] Deflection updates real backend data (cancels subscription or sets alert)

---

## Design Alternatives Considered

### Alternative 1: Simple Sphere (No Procedural)
**Approach:** All asteroids use same sphere mesh
**Pros:** Simpler code, better performance
**Cons:** Visually boring, all look identical
**Decision:** ❌ Rejected - not impressive enough

### Alternative 2: Pre-Made Asset Library
**Approach:** Load 10 pre-made asteroid models, randomly select
**Pros:** Higher visual quality possible, artist-controlled
**Cons:** Larger asset size, not truly unique, feels repetitive
**Decision:** ❌ Rejected - want infinite variety

### Alternative 3: Procedural with High Detail
**Approach:** Generate very high-poly asteroids (10K+ triangles)
**Pros:** Ultra-realistic appearance
**Cons:** Performance killer, overkill for distant objects
**Decision:** ❌ Rejected - over-engineered

### Alternative 4: Procedural with LOD (SELECTED)
**Approach:** Low-poly procedural base, use LOD for distant objects
**Pros:** Unique + performant, scales well
**Cons:** Requires LOD system implementation
**Decision:** ✅ **Selected** - best balance

---

## Open Questions

### Resolved
- ✅ Q: Should asteroids have physics (bounce off each other)?
  - A: No - simplicity > realism, avoids complexity

- ✅ Q: Should larger asteroids break into smaller ones when hit?
  - A: No - clean deflection is more satisfying, easier to understand

### Unresolved
- ⚠️ Q: Should there be a "chain reaction" achievement (deflect 3 in a row)?
  - A: Defer to gamification phase

- ⚠️ Q: Should asteroids leave permanent scorch marks if they impact?
  - A: Cool idea, but low priority (visual polish phase)

---

## Implementation Checklist

### Phase 1: Core Geometry
- [ ] Implement procedural asteroid generator (simplex noise)
- [ ] Create asteroid material (emissive cracks, roughness)
- [ ] Add tumbling rotation (angular velocity)
- [ ] Position asteroids in 3D space

### Phase 2: Particle Systems
- [ ] Create particle pool architecture
- [ ] Implement fire trail emitter (50-100 particles)
- [ ] Implement explosion burst (200-300 particles)
- [ ] Implement money particle flight (10-15 orbs)

### Phase 3: Interaction
- [ ] Add hover detection (raycasting)
- [ ] Implement targeting brackets
- [ ] Implement info panel (glassmorphism)
- [ ] Add click deflection trigger

### Phase 4: Effects
- [ ] Create laser beam visual
- [ ] Create explosion shockwave
- [ ] Add screen shake on impact
- [ ] Add critical proximity warning (Zone 4)

### Phase 5: Integration
- [ ] Connect to threat detection backend
- [ ] Link deflection to shield updates
- [ ] Integrate Captain Nova responses
- [ ] Add sound effects

### Phase 6: Optimization
- [ ] Implement LOD system
- [ ] Add frustum culling
- [ ] Optimize particle pool
- [ ] Performance testing (60fps check)

### Phase 7: Polish
- [ ] Fine-tune particle colors
- [ ] Adjust timing values (explosion duration, etc.)
- [ ] Test with multiple asteroids
- [ ] Edge case testing (rapid clicks, off-screen, etc.)

### Phase 8: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark asteroid-threat as complete`

---

## Brainstormed Enhancements

### Visual Enhancements

**1. Frost/Decay Indicator**
Unused subscriptions accumulate ice crystals on the asteroid surface — a visual dormancy indicator. The longer the subscription goes unused, the more frost covers the rock. A subscription dormant for 90+ days should be nearly encased in blue-white ice, making it visually obvious this charge has been dead weight for months. This makes each asteroid tell its own story at a glance.

**2. Micro-Asteroid Swarm**
Very small subscriptions ($1-10/mo) appear as swarms of 5-8 tiny asteroids rather than a single rock. They move in loose formation, creating a "nuisance cloud" visual. Deflecting one triggers a chain reaction that pops the entire swarm. This differentiates low-value recurring charges from significant ones without making them invisible.

**3. Impact Crater Memory**
When an asteroid impacts (not deflected), it leaves a visible "scar" on the viewport frame — a cracked glass effect with faint red glow. Scars accumulate over time, creating a permanent visual record of missed savings opportunities. This adds consequence weight and motivates proactive deflection.

### Interaction Enhancements

**4. Formation Flying**
Multiple subscriptions from the same service provider (e.g., Spotify Premium + Spotify Family, or Netflix + Hulu under same parent company) fly in V-formation. Deflecting the lead asteroid triggers a chain reaction — all formation members explode in rapid sequence with escalating particle effects. Creates a satisfying "combo" moment.

**5. Deflection Combo System**
Rapidly deflecting 3+ asteroids within 5 seconds triggers a "COMBO" multiplier visual — cascading particle chains link the explosion sites, screen briefly flashes aurora, and Captain Nova gives an impressed reaction ("Impressive targeting, Commander! Multiple threats neutralized."). Gamification without complexity.

**6. Urgency Escalation**
As an asteroid enters Zone 3, its tumbling becomes more erratic — rotation speed increases, fire trail intensifies, and subtle screen-edge red pulses begin. The asteroid's behavior itself communicates urgency without needing to read the info panel. By Zone 4 it should feel genuinely threatening just from body language.

---

## Related Features

- `THREAT-002`: Ion Storm Threats (similar interaction pattern)
- `THREAT-003`: Solar Flare Threats (different visual style)
- `THREAT-004`: Black Hole Threats (gravitational pull mechanic)
- `THREAT-005`: Wormhole Threats (portal visual)
- `THREAT-006`: Enemy Cruiser Threats (combat pattern)
- `BACKEND-001`: Threat Detection Engine (spawns asteroids from data)
- `UI-004`: Shield Status Panels (receives deflection updates)

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
| 0.5 | 2026-02-06 | Initial implementation (basic mesh, simple deflection) |
| 1.0 | TBD | Full spec implementation (procedural, particles, polish) |

---

**Status:** Ready for procedural generation and particle system development.
