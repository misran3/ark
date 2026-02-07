# Asteroid Field System

Cinematic multi-rock threat visualization with cascade destruction mechanics.

## Architecture

### Components

**`AsteroidField.tsx`** - Orchestrator
- Generates 3-10 rocks per threat using log-scale params from amount
- Manages field state: rock HP tracking, destruction count, cascade trigger
- Handles per-field drift trajectory (toward random convergence point)
- Applies time-based neglect growth (2.4%/min, cap at 150%)

**`AsteroidFieldCascade.tsx`** - VFX sequence
- Shockwave ring expansion from trigger point
- Staggered rock detonation by distance (nearest-to-farthest)
- Impact flash 50ms before detonation for visual causality
- Final burst ring on completion

**`Asteroid.tsx`** - Individual rock
- Dual-mode: standalone + field child
- Multi-hit HP system (1-3 hp based on tier)
- Visual damage progression via shader
- Hit-triggered chunk debris particles (5-10 per hit)
- Field instability effects (pulse, emissive boost, passive shedding)

**`AsteroidMaterial.tsx`** - Custom shader
- Procedural Voronoi cracks with emissive glow
- Damage states: crack widening, color shift, core exposure
- Sympathetic glow during field instability
- Dynamic emissive strength boost (up to 2x)

**`asteroid-field-params.ts`** - Pure utilities
- `getFieldParams(amount)` - Log-scale interpolation for all field properties
- `getDriftTarget(seed)` - Convergence circle target selection
- `getGrowthFactor(createdAt)` - Time-based growth calculation
- All functions are deterministic with seeded randomness

### Data Flow

```
ThreatStore (amount, position, createdAt, seed)
  -> Threats.tsx (routes asteroid type)
    -> AsteroidField (computes params, manages state)
      |-- Asteroid × N (each with tier, hp, damage visuals, chunks)
      |-- AsteroidFieldCascade (shockwave on trigger)
      +-- Drift group (shared movement toward target)
```

## Performance Budget

### Particle Counts (Worst Case: 2 Fields, 10 Rocks Each)

| Component | Count | Particles/Each | Total |
|-----------|-------|----------------|-------|
| Large rock trails | 2 | 200 | 400 |
| Large rock ribbons | 2 | 15 | 30 |
| Medium rock trails | 6 | 30 | 180 |
| Small rocks (no trails) | 12 | 0 | 0 |
| Hit chunks (short-lived) | ~10 active | 1 | ~50 |
| **TOTAL** | | | **660** |

**Frame Budget:** ~5ms/frame (8.3% at 60fps) ✅

### Optimization Techniques

1. **Tiered trails:** Large=full (200p), medium=reduced (30p), small=none
2. **Memoized distributions:** Rock positions/sizes computed once per field
3. **Ref-based animations:** Drift/shudder use refs to avoid state thrashing
4. **Chunk culling:** Short-lived debris (2-4s), auto-removed when expired
5. **Memoized alive indices:** Prevents array filter every render

## Usage

### Basic (via ThreatStore)

```typescript
import { useThreatStore } from '@/lib/stores/threat-store';

const { addThreat } = useThreatStore();

addThreat({
  type: 'asteroid',
  amount: 49.99, // $50 subscription
  position: [5, 2, -8],
  seed: 12345,
  createdAt: Date.now(),
});
```

Field will automatically:
- Generate 6-7 rocks (log-scale from $50)
- Drift toward convergence point with deceleration
- Grow 2.4%/min if ignored
- Trigger cascade when threshold rocks destroyed

### Standalone (for testing)

```tsx
<AsteroidField
  amount={50}
  position={[0, 0, -5]}
  seed={42}
  createdAt={Date.now()}
  driftEnabled={true}
  onDeflect={() => console.log('Field cleared!')}
/>
```

### Dev Page

Navigate to `/dev-asteroid` for comprehensive controls:
- View toggle: Single Rock / Asteroid Field
- Amount slider ($1-$500) with live field regeneration
- Seed input for deterministic reproduction
- Rock count override (0-12 manual)
- Drift ON/OFF, growth speed multipliers (1x/5x/20x)
- Grid helper, OrbitControls, destroyed count display

## Testing

### Unit Tests

```bash
cd web
bun test lib/utils/__tests__/asteroid-field-params.test.ts
```

Covers:
- Determinism (same seed → same params)
- Log-scale interpolation
- Growth factor math
- Rock distribution (tier counts, spacing, HP)

### Manual Testing

1. **Field composition:** Check tier distribution (1 large, 2-3 medium, rest small)
2. **Drift:** Verify field moves toward screen center from spawn point, decelerates
3. **Growth:** Enable 20x speed, verify field reaches ~150% in 2-3 minutes
4. **Multi-hit:** Click medium rock twice, large rock 3 times to destroy
5. **Chunk debris:** Verify 5-10 chunks fly outward on each hit, fade after 2-4s
6. **Field instability:** Destroy 2 rocks, verify remaining rocks pulse at ~2 Hz + shed debris
7. **Cascade:** Destroy threshold rocks, verify shockwave ring + staggered detonations
8. **Hover:** Hover one rock, verify sympathetic glow on siblings

## Known Issues & Limitations

1. **Cascade trigger button:** Dev page button is placeholder (requires API exposure)
2. **Passive debris global state:** Uses `window[lastShedKey]` for shedding timers (works but not ideal)
3. **No integration tests:** Cascade timing verified manually, needs automated tests
4. **Growth on navigation:** Growth continues when user navigates away (intentional per spec, but might surprise users)

## Future Enhancements

From spec's "Brainstormed Enhancements" section:
- Internal fragment shimmer (faint light between cracks)
- Split/multiply behavior (rock breaks into 2 smaller rocks on high damage)
- Cluster bonuses (destroy entire field without missing → bonus animation)
- Environmental interactions (collisions between overlapping fields)
- Sound design (crunch, sizzle, shockwave rumble)

## Reference

- Design spec: `docs/plans/2026-02-07-asteroid-field-design.md`
- Code review: (search git history for "asteroid field critical fixes")
- Performance profile: ~660 particles, ~5ms/frame (verified 2026-02-07)
