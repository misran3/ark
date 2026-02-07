'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IonStormProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

export default function IonStorm({
  position,
  size = 1.5,
  color = '#a855f7',
  onHover,
  onClick,
}: IonStormProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Create particle cloud
  const particleSystem = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Random position in sphere
      const radius = Math.random() * size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Random velocities for swirling
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { positions, velocities, count };
  }, [size]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !particlesRef.current) return;

    const time = clock.getElapsedTime();

    // Swirl the entire storm
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;

    // Animate particles
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleSystem.count; i++) {
      const i3 = i * 3;

      // Swirling motion
      positions[i3] += particleSystem.velocities[i3];
      positions[i3 + 1] += particleSystem.velocities[i3 + 1];
      positions[i3 + 2] += particleSystem.velocities[i3 + 2];

      // Keep particles within bounds
      const dist = Math.sqrt(
        positions[i3] ** 2 +
        positions[i3 + 1] ** 2 +
        positions[i3 + 2] ** 2
      );
      if (dist > size) {
        positions[i3] *= 0.9;
        positions[i3 + 1] *= 0.9;
        positions[i3 + 2] *= 0.9;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Pulse when hovered
    if (isHovered) {
      const scale = 1 + Math.sin(time * 10) * 0.1;
      groupRef.current.scale.setScalar(scale);
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
      {/* Particle cloud */}
      <points
        ref={particlesRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleSystem.count}
            array={particleSystem.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color={color}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Electric arcs (simulated with lines) */}
      {isHovered && (
        <>
          {[...Array(5)].map((_, i) => {
            const start = new THREE.Vector3(
              (Math.random() - 0.5) * size,
              (Math.random() - 0.5) * size,
              (Math.random() - 0.5) * size
            );
            const end = new THREE.Vector3(
              (Math.random() - 0.5) * size,
              (Math.random() - 0.5) * size,
              (Math.random() - 0.5) * size
            );

            return (
              <line key={i}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([...start.toArray(), ...end.toArray()])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={color} opacity={0.4} transparent />
              </line>
            );
          })}
        </>
      )}
    </group>
  );
}
