'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

const LERP_SPEED = 8; // Higher = snappier. ~400ms at speed 8 with exponential decay.
const _target = new Vector3();
const _current = new Vector3();

/**
 * Smoothly lerps the camera toward a target position each frame.
 * Pass `null` to return to the rest position.
 */
export function useCameraFollow(
  targetPosition: [number, number, number] | null,
  restPosition: [number, number, number] = [0, 0, 5]
) {
  const restVec = useRef(new Vector3(...restPosition));

  useFrame(({ camera }, delta) => {
    const dest = targetPosition
      ? _target.set(targetPosition[0], targetPosition[1], targetPosition[2])
      : restVec.current;

    _current.copy(camera.position);
    _current.lerp(dest, 1 - Math.exp(-LERP_SPEED * delta));
    camera.position.copy(_current);
  });
}
