'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 800;

export function StarfieldBackground() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate star positions and properties (stable across frames)
  const { positions, sizes, twinkleOffsets } = useMemo(() => {
    const positions: number[] = [];
    const sizes: number[] = [];
    const twinkleOffsets: number[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      // Random position in 3D space
      positions.push(
        Math.random() * 2000 - 1000, // x: -1000 to 1000
        Math.random() * 2000 - 1000, // y: -1000 to 1000
        -(Math.random() * 1500 + 100)  // z: -100 to -1600 (behind camera)
      );

      // Random size
      sizes.push(Math.random() * 1.5 + 0.5);

      // Random twinkle phase offset
      twinkleOffsets.push(Math.random() * Math.PI * 2);
    }

    return { positions, sizes, twinkleOffsets };
  }, []);

  // Initialize instance matrices
  useMemo(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < STAR_COUNT; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.scale.setScalar(sizes[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, sizes, dummy]);

  // Twinkling animation (reuses single Object3D)
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < STAR_COUNT; i++) {
      const twinkle = Math.sin(time * 0.5 + twinkleOffsets[i]) * 0.4 + 0.6;
      const scale = sizes[i] * twinkle;

      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[0.8, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  );
}
