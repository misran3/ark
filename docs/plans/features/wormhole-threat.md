# Feature Spec: Wormhole Threat

**Feature ID:** `THREAT-005`
**Category:** Threat System
**Priority:** P1 (Important for full experience)
**Status:** 🔴 Not Started
**Current Version:** 0.0
**Target Version:** 1.0

---

## Overview

Wormholes represent **missed opportunities and lost rewards** — financial decisions already made suboptimally that resulted in foregone value. Unlike active threats (asteroids, storms), Wormholes are ethereal portals showing "what could have been" — a haunting visualization of the path not taken.

**The Core Magic:** Shimmering portal with ghostly vision of lost rewards visible through it, creating FOMO-driven urgency to optimize future spending patterns.

---

## Visual Specification

### Core Structure

**Portal Ring:**
- Shape: Torus (donut) rotating in space
- Outer radius: 2.5 units
- Inner radius: 1.5 units (portal opening)
- Material: Shimmering blue energy (#60a5fa)
- Edges: Rippling (like water surface)
- Rotation: Slow tumble on 2 axes (0.1 rad/s)

**Portal Surface:**
- Appearance: Circular disk inside torus
- Material: Semi-transparent, iridescent
- Color: Blue-cyan gradient with aurora shimmer
- Effect: Swirling energy pattern (like soap bubble)
- Depth: Appears to have infinite depth (shader trick)

**Through-Portal Vision:**
- Content: Ghostly visualization of "what you lost"
- Examples:
  - Points counter spinning up ("+450 points")
  - Cash back amount growing ("$15.00")
  - Status level progress bar (Platinum tier)
- Appearance: Translucent, dreamlike, slightly out of focus
- Animation: Floats toward viewer (beckoning)

**Edge Ripples:**
- Particle system around portal rim
- Count: 40-60 particles
- Behavior: Orbit around edge, slight randomness
- Color: Blue-white (#3b82f6 → #ffffff)
- Size: 0.1 units
- Trail: Faint particle trails

### Movement Behavior

**Spawning:**
- Initial position: Random point (radius 800-1000 units)
- Initial rotation: Random tumble
- Initial velocity: Slow drift toward camera
- Speed: 0.4 units/second (slowest threat type)

**Flight Path:**
- Direction: Drifts toward camera, but not aggressively
- Pattern: Slight wobble (figure-8 pattern)
- Rotation: Continuous tumble (all 3 axes)
- Feel: Ethereal, not threatening (more sad than scary)

**Persistence:**
- Wormholes don't "impact" — they linger
- If ignored, they drift past camera slowly
- Remain visible in background (haunting reminder)
- Eventually fade out after 2 minutes

### Hover State

**Trigger:** Cursor within 60px of portal center, wormhole in Zone 3+

**Visual Changes:**

1. **Portal Expands:**
   - Inner radius grows 20% (1.5 → 1.8 units)
   - Edges glow brighter
   - Ripple intensity increases
   - Particles orbit faster

2. **Through-Portal Vision Sharpens:**
   - Lost rewards become more vivid
   - Numbers animate (counting up to show potential)
   - Slight zoom effect (draws eye in)

3. **Info Panel (Blue Theme):**
   ```
   🌀 MISSED REWARDS PORTAL
   Freedom used at restaurants → Lost Sapphire 3x

   WHAT YOU LOST:
   • 450 Chase Ultimate Rewards points
   • Value: $13.50 (travel redemption)
   • Occurred: Jan 8-12 (5 transactions)

   OPPORTUNITY COST: $13.50/week
   ANNUAL IMPACT: ~$702

   CORRECTIVE ACTION:
   Route dining to Sapphire Reserve (3x points)

   [OPTIMIZE ROUTING] [DISMISS]
   ```

4. **Beckoning Effect:**
   - Portal pulses gently (come closer...)
   - Through-portal vision shows rewards accumulating
   - Cursor changes to "interested" icon

### Click Interaction: Correct Optimization

**Phase 1: Portal Analysis (0-500ms)**

1. **Scan Beam:**
   - Blue beam shoots from bottom to portal
   - Beam rotates around portal edge (360° scan)
   - Data particles extracted (transaction history)

2. **Captain Nova Analyzes:**
   - Eyes focused on portal
   - Speech:
     > "Analyzing transaction patterns... I've identified the source of this inefficiency."

**Phase 2: Route Correction (500-1200ms)**

1. **Routing Map Appears:**
   - Visual overlay showing past transactions
   - Lines show: Freedom card (wrong) → Dining category
   - New lines show: Sapphire Reserve (right) → Dining
   - Animation: Red lines replaced by green lines

2. **Optimization Activated:**
   - System creates new routing rule:
     "All DINING → Sapphire Reserve"
   - Rule appears in Command Center
   - Shield panel shows new routing indicator

**Phase 3: Portal Closure (1200-1800ms)**

1. **Wormhole Collapses:**
   - Portal rim contracts inward
   - Swirling energy accelerates
   - Through-portal vision fades
   - Final flash of blue light

2. **Particles Disperse:**
   - Edge particles scatter outward
   - Form brief constellation pattern
   - Particles fade to gold (correction made)

3. **Rewards Reclaimed (Symbolically):**
   - Gold particles flow to Rewards Tracking panel
   - Not actual points (already lost)
   - But shows: "Future rewards secured: +$13.50/week"

**Phase 4: Captain Nova Confirmation (1800-2000ms)**

- Speaks:
  > "Card routing optimized. Your Sapphire Reserve will now handle all dining transactions. Estimated future gain: $702 annually. Can't recover those lost points, but we won't make this mistake again, Commander."

**Phase 5: Cleanup (2000ms+)**

- Wormhole fully removed from scene
- Routing rule persisted to backend
- Future transactions automatically optimized
- Info panel dismissed

### Alternative Interaction: Dismiss

**If user clicks [DISMISS] instead of [OPTIMIZE]:**

1. **Portal Fades:**
   - No dramatic closure
   - Just slowly fades to transparency
   - Particles drift away
   - Quiet acceptance of inefficiency

2. **Nova Comments:**
   - Disappointed but not judgmental:
     > "Understood, Commander. I'll continue monitoring for optimization opportunities."

3. **Wormhole Can Return:**
   - If pattern continues (more missed rewards)
   - New wormhole spawns showing cumulative loss
   - Size increases with missed value

### Critical Proximity State (Zone 4)

**Trigger:** Wormhole reaches distance < 100 units

**Warning Effects:**

1. **Screen Tint:**
   - Subtle blue tint from portal light
   - Not alarming, more wistful/melancholy
   - Pulsing gently (3s cycle)

2. **Audio Cue:**
   - Ethereal whisper sound (not words, just tone)
   - Like distant echoes
   - Very subtle (5% volume)

3. **Captain Nova Reminder:**
   - Gentle tone:
     > "Commander, reviewing that opportunity cost... We're looking at $700 annually in foregone rewards. Might be worth addressing."

4. **Through-Portal Temptation:**
   - Lost rewards animate more dramatically
   - Numbers grow larger (psychological impact)
   - "What could have been" emphasized

### Impact State (Passes Through, No Action)

**If wormhole drifts past camera without optimization:**

1. **Gentle Pass:**
   - No explosion or damage
   - Wormhole gracefully drifts behind camera
   - Leaves faint blue particle trail
   - Sad piano note (sound)

2. **Opportunity Lost (Again):**
   - Inefficiency counter increments
   - "TOTAL MISSED REWARDS YTD: $158.50"
   - Wormhole joins "ghosts" in background

3. **Captain Nova Sighs:**
   - Resigned tone:
     > "Another optimization opportunity has passed us by. Those inefficiencies add up, Commander."

4. **Persistence:**
   - Wormhole doesn't disappear immediately
   - Lingers in background (distance: -200 units)
   - Remains faintly visible (haunting)
   - Eventually fades after 2 minutes

5. **Cumulative Effect:**
   - If 3+ wormholes ignored, they merge
   - Form larger "inefficiency vortex"
   - More dramatic visualization of total loss
   - Harder to ignore

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `three` (^0.182.0) - Torus geometry, custom shaders
- `@react-three/fiber` (^9.5.0) - React integration
- `@react-three/drei` (^10.7.7) - Shaders, effects

**Required Assets:**
- `shaders/portal-swirl.glsl` - Swirling portal surface shader
- `textures/iridescent.jpg` - Soap bubble texture
- `audio/ethereal-whisper.mp3` - Portal ambient sound
- `audio/portal-close.mp3` - Closure sound

### Core Implementation

**Wormhole.tsx:**

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WormholeProps {
  position: THREE.Vector3;
  lostValue: number;
  description: string;
}

export function Wormhole({ position, lostValue, description }: WormholeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);

  // Portal swirl shader
  const portalMaterial = useMemo(() =>
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#60a5fa') },
        color2: { value: new THREE.Color('#3b82f6') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 toCenter = vUv - center;
          float dist = length(toCenter);
          float angle = atan(toCenter.y, toCenter.x);

          // Spiral pattern
          float spiral = angle + dist * 10.0 - time * 0.5;
          float pattern = sin(spiral * 5.0) * 0.5 + 0.5;

          // Gradient
          vec3 color = mix(color1, color2, pattern);

          // Fade at edges
          float alpha = smoothstep(0.5, 0.3, dist);

          gl_FragColor = vec4(color, alpha * 0.6);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    }), []
  );

  // Animate shader + rotation
  useFrame(({ clock }) => {
    if (!groupRef.current || !portalRef.current) return;

    const time = clock.getElapsedTime();

    // Update shader time
    portalMaterial.uniforms.time.value = time;

    // Tumble rotation
    groupRef.current.rotation.x = time * 0.1;
    groupRef.current.rotation.y = time * 0.15;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Torus ring */}
      <mesh>
        <torusGeometry args={[2.5, 0.3, 16, 64]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Portal surface */}
      <mesh ref={portalRef}>
        <circleGeometry args={[1.5, 64]} />
        <primitive object={portalMaterial} />
      </mesh>

      {/* Glow */}
      <pointLight
        color="#60a5fa"
        intensity={1.5}
        distance={8}
      />
    </group>
  );
}
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Portal looks ethereal and mysterious
- [ ] Swirl animation is hypnotic
- [ ] Through-portal vision is dreamlike (not too solid)
- [ ] Edge particles create shimmer effect
- [ ] Tumble rotation feels organic (not mechanical)

### ✅ Interaction Quality

- [ ] Info panel clearly explains missed opportunity
- [ ] Annual impact calculation is eye-opening
- [ ] Optimization action is straightforward
- [ ] Routing correction is confirmed visually
- [ ] Captain Nova explanation makes sense

### ✅ Emotional Tone

- [ ] Wormhole feels wistful, not threatening
- [ ] Lost rewards visualization creates FOMO
- [ ] Ignoring wormhole feels like missed chance (not punishment)
- [ ] Cumulative wormholes emphasize pattern (not isolated mistake)

### ✅ Performance

- [ ] Shader runs at 60fps
- [ ] Multiple wormholes don't cause slowdown (3-4 wormholes)
- [ ] Portal particles properly managed

---

## Design Alternatives Considered

### Alternative 1: Show Past Transactions (Literal)
**Approach:** Display actual transactions inside portal
**Pros:** Very literal, clear what was wrong
**Cons:** Too much detail, cluttered, not magical
**Decision:** ❌ Rejected - breaks immersion

### Alternative 2: Rewards Counter Only
**Approach:** Just show lost dollar amount, no portal
**Pros:** Simple, clear
**Cons:** Not visually interesting, doesn't leverage 3D
**Decision:** ❌ Rejected - not compelling enough

### Alternative 3: Portal to "Better Timeline" (SELECTED)
**Approach:** Portal shows what could have been (ghostly vision)
**Pros:** Emotionally resonant, mysterious, beautiful
**Cons:** Requires good shader work
**Decision:** ✅ **Selected** - best thematic fit

---

## Brainstormed Enhancements

### Visual Enhancements

**1. Parallel Universe Window**
Through the portal, render a miniature "mirror dashboard" — the same metrics panel but with BETTER numbers. More rewards points, higher savings, optimized spending. The alternate timeline where they made the right card choice. Seeing your own dashboard but better is more emotionally resonant than abstract numbers.

**2. Temporal Echo Ghosts**
When a wormhole passes without action, it doesn't fully disappear. It leaves a "ghost" — a faint, semi-transparent portal outline that lingers in the background. Multiple ghosts overlap and accumulate, creating an increasingly visible constellation of missed opportunities. After 5+ ghosts, they begin to pulse together rhythmically. Haunting.

**3. Value Vortex**
Inside the portal, dollar amounts spiral inward like water down a drain. The numbers are your actual lost rewards values, spinning faster and faster toward the center. Hypnotic and slightly uncomfortable to watch — exactly the right emotional response to wasted money.

**4. Opportunity Decay**
The portal slowly shrinks over time (loses 5% radius per minute). If it closes completely before you act, the opportunity is gone for this billing cycle. Creates gentle but real urgency. A closing portal is more motivating than a permanent one.

### Interaction Enhancements

**5. Correction Ripple**
When user optimizes routing through a wormhole, the portal emits a visible ripple wave that spreads through space — "correcting the fabric of spacetime." The ripple passes through nearby threats and UI elements, causing a brief positive shimmer. The correction feels like it's fixing something fundamental.

**6. Wistful Tone (Not Threatening)**
Wormholes should feel fundamentally different from other threats. They're not aggressive — they're SAD. The color palette should be cool blues and silvers. The ambient sound should be ethereal, like distant wind chimes. When they pass without action, a single melancholy piano note plays. The emotional register is regret, not fear.

**7. Accumulation Escalation**
If 3+ wormholes are ignored, they begin to gravitationally attract each other. They merge into a larger "Inefficiency Vortex" — a more dramatic visualization that's harder to ignore. The vortex shows the CUMULATIVE annual loss, which is always a much larger (and more alarming) number than individual instances.

---

## Related Features

- `THREAT-003`: Solar Flare Threats (creates wormholes when missed)
- `FINANCIAL-001`: Credit Card Intelligence (corrects routing)
- `UI-007`: Rewards Tracking Panel (shows reclaimed future value)
- `FINANCIAL-005`: Card Routing Optimization (routing rules)

---

## Implementation Checklist

### Phase 1: Portal Geometry & Shaders
- [ ] Create Wormhole.tsx component with torus and portal surface
- [ ] Implement portal swirl shader (custom fragment/vertex shaders)
- [ ] Add portal rim glow and transparency
- [ ] Test shader performance at 60fps

### Phase 2: Movement & Animation
- [ ] Implement spawn position randomization (800-1000 units radius)
- [ ] Create tumble rotation (0.1 rad/s on X and Y axes)
- [ ] Implement slow drift toward camera (0.4 units/second)
- [ ] Add wobble/figure-8 movement pattern

### Phase 3: Particle Effects
- [ ] Create edge ripple particle system (40-60 particles)
- [ ] Implement particle orbit animation around portal rim
- [ ] Add particle trails and fade-out
- [ ] Set particle size and color (blue-white gradient)

### Phase 4: Through-Portal Vision
- [ ] Implement ghostly reward visualization (numbers, points, bar)
- [ ] Add animation for rewards counting up
- [ ] Create zoom effect that appears on hover
- [ ] Make vision semi-transparent and dreamlike

### Phase 5: Hover & Info Panel
- [ ] Detect proximity hover (60px threshold)
- [ ] Implement portal expansion on hover (20% inner radius growth)
- [ ] Create blue-themed info panel
- [ ] Show lost rewards breakdown and annual impact

### Phase 6: Interaction & Optimization
- [ ] Implement "Optimize Routing" action with beam scan animation
- [ ] Create routing map visualization (red lines → green lines)
- [ ] Build routing rule creation in backend
- [ ] Implement portal closure animation and particle dispersion

### Phase 7: State Transitions & Feedback
- [ ] Implement dismiss action with fade-out
- [ ] Add Captain Nova dialogue for optimization/dismiss/missed opportunity
- [ ] Create critical proximity state (Zone 4) with screen tint and audio
- [ ] Implement persistence (lingering after drift-by) and fade-out timing

### Phase 8: Cumulative Mechanics
- [ ] Track missed rewards over time
- [ ] Implement wormhole merging (3+ become "Inefficiency Vortex")
- [ ] Add larger vortex visualization
- [ ] Create cumulative opportunity cost display

### Phase 9: Audio & Polish
- [ ] Add ethereal whisper ambient sound (portal present)
- [ ] Add portal close sound effect
- [ ] Add sad piano note (opportunity lost)
- [ ] Implement screen tint pulsing on critical proximity

### Phase 10: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark wormhole-threat as complete`

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
| 0.0 | 2026-02-06 | Specification created |
| 1.0 | TBD | Full implementation with portal shader |

---

**Status:** Ready for portal shader development and optimization mechanics.
