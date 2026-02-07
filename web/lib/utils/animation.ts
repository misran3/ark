/** Easing functions — all take t in [0,1] and return [0,1] */
export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => --t * t * t + 1,
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  inExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outElastic: (t: number) => {
    const c = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
  },
};

/** Linearly interpolate with optional easing */
export function lerp(from: number, to: number, t: number, fn = ease.linear): number {
  return from + (to - from) * fn(Math.max(0, Math.min(1, t)));
}

/** Smooth-step (Hermite interpolation) */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Remap value from one range to another */
export function remap(v: number, inLow: number, inHigh: number, outLow: number, outHigh: number): number {
  return outLow + ((v - inLow) / (inHigh - inLow)) * (outHigh - outLow);
}

/** Clamp between min and max */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Ping-pong between 0 and 1 */
export function pingPong(t: number): number {
  const m = t % 2;
  return m > 1 ? 2 - m : m;
}
