/**
 * Asteroid Field Parameter Calculator
 *
 * Computes all field parameters from a single log10(amount) curve.
 * No hardcoded tiers — smooth logarithmic interpolation.
 */

export interface RockSpec {
  index: number;
  /** 'large' | 'medium' | 'small' */
  tier: 'large' | 'medium' | 'small';
  /** Size multiplier relative to parent threat's size (0-1) */
  sizeScale: number;
  /** HP based on tier */
  hp: number;
  /** Local position within the field ellipsoid */
  position: [number, number, number];
  /** Unique seed for procedural geometry */
  seed: number;
  /** Per-rock tumble velocity */
  angularVelocity: [number, number, number];
  /** Trail tier for performance budgeting */
  trailTier: 'full' | 'reduced' | 'none';
}

export interface FieldParams {
  rockCount: number;
  fieldRadius: number;
  anchorSize: number;
  driftSpeed: number;
  cascadeThreshold: number;
  rocks: RockSpec[];
}

// Seeded PRNG (mulberry32) for deterministic field generation
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lerp between min and max based on t (0-1) */
function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute asteroid field parameters from a dollar amount.
 * All values scale smoothly via log10(amount).
 *
 * @param amount - Dollar amount of the threat ($1-$500+)
 * @param seed - Base seed for deterministic generation (default: 42)
 */
export function getFieldParams(amount: number, seed: number = 42): FieldParams {
  // Normalize amount to a 0-1 curve via log10
  // log10(1) = 0, log10(10) ≈ 1, log10(100) = 2, log10(500) ≈ 2.7
  const logAmount = Math.log10(Math.max(1, amount));
  // Map to 0-1 range: $1 = 0, $500+ = 1
  const t = clamp(logAmount / 2.7, 0, 1);

  // --- Compute field-level parameters ---
  const rockCount = Math.round(lerp(3, 10, t));
  const fieldRadius = lerp(2, 7, t);
  const anchorSize = lerp(0.8, 1.0, t); // Multiplier of threat's base size
  const driftSpeed = lerp(0.08, 0.2, t);

  // Cascade threshold scales with field size
  let cascadeThreshold: number;
  if (rockCount <= 4) cascadeThreshold = 2;
  else if (rockCount <= 7) cascadeThreshold = 3;
  else cascadeThreshold = 4;

  // --- Generate rock distribution ---
  const rocks = generateRocks(rockCount, fieldRadius, anchorSize, seed);

  return {
    rockCount,
    fieldRadius,
    anchorSize,
    driftSpeed,
    cascadeThreshold,
    rocks,
  };
}

/**
 * Generate individual rock specs with positions, sizes, and seeds.
 * Distribution: 1 large, ~30% medium, rest small.
 */
function generateRocks(
  count: number,
  fieldRadius: number,
  anchorSize: number,
  baseSeed: number
): RockSpec[] {
  const rng = mulberry32(baseSeed);
  const rocks: RockSpec[] = [];

  // Determine tier counts: 1 large, ~30% medium, rest small
  const mediumCount = Math.max(2, Math.min(3, Math.round(count * 0.3)));
  const smallCount = count - 1 - mediumCount;

  // Build ordered tier list
  const tiers: Array<'large' | 'medium' | 'small'> = ['large'];
  for (let i = 0; i < mediumCount; i++) tiers.push('medium');
  for (let i = 0; i < smallCount; i++) tiers.push('small');

  // Generate positions within ellipsoidal volume (wider than tall)
  const positions: [number, number, number][] = [];
  const MIN_SPACING = fieldRadius * 0.25;

  for (let i = 0; i < count; i++) {
    const tier = tiers[i];
    let position: [number, number, number];
    let attempts = 0;

    // Find a position that doesn't overlap with existing rocks
    do {
      // Ellipsoidal volume: wider in XZ, flatter in Y
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = fieldRadius * Math.cbrt(rng()); // Cube root for uniform volume distribution

      position = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.5, // Flatten Y
        r * Math.cos(phi),
      ];

      // Large rock gets center-ish placement
      if (tier === 'large') {
        position = [
          position[0] * 0.3,
          position[1] * 0.3,
          position[2] * 0.3,
        ];
      }

      attempts++;
    } while (
      attempts < 50 &&
      positions.some(
        (p) =>
          Math.hypot(p[0] - position[0], p[1] - position[1], p[2] - position[2]) < MIN_SPACING
      )
    );

    positions.push(position);

    // Size scale based on tier
    let sizeScale: number;
    let hp: number;
    let trailTier: 'full' | 'reduced' | 'none';

    switch (tier) {
      case 'large':
        sizeScale = anchorSize * lerp(0.8, 1.0, rng());
        hp = 3;
        trailTier = 'full';
        break;
      case 'medium':
        sizeScale = lerp(0.4, 0.6, rng());
        hp = 2;
        trailTier = 'reduced';
        break;
      case 'small':
        sizeScale = lerp(0.15, 0.35, rng());
        hp = 1;
        trailTier = 'none';
        break;
    }

    rocks.push({
      index: i,
      tier,
      sizeScale,
      hp,
      position,
      seed: baseSeed + i,
      angularVelocity: [
        lerp(0.1, 0.6, rng()) * (rng() > 0.5 ? 1 : -1),
        lerp(0.1, 0.8, rng()) * (rng() > 0.5 ? 1 : -1),
        lerp(0.05, 0.4, rng()) * (rng() > 0.5 ? 1 : -1),
      ],
      trailTier,
    });
  }

  return rocks;
}

/**
 * Compute growth factor from creation timestamp.
 * ~2.4% per minute (0.0004 per second), capped at 150%.
 *
 * @param createdAt - Timestamp (ms) when the threat was created
 * @param now - Current timestamp (ms), defaults to Date.now()
 */
export function getGrowthFactor(createdAt: number, now: number = Date.now()): number {
  const elapsedSeconds = Math.max(0, (now - createdAt) / 1000);

  // Edge case: if createdAt is in the future, clamp to 1.0 (no growth)
  if (elapsedSeconds < 0) {
    console.warn('getGrowthFactor: createdAt is in the future, clamping to 1.0');
    return 1.0;
  }

  // Growth: 2.4% per minute (0.0004 per second)
  // Was: 0.0003 (1.8%/min, under spec)
  // Now: 0.0004 (2.4%/min, within spec's 2-3%/min target)
  return Math.min(1.5, 1.0 + 0.0004 * elapsedSeconds);
}

/**
 * Compute drift target point within convergence circle.
 * Each field approaches from a slightly different angle.
 */
export function getDriftTarget(seed: number, convergenceRadius: number = 2.5): [number, number, number] {
  const rng = mulberry32(seed * 7919); // Different prime from position seeding
  const angle = rng() * Math.PI * 2;
  const r = convergenceRadius * Math.sqrt(rng());
  return [r * Math.cos(angle), r * Math.sin(angle) * 0.5, 0];
}
