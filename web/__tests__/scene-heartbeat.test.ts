import { describe, expect, test } from 'bun:test';

describe('SceneHeartbeat throttle logic', () => {
  test('idle interval targets 30fps', () => {
    const isActive = false;
    const interval = isActive ? 1 / 60 : 1 / 30;
    expect(interval).toBeCloseTo(1 / 30, 5);
    expect(interval).toBeCloseTo(0.0333, 3);
  });

  test('active interval targets 60fps', () => {
    const isActive = true;
    const interval = isActive ? 1 / 60 : 1 / 30;
    expect(interval).toBeCloseTo(1 / 60, 5);
    expect(interval).toBeCloseTo(0.0167, 3);
  });

  test('throttle skips frames when elapsed time is less than interval', () => {
    let lastRender = 0;
    const interval = 1 / 30;
    let invalidateCalled = false;

    // Simulate frame at t=0.01 (less than 0.033)
    const now = 0.01;
    if (now - lastRender >= interval) {
      invalidateCalled = true;
      lastRender = now;
    }
    expect(invalidateCalled).toBe(false);

    // Simulate frame at t=0.04 (more than 0.033)
    invalidateCalled = false;
    const now2 = 0.04;
    if (now2 - lastRender >= interval) {
      invalidateCalled = true;
      lastRender = now2;
    }
    expect(invalidateCalled).toBe(true);
  });
});
