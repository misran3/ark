import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GlitchConfig {
  enabled?: boolean;
  frequency?: number; // 0-1 (0.002 = ~1-2 times per 10s)
  intensity?: number; // 0-1
  cooldownMs?: number; // milliseconds
}

const DEFAULT_CONFIG: Required<GlitchConfig> = {
  enabled: true,
  frequency: 0.002,
  intensity: 0.5,
  cooldownMs: 100,
};

/**
 * Hook for glitch effect on shader material
 *
 * @param materialRef - Reference to shader material
 * @param config - Glitch configuration
 */
export function useGlitchEffect(
  materialRef: React.RefObject<THREE.ShaderMaterial>,
  config: GlitchConfig = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const glitchCooldown = useRef(0);

  useFrame((_, delta) => {
    if (!cfg.enabled || !materialRef.current) return;

    const uniforms = materialRef.current.uniforms as any;
    glitchCooldown.current -= delta;

    if (glitchCooldown.current <= 0 && Math.random() < cfg.frequency) {
      uniforms.uGlitchIntensity.value = cfg.intensity + Math.random() * 0.3;
      glitchCooldown.current = cfg.cooldownMs / 1000;
    } else {
      uniforms.uGlitchIntensity.value *= 0.9;
    }
  });
}
