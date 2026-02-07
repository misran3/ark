import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { NovaIdleAnimations } from '../animations';
import { GestureSystem } from '../gestures';
import type { NovaBodyParts, AnimationConfig } from '../types';

export function useNovaAnimations(
  parts: NovaBodyParts | null,
  material: THREE.ShaderMaterial | null,
  config: AnimationConfig
) {
  const idleAnimationsRef = useRef<NovaIdleAnimations | null>(null);
  const gestureSystemRef = useRef<GestureSystem | null>(null);
  const glitchTimerRef = useRef(0);
  const { mouse } = useThree();

  useEffect(() => {
    if (!parts) return;

    idleAnimationsRef.current = new NovaIdleAnimations(parts, config);
    gestureSystemRef.current = new GestureSystem(parts);

    return () => {
      idleAnimationsRef.current = null;
      gestureSystemRef.current = null;
    };
  }, [parts, config]);

  useFrame(({ clock }, delta) => {
    if (!material) return;

    const elapsedTime = clock.getElapsedTime();

    // Update shader time
    material.uniforms.uTime.value = elapsedTime;

    // Update idle animations
    if (idleAnimationsRef.current) {
      idleAnimationsRef.current.update(delta, elapsedTime, {
        x: mouse.x,
        y: mouse.y,
      });
    }

    // Update gestures
    if (gestureSystemRef.current) {
      gestureSystemRef.current.update(delta);
    }

    // Random glitch effect (1-2 times per 10 seconds)
    glitchTimerRef.current += delta;
    if (glitchTimerRef.current > 5 + Math.random() * 5) {
      material.uniforms.uGlitchIntensity.value = 0.8;
      setTimeout(() => {
        if (material) material.uniforms.uGlitchIntensity.value = 0;
      }, 50 + Math.random() * 50);
      glitchTimerRef.current = 0;
    }
  });

  return gestureSystemRef.current;
}
