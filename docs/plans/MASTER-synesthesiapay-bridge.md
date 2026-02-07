# SynesthesiaPay Bridge - Master Design Document

**Version:** 1.0
**Last Updated:** 2026-02-06
**Status:** Living Document

---

## Table of Contents

1. [Vision](#vision)
2. [Current State](#current-state)
3. [Design System](#design-system)
4. [Technical Architecture](#technical-architecture)
5. [Constraints & Requirements](#constraints--requirements)
6. [Feature Catalog](#feature-catalog)
7. [Implementation Strategy](#implementation-strategy)

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
- ❌ Missing threat types (Black Hole, Wormhole, Enemy Cruisers)

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
| Cold Boot Sequence | 🔴 Not Started | P0 | - | None |
| Viewport Reveal Animation | 🔴 Not Started | P0 | - | Cold Boot |
| Starfield Initialization | 🟢 Complete | P0 | - | None |
| Bridge Frame Materialization | 🔴 Not Started | P0 | - | Viewport Reveal |
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
| Asteroid Threats | 🔵 Needs Polish | P0 | [features/asteroid-threat.md](./features/asteroid-threat.md) | Threat Detection |
| Ion Storm Threats | 🔵 Needs Polish | P0 | - | Threat Detection |
| Solar Flare Threats | 🔵 Needs Polish | P0 | - | Threat Detection |
| Black Hole Threats | 🔴 Not Started | P0 | - | Threat Detection |
| Wormhole Threats | 🔴 Not Started | P1 | - | Threat Detection |
| Enemy Cruiser Threats | 🔴 Not Started | P1 | - | Threat Detection |
| Threat Detection Engine | 🔴 Not Started | P0 | - | Backend AI, Transaction Data |
| Targeting System | 🟡 In Progress | P0 | - | None |
| Deflection Mechanics | 🟡 In Progress | P0 | [features/asteroid-threat.md](./features/asteroid-threat.md) | Threat objects |
| Impact Consequences | 🔴 Not Started | P0 | - | Shield System |

---

### 🎯 Navigation & Transitions

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Seamless Zoom Transition | 🔵 Needs Polish | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | GSAP, Next.js routing |
| Camera Controller | 🟢 Complete | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | None |
| Page Transition Coordinator | 🟡 In Progress | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | Camera Controller |
| Back to Bridge Animation | 🟡 In Progress | P0 | [features/zoom-transition.md](./features/zoom-transition.md) | Zoom Transition |

---

### 🖥️ Command Center UI

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Command Bridge Main View | 🔵 Needs Polish | P0 | - | None |
| Overview Tab | 🟡 In Progress | P0 | - | Financial Data |
| Budget Analysis Tab | 🟡 In Progress | P0 | - | Financial Data |
| Fleet Management Tab | 🔴 Not Started | P1 | - | Card Data |
| Threats Tab | 🔴 Not Started | P0 | - | Threat Detection |
| Travel / Goals Tab | 🔴 Not Started | P1 | - | None |
| Shield Status Panels | 🔵 Needs Polish | P0 | - | Financial Data |
| Transaction Log | 🔵 Needs Polish | P0 | - | Transaction Data |
| Metric Cards | 🟡 In Progress | P0 | - | Financial Data |
| Glassmorphism Panels | 🔴 Not Started | P0 | - | None |

---

### 💳 Financial Intelligence

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Credit Card Intelligence | 🔴 Not Started | P0 | - | VISA API, AI Analysis |
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
| Real-time Data Sync | 🔴 Not Started | P1 | - | WebSocket or Polling |

---

### 🎨 Visual Polish

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Advanced Particle Systems | 🔴 Not Started | P1 | - | Three.js |
| Sound Design | 🔴 Not Started | P1 | - | Web Audio API |
| Post-Processing Effects | 🔴 Not Started | P2 | - | Three.js postprocessing |
| Loading States | 🔴 Not Started | P0 | - | None |
| Error States | 🔴 Not Started | P0 | - | None |
| Empty States | 🔴 Not Started | P0 | - | None |

---

## Implementation Strategy

### Phase-Based Approach

We'll work feature-by-feature, but group features into logical phases for coherence:

**Phase 1: Visual Foundation (Weeks 1-2)**
- Focus: Make it breathtaking
- Features: Opening sequence, hologram refinement, threat polish, glassmorphism
- Goal: Nail the "Whoa" factor

**Phase 2: Functional Core (Weeks 3-4)**
- Focus: Make it real
- Features: VISA integration, transaction processing, AI analysis
- Goal: Connect to actual financial data

**Phase 3: Intelligence Layer (Weeks 5-6)**
- Focus: Make it smart
- Features: Threat detection, card optimization, spend controls
- Goal: Provide actual value

**Phase 4: Polish & Scale (Weeks 7-8)**
- Focus: Make it production-ready
- Features: Sound design, mobile optimization, error handling, testing
- Goal: Ship-ready quality

### Development Workflow

1. **Pick a feature** from the catalog
2. **Read the feature spec** (design doc)
3. **Create build guide** for that feature
4. **Implement** following the guide
5. **Test & iterate** until acceptance criteria met
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

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | Initial master document created | Claude + User |

---

## Next Steps

1. Review this master document for accuracy and vision alignment
2. Create remaining feature specification documents
3. Prioritize features (P0 first)
4. Begin implementation with highest-impact visual features
5. Iterate and refine as we build

**The journey to an awe-inspiring financial interface begins here. Let's make something legendary.** 🚀
