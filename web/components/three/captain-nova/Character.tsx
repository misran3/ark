'use client';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { assembleCharacter, NovaGeometryConfig } from './geometry';
import { createHologramMaterial } from './materials';

export interface CharacterProps {
  auroraColor1: string;
  auroraColor2: string;
  geometryConfig?: NovaGeometryConfig;
  materialRef?: React.RefObject<THREE.ShaderMaterial>;
  onCharacterReady?: (character: THREE.Group) => void;
}

export function Character({
  auroraColor1,
  auroraColor2,
  geometryConfig,
  materialRef,
  onCharacterReady,
}: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const internalMaterialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const character = assembleCharacter(geometryConfig);
    const material = createHologramMaterial(auroraColor1, auroraColor2);

    if (materialRef) {
      (materialRef as any).current = material;
    }
    internalMaterialRef.current = material;

    character.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    groupRef.current.add(character);

    if (onCharacterReady) {
      onCharacterReady(character);
    }

    return () => {
      groupRef.current?.remove(character);
      material.dispose();
    };
  }, [geometryConfig]);

  return <group ref={groupRef} name="captain-nova-character" />;
}
