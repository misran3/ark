// Mulberry32 — fast, deterministic, 32-bit PRNG
// Seed is generated once at module load → unique per page load,
// deterministic within session (no jitter on React re-renders)

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Session seed: random on each page load, stable within session
const SESSION_SEED = Math.floor(Math.random() * 2147483647);

/**
 * Create a seeded random number generator.
 * Call with no args to use the session seed (unique per page load).
 * Call with a number to use a specific seed (reproducible).
 */
export function createSeededRandom(seed: number = SESSION_SEED) {
  return mulberry32(seed);
}
