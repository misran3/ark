# TTS Improvements Design

**Date:** 2026-02-11
**Status:** Approved

## Problems

1. **Message restarts** — Same message gets cancelled and restarted mid-speech due to unstable callback identities in `useVoiceSynthesis`
2. **Hover spam** — Rapidly hovering between threats causes stuttering cancel→speak→cancel cycles
3. **Dialogue box resizing** — Typewriter effect grows box progressively; acknowledge button appearing causes layout shift

## Changes

### 1. Stabilize `useVoiceSynthesis` callbacks

**File:** `hooks/useVoiceSynthesis.ts`

The `speak` and `cancel` functions are recreated when `voices` state changes (via `voiceschanged` event). Since `NovaDialogueOverlay` uses these as effect dependencies, voice loading triggers effect re-fire → cancel → restart.

**Fix:** Use a ref-based stable wrapper pattern:
- Keep internal `speakImpl` as the real implementation (can depend on `voices`, `processQueue`, etc.)
- Expose a stable `speak` function via `useCallback(() => speakImplRef.current(...args), [])` that never changes identity
- Same pattern for `cancel`

### 2. Debounce hover speech + clear queue on threat speak

**File:** `hooks/useNovaHoverSpeech.ts`

Add 150ms debounce before calling `speakForThreat`. Cancel pending debounce on hover change.

**File:** `lib/stores/nova-dialogue-store.ts`

`speakForThreat` should clear the queue when setting a new threat message. Currently it leaves stale entries that replay when `dismiss()` is called.

### 3. Fixed-size dialogue box

**File:** `components/bridge/hud/NovaDialogueOverlay.tsx`

- Render full message text with `visibility: hidden` to pre-size the container
- Overlay typewriter text with `position: absolute inset-0`
- Always render acknowledge button but with `opacity: 0` / `pointer-events: none` until typewriter completes, then transition to visible

## Files Modified

1. `hooks/useVoiceSynthesis.ts` — Stable callback refs
2. `hooks/useNovaHoverSpeech.ts` — 150ms debounce
3. `lib/stores/nova-dialogue-store.ts` — Clear queue in `speakForThreat`
4. `components/bridge/hud/NovaDialogueOverlay.tsx` — Fixed-size layout
