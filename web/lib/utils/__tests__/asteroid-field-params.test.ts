import { describe, expect, test } from 'bun:test';
import {
  getFieldParams,
  getGrowthFactor,
  getDriftTarget,
} from '../asteroid-field-params';

describe('asteroid-field-params', () => {
  describe('determinism', () => {
    test('same amount and seed produce identical params', () => {
      const params1 = getFieldParams(50, 42);
      const params2 = getFieldParams(50, 42);

      expect(params1.rockCount).toBe(params2.rockCount);
      expect(params1.fieldRadius).toBe(params2.fieldRadius);
      expect(params1.anchorSize).toBe(params2.anchorSize);
      expect(params1.driftSpeed).toBe(params2.driftSpeed);
      expect(params1.cascadeThreshold).toBe(params2.cascadeThreshold);
    });

    test('different seeds produce different distributions', () => {
      const params1 = getFieldParams(50, 42);
      const params2 = getFieldParams(50, 999);

      expect(params1.rocks[0].position).not.toEqual(params2.rocks[0].position);
      expect(params1.rocks.length).toBe(params2.rocks.length); // Same count, different positions
    });

    test('drift targets are seeded-random within convergence circle', () => {
      const target1 = getDriftTarget(42);
      const target2 = getDriftTarget(42);
      const target3 = getDriftTarget(999);

      // Same seed = same target
      expect(target1).toEqual(target2);
      // Different seed = different target
      expect(target1).not.toEqual(target3);

      // Target should be within convergence circle (radius ~2-3 units)
      const [x, y, z] = target1;
      const distFromCenter = Math.sqrt(x * x + y * y + z * z);
      expect(distFromCenter).toBeLessThan(4); // Within convergence circle
    });
  });

  describe('log-scale interpolation', () => {
    test('cheap threats have fewer rocks', () => {
      const cheap = getFieldParams(5);
      expect(cheap.rockCount).toBeGreaterThanOrEqual(3);
      expect(cheap.rockCount).toBeLessThanOrEqual(5);
    });

    test('mid-tier threats have medium counts', () => {
      const mid = getFieldParams(50);
      expect(mid.rockCount).toBeGreaterThanOrEqual(6);
      expect(mid.rockCount).toBeLessThanOrEqual(8);
    });

    test('expensive threats have maximum rocks', () => {
      const expensive = getFieldParams(200);
      expect(expensive.rockCount).toBeGreaterThanOrEqual(9);
      expect(expensive.rockCount).toBeLessThanOrEqual(10);
    });

    test('field radius scales with amount', () => {
      const small = getFieldParams(5);
      const large = getFieldParams(200);
      expect(large.fieldRadius).toBeGreaterThan(small.fieldRadius);
    });

    test('cascade threshold scales with rock count', () => {
      const small = getFieldParams(5);  // 5 rocks → threshold 3
      const large = getFieldParams(200); // 9 rocks → threshold 4

      expect(small.cascadeThreshold).toBe(3);
      expect(large.cascadeThreshold).toBe(4);
    });
  });

  describe('growth factor', () => {
    test('no elapsed time returns 1.0 (no growth)', () => {
      const now = Date.now();
      expect(getGrowthFactor(now)).toBe(1.0);
    });

    test('10 minutes elapsed returns ~1.24 (24% growth)', () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const growth = getGrowthFactor(tenMinutesAgo);

      // 10 min × 60 sec × 0.0004 = 0.24, so 1.24 (24% growth)
      expect(growth).toBeCloseTo(1.24, 2);
    });

    test('growth caps at 1.5 (150%)', () => {
      const longAgo = Date.now() - 1000 * 60 * 1000; // 1000 minutes
      const growth = getGrowthFactor(longAgo);
      expect(growth).toBe(1.5);
    });

    test('future createdAt returns 1.0 (no growth)', () => {
      const future = Date.now() + 10000;
      const growth = getGrowthFactor(future);
      expect(growth).toBe(1.0);
    });
  });

  describe('rock distribution', () => {
    test('distribution has exactly 1 large rock', () => {
      const params = getFieldParams(50);
      const largeRocks = params.rocks.filter((r) => r.tier === 'large');
      expect(largeRocks.length).toBe(1);
    });

    test('distribution has 2-3 medium rocks', () => {
      const params = getFieldParams(50);
      const mediumRocks = params.rocks.filter((r) => r.tier === 'medium');
      expect(mediumRocks.length).toBeGreaterThanOrEqual(2);
      expect(mediumRocks.length).toBeLessThanOrEqual(3);
    });

    test('remaining rocks are small', () => {
      const params = getFieldParams(50);
      const smallRocks = params.rocks.filter((r) => r.tier === 'small');
      expect(smallRocks.length).toBeGreaterThanOrEqual(2);
    });

    test('rocks have minimum spacing (no overlap)', () => {
      const params = getFieldParams(50);
      const rocks = params.rocks;
      const minSpacing = 0.8; // From spec

      for (let i = 0; i < rocks.length; i++) {
        for (let j = i + 1; j < rocks.length; j++) {
          const [x1, y1, z1] = rocks[i].position;
          const [x2, y2, z2] = rocks[j].position;
          const distance = Math.sqrt(
            (x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2
          );
          expect(distance).toBeGreaterThanOrEqual(minSpacing);
        }
      }
    });

    test('rock sizes scale correctly per tier', () => {
      const params = getFieldParams(50);
      const rocks = params.rocks;

      const large = rocks.find((r) => r.tier === 'large');
      const medium = rocks.find((r) => r.tier === 'medium');
      const small = rocks.find((r) => r.tier === 'small');

      // Large: 80-100% of anchorSize
      expect(large!.sizeScale).toBeGreaterThanOrEqual(params.anchorSize * 0.8);
      expect(large!.sizeScale).toBeLessThanOrEqual(params.anchorSize * 1.0);

      // Medium: 40-60% of anchorSize
      expect(medium!.sizeScale).toBeGreaterThanOrEqual(params.anchorSize * 0.4);
      expect(medium!.sizeScale).toBeLessThanOrEqual(params.anchorSize * 0.6);

      // Small: 15-35% of anchorSize
      expect(small!.sizeScale).toBeGreaterThanOrEqual(params.anchorSize * 0.15);
      expect(small!.sizeScale).toBeLessThanOrEqual(params.anchorSize * 0.35);
    });

    test('rock HP matches tier', () => {
      const params = getFieldParams(50);
      const rocks = params.rocks;

      const large = rocks.find((r) => r.tier === 'large');
      const medium = rocks.find((r) => r.tier === 'medium');
      const small = rocks.find((r) => r.tier === 'small');

      expect(large!.hp).toBe(3);
      expect(medium!.hp).toBe(2);
      expect(small!.hp).toBe(1);
    });
  });
});
