'use client';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuroraColors } from '@/hooks/useAuroraColors';
import { Character } from './Character';
import { ProjectionBase } from './ProjectionBase';
import { useNovaAnimations, NovaAnimationConfig } from './hooks/useNovaAnimations';
import { updateHologramUniforms } from './materials';
import { NovaGeometryConfig } from './geometry';

export interface CaptainNovaProps {
  position?: [number, number, number];
  geometryConfig?: NovaGeometryConfig;
  animationConfig?: NovaAnimationConfig;
}

export default function CaptainNova({
  position = [-4, -2, 0],
  geometryConfig,
  animationConfig,
}: CaptainNovaProps) {
  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const colors = useAuroraColors();

  useNovaAnimations(characterRef, materialRef, animationConfig);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    updateHologramUniforms(materialRef.current, {
      time: clock.getElapsedTime(),
      auroraColor1: colors[0],
      auroraColor2: colors[1],
    });
  });

  const handleCharacterReady = (character: THREE.Group) => {
    characterRef.current = character;
  };

  return (
    <group ref={groupRef} position={position} name="captain-nova">
      <ProjectionBase auroraColor1={colors[0]} auroraColor2={colors[1]} />
      <Character
        auroraColor1={colors[0]}
        auroraColor2={colors[1]}
        geometryConfig={geometryConfig}
        materialRef={materialRef}
        onCharacterReady={handleCharacterReady}
      />
    </group>
  );
}

export type { NovaGeometryConfig, NovaAnimationConfig };
