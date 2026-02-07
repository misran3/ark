# Feature Spec: Cold Boot Sequence

**Feature ID:** `OPENING-001`
**Category:** Opening Experience
**Priority:** P0 (Must-have for MVP)
**Status:** 🟢 Complete
**Current Version:** 2.0
**Target Version:** 2.0

---

## Implementation Note (v2.0)

This feature was redesigned and implemented as a simplified 4.6-second sequence. See `docs/plans/2026-02-07-boot-sequence-redesign.md` for the v2.0 design specification.

**Key Changes from Original Spec:**
- Removed Captain Nova materialization from boot (moved to post-boot)
- Simplified to 7 phases (vs original 14-second timeline)
- Console-sourced lighting replaces complex particle systems
- Start screen added for first-time visitors
- localStorage-based skip for return visitors

---

## Overview

The Cold Boot Sequence is the **first 14 seconds** of the application — the critical window that creates the "Whoa, this is beautiful" moment. It's a carefully choreographed introduction that transitions from black screen to fully operational bridge, establishing the sci-fi aesthetic and immersing the user in the spaceship metaphor.

**The Core Magic:** Feels like booting up a starship's operating system, with each element powering on in sequence, culminating in Captain Nova's first words.

---

## Timeline Specification

### 0-2s: System Initialization

**Visual:**

```
Black screen
↓
Faint aurora shimmer starts forming (purple → teal)
↓
Text appears center screen:

     S Y N E S T H E S I A P A Y
   BRIDGE SYSTEMS INITIALIZING...

   [████████████████░░░░] 75%
```

**Details:**
- **Background:** Pure black (#000000)
- **Aurora shimmer:** Very faint gradient (opacity 0.1 → 0.3)
- **Text:**
  - Font: Orbitron, weight 700
  - Size: 48px
  - Color: Aurora primary (animated)
  - Letter spacing: 0.2em (wide tracking)
  - Glitch effect: Slight horizontal offset every 0.5s
- **Progress bar:**
  - Width: 400px
  - Height: 8px
  - Fill: Aurora gradient (left to right)
  - Animation: 0% → 100% over 2 seconds
  - Particles flow along bar (10-15 particles)
- **Audio:**
  - Low hum begins (40Hz bass tone)
  - Builds in volume (0% → 30%)

**Animation:**
```typescript
// Text glitch effect
function glitchText() {
  setInterval(() => {
    text.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
    setTimeout(() => {
      text.style.transform = 'translateX(0)';
    }, 50);
  }, 500);
}
```

---

### 2-4s: Viewport Reveal

**Visual:**

```
Progress bar completes → Flash of light
↓
Screen "opens" like eyelids
↓
Deep space revealed:
  - Starfield fades in (5,000 stars)
  - Nebula clouds in deep background
  - Aurora colors shimmer through stars
```

**Details:**

1. **Flash:** (2000ms mark)
   - Full screen white flash (100ms)
   - Additive blend
   - Fades to reveal starfield behind

2. **Eyelid Open:** (2100-2600ms)
   - Top half of screen slides up: `translateY(-100vh)`
   - Bottom half slides down: `translateY(100vh)`
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
   - Duration: 500ms
   - Reveals starfield underneath

3. **Starfield Fade In:** (2600-3200ms)
   - Stars appear gradually (opacity 0 → 1)
   - Depth layers fade in sequence:
     - Far stars (Z: -10000): 2600ms
     - Mid stars (Z: -5000): 2800ms
     - Near stars (Z: -1000): 3000ms
   - Creates parallax depth sense

4. **Star Twinkle Activation:** (3200ms)
   - Stars begin twinkling with aurora colors
   - Random flicker (not all at once)
   - Subtle scale pulse (0.8 → 1.2)

**Audio:**
- Whoosh sound on eyelid open (2100ms)
- Ambient space hum fades in (2600ms)
- Very quiet, atmospheric

---

### 4-7s: Bridge Frame Materialization

**Visual:**

```
HUD elements materialize around viewport:

┌──  ──  ──┐           Corner brackets fade in
│           │           (all four corners)
│  VIEWPORT │
│           │           Side beams slide in
└──  ──  ──┘           from edges

Top status bar slides down
Bottom console slides up
```

**Details:**

1. **Corner Brackets:** (4000-4400ms)
   - Four L-shaped brackets (one per corner)
   - Each: 80px × 80px
   - Material: Aurora gradient, pulsing glow
   - Animation: Fade in + scale (0.9 → 1.0)
   - Stagger: Top-left (0ms), top-right (+100ms), bottom-left (+200ms), bottom-right (+300ms)

2. **Side Beams:** (4400-4800ms)
   - Left beam: Slides from left edge (-40px → 0)
   - Right beam: Slides from right edge (+40px → 0)
   - Material: Dark metallic with aurora accent line
   - Glow: Pulsing aurora light along inner edge

3. **Top Status Bar:** (4800-5100ms)
   - Slides down from top (-60px → 0)
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
   - Content fades in after slide completes
   - Stardate clock begins ticking

4. **Bottom Console:** (5100-5400ms)
   - Slides up from bottom (+280px → 0)
   - Same easing as top bar
   - Shield panels, command center, quick actions visible

**Audio:**
- Mechanical slide sound for beams (4400ms)
- Soft beep when bars lock in place (5400ms)
- HUD activation hum (electronic buzz)

---

### 7-10s: Captain Nova Materialization

**Visual:**

```
Bottom-left of viewport:
↓
Holographic projection cone appears
↓
Particles swirl upward
↓
Particles coalesce into Nova's form
↓
Details resolve (face, uniform, pose)
↓
Hologram stabilizes
```

**Details:**

1. **Projection Cone:** (7000-7300ms)
   - Cone of light projects upward from bottom-left
   - Height: 3 units (Three.js space)
   - Material: Aurora gradient, semi-transparent
   - Inside: Swirling particles (200 particles)
   - Rotation: Slow spin (0.1 rad/s)

2. **Particle Swirl:** (7300-8500ms)
   - Thousands of tiny particles flow upward in cone
   - Particles accelerate as they rise
   - Orbital motion (helical path)
   - Color: Aurora gradient
   - Additive blending (particles glow)

3. **Form Coalescence:** (8500-9500ms)
   - Particles begin sticking together
   - Silhouette emerges (Nova's shape)
   - Details progressively resolve:
     - 8500ms: Rough human form
     - 9000ms: Uniform details
     - 9500ms: Facial features clear
   - Opacity increases: 0.3 → 0.8

4. **Hologram Shader Activation:** (9500-10000ms)
   - Scanline effect begins
   - Chromatic aberration on edges
   - Fresnel glow activates
   - Breathing animation starts
   - Eyes glow (aurora teal), make eye contact

**Animation (Three.js):**
```typescript
// Particle coalescence
useFrame(({ clock }) => {
  const t = (clock.elapsedTime - 7.3) / 2.2; // 0-1 over 2.2s

  particles.forEach((particle, i) => {
    const targetPos = novaVertices[i % novaVertices.length];
    particle.position.lerp(targetPos, t * 0.5);
  });

  if (t >= 1.0) {
    // Switch to hologram mesh
    showHologramMesh();
    hideParticles();
  }
});
```

**Audio:**
- Particle swirl sound (wind chime-like)
- Materialization hum (pitch rises)
- Stabilization beep (lock-in sound at 10000ms)

---

### 10-14s: First Contact

**Visual:**

```
Nova's eyes glow brighter
↓
Mouth begins moving (lip sync)
↓
Speech bubble appears beside her
↓
Text types in sync with voice
```

**Details:**

1. **Eye Glow:** (10000ms)
   - Eyes intensity: 0.5 → 2.0
   - Brief flare effect
   - Makes direct eye contact with camera
   - Slight head tilt (curiosity)

2. **Speech Bubble Appearance:** (10300ms)
   - Glassmorphism panel fades in next to Nova
   - Size: 300px × 150px
   - Position: To her right, speech bubble tail pointing to her
   - Fade in: 200ms

3. **Voice Synthesis Begins:** (10500ms)
   - Text-to-speech starts speaking
   - Message:
     > "Commander, welcome aboard. I'm Captain Nova, your AI financial officer. I've completed a full systems scan across your accounts..."

4. **Typewriter Text:** (10500-13500ms)
   - Text appears character by character
   - Speed: 50ms per character (synced with speech)
   - Current word highlights as spoken
   - Cursor blinks at end of typing

5. **Tools Used Pills:** (13500-14000ms)
   - Appear below speech bubble
   - Three pills fade in:
     ```
     [financial_snapshot] [threat_scanner] [budget_analyzer]
     ```
   - Aurora colored, glassmorphism style

**Audio:**
- Nova's voice (see text-to-speech.md)
- Soft typing sound (very subtle, 10% volume)
- Completion chime (14000ms)

---

### 14s+: Bridge Operational

**Visual:**

All animations settle, user has full control:

- Starfield drifts slowly (idle state)
- Aurora colors pulse subtly
- Nova in idle breathing animation
- All UI elements interactive
- Threats begin spawning (if any exist)

**Transition to Control:**
- No abrupt stop — animations fade to idle states
- User can interact at any point during sequence
- If user clicks during boot, sequence completes faster (skip ahead)

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `gsap` (^3.14.2) - Timeline coordination
- `framer-motion` (^12.33.0) - UI element animations
- `three` (^0.182.0) - Particle system, Nova materialization

**Required Assets:**
- `audio/boot-hum.mp3` - System power-on sound
- `audio/whoosh.mp3` - Eyelid open sound
- `audio/hud-slide.mp3` - Panel slide sound
- `audio/particle-swirl.mp3` - Nova materialization
- `audio/lock-beep.mp3` - Completion sounds

### Animation Timeline (GSAP)

**ColdBootSequence.tsx:**

```typescript
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function ColdBootSequence({ onComplete }: { onComplete: () => void }) {
  const timelineRef = useRef<gsap.core.Timeline>();

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      }
    });

    // Phase 1: System Init (0-2s)
    tl.to('.boot-text', {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.in'
    }, 0);

    tl.to('.progress-bar-fill', {
      width: '100%',
      duration: 2,
      ease: 'power1.inOut'
    }, 0);

    // Phase 2: Viewport Reveal (2-4s)
    tl.to('.flash', {
      opacity: 1,
      duration: 0.1
    }, 2);

    tl.to('.flash', {
      opacity: 0,
      duration: 0.1
    }, 2.1);

    tl.to('.eyelid-top', {
      y: '-100vh',
      duration: 0.5,
      ease: 'power2.inOut'
    }, 2.1);

    tl.to('.eyelid-bottom', {
      y: '100vh',
      duration: 0.5,
      ease: 'power2.inOut'
    }, 2.1);

    tl.to('.starfield', {
      opacity: 1,
      duration: 0.6,
      ease: 'power1.in'
    }, 2.6);

    // Phase 3: Bridge Frame (4-7s)
    tl.to('.corner-bracket', {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      stagger: 0.1
    }, 4);

    tl.to(['.top-bar', '.bottom-console'], {
      y: 0,
      duration: 0.3,
      stagger: 0.3,
      ease: 'power2.out'
    }, 4.8);

    // Phase 4: Nova spawn handled by Three.js

    // Phase 5: First speech
    tl.call(() => {
      // Trigger Nova speech
      nova.speak("Commander, welcome aboard...");
    }, null, 10.5);

    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="cold-boot-overlay">
      {/* Boot screen elements */}
      <div className="boot-text">
        SYNESTHESIAPAY
        <br />
        BRIDGE SYSTEMS INITIALIZING...
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" />
      </div>

      {/* Eyelids */}
      <div className="eyelid-top" />
      <div className="eyelid-bottom" />

      {/* Flash */}
      <div className="flash" />

      {/* Corner brackets */}
      <div className="corner-bracket tl" />
      <div className="corner-bracket tr" />
      <div className="corner-bracket bl" />
      <div className="corner-bracket br" />
    </div>
  );
}
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Progression feels deliberate (not rushed or slow)
- [ ] Each phase is distinct (clear transitions)
- [ ] Aurora colors are vibrant throughout
- [ ] Nova materialization is magical (not clunky)
- [ ] All text is readable (even with glitch effect)

### ✅ Animation Quality

- [ ] 60fps maintained throughout sequence
- [ ] No sudden pops or jumps (smooth transitions)
- [ ] Timing feels cinematic (14s feels right)
- [ ] GSAP timeline synchronizes perfectly
- [ ] Particle system is smooth (no lag)

### ✅ Audio Quality

- [ ] Sounds are balanced (not too loud)
- [ ] Audio syncs with visuals (no drift)
- [ ] Voice synthesis starts on time
- [ ] Background music doesn't overpower speech

### ✅ User Control

- [ ] User can skip by clicking (fast-forward to end)
- [ ] Skip doesn't break anything (clean state)
- [ ] First-time users see full sequence
- [ ] Returning users can skip (setting persisted)

---

## Design Alternatives Considered

### Alternative 1: Instant Load (No Sequence)
**Approach:** Show bridge immediately, no intro
**Pros:** Fastest time to interactive
**Cons:** Misses opportunity to impress, feels generic
**Decision:** ❌ Rejected - not memorable

### Alternative 2: Video Intro
**Approach:** Play pre-rendered video of boot sequence
**Pros:** Perfect quality, easy to implement
**Cons:** Not interactive, large file size, can't skip smoothly
**Decision:** ❌ Rejected - lacks interactivity

### Alternative 3: Choreographed Animation Sequence (SELECTED)
**Approach:** GSAP + Three.js synchronized timeline
**Pros:** Interactive, impressive, sets tone, optimized
**Cons:** Complex coordination required
**Decision:** ✅ **Selected** - best first impression

---

## Related Features

- `NOVA-001`: Captain Nova Hologram (materialization)
- `NOVA-002`: Text-to-Speech (first words)
- `UI-001`: Command Bridge Main View (revealed by sequence)
- Aurora Color System (used throughout boot sequence)

---

## Implementation Checklist

### Phase 1: UI Layout & Text Animation
- [ ] Build boot screen layout (centered text, progress bar)
- [ ] Implement glitch effect on "SYNESTHESIAPAY" text
- [ ] Animate progress bar (0-100% over 2s)
- [ ] Add particle flow along progress bar

### Phase 2: Viewport & Starfield
- [ ] Create eyelid divs (top/bottom)
- [ ] Implement eyelid open animation (2s-2.6s)
- [ ] Build starfield background (5000 stars)
- [ ] Implement depth-based fade-in (parallax layers)
- [ ] Add star twinkling with aurora color pulse

### Phase 3: Bridge Frame Materialization
- [ ] Create corner bracket components
- [ ] Implement bracket fade-in + scale animation (4s-4.4s)
- [ ] Build side beam elements with glow
- [ ] Implement top status bar slide down (4.8s-5.1s)
- [ ] Implement bottom console slide up (5.1s-5.4s)

### Phase 4: Captain Nova Materialization
- [ ] Create projection cone Three.js component
- [ ] Implement particle swirl system (7s-8.5s)
- [ ] Implement form coalescence (8.5s-9.5s)
- [ ] Activate hologram shader effects (9.5s-10s)
- [ ] Sync with Three.js nova model

### Phase 5: First Contact Speech
- [ ] Create speech bubble component (glassmorphism)
- [ ] Integrate text-to-speech engine
- [ ] Implement typewriter text animation
- [ ] Sync text with voice playback
- [ ] Add tools used pills (13.5s-14s)

### Phase 6: Timeline Integration & Audio
- [ ] Build GSAP master timeline (coordinating all phases)
- [ ] Add audio assets (hum, whoosh, slide, particle-swirl, lock-beep)
- [ ] Sync audio with visual timeline
- [ ] Implement skip functionality (user can bypass sequence)

### Phase 7: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark cold-boot-sequence as complete`

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
| 1.0 | TBD | Full implementation with animation timeline |
| 2.0 | 2026-02-07 | Redesigned with simplified 4.6s console-lighting sequence, Start screen, localStorage skip |

---

**Status:** Complete (v2.0). Original 14-second spec preserved above for reference.
