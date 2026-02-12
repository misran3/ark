import * as THREE from 'three';

// ── Camera ──────────────────────────────────────────────────
export const CAMERA = {
  position: [0, 0, 5] as [number, number, number],
  fov: 75,
  near: 0.1,
  far: 3000,
} as const;

// ── Static Threat Config ────────────────────────────────────
export const STATIC_THREAT_TYPES = new Set(['black_hole']);

export const BLACK_HOLE_POSITION: [number, number, number] = [8, -3, -30];
// X=8: right of center (~17% of visible width at Z=-30)
// Y=-3: slightly below center, menacing gravitational pull feel
// Z=-30: mid-distance, close enough for detail but not overwhelming

// ── Spawn Zones (Mobile Threats) ────────────────────────────
// Threats materialize at the edges of the frustum at deep Z, appearing
// as small distant objects approaching the bridge viewport.
export const SPAWN = {
  /** Depth at which threats materialize */
  z: -75,
  /** Z-axis jitter range: actual Z = z - random(0, zJitter) */
  zJitter: 15,
  /** Y-axis spread range (±) */
  yRange: 20,
  /** Y-axis upward bias so threats come "over the horizon" */
  yOffset: 5,
} as const;

// At Z=-75 (dist 80), frustum halfWidth ≈ 61.
// Spawn at |X| = 40-55: inside frustum but near edges.
export const SPAWN_SIDE = {
  /** Minimum |X| for spawn (inner edge of spawn band) */
  xMin: 40,
  /** Maximum |X| for spawn (outer edge, still within frustum) */
  xMax: 55,
} as const;

// ── Convergence Zone ────────────────────────────────────────
// Where mobile threats settle after drifting from spawn.
export const CONVERGENCE = {
  /** Center of the convergence circle */
  center: [0, 0, -30] as [number, number, number],
  /** Radius of scatter circle */
  radius: 12,
  /** Vertical flatten factor (ellipse, wider than tall) */
  yFlatten: 0.4,
  /** Z scatter range around center.z (±) */
  zScatter: 8,
} as const;

// ── Drift Configuration ─────────────────────────────────────
export const DRIFT = {
  /** Lerp alpha multiplier per second. 0.04 → ~85% arrived at 60s */
  speed: 0.04,
} as const;

// ── Helpers ─────────────────────────────────────────────────

/** Deterministic seeded PRNG (mulberry32) */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string ID to a stable integer */
function hashId(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

/**
 * Generate a spawn position for a mobile threat.
 * Deterministic per threat ID. Alternates left/right based on hash parity.
 */
export function generateSpawnPosition(threatId: string): [number, number, number] {
  const hash = hashId(threatId);
  const rng = mulberry32(hash * 7919);

  const side = hash % 2 === 0 ? -1 : 1;
  const x = side * (SPAWN_SIDE.xMin + rng() * (SPAWN_SIDE.xMax - SPAWN_SIDE.xMin));
  const y = SPAWN.yOffset + (rng() - 0.5) * 2 * SPAWN.yRange;
  const z = SPAWN.z - rng() * SPAWN.zJitter;

  return [x, y, z];
}

/**
 * Generate a convergence target for a mobile threat.
 * Deterministic per threat ID. Uses sqrt for uniform area distribution.
 */
export function generateConvergenceTarget(threatId: string): THREE.Vector3 {
  const hash = hashId(threatId);
  const rng = mulberry32(hash * 6271);

  const angle = rng() * Math.PI * 2;
  const r = CONVERGENCE.radius * Math.sqrt(rng());

  return new THREE.Vector3(
    CONVERGENCE.center[0] + Math.cos(angle) * r,
    CONVERGENCE.center[1] + Math.sin(angle) * r * CONVERGENCE.yFlatten,
    CONVERGENCE.center[2] + (rng() - 0.5) * 2 * CONVERGENCE.zScatter,
  );
}
