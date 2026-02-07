# Feature Spec: Solar Flare Threat

**Feature ID:** `THREAT-003`
**Category:** Threat System
**Priority:** P0 (Must-have for MVP)
**Status:** 🔵 Needs Polish
**Current Version:** 0.5 (Basic implementation exists)
**Target Version:** 1.0

---

## Overview

Solar Flares represent **upcoming bill spikes and subscription renewals** — predictable but potentially painful charges approaching on the horizon. Unlike chaotic threats (asteroids, storms), Solar Flares are orderly waves of energy that pulse rhythmically as their deadline approaches, creating a sense of ticking clock urgency.

**The Core Magic:** Expanding wave rings with radial flare rays, pulsing heartbeat rhythm synced to days-until-charge, and split-routing mechanics that let users optimize which card handles the payment.

---

## Visual Specification

### Core Structure

**Energy Wave (Primary Visual):**
- Appearance: Flat circular wave expanding outward
- Size: 4-6 units diameter (based on charge amount)
- Material: Radial gradient (gold center → transparent edge)
- Color: `#fbbf24` (amber) → `#f59e0b` (orange)
- Thickness: 0.3 units (thin energy sheet)
- Orientation: Faces camera (billboard effect)

**Flare Rays (Secondary Visual):**
- Count: 8 rays extending from center
- Length: 2-4 units (pulsing)
- Width: 0.2 units at base, tapers to point
- Material: Additive blend, high intensity
- Pattern: Rotate slowly (0.1 rad/s)
- Glow: Intense bloom effect

**Pulse Pattern:**
- Core pulses in/out (±15% size)
- Frequency: Based on urgency
  - 7+ days: 3s cycle (slow, calm)
  - 3-7 days: 2s cycle (moderate)
  - < 3 days: 1s cycle (fast, urgent)
- Brightness oscillates with size (brighter when larger)

### Movement Behavior

**Spawning:**
- Initial position: Random point (radius 1000-1200 units)
- Initial rotation: Random orientation
- Initial velocity: Straight toward camera
- Speed: 0.8 units/second (moderate pace)

**Flight Path:**
- Direction: Direct line to camera (predictable)
- No wobble or deviation (represents scheduled charge)
- Rotation: Flare rays rotate continuously
- Pulsing: Frequency increases as it approaches

**Urgency Visualization:**
```typescript
// Pulse frequency based on days until charge
function getPulseFrequency(daysUntil: number): number {
  if (daysUntil > 7) return 3.0; // 3 second cycle
  if (daysUntil > 3) return 2.0; // 2 second cycle
  return 1.0; // 1 second cycle (urgent)
}

// Visual intensity increases with proximity
function getIntensity(distance: number, daysUntil: number): number {
  const distanceFactor = 1 - (distance / 1200); // 0-1
  const urgencyFactor = 1 - (daysUntil / 30); // 0-1
  return (distanceFactor + urgencyFactor) / 2;
}
```

### Hover State

**Trigger:** Cursor within 70px of flare center, flare in Zone 3+

**Visual Changes:**

1. **Heat Distortion:**
   - Space around flare warps (heat shimmer effect)
   - Shader-based distortion on background
   - Radius: 1.5x flare size
   - Intensity: Gentle wavering (like heat waves)

2. **Flare Intensifies:**
   - Core brightness increases 1.5x
   - Rays extend outward (grow 20% longer)
   - Pulse frequency increases (1.2x)
   - Additional particle sparkles appear

3. **Targeting Reticle:**
   - Circular targeting ring appears around flare
   - Ring rotates opposite direction to rays
   - Color: Aurora gradient
   - Segments: Dashed circle (12 segments)

4. **Info Panel:**
   ```
   ☀️ NETFLIX + HULU RENEWAL
   Dual streaming auto-renew imminent
   COST: $31.98
   SCHEDULED: Jan 15, 2026
   ARRIVAL: 48 hours

   PAYMENT OPTIONS:
   [ ] Sapphire Reserve (3x points) ✨ Recommended
   [ ] Freedom Unlimited (1.5x points)
   [ ] Checking Account (no rewards)

   [OPTIMIZE ROUTING]
   ```

5. **Audio Cue:**
   - Soft pulsing hum (synced to visual pulse)
   - Pitch increases with urgency

### Click Interaction: Redirect Sequence

**Phase 1: Route Selection (0-200ms)**

If user hasn't selected card in panel, show quick-select modal:

```
OPTIMIZE PAYMENT ROUTING

This charge: $31.98
Best option: Sapphire Reserve
  → Earns 3x points ($0.96 value)
  → Streaming category bonus
  → No foreign transaction fees

[CONFIRM SAPPHIRE] [CHOOSE DIFFERENT CARD]
```

**Phase 2: Flare Split (200-800ms)**

1. **Core Separation:**
   - Central wave splits into two halves
   - Each half spirals outward (counter-rotating)
   - Colors shift:
     - One half → Green (approved spending)
     - Other half → Gold (rewards earned)

2. **Split Animation:**
   - Halves orbit around each other (500ms)
   - Trails form spiral pattern
   - Rays fragment into smaller rays

**Phase 3: Routing Streams (800-1500ms)**

1. **Approved Spending Stream (Green):**
   - Green energy flows downward
   - Destination: "Recreation Deck" shield bar
   - Particles: 20-30 flowing orbs
   - Effect: Shield bar shows scheduled charge: "+$31.98 on Jan 15"

2. **Rewards Stream (Gold):**
   - Gold particles flow to separate area
   - Destination: "Rewards Tracking" panel (new UI element)
   - Shows: "+96 points ($0.96 value)"
   - Sparkle effect on receipt

**Phase 4: Captain Nova Confirmation (1500-2000ms)**

1. **Nova Speaks:**
   > "Renewal confirmed. Optimizing payment routing to maximize rewards. Sapphire Reserve will earn 3x points. Total value: 96 points."

2. **Card Selection Visual:**
   - Small card icon appears next to flare path
   - Shows selected card (Sapphire Reserve)
   - Checkmark animation

**Phase 5: Flare Passes Through (2000-2500ms)**

- Flare doesn't explode (payment is accepted, not canceled)
- Instead, it gracefully passes by camera
- Leaves golden particle trail (approved transaction)
- Fades out over 500ms
- Removed from threat array

### Alternative Interaction: Deflect (Cancel Payment)

**If user wants to CANCEL the renewal:**

Info panel shows additional button:

```
[OPTIMIZE ROUTING]  [CANCEL RENEWAL]
```

**Cancel Sequence:**

1. **Confirmation Modal:**
   ```
   ⚠️ CANCEL SUBSCRIPTION RENEWAL?

   This will prevent $31.98 charge on Jan 15.
   Service will end after current billing cycle.

   [KEEP SUBSCRIPTION] [CONFIRM CANCELLATION]
   ```

2. **Deflection (if confirmed):**
   - Laser beam fires from bottom
   - Flare shatters into fragments
   - Particles scatter (explosion-like)
   - Shield bar shows: "SAVED: $31.98/mo"
   - Nova: "Renewal canceled. $31.98 per month redirected to Warp Fuel reserves."

### Critical Proximity State (Zone 4)

**Trigger:** Flare reaches distance < 100 units

**Warning Effects:**

1. **Screen Glow:**
   - Orange-gold glow pulses from flare position
   - Not alarming (flares aren't dangerous like black holes)
   - More of a "hey, pay attention" effect

2. **Audio Reminder:**
   - Soft chime (pleasant, not harsh)
   - Plays once when entering Zone 4

3. **Captain Nova Reminder:**
   - Calm tone:
     > "Commander, that renewal charge is arriving in 48 hours. I recommend routing to Sapphire Reserve for optimal rewards."

4. **Auto-Highlight:**
   - OPTIMIZE ROUTING button glows gold
   - Panel appears automatically (doesn't need hover)

### Impact State (Collision, No Action Taken)

**If flare reaches camera without optimization:**

1. **Gentle Flash:**
   - Screen flashes gold (not harsh white)
   - Brief warmth effect (not jarring)

2. **Charge Applied:**
   - Shield bar drops by amount charged
   - Notification: "CHARGE POSTED: $31.98"
   - Card used: Default card (suboptimal)

3. **Missed Optimization Alert:**
   - Warning (yellow, not red): "MISSED REWARDS OPPORTUNITY"
   - Shows: "Lost 96 points ($0.96 value)"
   - Creates new Wormhole threat (missed opportunity)

4. **Captain Nova Comment:**
   - Slightly disappointed tone:
     > "Charge confirmed on Freedom Unlimited. We could have earned 3x points on Sapphire Reserve. I'll flag these optimization opportunities earlier next time, Commander."

5. **Flare Aftermath:**
   - Flare passes through (doesn't damage severely)
   - Leaves faint trail (accepted charge)
   - Shield impact is minimal (expected expense)

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `three` (^0.182.0) - Geometry, materials, shaders
- `@react-three/fiber` (^9.5.0) - React integration
- `@react-three/drei` (^10.7.7) - Billboard helper

**Required Assets:**
- `textures/flare-gradient.png` - Radial gradient texture
- `shaders/heat-distortion.glsl` - Heat shimmer effect
- `audio/pulse-hum.mp3` - Pulsing ambient sound
- `audio/chime.mp3` - Pleasant notification chime

### Core Implementation

**SolarFlare.tsx:**

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface SolarFlareProps {
  position: THREE.Vector3;
  size: number;
  daysUntil: number;
  amount: number;
}

export function SolarFlare({ position, size, daysUntil, amount }: SolarFlareProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseFrequency = daysUntil > 7 ? 3.0 : daysUntil > 3 ? 2.0 : 1.0;

  // Pulsing animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();
    const pulse = Math.sin(time * Math.PI / pulseFrequency);

    // Scale core wave
    const scale = 1 + pulse * 0.15;
    groupRef.current.scale.setScalar(scale);

    // Rotate rays
    groupRef.current.rotation.z = time * 0.1;
  });

  // Flare rays geometry
  const rays = useMemo(() => {
    const rayGeometries: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rayLength = size * 0.8;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(rayLength, 0.1);
      shape.lineTo(rayLength, -0.1);
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateZ(angle);

      rayGeometries.push(geometry);
    }
    return rayGeometries;
  }, [size]);

  return (
    <group ref={groupRef} position={position}>
      {/* Central wave */}
      <Billboard>
        <mesh>
          <circleGeometry args={[size, 64]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>

      {/* Flare rays */}
      {rays.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Glow */}
      <pointLight
        color="#fbbf24"
        intensity={2}
        distance={size * 3}
      />
    </group>
  );
}
```

### Heat Distortion Shader

**heat-distortion.glsl:**

```glsl
// Fragment shader for background near flare
uniform float time;
uniform vec2 flarePosition;
uniform float flareRadius;

void main() {
  vec2 uv = vUv;
  vec2 toFlare = flarePosition - uv;
  float dist = length(toFlare);

  // Only distort within radius
  if (dist < flareRadius) {
    float distortion = (1.0 - dist / flareRadius) * 0.02;
    vec2 wave = vec2(
      sin(uv.y * 20.0 + time * 2.0),
      cos(uv.x * 20.0 + time * 2.0)
    );
    uv += wave * distortion;
  }

  gl_FragColor = texture2D(backgroundTexture, uv);
}
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Wave pulses smoothly (no sudden jumps)
- [ ] Rays extend naturally from center
- [ ] Heat distortion is subtle but noticeable
- [ ] Gold color is vibrant (not washed out)
- [ ] Pulse frequency matches urgency (faster when closer)
- [ ] Split animation is clean (halves separate smoothly)

### ✅ Interaction Quality

- [ ] Card selection modal is clear and actionable
- [ ] Routing optimization makes sense (best card recommended)
- [ ] Split streams reach correct destinations (shield bar, rewards panel)
- [ ] Captain Nova explanation is helpful
- [ ] Cancel option is available but not default
- [ ] Can't accidentally cancel subscription (requires confirmation)

### ✅ Urgency Communication

- [ ] Pulse speed clearly indicates time pressure
- [ ] Days-until-charge is prominently displayed
- [ ] Critical proximity (Zone 4) is noticeable but not alarming
- [ ] Missed optimization creates appropriate consequence (wormhole, not disaster)

### ✅ Performance

- [ ] 60fps with flare active
- [ ] Heat distortion doesn't cause frame drops
- [ ] Multiple flares on screen perform well (3-4 flares)
- [ ] Particles properly cleaned up after routing

---

## Design Alternatives Considered

### Alternative 1: Flare as Projectile (Like Asteroid)
**Approach:** Treat flare as deflectable threat
**Pros:** Consistent with asteroid mechanics
**Cons:** Doesn't communicate "scheduled charge" concept
**Decision:** ❌ Rejected - flares shouldn't feel threatening

### Alternative 2: Flare as Calendar Event
**Approach:** Show flare as date marker on timeline
**Pros:** Very clear scheduling visual
**Cons:** Breaks 3D space metaphor, feels too literal
**Decision:** ❌ Rejected - not immersive enough

### Alternative 3: Flare as Energy Wave (SELECTED)
**Approach:** Pulsing wave with split-routing mechanic
**Pros:** Visually distinct, communicates urgency, optimization makes sense
**Cons:** More complex interaction than asteroid
**Decision:** ✅ **Selected** - best balance of beauty and function

---

## Open Questions

### Resolved
- ✅ Q: Should flares ever be deflectable (cancel subscription)?
  - A: Yes - but not default action, requires explicit cancellation choice

- ✅ Q: Should users be able to reschedule charges?
  - A: No - that's not realistic, charges happen on fixed dates

### Unresolved
- ⚠️ Q: Should multiple flares merge if scheduled on same day?
  - A: Interesting - "combo flare" showing total charges for that day

- ⚠️ Q: Should flare show breakdown if it's bundle (Netflix + Hulu)?
  - A: Good UX - show itemized list in info panel

---

## Implementation Checklist

### Phase 1: Core Visual
- [ ] Create wave geometry (circular with radial gradient)
- [ ] Create flare ray geometry (8 triangular rays)
- [ ] Implement pulsing animation (size + brightness)
- [ ] Add rotation animation (rays spin)

### Phase 2: Urgency System
- [ ] Calculate pulse frequency from daysUntil
- [ ] Implement visual intensity based on proximity
- [ ] Test urgency visualization (7 days vs 2 days vs 12 hours)

### Phase 3: Heat Distortion
- [ ] Write heat shimmer shader
- [ ] Apply to background near flare
- [ ] Tune distortion intensity (subtle)

### Phase 4: Interaction
- [ ] Create card selection modal
- [ ] Implement flare split animation
- [ ] Create routing streams (green + gold particles)
- [ ] Integrate with rewards tracking panel

### Phase 5: Integration
- [ ] Connect to subscription data (renewal dates)
- [ ] Connect to card optimization engine
- [ ] Add Captain Nova dialogue
- [ ] Test with real subscription data

### Phase 6: Polish
- [ ] Add sound effects (pulse hum, chime)
- [ ] Fine-tune animation timing
- [ ] Test cancellation flow
- [ ] Test missed optimization consequence

---

## Related Features

- `THREAT-001`: Asteroid Threats (contrast: scheduled vs wasteful)
- `THREAT-005`: Wormhole Threats (created by missed optimization)
- `BACKEND-006`: Card Optimization Engine (recommends best card)
- `UI-007`: Rewards Tracking Panel (receives rewards particles)
- `FINANCIAL-004`: Subscription Management (cancellation integration)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.5 | 2026-02-06 | Initial implementation (basic pulse visual) |
| 1.0 | TBD | Full spec with routing and optimization |

---

**Status:** Ready for split-routing mechanics and card optimization integration.
