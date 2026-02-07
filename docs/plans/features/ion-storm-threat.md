# Feature Spec: Ion Storm Threat

**Feature ID:** `THREAT-002`
**Category:** Threat System
**Priority:** P0 (Must-have for MVP)
**Status:** 🔵 Needs Polish
**Current Version:** 0.5 (Basic implementation exists)
**Target Version:** 1.0

---

## Overview

Ion Storms represent **overspending surges and category budget overruns** — chaotic, unpredictable financial drains that crackle with energy. Unlike the solid, predictable asteroids, Ion Storms are amorphous clouds of purple-pink energy that pulse, swirl, and occasionally discharge lightning. They feel volatile and dangerous.

**The Core Magic:** Dynamic particle system with electrical arcs, procedural cloud movement, and absorption mechanics that let users "contain" the spending by activating VISA controls.

---

## Visual Specification

### Default Appearance

**Form & Structure:**
- Amorphous particle cloud (no fixed shape)
- Size: 3-5 units diameter (larger than asteroids, more diffuse)
- Particle count: 200-300 particles
- Cloud density: Denser at center, sparse at edges (radial gradient)

**Particle Behavior:**
- Position: Swirl around center point
- Movement: Orbital + random drift (Perlin noise)
- Speed: Varies per particle (0.5-2.0 units/s)
- Lifetime: Infinite (particles don't die, they circulate)

**Color Gradient:**
```
Core (center): #ec4899 (Hot pink)
Mid-range:     #a855f7 (Purple)
Outer edge:    #6366f1 (Indigo, fade to transparent)
```

**Material:**
- Additive blending (particles glow and overlap)
- Size: 0.2-0.4 units per particle (random variation)
- Opacity: 0.3-0.7 (varies with distance from center)

### Electrical Arcs

**Arc System:**
- Count: 3-5 arcs active at any time
- Appearance: Jagged lightning bolts inside the cloud
- Duration: 200-400ms per arc (flash and fade)
- Frequency: New arc every 0.5-1.0 seconds (random)

**Arc Visual:**
```typescript
// Lightning path generation
function generateLightningPath(start: Vector3, end: Vector3): Vector3[] {
  const points: Vector3[] = [start];
  const segments = 8;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const midpoint = new Vector3().lerpVectors(start, end, t);

    // Add random perpendicular offset
    const offset = new Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );

    points.push(midpoint.add(offset));
  }

  points.push(end);
  return points;
}
```

**Arc Material:**
- Color: Bright electric blue-white (#60a5fa)
- Glow: Intense bloom effect
- Width: 0.05 units
- Opacity: 1.0 (fully opaque, very bright)

### Movement Behavior

**Spawning:**
- Initial position: Random point in sphere (radius 1000-1200 units)
- Initial velocity: Drifts toward camera, but erratically
- Speed: 0.7 units/second (slower than asteroids, feels ponderous)

**Flight Path:**
- Direction: Wanders toward camera with noise-based offset
- Pattern: Sine wave overlay (horizontal wobble, ±2 units amplitude)
- Rotation: Cloud slowly spins on Y-axis (0.1 rad/s)
- Pulsing: Cloud expands/contracts (±10% size, 3s cycle)

**Chaos Factor:**
- Occasionally "surges" forward (2x speed for 1 second)
- Lightning intensifies during surge (5-8 arcs instead of 3-5)
- Creates unpredictable threat feel

### Hover State

**Trigger:** Cursor within 60px of storm center, storm in Zone 3+

**Visual Changes:**

1. **Electric Arcs Reach Toward Cursor:**
   - 2-3 arcs extend from cloud toward cursor position
   - Arcs don't quite reach (stop 0.5 units short)
   - Creates "attracted to you" effect

2. **Storm Intensifies:**
   - Particle speed increases 1.5x
   - Particle density increases (spawn more particles temporarily)
   - Color shifts hotter (more pink, less purple)
   - Pulsing frequency increases (2s cycle instead of 3s)

3. **Targeting Field:**
   - Circular holographic ring appears around storm
   - Ring pulses with storm's electrical rhythm
   - Color: Aurora gradient
   - Diameter: 1.5x storm size

4. **Info Panel:**
   ```
   ⚡ DINING OVERSPEND
   Recreation Deck at 142% capacity
   SURGE: +$284 over budget
   VOLATILITY: HIGH
   [ABSORB] button (crackling effect)
   ```

5. **Audio Cue:**
   - Faint electrical crackling sound (subtle, atmospheric)
   - Volume increases with proximity

### Click Interaction: Absorption Sequence

**Phase 1: Containment Field (0-200ms)**

1. **Field Activation:**
   - Purple energy barrier expands from bottom of screen
   - Spherical containment field (wireframe grid)
   - Grows to encompass the storm
   - Material: Translucent purple, gridlines glow

2. **Storm Reacts:**
   - Particles jolt toward field edges (repelled)
   - Lightning arcs strike the barrier frantically
   - Storm compresses (shrinks to 70% size)

**Phase 2: Energy Drain (200-800ms)**

1. **Absorption Streams:**
   - 5-8 energy streams pull from storm to field
   - Streams are spiraling purple ribbons
   - Flow direction: Storm → Bottom of screen
   - Speed: Fast at first, slows as storm depletes

2. **Storm Depletes:**
   - Particle count decreases (300 → 50 over 600ms)
   - Particle opacity fades
   - Lightning arcs weaken (fewer, dimmer)
   - Size shrinks: 5 units → 1 unit

3. **Energy Collection:**
   - Purple orbs accumulate at bottom shield panel
   - Orbs pulse with electrical energy
   - Count: 10-15 orbs

**Phase 3: Shield Overload (800-1200ms)**

1. **Shield Panel Receives Energy:**
   - Orbs fly into "VISA Transaction Control" shield bar
   - Shield bar crackles with electricity (temporary effect)
   - Bar fills rapidly with purple glow
   - Sparks fly off shield edges

2. **Overload Effect:**
   - Shield bar pulses red briefly (too much energy!)
   - Screen flickers (1-2 frames)
   - Warning beep (high-pitched)
   - Settles to stable glow

3. **Captain Nova Activates Controls:**
   - Nova gestures toward shield panel
   - Speaks:
     > "Activating spending shields. Setting $25 per transaction limit on dining sector."
   - New shield bar appears: "VISA CONTROLS — ACTIVE"
   - Shield shows spending limits: "DINING: $25/transaction"

**Phase 4: Storm Dissipation (1200-1500ms)**

- Remaining storm particles drift away (no explosion)
- Final lightning arc flickers out
- Containment field fades
- Info panel dismisses
- Storm removed from threat array

### Critical Proximity State (Zone 4)

**Trigger:** Storm reaches distance < 100 units

**Warning Effects:**

1. **Screen Interference:**
   - Static lines appear on screen edges
   - Colors desaturate briefly (1s pulse)
   - Subtle screen shake (low frequency rumble)

2. **Audio Warning:**
   - Electrical distortion sound (bzzzt)
   - Plays once when entering Zone 4

3. **Captain Nova Warning:**
   > "Commander, that spending surge is overwhelming our systems. Absorb it now!"
   - Eyes locked on storm
   - Urgent tone (1.1x speech rate)

### Impact State (Collision)

**Collision Sequence:**

1. **Energy Discharge:**
   - Massive lightning strike hits "camera"
   - Full-screen electric flash (purple-white)
   - Screen shakes violently (2-frame jolt)
   - All UI elements flicker

2. **Shield Damage:**
   - "Recreation Deck" shield bar drops significantly (15-20%)
   - Cracks appear in shield visual
   - Shield bar flashes red, sparks

3. **Budget Alert:**
   - Budget overspend counter increments
   - Red warning appears: "BUDGET EXCEEDED: +$284"
   - Spending category turns red (DINING: 142%)

4. **Captain Nova Reaction:**
   - Winces, raises arm defensively
   - Speaks:
     > "Impact confirmed! Dining expenses just spiked. We're hemorrhaging credits, Commander."

5. **Storm Aftermath:**
   - Storm passes through camera (continues behind)
   - Leaves electrical trail (particles linger 2s)
   - Screen static fades over 3 seconds

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `three` (^0.182.0) - Particle system, line geometry
- `@react-three/fiber` (^9.5.0) - React integration
- `simplex-noise` (^4.0.0) - Perlin noise for particle drift

**Required Assets:**
- `textures/particle-glow.png` - Circular gradient sprite
- `audio/electric-crackle.mp3` - Ambient electrical sound
- `audio/electric-discharge.mp3` - Impact sound

### Particle System Architecture

**StormParticleSystem.tsx:**

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimplexNoise } from 'simplex-noise';

interface IonStormProps {
  position: THREE.Vector3;
  size: number;
  intensity: number; // 0-1, drives surge behavior
}

export function IonStorm({ position, size, intensity }: IonStormProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const simplex = useMemo(() => new SimplexNoise(), []);

  const particleCount = 300;

  // Initialize particle positions
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * size;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [size]);

  // Animate particles
  useFrame(({ clock }) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // Orbital rotation + noise drift
      const angle = time * 0.3 + i * 0.1;
      const radius = Math.sqrt(x * x + y * y + z * z);

      const noiseX = simplex.noise3D(x * 0.5, y * 0.5, time * 0.2) * 0.5;
      const noiseY = simplex.noise3D(y * 0.5, z * 0.5, time * 0.2) * 0.5;
      const noiseZ = simplex.noise3D(z * 0.5, x * 0.5, time * 0.2) * 0.5;

      positions[i * 3] = Math.cos(angle) * radius + noiseX;
      positions[i * 3 + 1] = Math.sin(angle) * radius + noiseY;
      positions[i * 3 + 2] = z + noiseZ;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#a855f7"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
```

### Lightning Arc Generation

**LightningArc.tsx:**

```typescript
function LightningArc({ start, end }: { start: Vector3; end: Vector3 }) {
  const geometry = useMemo(() => {
    const points = generateLightningPath(start, end);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color="#60a5fa"
        linewidth={2}
        transparent
        opacity={1.0}
      />
    </line>
  );
}
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Storm looks chaotic and energetic (not static blob)
- [ ] Particles swirl convincingly around center
- [ ] Electrical arcs look like real lightning (jagged, bright)
- [ ] Color gradient creates sense of heat/energy
- [ ] Pulsing animation feels organic (not mechanical)
- [ ] Absorption effect is satisfying (energy visibly drains)

### ✅ Interaction Quality

- [ ] Hover arcs reach toward cursor (reactive feel)
- [ ] Containment field activation is clear and immediate
- [ ] Energy drain sequence has good timing (not too slow/fast)
- [ ] Shield overload effect communicates "too much energy"
- [ ] VISA controls activation makes sense narratively

### ✅ Threat Communication

- [ ] Storm feels more chaotic than asteroids (different threat type)
- [ ] Volatility is clear from visual behavior
- [ ] Budget overspend mapping is intuitive (storm = spending surge)
- [ ] Impact consequence feels serious (shield damage + budget alert)

### ✅ Performance

- [ ] 60fps with storm active (300 particles)
- [ ] Lightning arcs don't cause frame drops
- [ ] Multiple storms on screen perform well (2-3 storms)
- [ ] Particle system properly cleaned up when storm removed

---

## Brainstormed Enhancements

### Visual Enhancements

**1. Category Bleed Tendrils**
Storm tendrils (thin particle streams) reach toward OTHER budget categories' shield bars, visualizing how overspending in one area threatens to "spread." If dining is over budget, purple tendrils stretch toward the Recreation Deck shield. This makes the interconnected nature of budgets tangible and spatial.

**2. Calm Eye Reveal**
The center of the storm occasionally clears for 2-3 seconds, revealing the actual spending number floating in the void — a moment of clarity amid chaos. The number pulses, then the storm closes back around it. Creates a haunting "the truth is in there" effect.

**3. Color Temperature Shift**
Storm color shifts dynamically based on severity: purple (10-20% over budget) -> hot pink (20-50% over) -> angry red (50%+ over). The color change is gradual and continuous, providing an instant visual read on how bad the overrun is without needing to hover for details.

**4. Contagion Arcs**
If multiple ion storms exist simultaneously, lightning can arc BETWEEN them — showing interconnected overspending patterns. Two storms linked by arcs feel more dangerous than two isolated ones, communicating that simultaneous budget overruns compound each other.

### Interaction Enhancements

**5. Intensity Meter HUD**
When hovering, a small "VOLATILITY" gauge appears that fluctuates randomly (like a seismograph). The gauge occasionally spikes, and each spike corresponds to the storm surging forward briefly. Creates tension — you never know when the next surge hits.

**6. Absorption Tug-of-War**
During the absorption sequence, the storm doesn't go quietly. It "fights back" — particles resist the containment field, lightning strikes the barrier, and there's a visible power struggle. The containment field flickers and strains. This makes the absorption feel earned, not trivial.

**7. Static Screen Interference**
The closer an ion storm gets, the more it interferes with the UI itself. Nearby text garbles briefly, panel borders flicker, numbers scramble for a frame then correct. Subtle at Zone 3, noticeable at Zone 4. The storm is literally disrupting your command systems.

---

## Related Features

- `THREAT-001`: Asteroid Threats (contrast: solid vs cloud)
- `BACKEND-001`: Threat Detection Engine (spawns storms from spending data)
- `UI-004`: Shield Status Panels (VISA controls integration)
- `BACKEND-002`: VISA Controls API (activates spend limits)

---

## Implementation Checklist

### Phase 1: Particle System
- [ ] Initialize particle geometry (300 particles)
- [ ] Implement orbital + Perlin noise drift
- [ ] Apply additive blending and gradient colors
- [ ] Test particle performance at 60fps

### Phase 2: Electrical Arcs
- [ ] Implement lightning path generation (jagged bezier)
- [ ] Create arc spawning system (3-5 active arcs)
- [ ] Add arc material (bright electric blue, bloom)
- [ ] Implement arc fade-out animation (200-400ms)

### Phase 3: Movement & Behavior
- [ ] Implement spawning logic (random radius 1000-1200 units)
- [ ] Code wander + noise-based approach
- [ ] Add sine-wave horizontal wobble pattern
- [ ] Implement surge behavior (2x speed, 5-8 arcs)

### Phase 4: Hover & Targeting
- [ ] Implement targeting ring visualization
- [ ] Create info panel with overspend details
- [ ] Add electric crackling audio
- [ ] Implement arcs reaching toward cursor

### Phase 5: Click Interaction - Absorption Sequence
- [ ] Create containment field (wireframe, purple glow)
- [ ] Implement energy drain streams (purple ribbons)
- [ ] Build shield overload effect
- [ ] Integrate Captain Nova dialogue

### Phase 6: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark ion-storm-threat as complete`

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
| 0.5 | 2026-02-06 | Initial implementation (basic particle cloud) |
| 1.0 | TBD | Full spec with lightning and absorption |

---

**Status:** Ready for lightning arc system and absorption mechanics development.
