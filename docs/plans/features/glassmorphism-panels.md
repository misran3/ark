# Feature Spec: Glassmorphism UI Panels

**Feature ID:** `UI-006`
**Category:** Command Center UI / Visual Polish
**Priority:** P0 (Must-have for MVP)
**Status:** 🔴 Not Started
**Current Version:** 0.0 (Basic panels exist, need refinement)
**Target Version:** 1.0

---

## Overview

Glassmorphism panels are the foundational UI design pattern for all interface elements in SynesthesiaPay Bridge. They create a futuristic, translucent aesthetic that lets the 3D starfield show through while maintaining excellent readability. Every panel, card, modal, and overlay uses this design language for visual cohesion.

**The Core Magic:** Perfect balance of transparency, blur, glow, and depth that makes panels feel like holographic projections floating in space — beautiful but functional.

---

## Visual Specification

### Core Glassmorphism Formula

**Layer Structure:**
```
Z-Layer 1: Backdrop blur (starfield behind)
Z-Layer 2: Semi-transparent background
Z-Layer 3: Content (text, buttons, data)
Z-Layer 4: Border glow
Z-Layer 5: Highlight shimmer (optional)
```

**CSS Implementation:**
```css
.glass-panel {
  /* Background */
  background: rgba(6, 10, 22, 0.6);  /* 60% opaque space-dark */

  /* Backdrop blur (key to glassmorphism) */
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);

  /* Border */
  border: 1px solid rgba(var(--aurora-primary-rgb), 0.3);
  border-radius: 12px;

  /* Shadow (depth) */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),           /* Outer shadow */
    inset 0 1px 0 rgba(255, 255, 255, 0.1);  /* Inner highlight */

  /* Subtle glow */
  box-shadow: 0 0 30px rgba(var(--aurora-primary-rgb), 0.15);
}
```

### Panel Hierarchy (Depth Levels)

**Level 1: Background Panels** (lowest depth)
- Use: Large containers, main sections
- Background opacity: 50-60%
- Blur: 20px
- Border: 1px, 30% opacity
- Example: Command Center main container

**Level 2: Card Panels** (mid depth)
- Use: Metric cards, info boxes, lists
- Background opacity: 60-70%
- Blur: 16px
- Border: 1px, 40% opacity
- Glow: Subtle (0.1 opacity)
- Example: Net Worth card, Transaction cards

**Level 3: Overlay Panels** (high depth)
- Use: Modals, popovers, tooltips
- Background opacity: 70-80%
- Blur: 24px
- Border: 1.5px, 50% opacity
- Glow: Stronger (0.2 opacity)
- Example: Threat info panels, confirmation modals

**Level 4: Critical Alerts** (highest depth)
- Use: Warnings, errors, destructive actions
- Background: rgba(220, 38, 38, 0.15) (red tint)
- Blur: 24px
- Border: 2px, red with 60% opacity
- Glow: Red pulsing
- Example: Black hole warning, debt alerts

### Interactive States

**Default State:**
```css
.glass-panel {
  background: rgba(6, 10, 22, 0.6);
  border: 1px solid rgba(var(--aurora-primary-rgb), 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Hover State:**
```css
.glass-panel:hover {
  background: rgba(6, 10, 22, 0.7);  /* Slightly more opaque */
  border-color: rgba(var(--aurora-primary-rgb), 0.5);  /* Brighter border */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(var(--aurora-primary-rgb), 0.25);  /* Stronger glow */
  transform: translateY(-2px);  /* Subtle lift */
}
```

**Active/Focused State:**
```css
.glass-panel:focus,
.glass-panel.active {
  background: rgba(6, 10, 22, 0.75);
  border: 1.5px solid rgba(var(--aurora-primary-rgb), 0.7);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(var(--aurora-primary-rgb), 0.4);
  transform: translateY(-4px);
}
```

**Disabled State:**
```css
.glass-panel:disabled {
  background: rgba(6, 10, 22, 0.4);  /* More transparent */
  border-color: rgba(255, 255, 255, 0.1);  /* Desaturated */
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
```

### Animation Patterns

**Panel Entry Animation:**
```css
@keyframes glass-panel-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    backdrop-filter: blur(20px);
  }
}

.glass-panel {
  animation: glass-panel-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Panel Exit Animation:**
```css
@keyframes glass-panel-exit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
    backdrop-filter: blur(0px);
  }
}
```

**Glow Pulse (for active/important panels):**
```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 30px rgba(var(--aurora-primary-rgb), 0.15);
  }
  50% {
    box-shadow: 0 0 50px rgba(var(--aurora-primary-rgb), 0.3);
  }
}

.glass-panel.pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

### Content Readability

**Text Styling Inside Panels:**
```css
.glass-panel h1,
.glass-panel h2,
.glass-panel h3 {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  font-family: 'Orbitron', sans-serif;
}

.glass-panel p,
.glass-panel span {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  font-family: 'Rajdhani', sans-serif;
}

.glass-panel .label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

**Icon/Graphic Visibility:**
- Icons: Use stroke (outline) style, not filled
- Stroke width: 1.5-2px
- Color: Aurora primary or white with 80% opacity
- Add subtle drop shadow for depth

---

## Component Library

### Base GlassPanel Component

**GlassPanel.tsx:**
```typescript
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;  // Depth level
  variant?: 'default' | 'warning' | 'error' | 'success';
  hover?: boolean;
  pulse?: boolean;
  className?: string;
}

export function GlassPanel({
  children,
  level = 2,
  variant = 'default',
  hover = false,
  pulse = false,
  className = '',
}: GlassPanelProps) {
  const baseClasses = 'glass-panel';
  const levelClasses = `glass-panel-level-${level}`;
  const variantClasses = `glass-panel-${variant}`;
  const stateClasses = [
    hover && 'glass-panel-hoverable',
    pulse && 'glass-panel-pulse',
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={`${baseClasses} ${levelClasses} ${variantClasses} ${stateClasses} ${className}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**Usage:**
```tsx
<GlassPanel level={2} hover pulse>
  <h3>Net Worth</h3>
  <p className="text-4xl">$47,832</p>
</GlassPanel>
```

### Specialized Panel Components

**MetricCard.tsx:**
```tsx
export function MetricCard({ title, value, sparkline, trend }: MetricCardProps) {
  return (
    <GlassPanel level={2} hover className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="label">{title}</p>
          <h2 className="text-3xl font-bold mt-2">{value}</h2>
        </div>
        {trend && (
          <div className={`trend-indicator ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      {sparkline && <Sparkline data={sparkline} className="mt-4" />}
    </GlassPanel>
  );
}
```

**InfoPanel.tsx:** (For threat hover)
```tsx
export function InfoPanel({ icon, title, details, action }: InfoPanelProps) {
  return (
    <GlassPanel level={3} className="min-w-[300px]">
      <div className="flex items-start gap-3 p-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          {details.map((detail, i) => (
            <p key={i} className="text-sm text-white/70">{detail}</p>
          ))}
        </div>
      </div>
      {action && (
        <div className="border-t border-white/10 p-4">
          {action}
        </div>
      )}
    </GlassPanel>
  );
}
```

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `framer-motion` (^12.33.0) - Panel animations
- `tailwindcss` (^4.x) - Styling utilities

**Browser Support:**
- `backdrop-filter` support required (Chrome 76+, Safari 9+, Firefox 103+)
- Fallback for older browsers: Solid background (no blur)

### Fallback Strategy

**Detect backdrop-filter support:**
```typescript
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(20px)');

if (!supportsBackdropFilter) {
  // Use solid background instead
  document.body.classList.add('no-backdrop-filter');
}
```

**CSS Fallback:**
```css
/* Default: glassmorphism */
.glass-panel {
  background: rgba(6, 10, 22, 0.6);
  backdrop-filter: blur(20px);
}

/* Fallback: solid background */
.no-backdrop-filter .glass-panel {
  background: rgba(6, 10, 22, 0.95);  /* Much more opaque */
  backdrop-filter: none;
}
```

### Performance Optimization

**Backdrop Filter Performance:**
- Limit number of panels with backdrop-filter (< 10 simultaneously)
- Use `will-change: backdrop-filter` on hover/animated panels
- Disable backdrop-filter on low-end devices (FPS detection)

**Performance Monitoring:**
```typescript
// Detect low FPS, disable expensive effects
const fps = detectFPS(); // Implementation in utils
if (fps < 30) {
  document.body.classList.add('low-performance-mode');
}
```

```css
.low-performance-mode .glass-panel {
  backdrop-filter: none;  /* Disable blur */
  background: rgba(6, 10, 22, 0.9);
}
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Panels look translucent (starfield visible behind)
- [ ] Blur is subtle but effective (not too strong)
- [ ] Borders have aurora-colored glow
- [ ] Text is perfectly readable on all panels
- [ ] Depth hierarchy is clear (can distinguish levels 1-4)
- [ ] Animations are smooth (60fps)

### ✅ Interaction Quality

- [ ] Hover states provide clear feedback
- [ ] Transitions are buttery smooth (no jank)
- [ ] Active states are visually distinct
- [ ] Disabled panels look clearly non-interactive
- [ ] Panel entry/exit animations feel polished

### ✅ Consistency

- [ ] All panels use same glassmorphism formula
- [ ] Aurora colors update panels when cycling
- [ ] Depth levels are used correctly throughout UI
- [ ] Spacing/padding is consistent (8px grid)
- [ ] Border radius is consistent (12px)

### ✅ Performance

- [ ] No frame drops when hovering panels
- [ ] Backdrop filter doesn't slow down 3D scene
- [ ] Fallback mode works on unsupported browsers
- [ ] Low-performance mode activates on slow devices
- [ ] Memory usage is stable (no leaks from animations)

---

## Design Alternatives Considered

### Alternative 1: Solid Panels (No Glassmorphism)
**Approach:** Opaque panels with traditional drop shadows
**Pros:** Maximum readability, best performance, widest browser support
**Cons:** Boring, doesn't match futuristic aesthetic, hides starfield
**Decision:** ❌ Rejected - not impressive enough

### Alternative 2: Extreme Glassmorphism (Very Transparent)
**Approach:** 20-30% opacity, heavy blur (40px)
**Pros:** Stunning visual effect, very futuristic
**Cons:** Readability suffers, performance cost too high
**Decision:** ❌ Rejected - beauty over function is wrong priority

### Alternative 3: Balanced Glassmorphism (SELECTED)
**Approach:** 60-70% opacity, moderate blur (16-20px)
**Pros:** Beautiful + functional, acceptable performance, readable
**Cons:** Requires modern browsers, needs fallback
**Decision:** ✅ **Selected** - best balance

---

## Open Questions

### Resolved
- ✅ Q: Should panels have noise texture overlay?
  - A: Optional - add subtle noise (5% opacity) for depth, but not required

- ✅ Q: Should panel borders animate on aurora color change?
  - A: Yes - smooth transition (300ms) when aurora updates

### Unresolved
- ⚠️ Q: Should panels cast "light" onto nearby 3D objects?
  - A: Cool idea but complex - defer to advanced polish phase

---

## Implementation Checklist

### Phase 1: Base Component
- [ ] Create GlassPanel React component
- [ ] Implement CSS glassmorphism styles
- [ ] Add depth level variants (1-4)
- [ ] Add variant types (default, warning, error)

### Phase 2: Interactive States
- [ ] Implement hover state
- [ ] Implement active/focused state
- [ ] Implement disabled state
- [ ] Add smooth transitions

### Phase 3: Animations
- [ ] Add entry/exit animations (Framer Motion)
- [ ] Add glow pulse animation
- [ ] Test animation performance
- [ ] Fine-tune timing values

### Phase 4: Specialized Components
- [ ] Create MetricCard component
- [ ] Create InfoPanel component
- [ ] Create ModalPanel component
- [ ] Create AlertPanel component

### Phase 5: Integration
- [ ] Replace all existing panels with new GlassPanel
- [ ] Connect to aurora color system
- [ ] Test across different backgrounds (starfield, threats, etc.)
- [ ] Ensure consistent spacing throughout

### Phase 6: Performance
- [ ] Implement backdrop-filter fallback
- [ ] Add low-performance mode detection
- [ ] Optimize re-renders (React.memo where needed)
- [ ] Test on low-end devices

### Phase 7: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark glassmorphism-panels as complete`

---

## Related Features

- `UI-001`: Command Bridge Main View (uses panels extensively)
- `UI-002`: Command Center Overview (uses metric cards)
- All threat info panels (THREAT-001 through THREAT-006) use glassmorphism
- Aurora Color System (panels inherit colors via CSS variables)

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
| 1.0 | TBD | Full implementation with component library |

---

**Status:** Ready for component development and design system integration.
