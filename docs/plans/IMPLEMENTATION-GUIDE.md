# Implementation Guide & Process Steering Document

**Version:** 1.0
**Last Updated:** 2026-02-06
**Purpose:** Define the systematic process for building features, maintaining documentation, and tracking progress

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Selection Process](#feature-selection-process)
3. [Implementation Workflow](#implementation-workflow)
4. [Build Guide Creation](#build-guide-creation)
5. [Status Updates](#status-updates)
6. [Quality Gates](#quality-gates)
7. [Git Workflow](#git-workflow)
8. [Documentation Maintenance](#documentation-maintenance)

---

## Overview

### Philosophy

This project uses a **spec-first, iterative development** approach:

1. **Specs define the vision** - Feature specs describe what we're building in detail
2. **Build guides provide the path** - Step-by-step implementation plans created from specs
3. **Implementation delivers the reality** - Code written following build guides
4. **Documentation reflects truth** - Master catalog always shows accurate status

### The Documentation Pyramid

```
┌──────────────────────────────────────┐
│   MASTER DOCUMENT                    │  ← Single source of truth
│   (Feature catalog with status)      │     Updated after each feature
├──────────────────────────────────────┤
│   FEATURE SPECS (15+ documents)      │  ← Detailed specifications
│   (What to build, why, how)          │     Created during planning
├──────────────────────────────────────┤
│   BUILD GUIDES (created on-demand)   │  ← Implementation roadmaps
│   (Step-by-step instructions)        │     Created before coding
├──────────────────────────────────────┤
│   CODE (implementation)              │  ← The actual product
│   (TypeScript, Python, GLSL)         │     Written following guides
└──────────────────────────────────────┘
```

### Key Principle

**The master document is the dashboard.** It must always reflect current reality. When a feature's status changes, update the master document immediately.

---

## Feature Selection Process

### Step 1: Review Current State

**Check the master document's feature catalog:**

```markdown
# In MASTER-synesthesiapay-bridge.md

## Feature Catalog

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Hologram Visual Shader | 🔵 Needs Polish | P0 | [link] | None |
| Cold Boot Sequence | 🔴 Not Started | P0 | [link] | Hologram Shader |
```

**Status Legend:**
- 🔴 **Not Started** - No implementation yet
- 🟡 **In Progress** - Actively being worked on
- 🔵 **Needs Polish** - Works but needs refinement
- 🟢 **Complete** - Fully implemented and tested

### Step 2: Apply Selection Criteria

**Choose features based on:**

1. **Priority (P0 first)**
   - P0 = Must-have for MVP
   - P1 = Important for full experience
   - P2 = Nice-to-have enhancements

2. **Dependencies (unblocked)**
   - Only pick features with no dependencies
   - OR features whose dependencies are 🟢 Complete

3. **Logical Grouping**
   - Prefer completing related features together
   - Example: All threat types, then threat detection engine

4. **Impact vs Effort**
   - High-impact, low-effort features first (quick wins)
   - Visual features early (demonstrate progress)
   - Complex integrations later (once foundation solid)

### Step 3: Declare Intent

**Before starting, update the master document:**

```markdown
| Hologram Visual Shader | 🟡 In Progress | P0 | [link] | None |
```

**Also update the feature spec's version section:**

```markdown
# In features/captain-nova-hologram.md

**Status:** 🟡 In Progress
**Current Version:** 0.4 → 0.8 (in development)
```

**Why?** This prevents duplicate work and signals to others what you're working on.

---

## Implementation Workflow

### The 7-Step Process

```
1. Select Feature
   ↓
2. Read Feature Spec (thoroughly)
   ↓
3. Create Build Guide (step-by-step plan)
   ↓
4. Implement (write code)
   ↓
5. Test (verify acceptance criteria)
   ↓
6. Update Documentation (mark complete)
   ↓
7. Commit & Review
```

### Detailed Breakdown

#### Step 1: Select Feature
- Use selection process above
- Update master document: 🔴 → 🟡

#### Step 2: Read Feature Spec
**Read the entire spec carefully:**
- Visual specifications (know what it should look like)
- Technical requirements (understand dependencies)
- Acceptance criteria (know when you're done)
- Implementation checklist (see the phases)

**Take notes on:**
- Unclear requirements (ask questions before coding)
- Missing dependencies (install packages first)
- Risky areas (plan extra time for testing)

#### Step 3: Create Build Guide
**Create a new document:**
`docs/plans/build-guides/YYYY-MM-DD-feature-name.md`

**Format:** (See "Build Guide Creation" section below)

**Purpose:** Transform spec into executable steps

#### Step 4: Implement
**Follow the build guide step-by-step:**
- Check off each step as you complete it
- Commit frequently (see Git Workflow)
- Test continuously (don't wait until end)

**If you deviate from the guide:**
- Update the build guide (keep it accurate)
- If major, update the feature spec too

#### Step 5: Test
**Run through all acceptance criteria:**
```markdown
## Acceptance Criteria

### ✅ Visual Quality
- [x] Hologram looks translucent but clearly visible
- [x] Scanlines are subtle (visible but not distracting)
- [ ] Chromatic aberration visible on edges  ← FAILING
```

**Do NOT mark feature complete if any criteria fail.**

**If tests fail:**
- Fix the issue
- Re-test
- Only proceed when ALL boxes checked

#### Step 6: Update Documentation

**Update THREE places:**

1. **Feature Spec** (`features/feature-name.md`):
   ```markdown
   **Status:** 🟢 Complete
   **Current Version:** 1.0

   ## Revision History
   | Version | Date | Changes |
   |---------|------|---------|
   | 1.0 | 2026-02-06 | Full implementation completed |
   ```

2. **Master Document** (`MASTER-synesthesiapay-bridge.md`):
   ```markdown
   | Hologram Visual Shader | 🟢 Complete | P0 | [link] | None |
   ```

3. **Build Guide** (if created):
   Add completion note at top:
   ```markdown
   **Status:** ✅ Completed 2026-02-06
   **Result:** Feature fully implemented and tested
   **Actual time:** 4 hours (estimated: 3 hours)
   **Learnings:** Shader compilation took longer than expected...
   ```

#### Step 7: Commit & Review

**Create descriptive commit:**
```bash
git add <files>
git commit -m "feat: implement hologram visual shader system

- Add 7 shader components (scanlines, chromatic aberration, etc.)
- Implement breathing animation with sine wave
- Add eye tracking system with cursor following
- Integrate with aurora color system
- All acceptance criteria passing

Closes: NOVA-001

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Self-review checklist:**
- [ ] All acceptance criteria checked
- [ ] Code follows project patterns (see CLAUDE.md)
- [ ] No console errors/warnings
- [ ] Performance targets met (60fps)
- [ ] Documentation updated (all 3 places)

---

## Build Guide Creation

### When to Create a Build Guide

**Always create a build guide for:**
- P0 features (critical path)
- Complex features (> 3 files touched)
- Features with tricky integration (backend + frontend)
- Features you're building for the first time

**Can skip build guide for:**
- Tiny tweaks (1-2 line changes)
- Features you've built many times before
- Urgent hotfixes

### Build Guide Template

**File:** `docs/plans/build-guides/YYYY-MM-DD-feature-name.md`

```markdown
# Build Guide: [Feature Name]

**Feature Spec:** [link to spec]
**Created:** YYYY-MM-DD
**Estimated Time:** X hours
**Status:** 🏗️ In Progress / ✅ Completed

---

## Pre-Implementation Checklist

**Dependencies to install:**
- [ ] Package 1: `bun add package-name`
- [ ] Package 2: `uv add package-name`

**Files to read first:**
- [ ] `path/to/related-file.tsx` (understand existing pattern)
- [ ] `path/to/integration-point.ts` (see where this connects)

**Decisions to make:**
- [ ] Which shader approach? (Option A vs Option B)
- [ ] Where to put shared types? (Create new file or extend existing?)

---

## Implementation Steps

### Phase 1: Foundation (Est: 30min)

**Step 1.1: Create shader files**
```bash
mkdir -p web/components/three/shaders
touch web/components/three/shaders/HologramMaterial.ts
touch web/components/three/shaders/hologramVertex.glsl
touch web/components/three/shaders/hologramFragment.glsl
```

- [ ] Files created
- [ ] Basic shader structure in place

**Step 1.2: Define shader uniforms**
```typescript
// In HologramMaterial.ts
const uniforms = {
  time: { value: 0 },
  hologramOpacity: { value: 0.8 },
  // ... (from spec)
};
```

- [ ] Uniforms defined
- [ ] TypeScript types added

### Phase 2: Shader Components (Est: 2h)

**Step 2.1: Implement base transparency**
```glsl
// In hologramFragment.glsl
uniform float hologramOpacity;
vec4 finalColor = vec4(color.rgb, color.a * hologramOpacity);
```

- [ ] Transparency working
- [ ] Can see starfield through hologram

**Step 2.2: Add scanline effect**
[Detailed code from spec]

- [ ] Scanlines visible
- [ ] Moving upward at correct speed

[Continue for all 7 shader components...]

### Phase 3: Integration (Est: 1h)

**Step 3.1: Apply material to Nova mesh**
- [ ] Material applied
- [ ] Hologram appears in scene

**Step 3.2: Connect to aurora color system**
- [ ] Colors update when aurora cycles
- [ ] Smooth transition (300ms)

### Phase 4: Testing (Est: 30min)

**Run through acceptance criteria:**
- [ ] Visual quality checks (all boxes)
- [ ] Animation quality checks (all boxes)
- [ ] Performance checks (60fps sustained)
- [ ] Integration checks (works with other features)

---

## Actual Implementation Notes

**Issues encountered:**
- Problem: Shader compilation error on Safari
- Solution: Changed `texture2D` to `texture` for WebGL2

**Time tracking:**
- Phase 1: 25min (faster than expected)
- Phase 2: 2.5h (shader debugging took extra time)
- Phase 3: 45min (as expected)
- Phase 4: 20min (tests passed first try)
- **Total: 3h 40min**

**Key learnings:**
- Always test shaders in Safari early (different WebGL support)
- Fresnel calculations are expensive, use LOD on low-end devices

---

## Completion Checklist

- [x] All implementation steps completed
- [x] All acceptance criteria passing
- [x] Documentation updated (feature spec + master doc)
- [x] Code committed with descriptive message
- [x] Build guide marked complete

**Completed:** 2026-02-06
```

### How to Use Build Guides

**During implementation:**
1. Check off steps as you complete them
2. Add notes in "Actual Implementation Notes"
3. Track time spent per phase
4. Document issues and solutions

**After completion:**
- Keep the guide (future reference)
- Note actual vs estimated time (improve estimates)
- Extract learnings (avoid same mistakes)

**For others:**
- Build guides show how you approached the problem
- Useful for code review context
- Helpful for similar features later

---

## Status Updates

### When to Update Status

**Update immediately when:**
- Starting a feature (🔴 → 🟡)
- Completing a feature (🟡 → 🟢)
- Discovering a feature needs work (🟢 → 🔵)
- Blocking/unblocking a feature (add/remove dependencies)

### How to Update Status

**1. Update Master Document**

```markdown
# In MASTER-synesthesiapay-bridge.md

## Feature Catalog

### 👤 Captain Nova System

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
| Hologram Visual Shader | 🟢 Complete | P0 | [link] | None |  ← CHANGED
| Idle Breathing Animation | 🟡 In Progress | P0 | [link] | Hologram Shader |  ← NEW
```

**Find/replace for bulk updates:**
- Old: `| Hologram Visual Shader | 🔴 Not Started |`
- New: `| Hologram Visual Shader | 🟢 Complete |`

**2. Update Feature Spec Header**

```markdown
# In features/captain-nova-hologram.md

**Feature ID:** `NOVA-001`
**Category:** Captain Nova System
**Priority:** P0 (Must-have for MVP)
**Status:** 🟢 Complete  ← CHANGED
**Current Version:** 1.0  ← CHANGED (was 0.4)
**Target Version:** 1.0
```

**3. Update Revision History**

```markdown
## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.4 | 2026-02-06 | Initial implementation (basic shader) |
| 1.0 | 2026-02-07 | Full spec implementation ← ADDED
```

**4. Commit the Documentation Changes**

```bash
git add docs/plans/MASTER-synesthesiapay-bridge.md
git add docs/plans/features/captain-nova-hologram.md
git commit -m "docs: mark hologram shader as complete

Updated status from 🟡 In Progress to 🟢 Complete.
All acceptance criteria verified passing."
```

### Status Change Rules

**🔴 Not Started → 🟡 In Progress**
- When: You begin working on the feature
- Requires: Declaration in master doc

**🟡 In Progress → 🟢 Complete**
- When: ALL acceptance criteria pass
- Requires: Testing completed, documentation updated

**🟡 In Progress → 🔴 Not Started**
- When: You decide to stop and work on something else
- Requires: Brief note explaining why (in master doc)

**🟢 Complete → 🔵 Needs Polish**
- When: Feature works but you discover quality issues
- Requires: List of specific polish items in feature spec

**🔵 Needs Polish → 🟢 Complete**
- When: Polish items completed
- Requires: Verification of polish acceptance criteria

**Never go backwards from 🟢 Complete to 🔴 Not Started**
- If a completed feature breaks, mark it 🔵 Needs Polish
- Create a new task for the fix (don't un-complete it)

---

## Quality Gates

### Before Marking 🟢 Complete

**All of these MUST be true:**

#### 1. Acceptance Criteria (100%)
```markdown
### ✅ Visual Quality
- [x] All boxes checked  ← MUST BE ALL CHECKED
- [x] No failing items
```

**If even ONE box unchecked:**
- Feature is NOT complete
- Stay in 🟡 In Progress
- Fix the failing item

#### 2. Performance Verified
- [ ] Runs at 60fps (use Chrome DevTools Performance)
- [ ] No memory leaks (heap stays stable over 5 minutes)
- [ ] No console errors or warnings
- [ ] Network requests < 1s (p95)

#### 3. Integration Tested
- [ ] Works with other completed features
- [ ] Doesn't break existing functionality
- [ ] Data flows correctly (frontend ↔ backend)

#### 4. Code Quality
- [ ] Follows project patterns (see CLAUDE.md)
- [ ] TypeScript types are strict (no `any`)
- [ ] Naming is clear and consistent
- [ ] Comments where logic is non-obvious

#### 5. Documentation Updated
- [ ] Feature spec marked complete
- [ ] Master document updated
- [ ] Build guide (if created) finalized
- [ ] Code committed with clear message

### Partial Completion

**If 80% done but stuck:**

Don't mark 🟢 Complete — instead:

1. Mark 🔵 Needs Polish
2. Document what's missing in feature spec:
   ```markdown
   **Status:** 🔵 Needs Polish

   **Remaining Work:**
   - [ ] Fix Safari shader compilation issue
   - [ ] Optimize particle count for low-end devices
   - [ ] Add keyboard navigation support
   ```
3. Move to next feature (come back later)

**Why?** Honest status > false completion. Master doc must reflect reality.

---

## Git Workflow

### Branch Strategy

**Main branches:**
- `main` - Production-ready code (protected)
- `feature/the-whole-frontend` - Main development branch (current)

**Feature branches (optional, for big features):**
- `feature/nova-hologram` - For hologram shader work
- `feature/threat-system` - For all threat implementations
- Merge back to `feature/the-whole-frontend` when done

### Commit Guidelines

**Commit frequently:**
- After each phase of build guide
- When tests pass
- Before trying something risky (easy rollback)

**Commit message format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, no code change
- `refactor:` - Code restructure, same behavior
- `test:` - Adding tests
- `chore:` - Build process, tooling

**Example:**
```bash
git commit -m "feat: add gravitational lensing shader to black hole

Implemented custom fragment shader that warps starfield behind
black hole using inverse square law distortion. Creates realistic
Einstein ring effect.

- Add lensing.glsl shader
- Apply distortion to background pass
- Tune distortion strength parameter
- Test on multiple black hole sizes

Closes: THREAT-004"
```

**Always include Co-Author:**
```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### When to Commit Documentation

**Separate commits for docs:**
```bash
# After implementing feature
git add web/components/three/BlackHole.tsx
git commit -m "feat: implement black hole threat visual"

# After updating docs
git add docs/plans/MASTER-synesthesiapay-bridge.md
git add docs/plans/features/black-hole-threat.md
git commit -m "docs: mark black hole threat as complete"
```

**Why separate?** Clear history. Easy to see code vs documentation changes.

---

## Documentation Maintenance

### Weekly Review

**Every week, review master document:**

1. **Status Accuracy**
   - Do statuses match reality?
   - Are "In Progress" items actually being worked on?
   - Update stale statuses

2. **Dependency Updates**
   - Did new dependencies emerge?
   - Are blocked features now unblocked?
   - Update dependency column

3. **Priority Adjustments**
   - Should priorities shift based on progress?
   - Are P2 features more urgent now?
   - Update priority column

### Spec Updates

**Update feature specs when:**
- Implementation reveals spec was wrong
- User feedback changes requirements
- Technical constraints force design changes
- New dependencies discovered

**How to update specs:**

1. **Add revision history entry:**
   ```markdown
   | 1.1 | 2026-02-10 | Updated shader to use WebGL2 (Safari fix) |
   ```

2. **Update the changed section:**
   - Strike through old text: `~~old approach~~`
   - Add new text below
   - Explain why in comment

3. **Commit the change:**
   ```bash
   git commit -m "docs: update hologram spec for WebGL2 compatibility"
   ```

### Master Document Sections to Maintain

**Section 1: Current State**
```markdown
## Current State

### What We've Built (v0.1 - Initial Implementation)

**Date:** 2026-02-06  ← UPDATE WHEN SIGNIFICANT PROGRESS
**Build Time:** ~2-3 hours  ← UPDATE TO REFLECT TOTAL TIME
**Lines of Code:** ~3,500 lines  ← UPDATE PERIODICALLY

#### ✅ Completed Features

**Core Infrastructure:**
- ✅ Next.js 16 app with App Router
- ✅ Three.js scene with React Three Fiber integration
...
```

**Update this section:**
- After completing major milestones (every 5-10 features)
- When transitioning phases (Visual → Functional → Intelligence)
- Monthly (even if no major changes)

**Section 2: Feature Catalog**
```markdown
## Feature Catalog

### 🎬 Opening Experience

| Feature | Status | Priority | Doc Link | Dependencies |
|---------|--------|----------|----------|--------------|
...
```

**Update this section:**
- Immediately when status changes
- When priorities shift
- When dependencies are added/removed

**Section 3: Implementation Strategy**
```markdown
## Implementation Strategy

### Phase-Based Approach

**Phase 1: Visual Foundation (Weeks 1-2)**  ← UPDATE DATES
- Focus: Make it breathtaking
- Features: Opening sequence, hologram refinement, threat polish
- Goal: Nail the "Whoa" factor
- **Status: 60% complete**  ← ADD PROGRESS TRACKING
```

**Update this section:**
- Weekly (track phase progress)
- When starting new phase
- When adjusting timeline

---

## Example: Complete Implementation Cycle

### Day 1: Starting Hologram Shader

**1. Morning: Feature Selection**
```markdown
# Review master doc
# Choose: Hologram Visual Shader (P0, no dependencies)

# Update master doc
| Hologram Visual Shader | 🟡 In Progress | P0 | [link] | None |
```

**2. Read feature spec thoroughly**
- Print or open in second monitor
- Highlight unclear parts
- Note dependencies: need `three`, `@react-three/fiber`

**3. Create build guide**
```bash
touch docs/plans/build-guides/2026-02-06-hologram-shader.md
# Fill in template with steps from spec
```

**4. Start implementing**
```bash
# Install dependencies
cd web && bun add three @react-three/fiber

# Create files (from build guide step 1.1)
mkdir -p web/components/three/shaders
# ...

# Commit foundation
git add -A
git commit -m "feat(hologram): add shader file structure"
```

### Day 2: Implementation Continues

**5. Work through build guide phases**
- Check off steps as completed
- Test continuously
- Commit after each phase

**6. Hit a blocker**
```markdown
# In build guide, add note:
**Issues encountered:**
- Problem: Shader compilation error on Safari
  Error: "texture2D is deprecated"
- Solution: [researching...]
```

**7. Solve and document**
```markdown
- Solution: Use `texture` instead of `texture2D` for WebGL2
- Also update spec to reflect this requirement
```

### Day 3: Testing & Completion

**8. Run through all acceptance criteria**
```markdown
### ✅ Visual Quality
- [x] Hologram looks translucent ✓
- [x] Scanlines are subtle ✓
- [x] Chromatic aberration visible ✓
...all checked
```

**9. Update documentation (3 places)**

Feature spec:
```markdown
**Status:** 🟢 Complete
**Current Version:** 1.0
```

Master doc:
```markdown
| Hologram Visual Shader | 🟢 Complete | P0 | [link] | None |
```

Build guide:
```markdown
**Status:** ✅ Completed 2026-02-08
**Actual time:** 4 hours (estimated: 3 hours)
```

**10. Final commit**
```bash
git add -A
git commit -m "feat: complete hologram visual shader system

Implemented all 7 shader components with Safari compatibility:
- Base transparency with adjustable opacity
- Scanlines moving upward
- Chromatic aberration on edges (RGB split)
- Random glitch effect
- Aurora gradient flow
- Fresnel rim lighting
- Particle noise overlay

All acceptance criteria verified passing. Performance
sustained at 60fps with shader active.

Closes: NOVA-001

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**11. Move to next feature**
```markdown
# Review master doc
# Next: Idle Breathing Animation (dependency: Hologram Shader ✅)
# Update status to 🟡 In Progress
```

---

## Troubleshooting

### "I forgot to update the master doc"

**Fix:**
```bash
# Update master doc now
# Commit separately
git add docs/plans/MASTER-synesthesiapay-bridge.md
git commit -m "docs: update master catalog (forgot earlier)"
```

**Prevention:** Add to build guide final checklist

### "Status in master doc doesn't match reality"

**Fix:**
- Review all features marked 🟡 In Progress
- Actually in progress? Keep
- Not being worked on? → 🔴 Not Started
- Actually done? → 🟢 Complete

**Commit:**
```bash
git commit -m "docs: audit and correct feature statuses"
```

### "Feature is 90% done but one test failing"

**Do NOT mark complete.**

**Options:**
1. Fix the failing test (preferred)
2. Mark 🔵 Needs Polish, document the issue
3. If test is wrong, update acceptance criteria

**Never:** Mark complete with failing tests

### "I want to change a completed feature"

**Process:**
1. Mark status: 🟢 Complete → 🔵 Needs Polish
2. List changes needed in feature spec
3. Update feature
4. Re-verify all acceptance criteria
5. Mark: 🔵 Needs Polish → 🟢 Complete

---

## Summary Checklist

**Before starting any feature:**
- [ ] Feature selected using criteria
- [ ] Dependencies verified complete
- [ ] Master doc updated to 🟡 In Progress
- [ ] Feature spec read thoroughly

**During implementation:**
- [ ] Build guide created (if needed)
- [ ] Steps checked off as completed
- [ ] Issues documented
- [ ] Commits made frequently

**Before marking complete:**
- [ ] ALL acceptance criteria passing
- [ ] Performance verified (60fps)
- [ ] Integration tested
- [ ] Code quality reviewed

**After completion:**
- [ ] Feature spec updated (status, version, revision)
- [ ] Master doc updated (status changed to 🟢)
- [ ] Build guide finalized (if created)
- [ ] Final commit with clear message
- [ ] Ready to start next feature

---

## Living Document

This guide itself should evolve:

**Update this guide when:**
- Process improvements discovered
- Common issues found (add to troubleshooting)
- New quality gates identified
- Better workflow patterns emerge

**How to update:**
1. Make changes to this file
2. Update "Last Updated" date at top
3. Commit: `git commit -m "docs: improve implementation guide"`

---

**The golden rule: The master document is the single source of truth. Keep it accurate, keep it updated, keep it honest.**
