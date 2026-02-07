'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuroraColors } from '@/hooks/useAuroraColors';
import { useTransitionStore } from '@/lib/stores/transition-store';

export default function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colors = useAuroraColors();
  const starfieldOpacity = useTransitionStore((state) => state.starfieldOpacity);

  const { positions, colorIndices, sizes } = useMemo(() => {
    const positions: number[] = [];
    const colorIndices: number[] = [];
    const sizes: number[] = [];
    const count = 5000;

    for (let i = 0; i < count; i++) {
      // Random position in sphere
      const radius = 500 + Math.random() * 1500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Assign to one of three aurora colors
      // 70% primary, 20% secondary, 10% tertiary
      const rand = Math.random();
      if (rand < 0.7) {
        colorIndices.push(0);
      } else if (rand < 0.9) {
        colorIndices.push(1);
      } else {
        colorIndices.push(2);
      }

      // Random sizes - some stars are bigger
      sizes.push(Math.random() < 0.95 ? 0.5 : 1.5);
    }

    return { positions, colorIndices, sizes };
  }, []);

  // Animate stars (twinkling)
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < 5000; i++) {
      // Position
      const scale = sizes[i];
      matrix.identity();
      matrix.setPosition(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      meshRef.current.setMatrixAt(i, matrix);

      // Color with twinkle and opacity from transition
      const auroraColor = colors[colorIndices[i]];
      color.set(auroraColor);
      const twinkle = 0.3 + 0.7 * (Math.sin(time * 2 + i * 0.1) * 0.5 + 0.5);
      color.multiplyScalar(twinkle * starfieldOpacity);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 5000]}>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshBasicMaterial />
      </instancedMesh>

      {/* Deep space nebula background */}
      <mesh position={[0, 0, -1500]}>
        <planeGeometry args={[3000, 3000]} />
        <meshBasicMaterial
          color="#020510"
          transparent
          opacity={0.3}
        />
      </mesh>
    </>
  );
}
