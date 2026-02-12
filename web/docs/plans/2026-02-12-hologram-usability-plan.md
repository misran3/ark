# Hologram Usability Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the net worth hologram more usable by adding camera-follow navigation, billboard labels, keyboard controls, a discoverability prompt, and enhanced detail panel positioning.

**Architecture:** The hologram orrery (`AssetNavigation.tsx`) becomes stationary (no group rotation). A new `useCameraFollow` hook manages smooth camera lerp to selected planets. `AssetPlanet` gains billboard labels, selection glow, dimming, and cursor feedback. Keyboard events in `AssetNavigation` drive asset cycling. The detail panel positions relative to the selected planet instead of at a fixed world coord.

**Tech Stack:** React Three Fiber 9, drei 10 (`<Billboard>`, `<Text>`), Three.js 0.182, Zustand, GSAP (not needed — using `useFrame` lerp)

**Design doc:** `docs/plans/2026-02-12-hologram-usability-design.md`

---

### Task 1: Remove Group-Level Orrery Rotation

**Files:**
- Modify: `components/bridge/hologram/panels/AssetNavigation.tsx:29,76-79`

**Step 1: Remove the `GROUP_ROTATION_SPEED` constant and `useFrame` that rotates the group**

In `AssetNavigation.tsx`, delete the constant on line 29:
```tsx
const GROUP_ROTATION_SPEED = (2 * Math.PI) / 60; // 1 revolution per 60 seconds
```

Delete the `useFrame` block (lines 76-80):
```tsx
// DELETE THIS ENTIRE BLOCK:
useFrame(({ clock }) => {
  if (orreryGroupRef.current) {
    orreryGroupRef.current.rotation.y = clock.getElapsedTime() * GROUP_ROTATION_SPEED;
  }
});
```

Also remove the `orreryGroupRef` since nothing uses it anymore. Remove:
- Line 43: `const orreryGroupRef = useRef<Group>(null);`
- Line 87: `ref={orreryGroupRef}` from `<group ref={orreryGroupRef} rotation-x={ORRERY_TILT}>`

Clean up unused imports: remove `Group` from the `three` import if no longer used (check if it's used elsewhere first — it's imported but may only be used for the ref type). Remove `useFrame` from `@react-three/fiber` import.

**Step 2: Verify**

Run: `bun dev`
Open the hologram (click net worth console button). Confirm:
- The orrery no longer slowly rotates as a group
- Individual planets still spin on their own axes (this rotation is in `AssetPlanet.tsx`, untouched)
- Everything else still works (reveal animation, planet clicks, detail panel)

**Step 3: Commit**

```bash
git add components/bridge/hologram/panels/AssetNavigation.tsx
git commit -m "fix: remove group-level orrery rotation (keep planet self-spin)"
```

---

### Task 2: Add Asset Navigation Order to Store

**Files:**
- Modify: `lib/stores/asset-store.ts:116,287`

**Step 1: Add ASSET_NAV_ORDER constant**

After the `DEFAULT_ASSETS` array (after line 253), add:

```tsx
/** Ordered asset IDs for keyboard navigation cycling */
export const ASSET_NAV_ORDER = DEFAULT_ASSETS.map((a) => a.id);
// Result: ['home', 'investments', 'emergency-fund', 'suv', 'sedan', 'crypto']
```

This derives order from the array definition order, which already matches the orbital progression: ring 1 → ring 2 → ring 3 (×3) → ring 4.

**Step 2: Verify**

No visual change. Just confirm the app still builds:
```bash
cd web && bun run build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add lib/stores/asset-store.ts
git commit -m "feat: add ASSET_NAV_ORDER for keyboard navigation cycling"
```

---

### Task 3: Billboard Labels on AssetPlanet

**Files:**
- Modify: `components/bridge/hologram/panels/orrery/AssetPlanet.tsx:1-5,214-238`

**Step 1: Import Billboard from drei**

Change the drei import (line 5) from:
```tsx
import { Text } from '@react-three/drei';
```
to:
```tsx
import { Text, Billboard } from '@react-three/drei';
```

**Step 2: Wrap labels in Billboard**

Replace the two `<Text>` label blocks (lines 214-238) with Billboard-wrapped versions:

```tsx
{/* Labels — billboard to always face camera */}
<Billboard follow lockX={false} lockY={false} lockZ={false}>
  <Text
    fontSize={0.14}
    letterSpacing={0.15}
    color={color}
    anchorX="center"
    anchorY="bottom"
    fillOpacity={hovered ? 0.9 : 0.7}
    outlineWidth="6%"
    outlineColor="#000000"
    outlineOpacity={0.5}
    position={[0, size + 0.25, 0]}
  >
    {formatDollars(value)}
  </Text>
  <Text
    fontSize={0.08}
    letterSpacing={0.2}
    color={color}
    anchorX="center"
    anchorY="bottom"
    fillOpacity={hovered ? 0.7 : 0.5}
    outlineWidth="6%"
    outlineColor="#000000"
    outlineOpacity={0.4}
    position={[0, size + 0.08, 0]}
  >
    {name}
  </Text>
</Billboard>
```

Key changes vs. old labels:
- Wrapped in `<Billboard>` so labels always face camera regardless of planet position/orrery tilt
- Slightly larger font (0.12→0.14 for value, 0.07→0.08 for name)
- Dark outline (`#000000`) for contrast instead of same-color outline
- Higher opacity for better readability

**Step 3: Verify**

Run: `bun dev`
Open hologram, confirm:
- Planet labels always face the camera
- Labels readable from any angle
- Dark outline provides contrast against bright scene elements
- Hover still increases label opacity

**Step 4: Commit**

```bash
git add components/bridge/hologram/panels/orrery/AssetPlanet.tsx
git commit -m "feat: billboard planet labels for always-face-camera readability"
```

---

### Task 4: Selection Glow Ring Component

**Files:**
- Create: `components/bridge/hologram/panels/orrery/SelectionGlow.tsx`

**Step 1: Create the pulsing glow ring**

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, TorusGeometry, MeshBasicMaterial, AdditiveBlending, Color } from 'three';

interface SelectionGlowProps {
  size: number;
  color: Color;
}

export function SelectionGlow({ size, color }: SelectionGlowProps) {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(
    () => new TorusGeometry(size * 1.6, 0.03, 8, 48),
    [size]
  );

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 0.4 + Math.sin(clock.getElapsedTime() * 4) * 0.3;
      material.opacity = pulse;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation-x={Math.PI / 2}
    />
  );
}
```

This renders a horizontal torus ring around the planet that pulses between 0.1 and 0.7 opacity using additive blending. The ring radius is 1.6× the planet size. `rotation-x={Math.PI / 2}` makes it lie flat in the orbital plane.

**Step 2: Verify**

No visual change yet — this component isn't wired in until Task 5. Just confirm no build errors:
```bash
cd web && bun run build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add components/bridge/hologram/panels/orrery/SelectionGlow.tsx
git commit -m "feat: add SelectionGlow pulsing ring component"
```

---

### Task 5: Selection State + Dimming in AssetPlanet

**Files:**
- Modify: `components/bridge/hologram/panels/orrery/AssetPlanet.tsx`
- Modify: `components/bridge/hologram/panels/AssetNavigation.tsx`

**Step 1: Add `isSelected` prop to AssetPlanet**

In `AssetPlanet.tsx`, update the interface (around line 22):

```tsx
interface AssetPlanetProps {
  name: string;
  value: number;
  orbitRadius: number;
  fixedAngle: number;
  size: number;
  geometry: AssetGeometry;
  color: Color;
  isSelected?: boolean;
  someSelected?: boolean; // true when ANY planet is selected (for dimming others)
  onClick?: () => void;
}
```

Destructure the new props in the component function:
```tsx
export function AssetPlanet({
  name,
  value,
  orbitRadius,
  fixedAngle,
  size,
  geometry: geoType,
  color,
  isSelected = false,
  someSelected = false,
  onClick,
}: AssetPlanetProps) {
```

**Step 2: Add dimming logic and selection glow**

Import SelectionGlow at the top:
```tsx
import { SelectionGlow } from '@/components/bridge/hologram/panels/orrery/SelectionGlow';
```

After the existing shield section (around line 210), and before the labels, add:

```tsx
{/* Selection glow ring */}
{isSelected && <SelectionGlow size={size} color={color} />}
```

For dimming, modify the wireframe material opacity. Change the `wireMat` useMemo (lines 100-108):

```tsx
const dimFactor = someSelected && !isSelected ? 0.35 : 1.0;

const wireMat = useMemo(
  () =>
    new LineBasicMaterial({
      color,
      transparent: true,
      opacity: (hovered ? 0.9 : 0.7) * dimFactor,
    }),
  [color, hovered, dimFactor]
);
```

Also dim the fill material. Change `fillMat` (lines 125-135):
```tsx
const fillMat = useMemo(
  () =>
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.06 * dimFactor,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  [color, dimFactor]
);
```

And dim the label opacity in the `<Billboard>` labels. Multiply `fillOpacity` values by `dimFactor`:
```tsx
fillOpacity={(hovered ? 0.9 : 0.7) * dimFactor}
```
```tsx
fillOpacity={(hovered ? 0.7 : 0.5) * dimFactor}
```

**Step 3: Pass selection props from AssetNavigation**

In `AssetNavigation.tsx`, update the `<AssetPlanet>` rendering (around lines 107-120):

```tsx
{revealProgress > 0.25 &&
  assets.map((asset) => (
    <group key={asset.id} scale={layerAlpha(revealProgress, 0.3, 0.3)}>
      <AssetPlanet
        name={asset.name}
        value={asset.value}
        orbitRadius={asset.orbitRadius}
        fixedAngle={asset.fixedAngle}
        size={asset.size}
        geometry={asset.geometry}
        color={systemColor}
        isSelected={selectedAssetId === asset.id}
        someSelected={selectedAssetId !== null}
        onClick={() => handleAssetClick(asset.id)}
      />
    </group>
  ))}
```

**Step 4: Verify**

Run: `bun dev`
Open hologram, click a planet. Confirm:
- Selected planet has a pulsing glow ring around it
- Other planets dim to ~35% opacity
- Clicking the same planet again deselects (glow goes away, all planets return to full)
- Hover still works on dimmed planets

**Step 5: Commit**

```bash
git add components/bridge/hologram/panels/orrery/AssetPlanet.tsx components/bridge/hologram/panels/AssetNavigation.tsx components/bridge/hologram/panels/orrery/SelectionGlow.tsx
git commit -m "feat: add selection glow ring and dim unselected planets"
```

---

### Task 6: Pointer Cursor on Planet Hover

**Files:**
- Modify: `components/bridge/hologram/panels/orrery/AssetPlanet.tsx:182-189`

**Step 1: Set cursor style on hover**

In `AssetPlanet.tsx`, update the pointer event handlers on the root `<group>` (around lines 182-189):

```tsx
<group
  position={position}
  onClick={(e) => {
    e.stopPropagation();
    onClick?.();
  }}
  onPointerOver={(e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }}
  onPointerOut={() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }}
>
```

Note: Changed `onPointerEnter`/`onPointerLeave` to `onPointerOver`/`onPointerOut` for better R3F compatibility (enter/leave don't bubble in R3F).

**Step 2: Verify**

Run: `bun dev`
Hover over a planet. Confirm:
- Mouse cursor changes to pointer hand
- Cursor returns to default when hovering off

**Step 3: Commit**

```bash
git add components/bridge/hologram/panels/orrery/AssetPlanet.tsx
git commit -m "feat: pointer cursor on planet hover"
```

---

### Task 7: "Select a Planet to Begin" Prompt

**Files:**
- Modify: `components/bridge/hologram/panels/AssetNavigation.tsx`

**Step 1: Import Billboard from drei**

Update the drei import at the top of `AssetNavigation.tsx`:
```tsx
import { Text, Billboard } from '@react-three/drei';
```

**Step 2: Add prompt text when no planet is selected**

After the liabilities label block (around line 220) and before the critical alert, add:

```tsx
{/* === "Select a planet" prompt — visible when no planet is selected === */}
{!selectedAssetId && revealProgress > 0.6 && (
  <Billboard>
    <Text
      fontSize={0.14}
      letterSpacing={0.15}
      color={systemColor}
      anchorX="center"
      anchorY="middle"
      fillOpacity={0.5}
      outlineWidth="5%"
      outlineColor="#000000"
      outlineOpacity={0.3}
      position={[0, -1.5, 0.5]}
    >
      SELECT A PLANET TO BEGIN
    </Text>
  </Billboard>
)}
```

Position `[0, -1.5, 0.5]` places it below the orrery center, slightly in front. It only appears once the reveal is >60% (planets are visible by then). Disappears as soon as any planet is selected.

**Step 3: Verify**

Run: `bun dev`
Open hologram. Confirm:
- "SELECT A PLANET TO BEGIN" text appears below the orrery
- Text always faces camera (billboard)
- Text disappears when you click any planet
- Text reappears when you deselect (click away)

**Step 4: Commit**

```bash
git add components/bridge/hologram/panels/AssetNavigation.tsx
git commit -m "feat: add 'select a planet to begin' discoverability prompt"
```

---

### Task 8: Camera Follow Hook

**Files:**
- Create: `hooks/useCameraFollow.ts`

**Step 1: Create the hook**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

const LERP_SPEED = 8; // Higher = snappier. ~400ms at speed 8 with exponential decay.
const _target = new Vector3();
const _current = new Vector3();

/**
 * Smoothly lerps the camera toward a target position each frame.
 * Pass `null` to return to the rest position.
 */
export function useCameraFollow(
  targetPosition: [number, number, number] | null,
  restPosition: [number, number, number] = [0, 0, 5]
) {
  const restVec = useRef(new Vector3(...restPosition));

  useFrame(({ camera }, delta) => {
    const dest = targetPosition
      ? _target.set(targetPosition[0], targetPosition[1], targetPosition[2])
      : restVec.current;

    _current.copy(camera.position);
    _current.lerp(dest, 1 - Math.exp(-LERP_SPEED * delta));
    camera.position.copy(_current);
  });
}
```

Key design:
- Uses exponential decay lerp (`1 - exp(-speed * delta)`) for frame-rate-independent smooth motion
- `LERP_SPEED = 8` gives ~400ms settle time (reaches 95% in ~0.37s)
- Reuses Vector3 instances to avoid GC pressure (module-level `_target`, `_current`)
- When `targetPosition` is null, lerps back to rest position
- Interruptible: changing `targetPosition` mid-animation just redirects the lerp

**Step 2: Verify**

No visual change yet — wired in Task 9. Confirm build:
```bash
cd web && bun run build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add hooks/useCameraFollow.ts
git commit -m "feat: add useCameraFollow hook with exponential decay lerp"
```

---

### Task 9: Wire Camera Follow into AssetNavigation

**Files:**
- Modify: `components/bridge/hologram/panels/AssetNavigation.tsx`
- Modify: `components/bridge/hologram/HologramOverlay.tsx`

**Step 1: Compute camera target from selected planet**

In `AssetNavigation.tsx`, import the hook and compute the target position.

Add import at top:
```tsx
import { useCameraFollow } from '@/hooks/useCameraFollow';
```

After `const selectedAsset = ...` (around line 82), compute the camera target:

```tsx
// Camera target: offset from planet world position to frame planet + panel
const cameraTarget = useMemo<[number, number, number] | null>(() => {
  if (!selectedAsset) return null;
  const x = Math.cos(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
  const z = Math.sin(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
  // Offset: slightly toward camera (+Z), pan toward planet X, lift slightly
  // Multiply by the group scale (0.4) since the orrery is in a scaled group
  const scale = 0.4;
  return [x * scale * 0.3, 0.6 + 0.3, 5 - 0.5];
}, [selectedAsset]);

useCameraFollow(cameraTarget);
```

The camera target calculation:
- `x * scale * 0.3` — shifts camera laterally toward the planet (30% of its world X) so it stays roughly centered
- `0.6 + 0.3 = 0.9` — slightly above default Y to frame the planet
- `5 - 0.5 = 4.5` — slightly closer than default Z=5

**Step 2: Disable conflicting camera movement in HologramOverlay**

In `HologramOverlay.tsx`, the existing `useFrame` (line 72-75) lerps the camera toward `CAM_DRIFT` or `CAM_REST`. This conflicts with the new `useCameraFollow`. We need to disable that camera lerp when the networth panel is showing, since `useCameraFollow` handles it.

In `HologramOverlay.tsx`, change the camera micro-drift section (lines 72-75):

```tsx
// --- Camera micro-drift (disabled for networth — useCameraFollow handles it) ---
if (expandedPanel !== 'networth') {
  const camTarget = activationPhase === 'idle' || activationPhase === 'dismissing'
    ? CAM_REST
    : CAM_DRIFT;
  camera.position.lerp(camTarget, delta * 4);
}
```

**Step 3: Verify**

Run: `bun dev`
Open hologram, click a planet. Confirm:
- Camera smoothly glides toward the selected planet area (~400ms)
- Click another planet — camera redirects smoothly mid-transition
- Deselect (click away) — camera returns to default position
- Other hologram panels (shields, transactions, cards) still have their camera micro-drift

**Step 4: Commit**

```bash
git add components/bridge/hologram/panels/AssetNavigation.tsx components/bridge/hologram/HologramOverlay.tsx hooks/useCameraFollow.ts
git commit -m "feat: camera follows selected planet with smooth lerp"
```

---

### Task 10: Keyboard Navigation

**Files:**
- Modify: `components/bridge/hologram/panels/AssetNavigation.tsx`

**Step 1: Add keyboard event handler**

Import `ASSET_NAV_ORDER` from asset store:
```tsx
import { useAssetStore, RING_RADII, DEBRIS_BELT_RADIUS, ASSET_NAV_ORDER } from '@/lib/stores/asset-store';
```

Add `useEffect` import if not already present. Then add a keyboard handler effect inside the `AssetNavigation` component, after the existing `handleClose` callback:

```tsx
// Keyboard navigation
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedAssetId((prev) => {
        const currentIdx = prev ? ASSET_NAV_ORDER.indexOf(prev) : -1;
        let nextIdx: number;
        if (e.key === 'ArrowRight') {
          nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % ASSET_NAV_ORDER.length;
        } else {
          nextIdx = currentIdx <= 0 ? ASSET_NAV_ORDER.length - 1 : currentIdx - 1;
        }
        return ASSET_NAV_ORDER[nextIdx];
      });
      setDeepScanTarget(null);
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!selectedAssetId) return;
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (!asset) return;
      if (deepScanTarget?.id === selectedAssetId) {
        // Already in deep scan — collapse
        setDeepScanTarget(null);
      } else {
        // Open deep scan
        setDeepScanTarget(asset);
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (deepScanTarget) {
        setDeepScanTarget(null);
      } else if (selectedAssetId) {
        setSelectedAssetId(null);
      }
      // Note: closing the entire hologram (when nothing selected) is handled
      // by HologramDetailPanel's existing ESC listener or the console button
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [selectedAssetId, deepScanTarget, assets]);
```

**Step 2: Remove conflicting ESC handler from HologramDetailPanel**

The `HologramDetailPanel.tsx` has its own ESC handler (lines 159-165) that calls `onClose()`. This would conflict with our layered Escape. Remove it since keyboard navigation now handles all ESC behavior:

In `HologramDetailPanel.tsx`, delete lines 159-165:
```tsx
// DELETE THIS:
useEffect(() => {
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, [onClose]);
```

**Step 3: Verify**

Run: `bun dev`
Open hologram. Test:
1. Press Right Arrow — first planet (Home) selected, camera moves
2. Press Right Arrow again — next planet (Investments), camera follows
3. Press Left Arrow — back to Home
4. Press Enter — detail panel opens with deep scan
5. Press Enter again — deep scan collapses
6. Press Escape — detail panel closes, planet still selected
7. Press Escape again — planet deselected, camera returns to overview
8. Confirm wrapping: at last planet (Crypto), Right Arrow goes to Home

**Step 4: Commit**

```bash
git add components/bridge/hologram/panels/AssetNavigation.tsx components/bridge/hologram/HologramDetailPanel.tsx
git commit -m "feat: keyboard navigation (arrows cycle, Enter toggles scan, Escape backs out)"
```

---

### Task 11: Relative Detail Panel Positioning

**Files:**
- Modify: `components/bridge/hologram/panels/AssetNavigation.tsx:241-252`

**Step 1: Compute panel position relative to selected planet**

Replace the fixed `position={[3.5, 1.5, 0.3]}` on the `HologramDetailPanel` with a computed position based on the selected planet's orbital position.

Add a `panelPosition` calculation after `cameraTarget` (or near `selectedAsset`):

```tsx
// Panel position: offset right and up from selected planet
const panelPosition = useMemo<[number, number, number]>(() => {
  if (!selectedAsset) return [3.5, 1.5, 0.3];
  const x = Math.cos(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
  const z = Math.sin(selectedAsset.fixedAngle) * selectedAsset.orbitRadius;
  // Offset right (+X) and up (+Y) from planet position within the orrery group
  return [x + 2.2, 1.2, z + 0.3];
}, [selectedAsset]);
```

Then update the HologramDetailPanel rendering:

```tsx
{selectedAsset && (
  <HologramDetailPanel
    position={panelPosition}
    color={cssColor}
    glowColor={cssGlow}
    asset={selectedAsset}
    isDeepScan={deepScanTarget?.id === selectedAsset.id}
    onDeepScan={() => handleDeepScan(selectedAsset)}
    onCollapse={() => setDeepScanTarget(null)}
    onClose={handleClose}
  />
)}
```

**Step 2: Verify**

Run: `bun dev`
Click different planets. Confirm:
- Detail panel appears near the selected planet, not at a fixed position
- Panel doesn't overlap the planet excessively
- Panel is readable with camera follow positioning
- Switching between planets repositions the panel correctly

**Step 3: Commit**

```bash
git add components/bridge/hologram/panels/AssetNavigation.tsx
git commit -m "feat: position detail panel relative to selected planet"
```

---

### Task 12: Enhanced Detail Panel Data Hierarchy

**Files:**
- Modify: `components/bridge/hologram/HologramDetailPanel.tsx:255-332`

**Step 1: Improve the AssetScanContent quick glance section**

In `HologramDetailPanel.tsx`, update the `AssetScanContent` component's quick glance section. Replace the existing header + value rows (lines 257-305) with an improved layout:

```tsx
return (
  <>
    {/* Header */}
    <div
      style={{
        color,
        fontSize: '10px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '6px',
        textShadow: `0 0 6px ${color}`,
      }}
    >
      ◆ ASSET SCAN REPORT
    </div>

    {/* Divider */}
    <div
      style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        margin: '0 0 8px 0',
        opacity: 0.3,
      }}
    />

    {/* Asset name — larger */}
    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>
      {asset.name}
    </div>

    {/* Status badge */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', marginBottom: '10px' }}>
      <span
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: `0 0 4px ${statusColor}`,
        }}
      />
      <span style={{ color: statusColor, letterSpacing: '1px' }}>{asset.status}</span>
    </div>

    {/* Current value — hero number */}
    <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px', fontVariantNumeric: 'tabular-nums' }}>
      {fmt(asset.value)}
    </div>

    {/* Trend arrow + share on same line */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
      <span style={{ color: trendColor, fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
        {asset.trendPct >= 0 ? '▲' : '▼'} {pct(asset.trendPct, true)}
      </span>
      <span style={{ opacity: 0.5, fontSize: '10px' }}>
        {pct(asset.netWorthShare)} of net worth
      </span>
    </div>

    {/* Deep scan section */}
    {isDeepScan ? (
      <>
        <div style={{ borderTop: `1px dashed ${color}`, margin: '0 0 8px', opacity: 0.25 }} />
        {renderDeepScanRows(asset, isDecoding)}
        <button
          onClick={onCollapse}
          style={buttonStyle}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
        >
          ▲ COLLAPSE SCAN
        </button>
      </>
    ) : (
      <button
        onClick={onDeepScan}
        style={buttonStyle}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
      >
        ▼ SCAN DEEPER
      </button>
    )}
  </>
);
```

Key improvements:
- Asset name: `13px → 14px`, `fontWeight: 600 → 700`
- Status: now has a colored dot indicator + color text (not just text)
- Value: `hero number at 18px` instead of buried in a flex row
- Trend + share on same line below value for quick scanning
- Better spacing and visual hierarchy

**Step 2: Verify**

Run: `bun dev`
Open hologram, click a planet. Confirm:
- Asset name is larger and bolder
- Status has a glowing colored dot
- Current value is prominent (18px)
- Trend arrow and net worth share are on the same line below value
- Deep scan still works with decode animation
- Close/collapse buttons still functional

**Step 3: Commit**

```bash
git add components/bridge/hologram/HologramDetailPanel.tsx
git commit -m "feat: enhanced detail panel with better data hierarchy"
```

---

## Task Summary

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| 1 | Remove group orrery rotation | AssetNavigation.tsx | 2 min |
| 2 | Add ASSET_NAV_ORDER | asset-store.ts | 1 min |
| 3 | Billboard labels | AssetPlanet.tsx | 3 min |
| 4 | SelectionGlow component | SelectionGlow.tsx (new) | 3 min |
| 5 | Selection state + dimming | AssetPlanet.tsx, AssetNavigation.tsx | 5 min |
| 6 | Pointer cursor on hover | AssetPlanet.tsx | 2 min |
| 7 | "Select a planet" prompt | AssetNavigation.tsx | 2 min |
| 8 | Camera follow hook | useCameraFollow.ts (new) | 3 min |
| 9 | Wire camera follow | AssetNavigation.tsx, HologramOverlay.tsx | 5 min |
| 10 | Keyboard navigation | AssetNavigation.tsx, HologramDetailPanel.tsx | 5 min |
| 11 | Relative panel positioning | AssetNavigation.tsx | 3 min |
| 12 | Enhanced detail panel | HologramDetailPanel.tsx | 5 min |

**Total: 12 tasks, ~39 minutes**

## Code Review Checkpoints

- After Task 6: Review tasks 1-6 (stationary orrery, labels, selection, cursor)
- After Task 12: Final review of all tasks
