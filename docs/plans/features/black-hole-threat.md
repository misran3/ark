# Feature Spec: Black Hole Threat

**Feature ID:** `THREAT-004`
**Category:** Threat System
**Priority:** P0 (Must-have for MVP)
**Status:** 🔴 Not Started
**Current Version:** 0.0
**Target Version:** 1.0

---

## Overview

Black Holes represent the most dangerous financial threat: **debt spirals and compounding interest**. Unlike asteroids (one-time costs) or ion storms (temporary surges), Black Holes are persistent, growing threats that pull resources in relentlessly. They warp space around them, pull nearby particles toward their event horizon, and feel ominous and inevitable.

**The Core Magic:** Gravitational lensing shader that warps the starfield, particle accretion disk that spirals inward, and a multi-step neutralization mechanic that requires strategic planning (not just a quick click).

---

## Visual Specification

### Core Structure

**Event Horizon (Center):**
- Appearance: Perfect black sphere (void)
- Size: 2-4 units diameter (based on debt severity)
- Material: Pure black (#000000), no light emission
- Shader: Absorbs light, creates "hole" in space
- Edge: Sharp transition to accretion disk (no blur)

**Accretion Disk:**
- Structure: Flat disk of swirling particles orbiting the black hole
- Radius: 1.5x event horizon radius
- Thickness: 0.3 units (thin disk)
- Particle count: 400-600 particles
- Colors: Purple → Blue gradient (#4c1d95 → #1e3a8a)
- Direction: Counterclockwise rotation (viewed from above)
- Speed: Faster particles near event horizon (orbital mechanics)

**Particle Behavior:**
- Spiral: Logarithmic spiral inward
- Speed: Increases as particles approach center
- Fade: Particles disappear when reaching event horizon
- Respawn: New particles appear at disk outer edge
- Trail: Each particle leaves faint trail (motion blur)

### Gravitational Effects

**Space Warping (Lensing):**

The black hole distorts the starfield behind it, creating a realistic gravitational lensing effect.

**Shader Implementation:**
```glsl
// Fragment shader for background starfield
uniform vec3 blackHolePosition; // Black hole position in screen space
uniform float blackHoleRadius;  // Event horizon radius

void main() {
  vec2 uv = vUv;

  // Calculate distance from black hole center
  vec2 toBlackHole = blackHolePosition.xy - uv;
  float dist = length(toBlackHole);

  // Gravitational lensing distortion
  float lensStrength = 1.0 / (dist * dist + 0.1); // Inverse square law
  float maxLensing = 0.3; // Maximum distortion amount

  vec2 distortion = normalize(toBlackHole) * lensStrength * maxLensing;

  // Apply distortion to UV (warp space)
  vec2 warpedUV = uv + distortion;

  // Sample starfield with warped coordinates
  vec4 starColor = texture2D(starfieldTexture, warpedUV);

  // Darken near event horizon
  float darkenFactor = smoothstep(blackHoleRadius * 2.0, blackHoleRadius, dist);
  starColor.rgb *= (1.0 - darkenFactor * 0.8);

  gl_FragColor = starColor;
}
```

**Effect:**
- Stars near black hole appear stretched and curved
- Creates characteristic "Einstein ring" effect
- Stars behind black hole are visible (bent light)

**Particle Attraction (Nearby Objects):**

- Nearby threat particles (from other threats) drift toward black hole
- Stars in starfield accelerate toward it (subtle effect)
- Camera shakes slightly when very close (< 50 units)

### Movement Behavior

**Spawning:**
- Initial position: Random point (radius 800-1000 units)
- Initial velocity: Slow drift toward camera (0.3 units/s)
- Rotation: Accretion disk rotates (not the black hole itself)

**Flight Path:**
- Direction: Straight line toward camera (inexorable)
- Speed: Slow but constant (feels inevitable, not frantic)
- No wobble or evasion (moves like physics, not alive)

**Growing Threat:**
- Black hole size increases over time (debt compounds!)
- Growth rate: 2% per 10 seconds of screen time
- Accretion disk expands proportionally
- Gravitational pull radius increases

### Hover State

**Trigger:** Cursor within 80px of event horizon, black hole in Zone 3+

**Visual Changes:**

1. **Gravity Pull Effect:**
   - Cursor is "pulled" toward event horizon (cursor moves slightly)
   - CSS: Apply transform toward black hole center (subtle, 5-10px)
   - Creates uncomfortable feeling of being drawn in

2. **Accretion Disk Intensifies:**
   - Particle speed increases 1.5x
   - Particle glow brightens
   - More particles spawn (disk becomes denser)
   - Spiral tightens (faster inward pull)

3. **Warning Indicators:**
   - Red alert brackets (instead of aurora brackets)
   - Brackets pulsate urgently (1s cycle)
   - Klaxon sound (low, ominous)

4. **Info Panel (Red Theme):**
   ```
   ⚫ CREDIT CARD DEBT SPIRAL
   Minimum payments sustaining balance
   PRINCIPAL: $8,450
   INTEREST: $127/mo compounding
   PAYOFF TIME: 18 years (current rate)
   DANGER: CRITICAL
   [NEUTRALIZE] button (requires confirmation)
   ```

5. **Camera Shake:**
   - Subtle rumble (low frequency, 2Hz)
   - Increases intensity with proximity

### Click Interaction: Neutralization Sequence

**Phase 0: Confirmation Modal (Blocking)**

Black holes are serious - require explicit confirmation before action.

**Modal Content:**
```
⚠️ DEBT NEUTRALIZATION PROTOCOL

This action will:
• Analyze full debt structure
• Generate aggressive payoff strategy
• Redirect $340/mo from Recreation Deck
• Eliminate debt in 8 months

Proceed with neutralization?

[CANCEL]  [CONFIRM NEUTRALIZATION]
```

**If Cancel:** Return to normal, black hole remains
**If Confirm:** Proceed to Phase 1

**Phase 1: Analysis Scan (0-1000ms)**

1. **Scanning Beam:**
   - Bright blue beam shoots from bottom of screen to black hole
   - Beam rotates around event horizon (360° scan)
   - Duration: 1 second
   - Material: Additive blend, pulsing intensity

2. **Data Particles Extracted:**
   - Small particles (data fragments) pulled from accretion disk
   - Particles fly down scan beam toward screen bottom
   - Count: 20-30 particles
   - Color: Blue-white (data visualization)

3. **Captain Nova Analyzes:**
   - Eyes focused on black hole
   - Speech:
     > "Scanning debt structure... I've identified an optimal payoff strategy."

**Phase 2: Singularity Collapse (1000-2500ms)**

1. **Accretion Disk Reversal:**
   - Particles stop spiraling inward
   - Particles reverse direction (spiral outward!)
   - Speed increases (rapid expansion)
   - Color shifts: Purple → Gold (energy change)

2. **Event Horizon Shrinks:**
   - Black sphere contracts rapidly
   - Size: 4 units → 1 unit over 1 second
   - Edge glows with Hawking radiation (faint blue glow)

3. **Gravitational Lensing Weakens:**
   - Starfield distortion reduces
   - Space "un-warps" back to normal
   - Smooth transition (300ms)

**Phase 3: Implosion (2500-3000ms)**

1. **Final Collapse:**
   - Event horizon shrinks to point (singularity)
   - All accretion disk particles collapse inward
   - Particles converge on center point
   - Speed: Accelerating (appears to fall into void)

2. **Flash:**
   - Bright blue-white flash at singularity point
   - Screen flashes (additive, 2 frames)
   - Shockwave ripple (expanding ring, 500ms)

3. **Particles Scatter:**
   - Particles burst outward (explosion-like)
   - Particles fade to gold (debt converted to savings)
   - Particles fly toward "Warp Fuel" shield bar

**Phase 4: Debt Payoff Plan (3000-4000ms)**

1. **Shield Bar Update:**
   - "Debt Elimination" shield bar appears (new)
   - Bar shows payoff progress: 0% → 100% (goal)
   - Monthly payment amount displayed: "$340/mo"
   - Timeline: "8 months to freedom"

2. **Captain Nova Explains:**
   - Speaks:
     > "Debt neutralized via aggressive payment strategy. I'm rerouting $340 per month from Recreation Deck to eliminate this in 8 months. Your financial shields will be back to full strength soon, Commander."

3. **Budget Reallocation Visual:**
   - Recreation Deck shield bar drops (shows $340 deduction)
   - Arrow animates from Recreation → Debt Elimination
   - New budget breakdown appears in Command Center

**Phase 5: Cleanup (4000ms+)**

- Black hole fully removed from scene
- Space returns to normal (no distortion)
- New "Debt Payoff Plan" card added to Command Center
- Info panel dismissed

### Critical Proximity State (Zone 4)

**Trigger:** Black hole reaches distance < 100 units

**Warning Effects:**

1. **Screen Vignette:**
   - Dark purple vignette closes in from edges
   - Pulsing (2s cycle, synchronized with heartbeat rhythm)
   - Intensity: 50% opacity at peak

2. **Camera Shake:**
   - Constant low rumble (escalates from Zone 3)
   - Frequency: 3Hz
   - Amplitude increases with proximity

3. **Audio Warning:**
   - Ominous drone sound (deep bass)
   - Heartbeat sound layered over (psychological pressure)

4. **Captain Nova Warning:**
   - Urgent tone:
     > "Commander, that debt spiral is reaching critical mass! Neutralize immediately or we'll lose control!"
   - Facial expression: Concerned (if emotion system implemented)

5. **Forced Attention:**
   - NEUTRALIZE button pulses red (impossible to miss)
   - Other UI elements dim (black hole demands focus)

### Impact State (Collision)

**Collision Sequence:**

If black hole reaches camera without neutralization, consequences are severe.

1. **Gravitational Crush:**
   - Screen rapidly shrinks to center point (tunnel vision)
   - All UI elements stretch toward center (spaghettification)
   - Duration: 500ms

2. **Massive Shield Loss:**
   - All shield bars drop by 25-30% (catastrophic)
   - Shield visuals shatter (broken glass effect)
   - Warning klaxons blare (loud, alarming)

3. **Debt Increase:**
   - Principal balance increases (interest compounded)
   - New notification: "DEBT INCREASED: +$127"
   - Credit score alert: "SCORE IMPACT: -15 points"

4. **Captain Nova Reaction:**
   - Shocked expression, stumbles back
   - Speaks:
     > "Impact! We've lost containment on that debt spiral. Financial shields are critical. We need to act NOW, Commander, before this gets worse!"

5. **Recovery:**
   - Screen "snaps back" to normal (elastic effect, 800ms)
   - Black hole continues past camera (behind view)
   - Leaves dark energy trail (particles linger 5s)
   - All UI elements return to position (with wobble)

6. **Persistent Threat:**
   - Black hole doesn't disappear after impact
   - Loops back around (distant orbit)
   - Returns after 60 seconds (continues to threaten)
   - Size increased (grew from impact)

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `three` (^0.182.0) - Custom shaders, particle systems
- `@react-three/fiber` (^9.5.0) - React integration
- `@react-three/postprocessing` (^3.0.4) - Screen effects

**Required Assets:**
- `shaders/gravitational-lensing.glsl` - Lensing shader
- `audio/black-hole-drone.mp3` - Ominous ambient sound
- `audio/heartbeat.mp3` - Tension rhythm
- `audio/klaxon-critical.mp3` - Extreme danger warning

### Gravitational Lensing Implementation

**BlackHole.tsx:**

```typescript
function BlackHole({ position, radius }: { position: Vector3; radius: number }) {
  const eventHorizonRef = useRef<THREE.Mesh>(null);

  // Event horizon (pure black sphere)
  const eventHorizonMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide, // Render inside-out for void effect
    }), []
  );

  // Accretion disk particles
  const AccretionDisk = () => {
    // Similar to Ion Storm particle system
    // but with logarithmic spiral inward
    // See implementation in separate component
  };

  return (
    <group position={position}>
      {/* Event horizon */}
      <mesh ref={eventHorizonRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <primitive object={eventHorizonMaterial} />
      </mesh>

      {/* Accretion disk */}
      <AccretionDisk radius={radius * 1.5} />

      {/* Hawking radiation glow (subtle) */}
      <pointLight
        color="#3b82f6"
        intensity={0.2}
        distance={radius * 3}
      />
    </group>
  );
}
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Event horizon is perfectly black (void effect)
- [ ] Accretion disk spirals smoothly inward
- [ ] Gravitational lensing visible and convincing
- [ ] Space warping feels realistic (stars curve around)
- [ ] Particle trails create sense of motion
- [ ] Implosion sequence is dramatic and satisfying

### ✅ Threat Communication

- [ ] Black hole feels more dangerous than other threats
- [ ] Debt mapping is clear (serious financial problem)
- [ ] Growth over time creates urgency
- [ ] Confirmation modal prevents accidental neutralization
- [ ] Payoff plan is understandable and actionable

### ✅ Interaction Quality

- [ ] Hover cursor pull is subtle but noticeable
- [ ] Neutralization requires deliberate action (not accidental)
- [ ] Analysis scan feels like real computation
- [ ] Implosion timing is satisfying (not too slow/fast)
- [ ] Debt payoff plan integration makes sense

### ✅ Performance

- [ ] Gravitational lensing doesn't cause frame drops
- [ ] 400-600 particles render at 60fps
- [ ] Shader compiles quickly (< 300ms)
- [ ] Black hole grows smoothly (no sudden jumps)

---

## Design Alternatives Considered

### Alternative 1: Simple Dark Sphere (No Lensing)
**Approach:** Just a dark sphere with particles, no space warping
**Pros:** Much simpler, better performance
**Cons:** Doesn't communicate "black hole" concept effectively
**Decision:** ❌ Rejected - lensing is key visual identifier

### Alternative 2: Full Raytraced Black Hole
**Approach:** Physically accurate raytracing (like Interstellar movie)
**Pros:** Stunning visual accuracy
**Cons:** Extremely expensive computation, kills framerate
**Decision:** ❌ Rejected - way over budget for web

### Alternative 3: Shader-Based Lensing (SELECTED)
**Approach:** Approximate lensing with fragment shader distortion
**Pros:** Good visual quality, acceptable performance, achievable
**Cons:** Not physically perfect, but close enough
**Decision:** ✅ **Selected** - best balance for web context

---

## Open Questions

### Resolved
- ✅ Q: Should black hole ever disappear if not neutralized?
  - A: No - it persists and returns (debt doesn't go away on its own)

- ✅ Q: Should users be able to "feed" black hole to make it grow faster?
  - A: No - that's confusing and counter-intuitive

### Unresolved
- ⚠️ Q: Should there be different black hole tiers (small debt vs large)?
  - A: Good idea - vary size based on principal amount

- ⚠️ Q: Should black hole merge with nearby ion storms (debt + overspending)?
  - A: Cool concept, but complex - defer to Phase 2

---

## Implementation Checklist

### Phase 1: Core Visual
- [ ] Create event horizon mesh (black sphere)
- [ ] Implement accretion disk particle system
- [ ] Add logarithmic spiral particle motion
- [ ] Test particle fade at event horizon

### Phase 2: Gravitational Effects
- [ ] Write gravitational lensing shader
- [ ] Apply shader to starfield background
- [ ] Test lensing distortion (adjust parameters)
- [ ] Add particle attraction to nearby objects

### Phase 3: Growth Mechanic
- [ ] Implement size increase over time
- [ ] Scale event horizon + disk proportionally
- [ ] Update lensing radius dynamically
- [ ] Test growth rate (2% per 10s)

### Phase 4: Interaction
- [ ] Create confirmation modal component
- [ ] Implement scanning beam animation
- [ ] Create singularity collapse sequence
- [ ] Add implosion particle burst

### Phase 5: Integration
- [ ] Connect to debt data (principal, interest, payoff time)
- [ ] Create debt payoff plan UI component
- [ ] Integrate with budget reallocation system
- [ ] Add Captain Nova dialogue

### Phase 6: Polish
- [ ] Add sound effects (drone, heartbeat, klaxon)
- [ ] Fine-tune timing values
- [ ] Test impact sequence (screen crush effect)
- [ ] Optimize shader performance

---

## Related Features

- `THREAT-001`: Asteroid Threats (contrast: simple vs complex)
- `THREAT-002`: Ion Storm Threats (different energy aesthetic)
- `THREAT-006`: Threat Detection Engine (spawns black holes from debt data)
- `BACKEND-005`: Debt Analysis API (calculates payoff strategies)
- `UI-005`: Debt Payoff Tracker (new UI component)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.0 | 2026-02-06 | Specification created (not yet implemented) |
| 1.0 | TBD | Full implementation with lensing and neutralization |

---

**Status:** Ready for gravitational lensing shader development and particle system implementation.
