# Feature Spec: Seamless Zoom Transition

**Feature ID:** `NAV-001`
**Category:** Navigation & Transitions
**Priority:** P0 (Must-have for MVP)
**Status:** 🔵 Needs Polish
**Current Version:** 0.5 (Basic implementation exists)
**Target Version:** 1.0

---

## Overview

The seamless zoom transition transforms a traditional web page navigation into a cinematic camera movement through 3D space. When the user clicks on the Command Center panel, instead of a page flash, the viewport smoothly zooms forward while the 3D scene dims and side panels slide in — all perfectly synchronized with Next.js routing.

**The Core Magic:** The page transition happens DURING the animation, not after, making it feel like the Command Center was always there in 3D space, just zoomed out.

---

## Visual Specification

### Default State (Bridge View)

**Command Center Panel Location:**
- Position: Bottom-center of viewport
- Size: 480px × 240px
- Z-depth: Foreground (appears in front of starfield)

**Visual Appearance:**
```
┌─────────────────────────────────────┐
│        COMMAND CENTER               │
│ ┌─────────────┬─────────────┐      │
│ │ NET WORTH   │ INCOME      │      │
│ │ $47,832     │ $6,240      │      │
│ │ ▁▂▃▅▆▇█     │ ▁▃▄▅▆       │      │
│ ├─────────────┼─────────────┤      │
│ │ SPENDING    │ SAVINGS     │      │
│ │ $3,891      │ $18.4K      │      │
│ │ ▁▂▁▃▅▇█     │ ▁▂▃▃▄▅▆     │      │
│ └─────────────┴─────────────┘      │
│                                     │
│  ▲  ACCESS FULL SYSTEMS  ▲         │
│  (pulsing aurora glow)              │
└─────────────────────────────────────┘
```

**Styling:**
- Background: `rgba(6, 10, 22, 0.7)` with `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(aurora-primary, 0.4)`
- Aurora particles: Slowly drifting across the panel (20 particles, 0.5 opacity)
- Glow: Subtle `box-shadow: 0 0 30px rgba(aurora-primary, 0.15)`

### Hover State

**Trigger:** Cursor enters panel bounds

**Changes:**
1. **Brightness:** Background opacity increases to `0.85`
2. **Border:** Glow intensifies: `0 0 40px rgba(aurora-primary, 0.3)`
3. **3D Lift:** Panel transforms: `translateZ(10px)` (subtle depth)
4. **Cursor:** Changes to targeting reticle (custom SVG cursor)
5. **Expand Indicator:** Pulses faster (1.5s → 1s)

**Transition Timing:** 200ms `cubic-bezier(0.4, 0, 0.2, 1)`

### Click Trigger → Transition Sequence

#### **Phase 1: Pre-Navigation (0-200ms)**
Happens BEFORE Next.js routing fires

**Visual Effects:**
1. **Click Ripple** (0ms)
   - Aurora-colored ripple emanates from click point
   - Expands to cover entire panel (300ms duration)
   - Opacity: 1 → 0 as it expands

2. **Panel Lock** (50ms)
   - Panel border turns solid aurora color
   - `box-shadow: 0 0 60px rgba(aurora-primary, 0.6)`
   - Scale pulse: `scale(1.02)` for 100ms

3. **Camera Start Dolly** (100ms)
   - Three.js camera begins moving forward
   - From: `z = 10` → To: `z = 5`
   - Duration: 400ms total
   - Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

4. **Next.js Navigation Fired** (200ms)
   - `router.push('/command-center')` executed
   - This happens mid-animation!

#### **Phase 2: Active Transition (200-500ms)**
Next.js is loading the new route, animation continues

**Concurrent Animations:**

1. **Camera Dolly** (continues from Phase 1)
   - Camera reaches `z = 5` at 500ms mark
   - Field of view narrows slightly (75° → 70°)
   - Creates "tunnel vision" effect

2. **Starfield Fade** (200-400ms)
   - Starfield opacity: 100% → 30%
   - Stars slow down their drift speed
   - Aurora colors desaturate slightly
   - Easing: `ease-out`

3. **Side Panels Slide In** (250-500ms)
   - Left panel slides in from `x: -500px` → `x: 0`
   - Right panel slides in from `x: +500px` → `x: 0`
   - Stagger: Right panel starts 50ms after left
   - Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

4. **Content Fade Out** (200-350ms)
   - Bridge-specific UI elements fade out
   - Shield panels, transaction log, etc.
   - Opacity: 100% → 0%
   - Easing: `ease-out`

#### **Phase 3: Route Settling (500-700ms)**
New route is loaded, finalize animation

**Visual Effects:**

1. **Command Center Content Fade In** (500-700ms)
   - New page content opacity: 0% → 100%
   - Stagger child elements (each 50ms apart)
   - Overview tab, metrics, threat list appear
   - Easing: `ease-in`

2. **Captain Nova Repositions** (500-600ms)
   - Hologram shifts position to upper-left corner
   - Scale slightly smaller: `scale(0.85)`
   - Still visible, now in "advisor" position

3. **Final Polish** (600-700ms)
   - Camera settles completely at `z = 5`
   - Starfield stabilizes at 30% opacity
   - Side panels glow to indicate active state
   - Subtle "snap" haptic feedback (if supported)

#### **Phase 4: Idle State (700ms+)**
Animation complete, user has control

**Final State:**
- Camera locked at `z = 5`
- Starfield dim background (30% opacity)
- Side panels fully visible
- Command Center content interactive
- "BACK TO BRIDGE" button visible in top-left
- Captain Nova in advisor position

### Reverse Transition (Command Center → Bridge)

**Trigger:** Click "BACK TO BRIDGE" button

**Animation:**
- All phases run in reverse
- Camera dollies back: `z = 5` → `z = 10`
- Side panels slide out
- Starfield brightens to 100%
- Bridge UI fades back in
- Duration: 600ms (slightly faster)

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `gsap` (^3.14.2) - Timeline coordination
- `next` (16.x) - App Router navigation
- `@react-three/fiber` (^9.5.0) - Camera control
- `zustand` (^5.0.11) - Transition state management

**Required Files:**
- `lib/stores/transition-store.ts` - State management
- `hooks/useSeamlessTransition.ts` - Transition hook
- `components/three/ThreeScene.tsx` - Camera ref access

### State Management

**Zustand Store Structure:**
```typescript
interface TransitionStore {
  isTransitioning: boolean;
  currentRoute: '/bridge' | '/command-center';
  cameraPosition: number; // z-depth
  starfieldOpacity: number;

  // Actions
  startTransition: (to: string) => void;
  completeTransition: () => void;
  updateCameraPosition: (z: number) => void;
}
```

### GSAP Timeline Structure

```typescript
const timeline = gsap.timeline({
  onStart: () => setIsTransitioning(true),
  onComplete: () => setIsTransitioning(false)
});

// Phase 1: Pre-nav
timeline.to(cameraRef.current.position, {
  z: 5,
  duration: 0.4,
  ease: 'power2.out'
}, 0.1);

// Phase 2: Concurrent
timeline.to('.starfield', {
  opacity: 0.3,
  duration: 0.2,
  ease: 'power1.out'
}, 0.2);

timeline.fromTo('.side-panel-left', {
  x: -500
}, {
  x: 0,
  duration: 0.25,
  ease: 'power2.out'
}, 0.25);

// Phase 3: Route change fired at 200ms
timeline.call(() => {
  router.push('/command-center');
}, null, 0.2);
```

### Camera Controller

**Three.js Camera Setup:**
```typescript
// In ThreeScene component
const cameraRef = useRef<THREE.PerspectiveCamera>(null);

useFrame(() => {
  if (cameraRef.current) {
    // Sync camera position with Zustand store
    const targetZ = useTransitionStore.getState().cameraPosition;
    cameraRef.current.position.z = THREE.MathUtils.lerp(
      cameraRef.current.position.z,
      targetZ,
      0.1 // Smooth interpolation
    );
  }
});
```

### Performance Optimization

**Required Optimizations:**
1. **GPU-Accelerated Properties:** Only animate `transform`, `opacity` (avoid layout properties)
2. **will-change:** Add `will-change: transform` to panels during transition
3. **React Concurrent Mode:** Wrap route change in `startTransition()` (React 19)
4. **Debounce:** Prevent double-clicks (disable button during transition)
5. **Preload:** Preload Command Center route on Bridge mount

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] No visible page flash or white screen during transition
- [ ] Animation runs at 60fps throughout (use DevTools Performance)
- [ ] Camera movement feels smooth, not jerky
- [ ] Side panels slide in without layout shift
- [ ] Aurora glow maintains consistent color throughout
- [ ] Starfield dims gradually, not abruptly
- [ ] Content fades feel intentional, not accidental

### ✅ Timing Precision

- [ ] Total transition duration: 700ms ±50ms
- [ ] Route change fires at exactly 200ms mark
- [ ] No "dead time" where nothing is animating
- [ ] Reverse transition completes in 600ms
- [ ] No animation overlap causing visual conflict

### ✅ User Experience

- [ ] Click feels responsive (immediate feedback within 50ms)
- [ ] User cannot break animation by clicking repeatedly
- [ ] Back button works as expected
- [ ] Browser back/forward buttons handled gracefully
- [ ] Transition works on first load (not just subsequent navigations)

### ✅ Edge Cases Handled

- [ ] Works if JavaScript is slow (setTimeout delays)
- [ ] Works if user clicks away mid-transition
- [ ] Works on browser resize during animation
- [ ] Works with keyboard navigation (Enter key)
- [ ] Works with reduced motion preference (instant swap)

### ✅ Code Quality

- [ ] GSAP timeline properly cleaned up (no memory leaks)
- [ ] Camera ref doesn't cause re-render loops
- [ ] State updates don't trigger unnecessary re-renders
- [ ] TypeScript types are strict (no `any`)
- [ ] Console shows no errors or warnings

---

## Design Alternatives Considered

### Alternative 1: Instant Page Swap (Traditional)
**Approach:** Standard Next.js navigation with fade transition
**Pros:** Simple, fast, no complex coordination
**Cons:** Breaks immersion, feels like a website not a 3D space
**Decision:** ❌ Rejected - doesn't achieve "seamless" goal

### Alternative 2: Full 3D Scene Swap
**Approach:** Both routes exist in 3D space, camera flies between them
**Pros:** Maximum spatial coherence, very cinematic
**Cons:** High memory usage (two full scenes loaded), complex state management
**Decision:** ❌ Rejected - over-engineered for web context

### Alternative 3: Overlay Modal Approach
**Approach:** Command Center is a modal overlay, no route change
**Pros:** Simpler state management, no routing complexity
**Cons:** Breaks URL sharing, browser history, accessibility
**Decision:** ❌ Rejected - violates web conventions

### Alternative 4: Hybrid Camera + Route Change (SELECTED)
**Approach:** Coordinate GSAP camera animation with Next.js route change mid-flight
**Pros:** Best of both worlds - feels 3D but respects web platform
**Cons:** Complex timing coordination required
**Decision:** ✅ **Selected** - achieves seamless feel while maintaining web semantics

---

## Open Questions

### Resolved
- ✅ Q: Should transition be interruptible?
  - A: No - once started, let it complete (prevent state corruption)

- ✅ Q: What happens if API data isn't loaded when route renders?
  - A: Show skeleton UI, data streams in via React Query

### Unresolved
- ⚠️ Q: Should we add sound effects (whoosh, beep)?
  - A: Defer to sound design phase

- ⚠️ Q: How to handle transition on slow devices?
  - A: Detect performance, reduce particle count if needed (future)

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `useSeamlessTransition` hook
- [ ] Set up Zustand transition store
- [ ] Add camera ref to ThreeScene
- [ ] Create GSAP timeline coordinator

### Phase 2: Animation
- [ ] Implement camera dolly animation
- [ ] Implement starfield fade
- [ ] Implement side panel slide
- [ ] Implement content fade in/out

### Phase 3: Integration
- [ ] Hook up Next.js router.push() at 200ms
- [ ] Handle browser back/forward
- [ ] Add click ripple effect
- [ ] Add hover states

### Phase 4: Polish
- [ ] Add reduced motion support
- [ ] Optimize performance (will-change, etc.)
- [ ] Add loading states
- [ ] Test edge cases
- [ ] Fix any timing drift

### Phase 5: Testing
- [ ] Manual testing across browsers
- [ ] Performance profiling (60fps check)
- [ ] Accessibility audit
- [ ] Edge case testing

---

## Related Features

- `NAV-002`: Back to Bridge Animation (reverse transition)
- `UI-001`: Command Bridge Main View (source view)
- `UI-002`: Command Center Overview Tab (destination view)
- `NOVA-003`: Captain Nova Reposition (during transition)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.5 | 2026-02-06 | Initial implementation (basic zoom) |
| 1.0 | TBD | Full spec implementation |

---

**Status:** Ready for build guide creation and implementation.
