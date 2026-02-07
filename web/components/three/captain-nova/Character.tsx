'use client';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { assembleCharacter, NovaGeometryConfig } from './geometry';
import { createHologramMaterial } from './materials';

export interface CharacterProps {
  geometryConfig?: NovaGeometryConfig;
  materialRef?: React.RefObject<THREE.ShaderMaterial>;
  onCharacterReady?: (character: THREE.Group) => void;
}

/**
 * Captain Nova character mesh with hologram material
 *
 * Note: Colors are managed by parent component via updateHologramUniforms
 */
export function Character({
  geometryConfig,
  materialRef,
  onCharacterReady,
}: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const internalMaterialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const character = assembleCharacter(geometryConfig);
    // Use default colors - parent updates via updateHologramUniforms in useFrame
    const material = createHologramMaterial();

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
      // Dispose geometries to prevent memory leaks
      character.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
      groupRef.current?.remove(character);
      material.dispose();
    };
  }, [geometryConfig, materialRef, onCharacterReady]);

  return <group ref={groupRef} name="captain-nova-character" />;
}
