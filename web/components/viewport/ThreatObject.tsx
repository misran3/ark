'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Threat } from '@/lib/stores/threat-store';

interface ThreatObjectProps {
  threat: Threat;
  onDeflect: (id: string) => void;
}

export function ThreatObject({ threat, onDeflect }: ThreatObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  // Position and wobble
  useFrame(() => {
    if (!meshRef.current) return;

    angleRef.current += 0.01;

    const wobbleX = Math.sin(angleRef.current) * 30;
    const wobbleY = Math.cos(angleRef.current * 0.7) * 20;

    meshRef.current.position.x = threat.position[0] * 50 + wobbleX;
    meshRef.current.position.y = threat.position[1] * 50 + wobbleY;
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.008;
  });

  const color = threat.color;

  return (
    <group>
      {/* Core mesh */}
      <mesh
        ref={meshRef}
        position={[threat.position[0] * 50, threat.position[1] * 50, threat.position[2] * 50]}
        onClick={() => onDeflect(threat.id)}
      >
        {/* Different geometry per threat type */}
        {threat.type === 'asteroid' && <icosahedronGeometry args={[18, 0]} />}
        {threat.type === 'ion_storm' && <octahedronGeometry args={[22, 0]} />}
        {threat.type === 'solar_flare' && <tetrahedronGeometry args={[15, 0]} />}
        {threat.type === 'black_hole' && <torusGeometry args={[20, 5, 16, 32]} />}
        {threat.type === 'wormhole' && <dodecahedronGeometry args={[16, 0]} />}
        {threat.type === 'enemy_cruiser' && <coneGeometry args={[12, 30, 6]} />}

        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Glow halo */}
      <mesh position={[threat.position[0] * 50, threat.position[1] * 50, threat.position[2] * 50]}>
        <sphereGeometry args={[30, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        position={[threat.position[0] * 50, threat.position[1] * 50, threat.position[2] * 50]}
        color={color}
        intensity={0.5}
        distance={100}
      />
    </group>
  );
}
