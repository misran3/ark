# Hologram Usability Overhaul

## Goal

Improve the net worth hologram's usability across four dimensions: discoverability, navigation flow, information density, and visual readability.

## Design Decisions

- **Approach:** Camera-follow navigation with keyboard support
- **Panel style:** 3D billboard (stays in scene, always faces camera)
- **Orrery rotation:** Remove group-level spin; keep individual planet self-rotation
- **Transition speed:** ~400ms (snappy)
- **Discoverability:** "Select a planet to begin" prompt + pointer cursor on hover (no idle glow pulses)

---

## 1. Stationary Orrery

**Remove group rotation:**
- Delete the `rotation-y = elapsed * (2π/60)` on the orrery group in `AssetNavigation.tsx`
- Planets stay at their fixed orbital angles at all times

**Keep planet self-spin:**
- Individual planet rotation on their own axis remains (`y += 0.01`, `x += 0.003` per frame)
- This gives visual life without moving planets away from their positions

## 2. Billboard Labels

**Always face camera:**
- Wrap planet name + value labels in drei `<Billboard>` component
- Labels rotate to face camera regardless of camera position

**Improved contrast:**
- Increase font size slightly for readability
- Add subtle dark outline/backdrop behind label text
- Ensure labels remain crisp against bright scene elements

## 3. Camera-Follow on Selection

**On planet selection (click or keyboard):**
- Camera smoothly animates to frame the selected planet and its detail panel
- Target position: offset from planet so both planet and panel are visible
- Animation: ~400ms with ease-out easing
- Orrery tilt stays fixed; only camera moves

**On deselection (click away / ESC):**
- Camera smoothly returns to default overview position
- Same ~400ms animation

**Constraints:**
- Camera stays within reasonable bounds
- Transition is interruptible — selecting a different planet mid-transition redirects camera to new target

## 4. Keyboard Navigation

**Arrow key cycling:**
- Left/Right arrows cycle through assets in orbital order
- Order: Home → Investments → Emergency Fund → SUV → Sedan → Crypto → (wrap)
- Selection triggers camera-follow animation

**Enter / Space:**
- Opens detail panel for focused planet
- If panel is open, toggles deep scan

**Escape (layered):**
- Deep scan open → collapse deep scan
- Detail panel open → close panel
- Nothing open → deselect planet, camera returns to overview

**Visual focus indicator:**
- Selected planet gets a bright pulsing ring (additive glow)
- Unselected planets dim slightly (~60% opacity) to create contrast
- Works for both keyboard and mouse selection

## 5. Discoverability

**"Select a planet to begin" prompt:**
- Shown when hologram opens and no planet is selected
- Billboard text centered in the orrery view
- Disappears when any planet is selected

**Cursor feedback:**
- Pointer cursor on planet hover via R3F `onPointerOver`
- Existing hover scale (1.0 → 1.15) remains

## 6. Enhanced Detail Panel

**Positioning:**
- Panel positioned relative to selected planet (offset right + up), not at fixed world coords
- Example: `planet.position + [2.0, 1.0, 0]`
- Wrapped in `<Billboard>` to always face camera
- Scales to stay readable regardless of camera distance

**Quick glance (default view):**
- Asset name: larger, bold, at top
- Current value: prominent, large number
- Trend: color-coded arrow (green up / red down) + percentage
- Net worth share: percentage below value
- Status badge: NOMINAL/CAUTION/CRITICAL with color dot

**Deep scan (expanded view):**
- Type-specific rows with clearer labels and formatting
- Numbers right-aligned for scannability
- Currency values formatted consistently ($XXX,XXX)
- Subtle divider lines between data sections
- Text decode animation preserved (cinematic character-scramble effect)

---

## Files to Modify

| File | Changes |
|------|---------|
| `components/bridge/hologram/panels/AssetNavigation.tsx` | Remove group rotation, add keyboard listener, add "select a planet" prompt, manage camera target state |
| `components/bridge/hologram/panels/orrery/AssetPlanet.tsx` | Add `<Billboard>` wrapper for labels, add pointer cursor, add selection glow ring, add dimming for unselected |
| `components/bridge/hologram/HologramDetailPanel.tsx` | Billboard wrapper, relative positioning, improved data hierarchy, better formatting |
| `components/bridge/hologram/HologramOverlay.tsx` | Camera animation logic (smooth lerp to target on selection) |
| `lib/stores/asset-store.ts` | Add asset ordering array for keyboard navigation cycling |

## New Components

| Component | Purpose |
|-----------|---------|
| `SelectionGlow.tsx` | Pulsing additive glow ring rendered around selected planet |
| `useCameraFollow.ts` | Hook managing camera target position + smooth lerp animation |
