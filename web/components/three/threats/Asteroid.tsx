'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  label?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

export default function Asteroid({
  position,
  size = 1,
  color = '#ff5733',
  label = 'THREAT',
  onHover,
  onClick,
}: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Generate random asteroid shape
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(size, 8, 8);
    const positionAttribute = geo.getAttribute('position');

    // Deform vertices for irregular shape
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      const noise = 0.5 + Math.random() * 0.5;
      positionAttribute.setXYZ(i, x * noise, y * noise, z * noise);
    }

    geo.computeVertexNormals();
    return geo;
  }, [size]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();

    // Rotate asteroid
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.003;
    meshRef.current.rotation.z += 0.002;

    // Pulse glow when hovered
    if (glowRef.current) {
      const glowScale = isHovered ? 1.5 + Math.sin(time * 5) * 0.2 : 1.2;
      glowRef.current.scale.setScalar(glowScale);
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
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main asteroid body */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Targeting brackets when hovered */}
      {isHovered && (
        <>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(size * 2.5, size * 2.5, size * 2.5)]} />
            <lineBasicMaterial color={color} opacity={0.5} transparent />
          </lineSegments>
        </>
      )}
    </group>
  );
}

// Add useState import
import { useState } from 'react';
