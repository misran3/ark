# Start Screen Glitch & CRT Shutdown Redesign

## Problem

The current start screen has a static "ARK" title with text-shadow glow that looks confined inside a rectangle. The exit transition is a plain opacity fade. It lacks personality and cinematic energy.

## Design

### Radial Bloom Glow

Replace text-shadow-only glow with a large radial gradient pseudo-element behind the text:

- ~600px radius soft radial gradient, `rgba(0, 240, 255, ...)`
- Breathing animation: opacity oscillates 0.3-0.5 over 4s
- Eliminates rectangular confinement by being explicitly circular and oversized
- Text still keeps a subtle text-shadow for letter-level definition

### Idle Glitch System

A randomized interval (3-6s between bursts) triggers glitch events lasting 150-400ms. Each burst randomly selects 1-2 effects:

1. **Chromatic split** — Red/blue text copies offset horizontally by +/-2-4px, snap back when burst ends
2. **Positional jitter** — Title container gets random `translate(Xpx, Ypx)` updates every ~50ms
3. **Slice corruption** — `clip-path: inset(...)` on a duplicate layer shifts a horizontal band by 5-15px

Between bursts, the title is clean with only the radial bloom breathing.

### Exit Sequence (3 phases, ~1.2-1.4s total)

**Phase 1 — Glitch Storm (0-600ms):**
- Button fades out immediately
- All three glitch effects fire simultaneously at max intensity:
  - Chromatic split: +/-8-12px, rapid cycling
  - Jitter: +/-5px at 30ms intervals
  - Slice corruption: multiple bands, +/-20px shifts
- Radial bloom flickers randomly (opacity 0.1-0.8 at 50ms)

**Phase 2 — CRT Collapse (600-900ms):**
- All glitch effects freeze
- Entire screen collapses vertically: `scaleY` from 1 to ~0.005
- Brightness increases to 3x as content compresses (phosphor concentration)
- Collapse centered at vertical midpoint

**Phase 3 — Line Fade + Blackout (900-1200ms):**
- Bright horizontal line holds ~100ms
- Line fades to black (opacity 0)
- Hold pure black ~200ms before calling `onStart()`

## Implementation

### Phase Machine

Expand `ScreenPhase` type:

```typescript
type ScreenPhase = 'waiting' | 'ready' | 'glitch-storm' | 'crt-collapse' | 'blackout' | 'done';
```

### Glitch Engine

Inline glitch state in `StartScreen.tsx`:

- `useEffect` with randomized `setTimeout` for idle bursts
- On `'glitch-storm'` phase, switches to max intensity for 600ms
- Returns: `{ chromaOffset, jitterX, jitterY, sliceBands, bloomOpacity }`

### DOM Structure

```
<div> (root container, handles CRT collapse via scaleY + brightness)
  <div> (radial bloom - positioned behind text, radial gradient bg)
  <div> (title wrapper, receives jitter transform)
    <span> (red chromatic copy, absolute positioned)
    <h1>ARK</h1> (main text)
    <span> (blue chromatic copy, absolute positioned)
    <div> (slice corruption overlay, clip-path animated)
  <button> Initialize Bridge </button>
</div>
```

### Files Changed

- `components/bridge/boot/StartScreen.tsx` — all logic and DOM changes
- `app/globals.css` — add `@keyframes crt-collapse` and `@keyframes glitch-flicker`

### No New Files

Everything stays in existing files. No new components or hooks extracted.

## Tasks

1. Add radial bloom glow behind ARK title (replace rectangular text-shadow with circular gradient)
2. Build idle glitch system (chromatic split, jitter, slice corruption on random interval)
3. Implement 3-phase exit sequence (glitch storm -> CRT collapse -> blackout)
4. Add supporting CSS keyframes to globals.css
