import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface BreathingConfig {
  enabled?: boolean;
  cycleDuration?: number; // seconds
  scaleAmount?: number; // percentage (0.02 = 2%)
}

const DEFAULT_CONFIG: Required<BreathingConfig> = {
  enabled: true,
  cycleDuration: 4,
  scaleAmount: 0.02,
};

/**
 * Hook for breathing animation (chest expansion/contraction)
 *
 * @param torsoRef - Reference to torso mesh
 * @param config - Breathing configuration
 */
export function useBreathing(
  torsoRef: React.RefObject<THREE.Mesh | null>,
  config: BreathingConfig = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const breathPhase = useRef(0);

  useFrame(({ clock }) => {
    if (!cfg.enabled || !torsoRef.current) return;

    const time = clock.getElapsedTime();
    breathPhase.current = time * (Math.PI / (cfg.cycleDuration / 2));

    const breathScale = Math.sin(breathPhase.current) * cfg.scaleAmount + 1;
    torsoRef.current.scale.y = breathScale;
  });

  return breathPhase;
}
