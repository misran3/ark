'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SolarFlareProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

export default function SolarFlare({
  position,
  size = 2,
  color = '#fbbf24',
  onHover,
  onClick,
}: SolarFlareProps) {
  const groupRef = useRef<THREE.Group>(null);
  const waveRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!groupRef.current || !waveRef.current) return;

    const time = clock.getElapsedTime();

    // Pulsing wave
    const pulse = Math.sin(time * 2) * 0.5 + 0.5;
    waveRef.current.scale.setScalar(1 + pulse * 0.3);
    waveRef.current.material.opacity = 0.4 - pulse * 0.2;

    // Shimmer effect
    groupRef.current.rotation.z += 0.02;

    if (isHovered) {
      groupRef.current.scale.setScalar(1.1);
    } else {
      groupRef.current.scale.setScalar(1);
    }
  });

  const handlePointerOver = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Central core */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Expanding wave */}
      <mesh ref={waveRef}>
        <ringGeometry args={[size * 0.8, size * 1.2, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Flare rays */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;

        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
            <coneGeometry args={[0.1, size * 0.5, 4]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
