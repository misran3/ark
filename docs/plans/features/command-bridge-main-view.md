# Feature Spec: Command Bridge Main View

**Feature ID:** `UI-001`
**Category:** Command Center UI
**Priority:** P0 (Must-have for MVP)
**Status:** 🔵 Needs Polish
**Current Version:** 0.6 (Basic layout exists)
**Target Version:** 1.0

---

## Overview

The Command Bridge Main View is the primary dashboard — the "home screen" of the entire application. It's the view users see when they first open the app, showing a holistic overview of their financial status with Captain Nova, active threats in 3D space, and key metrics in glassmorphism panels.

**The Core Magic:** Feels like standing on the bridge of a starship, looking out into space through a viewport, with critical systems status displayed on surrounding HUD panels.

---

## Layout Specification

### Screen Regions

```
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR (fixed, 60px height)                                │
│ [Stardate] [User Name] [Shield Status] [Alert Count] [Menu]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LEFT PANEL (280px)    VIEWPORT (flex)      RIGHT PANEL     │
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │               │    │              │    │              ││
│  │  CAPTAIN NOVA │    │   3D SCENE   │    │  TRANSACTION ││
│  │  + SPEECH     │    │              │    │     LOG      ││
│  │               │    │  (Threats,   │    │              ││
│  │               │    │  Starfield,  │    │              ││
│  │               │    │   Camera)    │    │              ││
│  │               │    │              │    │              ││
│  └───────────────┘    └──────────────┘    └──────────────┘│
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ BOTTOM CONSOLE (fixed, 280px height)                        │
│ ┌────────────┬──────────────────────┬────────────┐        │
│ │   SHIELD   │   COMMAND CENTER     │  QUICK     │        │
│ │   STATUS   │   (4 metric preview) │  ACTIONS   │        │
│ └────────────┴──────────────────────┴────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Top Bar (HUD)

**Position:** Fixed to top, always visible
**Height:** 60px
**Style:** Glassmorphism Level 1 (subtle, low opacity)

**Contents (Left to Right):**

1. **Stardate Clock** (Left)
   ```
   SD 2026.02.06 — 22:38:23
   ```
   - Font: Share Tech Mono
   - Size: 14px
   - Color: Aurora primary
   - Updates: Every second
   - Format: `SD YYYY.MM.DD — HH:MM:SS`

2. **User Name** (Left-center)
   ```
   CMDR. BENJAMIN FAIB
   ```
   - Font: Orbitron, weight 600
   - Size: 16px
   - Color: White 90%
   - Prefix: "CMDR." (Commander rank)

3. **Shield Status Mini** (Center)
   ```
   SHIELDS: ███████░░░ 72%
   ```
   - Three colored bars (Needs, Wants, Savings)
   - Each: 30px wide × 6px tall
   - Inline progress bars
   - Overall percentage displayed

4. **Alert Count** (Right-center)
   ```
   ⚠️ 3 THREATS
   ```
   - Icon: Warning triangle
   - Count: Number of active threats
   - Color: Red if critical, Aurora if normal
   - Pulsing if any Zone 4 threats

5. **Menu Button** (Right)
   - Icon: Three horizontal lines (hamburger)
   - Hover: Expands to show: Settings, Help, Sign Out
   - Glassmorphism dropdown

---

### 2. Left Panel — Captain Nova

**Width:** 280px
**Height:** Viewport height - top bar - bottom console
**Style:** Glassmorphism Level 2

**Contents:**

1. **Captain Nova Portrait** (Top)
   - 200px × 200px circular frame
   - 3D hologram view (rendered from separate camera)
   - Frame: Aurora gradient border, pulsing
   - Shows: Nova from chest up, making eye contact

2. **Speech Bubble** (Below portrait)
   - Dynamic height (fits content)
   - Glassmorphism panel
   - Displays current message
   - Word highlighting as she speaks
   - Audio waveform at bottom

3. **Quick Action Buttons** (Bottom)
   ```
   [STATUS]  [THREATS]  [SHIELDS]
   ```
   - 3 buttons in row
   - Trigger pre-defined Nova responses
   - Aurora glow on hover

**Behavior:**
- Panel slides in from left on page load (300ms)
- Nova materializes after panel arrives
- First speech auto-triggers after 1s delay
- Subsequent speeches triggered by buttons or events

---

### 3. Viewport — 3D Scene

**Size:** Flexible (fills remaining space between panels)
**Min Width:** 600px (responsive)
**Background:** Deep space starfield

**Contents:**

1. **Starfield Background**
   - 5,000 instanced stars
   - Aurora color twinkling
   - Slow drift (parallax effect)
   - Z-depth: -1000 to -10000

2. **Active Threats**
   - All spawned threats visible
   - Positioned in 3D space (Z: 100-1200)
   - Move toward camera per threat specs
   - Interactable (hover, click)

3. **HUD Overlays** (2D on top of 3D)
   - Corner brackets (viewport frame)
   - Threat targeting UI (when hovered)
   - Distance markers
   - Zone indicators (Zone 2/3/4 visual cues)

**Camera:**
- Position: (0, 0, 10)
- FOV: 75°
- Look at: (0, 0, 0)
- Controlled by zoom transition system

---

### 4. Right Panel — Transaction Log

**Width:** 320px
**Height:** Viewport height - top bar - bottom console
**Style:** Glassmorphism Level 2

**Header:**
```
RECENT TRANSACTIONS
[Filter: All ▼]  [Search 🔍]
```

**Transaction List:**

Each transaction card:
```
┌─────────────────────────────────────┐
│ 🍔 CHIPOTLE                  -$12.45│
│ Dining • Freedom Unlimited          │
│ 2 hours ago                          │
└─────────────────────────────────────┘
```

**Card Details:**
- Icon: Category emoji (🍔 dining, 🏠 home, ⛽ gas, etc.)
- Merchant: Bold, white 95%
- Amount: Right-aligned, color-coded
  - Negative (spending): Red
  - Positive (income): Green
- Category + Card: Small text, white 70%
- Time: Relative ("2 hours ago", "Yesterday")

**Scroll Behavior:**
- Virtual scrolling (only render visible)
- Load more on scroll (infinite scroll)
- Smooth momentum scrolling

**Interaction:**
- Click transaction → Detail modal
- Swipe left → Quick actions (categorize, flag, dispute)

---

### 5. Bottom Console — Status Panels

**Height:** 280px
**Width:** Full width
**Style:** Glassmorphism Level 1

**3-Column Layout:**

#### Column 1: Shield Status (30%)

```
DEFENSIVE SHIELDS
┌──────────────────────────┐
│ ███████████░ 78%  NEEDS  │
│ Groceries, Rent, Bills   │
├──────────────────────────┤
│ █████░░░░░░░ 42%  WANTS  │
│ Dining, Entertainment    │
├──────────────────────────┤
│ ██████████░░ 85%  SAVINGS│
│ Emergency Fund, Invest   │
└──────────────────────────┘
```

**Details:**
- 3 progress bars (horizontal)
- Each bar: Height 24px
- Color coding:
  - Green: < 80% of budget (healthy)
  - Yellow: 80-100% (caution)
  - Red: > 100% (danger)
- Labels: Category + percentage
- Sub-labels: Examples from category

#### Column 2: Command Center Preview (40%)

```
COMMAND CENTER
┌─────────────┬─────────────┐
│ NET WORTH   │ INCOME      │
│ $47,832     │ $6,240      │
│ +2.3% ▲     │ This month  │
├─────────────┼─────────────┤
│ SPENDING    │ SAVINGS     │
│ $3,891      │ $18.4K      │
│ This month  │ +$340 ▲     │
└─────────────┴─────────────┘

[EXPAND TO FULL VIEW] ▲
```

**Details:**
- 2×2 grid of key metrics
- Each cell: Glassmorphism Level 2
- Large number (hero text)
- Small context label
- Optional: Sparkline graph
- Expand button: Opens zoom transition

#### Column 3: Quick Actions (30%)

```
QUICK ACTIONS
┌─────────────────────────┐
│ 🎯 REVIEW BUDGET        │
├─────────────────────────┤
│ 💳 OPTIMIZE CARDS       │
├─────────────────────────┤
│ 🛡️ ACTIVATE CONTROLS    │
├─────────────────────────┤
│ 📊 VIEW INSIGHTS        │
└─────────────────────────┘
```

**Details:**
- 4 action buttons (vertical stack)
- Icon + Label
- Aurora glow on hover
- Click: Navigate to relevant section

---

## Responsive Behavior

### Desktop (1920×1080)
- Full layout as described above
- All panels visible
- Optimal viewing experience

### Laptop (1440×900)
- Left/right panels slightly narrower (240px)
- Viewport still comfortable
- Bottom console stacks to 2 rows if needed

### Tablet (1024×768) — Not in MVP
- Left panel collapses (Nova portrait only, speech in modal)
- Right panel becomes slide-out drawer
- Viewport expands to full width

### Mobile (< 768px) — Not in MVP
- Single column layout
- 3D viewport at top (full width, 50vh)
- Panels become tabs/cards below
- Bottom console becomes swipeable carousel

---

## Animation Choreography

### Page Load Sequence

**0-500ms: Initial Fade In**
- Black screen fades to space background
- Starfield fades in (opacity 0 → 1)

**500-800ms: HUD Materialization**
- Top bar slides down from top (-60px → 0)
- Bottom console slides up from bottom (+280px → 0)
- Aurora glow effect on borders

**800-1100ms: Side Panels**
- Left panel slides in from left (-280px → 0)
- Right panel slides in from right (+320px → 0)
- Stagger: Left first (0ms), Right second (+100ms)

**1100-1400ms: Captain Nova Spawn**
- See captain-nova-hologram.md: Materialization sequence
- Particles coalesce into form
- Stabilizes, makes eye contact

**1400-1700ms: Content Population**
- Shield bars animate filling (0% → current %)
- Metric numbers count up (0 → actual value)
- Transaction cards fade in (staggered, 50ms each)

**1700-2000ms: First Speech**
- Nova begins welcome message
- Speech bubble appears
- User has full control

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `@tanstack/react-virtual` (^3.13.18) - Virtual scrolling
- `framer-motion` (^12.33.0) - Panel animations
- `date-fns` (^3.0.0) - Date formatting

**Required Components:**
- `GlassPanel` (from glassmorphism-panels.md)
- `ThreeScene` (from zoom-transition.md)
- `CaptainNovaUI` (from captain-nova-hologram.md)

### State Management

**Required Stores:**
- `useUserStore` - User profile data
- `useFinancialStore` - Snapshot, budget, shields
- `useThreatStore` - Active threats
- `useTransactionStore` - Transaction history

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Layout feels balanced (not cluttered)
- [ ] Glassmorphism panels have good contrast (readable)
- [ ] Starfield is atmospheric (not distracting)
- [ ] Nova is clearly visible and prominent
- [ ] Colors follow aurora system (cohesive)

### ✅ Animation Quality

- [ ] Page load sequence is smooth (no jank)
- [ ] Panel slides are synchronized
- [ ] Shield bars fill naturally
- [ ] Numbers count up (not instant)
- [ ] Transitions between states are seamless

### ✅ Interaction Quality

- [ ] All buttons are clickable (good hitboxes)
- [ ] Hover states provide feedback
- [ ] Transaction log scrolls smoothly
- [ ] Command Center expand works (zoom transition)
- [ ] Quick actions navigate correctly

### ✅ Performance

- [ ] 60fps sustained (all animations)
- [ ] Virtual scrolling works (1000+ transactions)
- [ ] 3D scene doesn't block UI updates
- [ ] Data fetches don't freeze UI

---

## Related Features

- `NAV-001`: Seamless Zoom Transition (expands Command Center)
- `NOVA-001`: Captain Nova Hologram (left panel)
- `UI-006`: Glassmorphism Panels (all panels)
- `BACKEND-001`: Threat Detection Engine (populates viewport)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.6 | 2026-02-06 | Initial implementation (basic layout) |
| 1.0 | TBD | Full spec with polished animations |

---

**Status:** Ready for layout refinement and animation choreography.
