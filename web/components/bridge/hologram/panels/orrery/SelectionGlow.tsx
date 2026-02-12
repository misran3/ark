'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, TorusGeometry, MeshBasicMaterial, AdditiveBlending, Color } from 'three';

interface SelectionGlowProps {
  size: number;
  color: Color;
}

export function SelectionGlow({ size, color }: SelectionGlowProps) {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(
    () => new TorusGeometry(size * 1.6, 0.03, 8, 48),
    [size]
  );

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 0.4 + Math.sin(clock.getElapsedTime() * 4) * 0.3;
      material.opacity = pulse;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation-x={Math.PI / 2}
    />
  );
}
