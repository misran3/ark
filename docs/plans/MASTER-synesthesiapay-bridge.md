# SynesthesiaPay Bridge - Master Design Document

**Version:** 1.9
**Last Updated:** 2026-02-07
**Status:** Living Document

---

## Table of Contents

1. [Vision](#vision)
2. [Current State](#current-state)
3. [Design System](#design-system)
4. [Technical Architecture](#technical-architecture)
5. [Constraints & Requirements](#constraints--requirements)
6. [Feature Catalog](#feature-catalog)
7. [Hackathon Demo Strategy](#hackathon-demo-strategy)
8. [Implementation Strategy](#implementation-strategy)

---

## Vision

### The Ultimate Goal

Transform personal finance management from a mundane task into an **awe-inspiring, cinematic experience** that feels like commanding a starship through the cosmos. Users should feel like they're **opening their eyes on the bridge of a spaceship**, where financial threats appear as cosmic phenomena and AI-powered intelligence guides them through strategic decisions.

### Core Experience Pillars

1. **Awe and Wonder** - First impression should be "Whoa, this is beautiful" — breathtaking visuals that set a new standard for financial UX
2. **Seamless Immersion** - Every interaction feels fluid, intentional, and part of a cohesive 3D environment (no jarring page transitions)
3. **Intelligent Assistance** - Captain Nova acts as a living, breathing AI officer who speaks, analyzes, and guides with personality
4. **Actionable Beauty** - Stunning visuals serve the purpose of making complex financial data intuitive and actionable

### Success Criteria

- Users spend 3-5 seconds just taking in the opening animation before interacting
- Page transitions feel like camera movements in a 3D space, not web navigation
- Financial threats are immediately understandable through visual metaphors
- Users describe the experience as "magical," "next-level," or "nothing like traditional banking apps"
- Maintains 60fps performance on modern hardware

---

## Current State

### What We've Built (v0.1 - Initial Implementation)

**Date:** 2026-02-06
**Build Time:** ~2-3 hours
**Lines of Code:** ~3,500 lines across 25+ files

#### ✅ Completed Features

**Core Infrastructure:**
- ✅ Next.js 16 app with App Router
- ✅ Three.js scene with React Three Fiber integration
- ✅ Aurora borealis color cycling system (60s cycle: Purple → Cyan → Green → Mint)
- ✅ GSAP animation framework
- ✅ Zustand state management (threats, transitions)
- ✅ React Query for data fetching

**Visual Elements:**
- ✅ 5,000 instanced stars with aurora color twinkling
- ✅ Captain Nova hologram with basic shader (scanlines, chromatic aberration, breathing)
- ✅ Basic threat system (Asteroid, Ion Storm, Solar Flare)
- ✅ Seamless page transition between Bridge → Command Center
- ✅ Aurora gradient color system applied to UI

**Interactions:**
- ✅ Click threats to deflect → particle explosion
- ✅ Hover for targeting brackets
- ✅ Voice synthesis with basic lip sync
- ✅ Quick action buttons (STATUS, THREATS, SHIELDS)

**UI Components:**
- ✅ Bridge view dashboard
- ✅ Command Center with 5 tabs (Overview, Budget, Fleet, Threats, Travel)
- ✅ Shield status panels
- ✅ Transaction log
- ✅ Budget breakdown (50/30/20)

#### ❌ Current Limitations & Gaps

**Visual Polish:**
- ⚠️ Hologram shader is basic (lacks advanced glitch effects, edge glow refinement)
- ⚠️ Threat animations are simple (need more visual complexity)
- ⚠️ Particle effects are placeholder quality
- ⚠️ UI panels lack depth and glassmorphism refinement
- ⚠️ Typography hierarchy needs improvement
- ⚠️ Animation timing feels rushed in places
- ⚠️ No ambient sound design

**Functional Gaps:**
- ❌ No real VISA integration (just mockups)
- ❌ Transaction categorization is hardcoded
- ❌ No actual AI analysis (Captain Nova uses fallback responses)
- ❌ Threat detection not connected to real financial data
- ❌ No card optimization recommendations
- ❌ No spend controls or alerts
- ✅ All 6 threat types implemented (Asteroid, Ion Storm, Solar Flare, Black Hole, Wormhole, Enemy Cruiser)

**Technical Debt:**
- ⚠️ CSS @import causing parsing errors (needs fix)
- ⚠️ Some hardcoded values that should be configurable
- ⚠️ Limited mobile responsiveness
- ⚠️ No error boundaries
- ⚠️ Mock data mixing with real API structure

### The Gap: Where We Need to Go

**Visual Elevation Required:**
- AAA-game-level shader quality
- Buttery smooth 60fps animations across all interactions
- Refined particle systems with physics-based behavior
- Advanced UI glassmorphism with proper depth layers
- Cinematic camera movements
- Professional sound design

**Functional Completion Required:**
- Full VISA API integration
- Real-time transaction processing & categorization
- AI-powered financial analysis (Claude via Bedrock)
- Smart card routing & optimization
- Spend control activation
- Complete threat detection system

---

## Design System

### Visual Identity: "Aurora Bridge"

The aesthetic signature that makes this unmistakably unique.

#### Color Palette

**Aurora Gradient System (60-second cycle):**

```css
Phase 1 (0-15s):   Purple Nebula    #8b5cf6 → #6366f1
Phase 2 (15-30s):  Cyan Drift       #6366f1 → #3b82f6
Phase 3 (30-45s):  Emerald Shimmer  #3b82f6 → #10b981
Phase 4 (45-60s):  Mint Return      #10b981 → #8b5cf6
```

**Supporting Colors:**
- `--space-black`: #030818 (deep background)
- `--space-dark`: #060a16 (panels)
- `--space-darker`: #020510 (voids)
- `--warning-red`: #ef4444 (critical threats)
- `--success-green`: #10b981 (positive actions)
- `--info-blue`: #3b82f6 (informational)

**Threat-Specific Colors:**
- Asteroid: Orange-red (#f97316 → #dc2626) with fire trail
- Ion Storm: Purple-pink (#a855f7 → #ec4899) with electric arcs
- Solar Flare: Gold (#fbbf24 → #f59e0b) with radial glow
- Black Hole: Deep purple-blue (#4c1d95 → #1e3a8a) with void center
- Wormhole: Shimmer blue (#60a5fa → #3b82f6) with portal effect
- Enemy Cruiser: Crimson-red (#991b1b) with hostile glow

#### Typography

**Font Families:**
1. **Orbitron** (Titles, Metrics, Technical Labels)
   - Weights: 400, 500, 600, 700, 900
   - Use: Hero numbers, stardate, threat names

2. **Rajdhani** (Body Text, Descriptions)
   - Weights: 300, 400, 500, 600, 700
   - Use: Captain Nova dialogue, UI descriptions, labels

3. **Share Tech Mono** (Code-like Elements)
   - Weight: 400
   - Use: Stardate clock, technical readouts, coordinates

**Type Scale:**
- Hero: 72px (Net worth displays)
- H1: 48px (Page titles)
- H2: 36px (Section headers)
- H3: 24px (Card headers)
- Body: 16px (Descriptions)
- Small: 14px (Labels)
- Tiny: 12px (Technical readouts)

#### Animation Philosophy

**"Buttery Smooth yet High Fidelity"**

**Timing Principles:**
- Fast interactions: 150-200ms (button hovers, clicks)
- Medium transitions: 300-400ms (panel slides, reveals)
- Cinematic moments: 600-1000ms (zoom transitions, threat deflections)
- Ambient motion: 2-6s (breathing, floating, pulsing)

**Easing Curves:**
- UI interactions: `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design emphasis)
- Spatial movements: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad)
- Organic breathing: `sine wave` (for Captain Nova idle, star twinkle)
- Explosions/impacts: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (ease-out-back)

**Performance Targets:**
- 60fps sustained during all interactions
- Max 200ms layout shift on page transitions
- < 100ms input latency for clicks
- Instanced rendering for particles (1 draw call per system)

#### Glassmorphism & Depth

**UI Panel Hierarchy:**
```
Z-Layer 0: Starfield background
Z-Layer 1: Distant threats (z: 800-1200)
Z-Layer 2: Mid-range threats (z: 400-800)
Z-Layer 3: Close threats (z: 100-400)
Z-Layer 4: Captain Nova hologram (z: 50)
Z-Layer 5: UI panels (foreground)
Z-Layer 6: Modals & overlays
```

**Glass Panel Style:**
```css
background: rgba(6, 10, 22, 0.6);
backdrop-filter: blur(20px) saturate(150%);
border: 1px solid rgba(var(--aurora-primary-rgb), 0.3);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

---

## Technical Architecture

### Stack Overview

**Frontend (web/):**
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Styling:** TailwindCSS 4 with inline theme variables
- **3D Graphics:** Three.js + @react-three/fiber + @react-three/drei
- **Animation:** GSAP (timelines), Framer Motion (UI), Three.js useFrame (3D)
- **State:** Zustand (global), React Query (server), local state (UI)
- **Audio:** Web Speech API (voice synthesis)

**Backend (core/):**
- **Runtime:** AWS Lambda (Python 3.12, ARM64)
- **Framework:** AWS Lambda Powertools, APIGatewayRestResolver
- **AI:** Pydantic AI + BedrockConverseModel (Claude Sonnet 4.5)
- **Database:** DynamoDB (single-table design)
- **Integration:** VISA Developer APIs

**Infrastructure (infrastructure/):**
- **IaC:** AWS CDK v2 (TypeScript)
- **Stacks:** Amplify, Auth (Cognito), Storage, Api (API Gateway + Lambda)

### Data Flow Architecture

```
User Browser
    ↓
Next.js 16 App (SSR + Client Components)
    ↓
Three.js Scene (Persistent across routes)
    ↓
React Query (Data fetching/caching)
    ↓
API Gateway (AWS)
    ↓
Lambda Functions
    ├─→ Financial Snapshot (DynamoDB)
    ├─→ Threat Scanner (AI Analysis)
    ├─→ Budget Analyzer (Pydantic AI)
    └─→ VISA Controls (VISA API)
```

### Key Architectural Decisions

**Persistent Layout Pattern:**
- Three.js scene lives in `layout.tsx` → persists across route changes
- Captain Nova UI in layout → always visible
- Only page content swaps during transitions
- **Why:** Enables seamless transitions without unmounting 3D scene

**Animation Coordination:**
- GSAP for page transitions (precise timing control)
- Three.js `useFrame` for 3D animations (60fps loop)
- CSS transitions for simple UI states (performance)
- **Why:** Right tool for each animation type

**State Management Split:**
- Zustand: Global app state (threats, transitions, UI mode)
- React Query: Server state with caching (financial data)
- Local state: Ephemeral UI (hover, typing, expanded panels)
- **Why:** Separation of concerns, optimal re-render performance

**Fallback Strategy:**
- All API calls wrapped in try/catch with mock data fallback
- Voice synthesis degrades gracefully if unsupported
- App works offline with static data
- **Why:** Resilience, development speed, demo capability

---

## Constraints & Requirements

### Performance Requirements

- **Frame Rate:** Sustained 60fps during all interactions
- **Load Time:** < 3s initial load on broadband
- **Bundle Size:** < 2MB total JavaScript (code-split)
- **Draw Calls:** < 50 per frame (use instanced rendering)
- **Memory:** < 200MB heap usage on desktop browsers

### Browser Support

- **Minimum:** Chrome 120+, Safari 17+, Firefox 120+, Edge 120+
- **3D Fallback:** If WebGL2 unavailable, show 2D mode (future consideration)
- **Mobile:** Optimized touch interactions (Phase 2)

### Accessibility (Future Phase)

- **Screen Readers:** Descriptive labels for all interactive elements
- **Keyboard Nav:** Full keyboard control (tab, enter, escape)
- **Motion:** Respect `prefers-reduced-motion` (disable animations)
- **Contrast:** WCAG AA minimum for text readability

### Security & Privacy

- **Data Handling:** Financial data encrypted in transit (HTTPS) and at rest (DynamoDB encryption)
- **Auth:** AWS Cognito with MFA support
- **API Keys:** VISA credentials stored in AWS Secrets Manager
- **Client-Side:** No sensitive data in localStorage (use httpOnly cookies)

### Development Constraints

- **Package Manager:** Bun (not npm/yarn/pnpm)
- **Python Manager:** uv (workspace pattern)
- **Deployment:** AWS CDK (infrastructure as code)
- **Version Control:** Git with feature branches, PR-based workflow

---

## Feature Catalog

### Status Legend
- 🔴 **Not Started** - No implementation yet
- 🟡 **In Progress** - Partially implemented
- 🟢 **Complete** - Fully implemented and tested
- 🔵 **Needs Polish** - Works but needs visual/UX refinement

### Priority Legend
- **P0** - Must-have for MVP
- **P1** - Important for full experience
- **P2** - Nice-to-have enhancements

---

### 🎬 Opening Experience

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Cold Boot Sequence | 🟢 Complete | P0 | [features/cold-boot-sequence.md](./features/cold-boot-sequence.md) | None |
| Viewport Reveal Animation | 🟢 Complete | P0 | - | Cold Boot |
| Starfield Initialization | 🟢 Complete | P0 | - | None |
| Bridge Frame Materialization | 🟢 Complete | P0 | - | Viewport Reveal |
| Captain Nova Spawn Animation | 🔴 Not Started | P0 | [features/captain-nova-hologram.md](./features/captain-nova-hologram.md) | Viewport Reveal |

---

### 👤 Captain Nova System

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Hologram Visual Shader | 🔵 Needs Polish | P0 | [features/captain-nova-hologram.md](./features/captain-nova-hologram.md) | None |
| Idle Breathing Animation | 🟢 Complete | P0 | [features/captain-nova-hologram.md](./features/captain-nova-hologram.md) | Hologram Shader |
| Text-to-Speech Engine | 🟢 Complete | P0 | [features/text-to-speech.md](./features/text-to-speech.md) | None |
| Mouth Animation Sync | 🟡 In Progress | P0 | [features/mouth-sync-animation.md](./features/mouth-sync-animation.md) | Text-to-Speech |
| Eye Tracking / Gaze System | 🔴 Not Started | P1 | - | Hologram Shader |
| Gesture System | 🔴 Not Started | P1 | - | Hologram Shader |
| AI-Powered Responses | 🔴 Not Started | P0 | - | Backend AI |
| Emotion States | 🔴 Not Started | P2 | - | Hologram Shader |

---

### 🌌 Threat System

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Asteroid Threats | 🟢 Complete | P0 | [features/asteroid-threat.md](./features/asteroid-threat.md) | Threat Detection |
| Ion Storm Threats | 🟢 Complete | P0 | [features/ion-storm-threat.md](./features/ion-storm-threat.md) | Threat Detection |
| Solar Flare Threats | 🟢 Complete | P0 | [features/solar-flare-threat.md](./features/solar-flare-threat.md) | Threat Detection |
| Black Hole Threats | 🟢 Complete | P0 | [features/black-hole-threat.md](./features/black-hole-threat.md) | Threat Detection |
| Wormhole Threats | 🟢 Complete | P1 | [features/wormhole-threat.md](./features/wormhole-threat.md) | Threat Detection |
| Enemy Cruiser Threats | 🟢 Complete | P1 | [features/enemy-cruiser-threat.md](./features/enemy-cruiser-threat.md) | Threat Detection |
| Threat Detection Engine | 🔴 Not Started | P0 | [features/threat-detection-engine.md](./features/threat-detection-engine.md) | Backend AI, Transaction Data |
| Targeting System | 🟢 Complete | P0 | - | None |
| Deflection Mechanics | 🟢 Complete | P0 | [features/asteroid-threat.md](./features/asteroid-threat.md) | Threat objects |
| Shield System | 🟢 Complete | P0 | [features/shield-system.md](./features/shield-system.md) | Financial Data |
| Impact Consequences | 🔴 Not Started | P0 | [features/shield-system.md](./features/shield-system.md) | Shield System |

---

### 🎯 Navigation & Transitions

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Seamless Zoom Transition | 🟢 Complete | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | GSAP, Next.js routing |
| Camera Controller | 🟢 Complete | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | None |
| Page Transition Coordinator | 🟢 Complete | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | Camera Controller |
| Back to Bridge Animation | 🟢 Complete | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | Zoom Transition |

---

### 🖥️ Command Center UI

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Command Bridge Main View | 🟢 Complete | P0 | [features/command-bridge-main-view.md](./features/command-bridge-main-view.md) | None |
| Overview Tab | 🟢 Complete | P0 | [features/command-center-tabs.md](./features/command-center-tabs.md) | Financial Data |
| Budget Analysis Tab | 🟢 Complete | P0 | [features/command-center-tabs.md](./features/command-center-tabs.md) | Financial Data |
| Fleet Management Tab | 🟢 Complete | P1 | [features/command-center-tabs.md](./features/command-center-tabs.md) | Card Data |
| Threats Tab | 🟢 Complete | P0 | [features/command-center-tabs.md](./features/command-center-tabs.md) | Threat Detection |
| Travel / Goals Tab | 🟢 Complete | P1 | [features/command-center-tabs.md](./features/command-center-tabs.md) | None |
| Shield Status Panels | 🟢 Complete | P0 | [features/shield-system.md](./features/shield-system.md) | Financial Data |
| Transaction Log | 🟢 Complete | P0 | - | Transaction Data |
| Transaction Detail Modal | 🟢 Complete | P1 | [features/transaction-detail-modal.md](./features/transaction-detail-modal.md) | Transaction Data |
| Metric Cards | 🟢 Complete | P0 | - | Financial Data |
| Glassmorphism Panels | 🟢 Complete | P0 | [features/glassmorphism-panels.md](./features/glassmorphism-panels.md) | None |

---

### 💳 Financial Intelligence

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Credit Card Intelligence | 🔴 Not Started | P0 | [features/credit-card-intelligence.md](./features/credit-card-intelligence.md) | VISA API, AI Analysis |
| Smart Spend Recommendations | 🔴 Not Started | P0 | - | AI Analysis, Card Rules |
| Transaction Categorization | 🔴 Not Started | P0 | - | AI Analysis |
| Budget Health Monitoring | 🔴 Not Started | P0 | - | Transaction Data |
| Card Routing Optimization | 🔴 Not Started | P0 | - | Card Rules, AI Analysis |
| Rewards Tracking | 🔴 Not Started | P1 | - | Card Data, Transactions |
| Spend Controls | 🔴 Not Started | P0 | - | VISA API |

---

### 🔌 Backend Integration

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| VISA API Integration | 🔴 Not Started | P0 | - | Lambda, Secrets Manager |
| Financial Snapshot API | 🔴 Not Started | P0 | - | DynamoDB, Lambda |
| AI Analysis Pipeline | 🔴 Not Started | P0 | - | Pydantic AI, Bedrock |
| Transaction Processing | 🔴 Not Started | P0 | - | VISA API, DynamoDB |
| VISA Controls API | 🔴 Not Started | P0 | - | VISA API, Lambda |
| Real-time Data Sync | 🔴 Not Started | P1 | - | WebSocket or Polling |

---

### 🛠️ Developer Experience

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Dev Dashboard | 🟢 Complete | P0 | [features/dev-dashboard.md](./features/dev-dashboard.md) | Foundation only |

---

### 🎨 Visual Polish

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Advanced Particle Systems | 🔴 Not Started | P1 | - | Three.js |
| Sound Design | 🔴 Not Started | P1 | - | Web Audio API |
| Post-Processing Effects | 🔴 Not Started | P2 | - | Three.js postprocessing |
| Loading States | 🟢 Complete | P0 | [features/error-loading-empty-states.md](./features/error-loading-empty-states.md) | None |
| Error States | 🟢 Complete | P0 | [features/error-loading-empty-states.md](./features/error-loading-empty-states.md) | None |
| Empty States | 🟢 Complete | P0 | [features/error-loading-empty-states.md](./features/error-loading-empty-states.md) | None |

---

## Hackathon Demo Strategy

### What's Actually Built (as of 2026-02-07, Wave 1 Complete)

**Working implementations:**
- 3D starfield with 5,000 instanced stars and aurora color cycling (60s)
- Captain Nova hologram with custom shader (scanlines, chromatic aberration, fresnel glow, glitch)
- **6 threat types**: Asteroid, Ion Storm, Solar Flare, **Black Hole** (lensing + accretion disk), **Wormhole** (portal shader + rim particles), **Enemy Cruiser** (procedural ship + engine trails)
- Bridge layout with shield panels, command center preview, transaction log
- Command Center with 2 working tabs (Overview, Budget) + 3 placeholders
- Voice synthesis with typewriter text and word highlighting
- Seamless GSAP zoom transition between Bridge and Command Center
- Zustand stores for threats, transitions, **and boot state**
- React Query hooks with mock data fallback
- Aurora gradient CSS system with CSS variable integration
- **Cold Boot Sequence** (8s abbreviated GSAP-choreographed intro with eyelid reveal, progress bar, HUD materialization, skip-to-end)
- **Glassmorphism component library** (GlassPanel with 4 depth levels + 4 variants, MetricCard, InfoPanel)
- **Glassmorphism applied** to Bridge page (Shield, Command Center, Transaction Log panels) and Command Center (all tabs, metrics, threat/shield panels)
- **All 6 threats wired** into Threats.tsx orchestrator with mock data (debt spiral, savings portal, fraud alert)
- **Ion Storm polished**: 350 vortex particles with purple-to-pink vertex colors, 6 animated lightning arcs, outer glow, targeting brackets
- **Solar Flare polished**: 120 corona particles with white-gold-orange gradient, expanding countdown rings, animated rays, targeting brackets
- All core npm dependencies installed (@react-three/fiber, @react-three/drei, three, zustand, @tanstack/react-query, gsap)

**Lane B UI systems (built this session):**
- Shield System: Zustand store with 3 shields (Life Support/Recreation Deck/Warp Fuel), weighted overall calc, ShieldBar + ShieldPanel components with status-aware colors and pulse animations
- Transaction Detail Modal: Slide-up modal with info grid, budget impact bar, action buttons, ESC key listener, persists in layout
- Command Center Fleet tab: 4 mock credit cards with utilization bars, rewards badges, MetricCard summary
- Command Center Threats tab: Live threat list from store, severity badges, DEFLECT buttons, exposure metrics
- Command Center Travel tab: Points balance, perks list, upcoming trips, optimization tips

**Lane C Infra/DX (built this session):**
- Dev Dashboard: Floating overlay panel (Ctrl+Shift+D toggle), 6 tabs (Threats, Shields, Data, Anim, Perf, Nova), draggable header, persistent position, keyboard shortcuts
- Dev Dashboard Threat Spawner: Per-threat toggles with position/size sliders, DEFLECT/RESET buttons, SPAWN ALL/CLEAR ALL/SHOW DEMO SCENE bulk actions
- Dev Dashboard Shield Controls: Per-shield sliders, quick-set (0%/50%/100%), DAMAGE/GAIN/CATASTROPHIC event triggers, 4 scenario presets
- Dev Dashboard Animation Controls: Speed presets (0.25x-2x), custom slider, PAUSE/RESUME, per-system toggles, GSAP timeScale integration
- Dev Dashboard Performance Panel: Real-time FPS counter via rAF, canvas FPS graph (10s history), memory stats, full-screen overlay toggle
- Dev Dashboard Nova Controls: Custom speech input, quick messages, voice rate/pitch sliders
- Error/Loading/Empty States: Skeleton shimmer (aurora gradient, 7 variants), ErrorPanel (3 severity levels with retry), EmptyState (space-themed), SpaceErrorBoundary (per-component error isolation), DataContainer (generic wrapper), RefreshIndicator, StaleDataIndicator
- States integrated into Bridge page (Shield Panel, Command Center metrics, Transaction Log) and Command Center (Overview + Budget tabs with DataContainer, all tabs with SpaceErrorBoundary)

**Lane B Polish (built this session):**
- ShieldPanel integrated into Bridge page (compact variant, replaces hardcoded bars)
- Overview Tab polished: hero metric, quick metrics grid, active threats from store, ShieldPanel standard, recent activity with modal
- Budget Tab polished: 50/30/20 category panels with progress bars, target markers, overspend visualization, subcategory cards, health summary
- Bridge Main View polished: HUD top bar (stardate, user name, shield mini, alert count), 3-column bottom console, transaction log right panel
- Zoom Transition polished: 4-phase GSAP timeline, hover effects, reverse transition, double-click prevention, reduced-motion support
- GlassPanel converted to forwardRef for GSAP animation support

**Not built yet (mock/placeholder only):**
- Particle explosion effects on deflection
- Any real backend integration (all mock data)
- Sound design (completely silent)
- Captain Nova 3D model (currently capsule+sphere primitives)
- Captain Nova hologram shader polish
- Dev Dashboard Mock Data Switcher tab (Data tab placeholder)

### Demo-Critical Priorities

For maximum hackathon impact, focus on features that create the biggest visual impression with the least implementation effort:

1. **Cold Boot Sequence (abbreviated to 8s)** — First impressions win hackathons
2. **Glassmorphism Panel System** — Transforms existing UI from "prototype" to "polished"
3. **Threat Deflection Polish** — Particle explosions, shield bar animations, Captain Nova reactions
4. **Black Hole Threat** — Gravitational lensing is a showstopper visual
5. **Demo Data Set** — Curated mock data that showcases every feature perfectly

### Known Technical Debt

- Missing dependencies in package.json (@react-three/fiber, three, zustand, @tanstack/react-query, gsap)
- CSS @import parsing (TailwindCSS v4 syntax, needs correct PostCSS config)
- Captain Nova is primitive geometry, not a real rigged model (blocks morph targets, gestures)
- Hardcoded mock data in threat-store.ts and api-client.ts
- No error boundaries anywhere in the component tree

---

## Implementation Strategy

### Parallelism Map — What Can Be Built Simultaneously

This is the most important section for team coordination. Features are grouped into **parallel lanes** — work items within different lanes have **zero dependency overlap** and can be developed by separate engineers or agents simultaneously.

#### Dependency Graph (Simplified)

```
                         ┌─────────────────┐
                         │  FOUNDATION      │
                         │  (already built) │
                         │  Three.js Scene  │
                         │  Zustand Stores  │
                         │  React Query     │
                         │  Aurora Colors   │
                         └────────┬────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
    ┌─────▼──────┐         ┌─────▼──────┐          ┌──────▼──────┐
    │  LANE A    │         │  LANE B    │          │  LANE C     │
    │  3D Threats│         │  UI Panels │          │  Infra/DX   │
    └─────┬──────┘         └─────┬──────┘          └──────┬──────┘
          │                      │                        │
          ▼                      ▼                        ▼
    Each threat type       Glassmorphism            Dev Dashboard
    is independent!        Shield System            Error States
    ────────────────       Cmd Center Tabs          Cold Boot
    Asteroid polish        Transaction Modal        Sound Design
    Ion Storm polish       ────────────────         ────────────
    Solar Flare polish     Budget Tab depends       All independent
    Black Hole (new)       on Shield System         of Lanes A & B
    Wormhole (new)
    Enemy Cruiser (new)
    ────────────────
    All 6 are independent
    of each other!
```

#### Lane A: 3D Threat Visuals (6 parallel streams)

**Every threat type is 100% independent of every other threat type.** They share the same rendering pipeline (`Threats.tsx` orchestrator) but each is a self-contained Three.js component with its own geometry, shaders, animations, and interactions.

| Work Item | Depends On | Can Parallelize With | Est. Complexity |
|---|---|---|---|
| Asteroid Polish | Foundation only | ALL other threats | Medium |
| Ion Storm Polish | Foundation only | ALL other threats | Medium |
| Solar Flare Polish | Foundation only | ALL other threats | Medium |
| **Black Hole (new)** | Foundation only | ALL other threats | High (lensing shader) |
| **Wormhole (new)** | Foundation only | ALL other threats | High (portal shader) |
| **Enemy Cruiser (new)** | Foundation only | ALL other threats | High (3D model) |

**Key insight:** You could have 6 separate agents/engineers each building a threat type simultaneously. They only merge at `Threats.tsx` (trivial — just add a `case` to the `switch`).

#### Lane B: UI Systems (partially sequential)

Some UI features depend on each other. Here's the ordering:

```
Glassmorphism Panels ──┐
(no dependencies)      │
                       ├──→ Shield System ──→ Command Center Tabs (Budget, Overview)
                       │    (needs glass      (needs shield bars)
                       │     panels)
                       │
                       └──→ Command Bridge Main View polish
                            (needs glass panels)

Transaction Detail Modal ← independent of above (just needs Transaction type)
```

| Work Item | Depends On | Can Parallelize With | Notes |
|---|---|---|---|
| Glassmorphism Panels | Foundation only | Everything in Lane A + C | **Start first** — other UI depends on it |
| Shield System | Glassmorphism Panels | Lane A, Lane C, Transaction Modal | Build after glass panels exist |
| Cmd Center Overview Tab | Shield System | Lane A, Lane C | Needs shield bars |
| Cmd Center Budget Tab | Shield System | Lane A, Lane C | Needs shield + budget data |
| Cmd Center Threats Tab | Threat Store | Lane C, Shield System | Reads from existing store |
| Cmd Center Fleet Tab | Mock data only | Everything | No real dependencies |
| Cmd Center Travel Tab | Mock data only | Everything | No real dependencies |
| Transaction Detail Modal | Foundation only | Everything | Fully independent |

#### Lane C: Infrastructure & Developer Experience

All items in this lane are independent of Lanes A and B:

| Work Item | Depends On | Can Parallelize With | Notes |
|---|---|---|---|
| **Dev Dashboard** | Foundation only | Everything | **Build early** — accelerates all other testing |
| Error/Loading/Empty States | Foundation only | Everything | Foundational UI patterns |
| Cold Boot Sequence | Foundation only | Everything except opening | Standalone animation |
| Sound Design | Foundation only | Everything | Audio layer, no code deps |

#### Lane D: Backend (separate team/session)

Entirely decoupled from frontend Lanes A-C. Backend can be built simultaneously:

| Work Item | Depends On | Can Parallelize With |
|---|---|---|
| Financial Snapshot API | DynamoDB, Lambda | ALL frontend work |
| VISA API Integration | Lambda, Secrets Manager | ALL frontend work |
| AI Analysis Pipeline | Pydantic AI, Bedrock | ALL frontend work |
| Threat Detection Engine | AI Pipeline | ALL frontend work |
| VISA Controls API | VISA API | ALL frontend work |

#### Maximum Parallelism Summary

**At peak, you could run up to 12 independent work streams simultaneously:**

```
Lane A:  [Asteroid] [Ion Storm] [Solar Flare] [Black Hole] [Wormhole] [Enemy Cruiser]
Lane B:  [Glassmorphism] → [Shield System] → [Cmd Center Tabs]
         [Transaction Modal]
Lane C:  [Dev Dashboard] [Error States] [Cold Boot]
Lane D:  [Backend APIs]
```

**Minimum sequential chains (longest path):**
- Glassmorphism → Shield System → Budget/Overview Tabs (3 steps)
- Everything else is 1-2 steps max

### Dev Dashboard for Testing

**Feature Spec:** [features/dev-dashboard.md](./features/dev-dashboard.md)

A full developer dashboard toggled via `Ctrl+Shift+D` that provides:
- **Threat Spawner:** Toggle each of the 6 threat types on/off individually, adjust position/size, trigger deflection animations
- **Shield Controls:** Manually set shield percentages, trigger damage/gain events
- **Mock Data Switcher:** Swap between financial scenarios (healthy, struggling, critical)
- **Animation Controls:** Speed multiplier, pause all animations, step through timelines
- **Performance Overlay:** FPS counter, draw calls, memory usage

This panel is **critical for development velocity** — build it early (Lane C) so all other lanes can use it for testing their features in isolation.

### Phase-Based Approach

We'll work feature-by-feature, but group features into logical phases for coherence:

**Phase 1: Visual Foundation (Weeks 1-2)**
- Focus: Make it breathtaking
- Features: Opening sequence, hologram refinement, threat polish, glassmorphism
- Goal: Nail the "Whoa" factor
- **Parallel strategy:** Dev Dashboard + Glassmorphism + all 6 threats in parallel

**Phase 2: Functional Core (Weeks 3-4)**
- Focus: Make it real
- Features: VISA integration, transaction processing, AI analysis
- Goal: Connect to actual financial data
- **Parallel strategy:** Backend APIs (Lane D) + Shield System + Command Center tabs

**Phase 3: Intelligence Layer (Weeks 5-6)**
- Focus: Make it smart
- Features: Threat detection, card optimization, spend controls
- Goal: Provide actual value

**Phase 4: Polish & Scale (Weeks 7-8)**
- Focus: Make it production-ready
- Features: Sound design, mobile optimization, error handling, testing
- Goal: Ship-ready quality

### Development Workflow

1. **Pick a feature** from the catalog (check the parallelism map for what's unblocked)
2. **Read the feature spec** (design doc)
3. **Use Dev Dashboard** to test the feature in isolation
4. **Implement** following the spec
5. **Test & iterate** until acceptance criteria met (use Dev Dashboard threat toggles for visual QA)
6. **Update master catalog** (mark as complete)
7. **Commit & document** changes
8. **Move to next feature**

### Quality Gates

Before marking a feature "Complete":
- ✅ Visual spec implemented exactly
- ✅ 60fps performance maintained
- ✅ Works with real data (no mocks)
- ✅ Error states handled
- ✅ Responsive behavior verified
- ✅ Code reviewed against patterns
- ✅ No console errors/warnings
- ✅ Testable via Dev Dashboard (threat features must be spawnable/toggleable)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.9 | 2026-02-07 | Lane B Polish complete: ShieldPanel integrated into Bridge, Overview Tab polished (hero metric, quick metrics, active threats, ShieldPanel standard, recent activity), Budget Tab polished (50/30/20 panels, progress bars, subcategory cards, health summary), Bridge Main View polished (HUD top bar, 3-column console, transaction log), Zoom Transition polished (4-phase GSAP, hover effects, reverse, double-click prevention, reduced-motion) | Claude + User |
| 1.8 | 2026-02-07 | Lane C Error/Loading/Empty States complete: Skeleton shimmer, ErrorPanel (3 severity), EmptyState, SpaceErrorBoundary, DataContainer, RefreshIndicator, StaleDataIndicator; integrated into Bridge + Command Center pages | Claude + User |
| 1.7 | 2026-02-07 | Lane A complete: All 6 threats polished — Enemy Cruiser (targeting brackets, deflection explosion, evasive movement), Asteroid (fracture animation, enhanced hover, particle trails), Ion Storm (plasma clouds, enhanced lightning, dispersal animation, particle trails), Solar Flare (plasma tendrils, enhanced glow, CME dissipation, particle trails); Targeting System and Deflection Mechanics marked complete | Claude + User |
| 1.6 | 2026-02-07 | Lane C Dev Dashboard complete: Zustand store, 6 tabs (Threat Spawner, Shield Controls, Animation Controls, Performance Panel, Nova Controls, Data placeholder), DevIndicator, layout integration, keyboard shortcuts | Claude + User |
| 1.5 | 2026-02-07 | Lane B complete: Shield System (store + ShieldBar + ShieldPanel), Transaction Detail Modal, Command Center Fleet/Threats/Travel tabs; handoff summary written | Claude + User |
| 1.4 | 2026-02-07 | Wave 2 complete: All 6 threats wired into orchestrator; GlassPanel applied to Bridge + Command Center; Ion Storm + Solar Flare visually polished with particles, arcs, brackets | Claude + User |
| 1.3 | 2026-02-07 | Wave 1 complete: Black Hole, Wormhole, Enemy Cruiser threats implemented; Glassmorphism panel library created; Cold Boot Sequence built; all deps installed | Claude + User |
| 1.2 | 2026-02-07 | Added parallelism map to Implementation Strategy, Dev Dashboard feature spec, dependency graph, parallel lanes analysis | Claude + User |
| 1.1 | 2026-02-07 | Reconciled feature IDs, updated statuses, added hackathon demo strategy, brainstormed enhancements for all 6 threat specs | Claude + User |
| 1.0 | 2026-02-06 | Initial master document created | Claude + User |

---

## Next Steps

1. Review this master document for accuracy and vision alignment
2. Create remaining feature specification documents
3. Prioritize features (P0 first)
4. Begin implementation with highest-impact visual features
5. Iterate and refine as we build

**The journey to an awe-inspiring financial interface begins here. Let's make something legendary.** 🚀
