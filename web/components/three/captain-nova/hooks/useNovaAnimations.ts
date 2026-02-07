import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBreathing, BreathingConfig } from './useBreathing';
import { useWeightShift, WeightShiftConfig } from './useWeightShift';
import { useHeadTracking, HeadTrackingConfig } from './useHeadTracking';
import { useGlitchEffect, GlitchConfig } from './useGlitchEffect';

export interface NovaAnimationConfig {
  breathing?: BreathingConfig;
  weightShift?: WeightShiftConfig;
  headTracking?: HeadTrackingConfig;
  glitch?: GlitchConfig;
  idleSway?: {
    enabled?: boolean;
    speed?: number; // multiplier
    amount?: number; // radians
  };
}

/**
 * Composite hook for all Captain Nova animations
 *
 * @param characterRef - Reference to character group
 * @param materialRef - Reference to hologram material
 * @param config - Animation configurations
 */
export function useNovaAnimations(
  characterRef: React.RefObject<THREE.Group>,
  materialRef: React.RefObject<THREE.ShaderMaterial>,
  config: NovaAnimationConfig = {}
) {
  const torsoRef = useRef<THREE.Mesh>(null);
  const hipsRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // Setup refs from character group
  useFrame(() => {
    if (!characterRef.current) return;

    if (!torsoRef.current) {
      torsoRef.current = characterRef.current.getObjectByName('torso') as THREE.Mesh;
    }
    if (!hipsRef.current) {
      hipsRef.current = characterRef.current.getObjectByName('hips') as THREE.Mesh;
    }
    if (!headRef.current) {
      headRef.current = characterRef.current.getObjectByName('head') as THREE.Mesh;
    }
  });

  // Individual animations
  useBreathing(torsoRef, config.breathing);
  useWeightShift(hipsRef, config.weightShift);
  useHeadTracking(headRef, config.headTracking);
  useGlitchEffect(materialRef, config.glitch);

  // Idle sway
  const idleSwayConfig = {
    enabled: true,
    speed: 0.3,
    amount: 0.03,
    ...config.idleSway,
  };

  useFrame(({ clock }) => {
    if (!idleSwayConfig.enabled || !characterRef.current) return;

    const time = clock.getElapsedTime();
    characterRef.current.rotation.y =
      Math.sin(time * idleSwayConfig.speed) * idleSwayConfig.amount;
  });

  return {
    torsoRef,
    hipsRef,
    headRef,
  };
}
