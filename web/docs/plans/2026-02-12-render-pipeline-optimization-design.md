# Render Pipeline Optimization Design

**Date:** 2026-02-12
**Goal:** Eliminate high CPU/GPU usage in the base idle state (no threats, no consoles, no holograms)

**Root cause:** The scene renders at 60 FPS unconditionally via a FrameLimiter that defeats R3F's demand-mode, driving 3+ post-processing passes, 7+ useFrame callbacks, and shader work every frame even when nothing has changed.

---

## Fix 1: Adaptive Frame Limiter

**Problem:** `FrameLimiter` in `Viewport3D.tsx:24-46` calls `invalidate()` 60x/sec via a permanent `requestAnimationFrame` loop, forcing the entire scene graph to render every frame regardless of activity.

**Solution:** Replace with an `AdaptiveFrameLimiter` that reads scene activity and adjusts render rate:

| Scene State               | Target FPS |
|---------------------------|------------|
| Boot (pre-reveal)         | 0 (frozen) |
| Idle (no interaction)     | 15 FPS     |
| Threats present           | 30 FPS     |
| Panel open / hover / boot reveal | 60 FPS |

**Implementation:**
- Single component inside `<Canvas>` subscribing to `useBootStore`, `useThreatStore`, `useConsoleStore` via Zustand selectors
- Derives current "activity tier" and adjusts `requestAnimationFrame` interval
- When tier is `frozen`, never calls `invalidate()`
- Imperative `requestFullFps()` function (via tiny Zustand store or ref) for immediate 60 FPS on hover/click, with auto-decay back to idle tier after ~2s inactivity
- Boot phase `'full-power'` fires a single `invalidate()` to prime the scene before the overlay lifts

**Impact:** ~75% GPU/CPU reduction at idle (15 FPS vs 60), 100% during boot.

**Files:** `Viewport3D.tsx`

---

## Fix 2: Post-Processing Cleanup

**Problem:** `SceneEffects.tsx:37-57` runs Bloom + ChromaticAberration + Vignette (3 full-screen passes) every frame.

**Solution:** Remove ChromaticAberration and Vignette entirely. Keep only Bloom:

```tsx
<EffectComposer multisampling={0}>
  <Bloom
    intensity={1.5}
    luminanceThreshold={0.6}
    luminanceSmoothing={0.9}
    radius={0.6}
    mipmapBlur
    levels={2}
    blendFunction={BlendFunction.ADD}
  />
</EffectComposer>
```

Remove unused props (`chromaticOffset`, `vignetteDarkness`) and `Vector2` import/memo.

**Impact:** -2 full-screen passes per frame.

**Files:** `SceneEffects.tsx`

---

## Fix 3: Boot Freeze

**Problem:** `BootSequence.tsx:29-36` mounts children with `visibility: hidden` during boot. The full Canvas + shaders + particle systems + useFrame callbacks run at 60 FPS behind an invisible overlay for ~5 seconds.

**Solution:** Handled by Fix 1 — when `bootPhase !== 'complete'`, the adaptive limiter's tier is `frozen` and `invalidate()` is never called. When phase transitions to `'full-power'`, a single `invalidate()` primes the scene before the overlay lifts. No structural changes to `BootSequence.tsx` needed.

**Impact:** Zero render cost during ~5s boot sequence.

**Files:** None (handled by adaptive limiter in Fix 1)

---

## Fix 4a: Memoize Threat Filter

**Problem:** `Viewport3D.tsx:52` — `allThreats.filter(t => !t.deflected)` creates a new array reference every render, causing `ThreatsLayer` to re-render on every unrelated store change.

**Solution:** Wrap in `useMemo` keyed on `allThreats`.

**Files:** `Viewport3D.tsx`

---

## Fix 4b: Wormhole Ref Instead of setState in useFrame

**Problem:** `Wormhole.tsx:344-348` — `setArcVersion(v => v + 1)` inside `useFrame` triggers React reconciliation every ~40 frames (~1.5x/sec per wormhole).

**Solution:** Replace `useState` for `arcVersion` with `useRef`. Mutate geometry directly without React involvement. Use `ref.current++` and direct geometry swap on mesh refs instead of React key-based remounting.

**Files:** `Wormhole.tsx`

---

## Fix 4c: Drop Redundant useState in useAuroraColors

**Problem:** `useAuroraColors.ts:64` — The hook already writes CSS variables directly to `documentElement` every second. The `setColors()` useState call is redundant and triggers a React re-render propagating through every consumer.

**Solution:** Remove the `useState`/`setColors` call. Consumers that need current colors can read CSS variables or use a ref.

**Files:** `useAuroraColors.ts`

---

## Expected Combined Impact

| Metric | Before | After |
|--------|--------|-------|
| Idle FPS target | 60 (forced) | 15 (adaptive) |
| Boot render cost | 60 FPS x 5s | 0 FPS x 5s |
| Post-processing passes/frame | 3 | 1 |
| React re-renders/sec (idle) | ~2-3 (aurora + misc) | ~0 |
| useFrame callbacks (idle) | 7+ at 60 FPS | 7+ at 15 FPS |
