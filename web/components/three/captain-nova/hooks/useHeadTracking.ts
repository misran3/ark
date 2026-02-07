import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface HeadTrackingConfig {
  enabled?: boolean;
  maxRotationY?: number; // radians
  maxRotationX?: number; // radians
  lerpSpeed?: number; // 0-1
}

const DEFAULT_CONFIG: Required<HeadTrackingConfig> = {
  enabled: true,
  maxRotationY: 0.15, // ~8.6 degrees
  maxRotationX: 0.1, // ~5.7 degrees
  lerpSpeed: 0.05,
};

/**
 * Hook for head tracking (cursor following)
 *
 * @param headRef - Reference to head mesh
 * @param config - Head tracking configuration
 */
export function useHeadTracking(
  headRef: React.RefObject<THREE.Mesh | null>,
  config: HeadTrackingConfig = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { mouse } = useThree();

  useFrame(() => {
    if (!cfg.enabled || !headRef.current) return;

    const targetRotationY = mouse.x * cfg.maxRotationY;
    const targetRotationX = -mouse.y * cfg.maxRotationX;

    // Smooth interpolation
    headRef.current.rotation.y +=
      (targetRotationY - headRef.current.rotation.y) * cfg.lerpSpeed;
    headRef.current.rotation.x +=
      (targetRotationX - headRef.current.rotation.x) * cfg.lerpSpeed;
  });
}
