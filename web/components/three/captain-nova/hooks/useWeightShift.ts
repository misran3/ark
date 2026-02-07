import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface WeightShiftConfig {
  enabled?: boolean;
  minInterval?: number; // seconds
  maxInterval?: number; // seconds
  rotationAmount?: number; // radians
}

const DEFAULT_CONFIG: Required<WeightShiftConfig> = {
  enabled: true,
  minInterval: 8,
  maxInterval: 16,
  rotationAmount: 0.05,
};

/**
 * Hook for weight shift animation (hip rotation)
 *
 * @param hipsRef - Reference to hips mesh
 * @param config - Weight shift configuration
 */
export function useWeightShift(
  hipsRef: React.RefObject<THREE.Mesh>,
  config: WeightShiftConfig = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const weightShiftPhase = useRef(0);
  const nextWeightShift = useRef(
    Math.random() * (cfg.maxInterval - cfg.minInterval) + cfg.minInterval
  );
  const targetRotation = useRef(0);

  useFrame((_, delta) => {
    if (!cfg.enabled || !hipsRef.current) return;

    weightShiftPhase.current += delta;

    // Trigger new shift
    if (weightShiftPhase.current >= nextWeightShift.current) {
      weightShiftPhase.current = 0;
      nextWeightShift.current =
        Math.random() * (cfg.maxInterval - cfg.minInterval) + cfg.minInterval;

      const shiftDirection = Math.random() > 0.5 ? 1 : -1;
      targetRotation.current = shiftDirection * cfg.rotationAmount;
    }

    // Smooth return to neutral
    if (weightShiftPhase.current > 1) {
      hipsRef.current.rotation.z *= 0.95;
    } else {
      hipsRef.current.rotation.z = targetRotation.current;
    }
  });

  return weightShiftPhase;
}
