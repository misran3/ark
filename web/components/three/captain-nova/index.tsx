'use client';
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuroraColors } from '@/hooks/useAuroraColors';
import { createNovaGeometry } from './geometry';
import { createHologramMaterial, updateHologramUniforms } from './materials';
import { useNovaAnimations } from './hooks/useNovaAnimations';
import type { NovaGeometryConfig, AnimationConfig, NovaBodyParts } from './types';

export interface CaptainNovaHandle {
  playGesture: (gesture: 'point' | 'salute' | 'at-ease') => void;
}

export interface CaptainNovaProps {
  position?: [number, number, number];
  geometryConfig?: NovaGeometryConfig;
  animationConfig?: AnimationConfig;
}

const defaultAnimConfig: AnimationConfig = {
  breathing: { enabled: true, cycleDuration: 4, scaleAmount: 0.015 },
  headTracking: {
    enabled: true,
    maxRotationY: 0.15,
    maxRotationX: 0.1,
    lerpSpeed: 0.05,
  },
  idleSway: { enabled: true, speed: 0.3, amount: 0.02 },
};

const CaptainNova = forwardRef<CaptainNovaHandle, CaptainNovaProps>(
  function CaptainNova(
    {
      position = [-4, -2, 0],
      geometryConfig,
      animationConfig = defaultAnimConfig,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null);
    const [bodyParts, setBodyParts] = useState<NovaBodyParts | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const colors = useAuroraColors();

    // Create geometry on mount
    useEffect(() => {
      const parts = createNovaGeometry(geometryConfig);
      const material = createHologramMaterial(colors[0], colors[1]);
      // Offset fade thresholds by group Y so fade works at any position
      material.uniforms.uFadeStart.value += position[1];
      material.uniforms.uFadeEnd.value += position[1];
      materialRef.current = material;

      // Apply material to all meshes
      parts.root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      if (groupRef.current) {
        groupRef.current.add(parts.root);
      }

      setBodyParts(parts);

      return () => {
        parts.root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
          }
        });
        material.dispose();
        if (groupRef.current) {
          groupRef.current.remove(parts.root);
        }
      };
    }, [geometryConfig]);

    // Animation system
    const gestureSystem = useNovaAnimations(
      bodyParts,
      materialRef.current,
      animationConfig
    );

    // Expose gesture triggers via ref
    useImperativeHandle(ref, () => ({
      playGesture: (gesture: 'point' | 'salute' | 'at-ease') => {
        gestureSystem?.playGesture({ name: gesture, duration: 2 });
      },
    }));

    // Update aurora colors
    useFrame(() => {
      if (!materialRef.current) return;
      updateHologramUniforms(materialRef.current, {
        auroraColor1: colors[0],
        auroraColor2: colors[1],
      });
    });

    return <group ref={groupRef} position={position} name="captain-nova-v3" />;
  }
);

export default CaptainNova;
export type { NovaGeometryConfig, AnimationConfig };
export { createNovaGeometry, createHologramMaterial };
