'use client';
import * as THREE from 'three';

export interface ProjectionBaseProps {
  auroraColor1: string;
  auroraColor2: string;
  platformRadius?: number;
  platformHeight?: number;
  ringOpacity?: number;
  coneOpacity?: number;
}

export function ProjectionBase({
  auroraColor1,
  auroraColor2,
  platformRadius = 0.4,
  platformHeight = 0.08,
  ringOpacity = 0.4,
  coneOpacity = 0.04,
}: ProjectionBaseProps) {
  return (
    <group name="projection-base">
      {/* Platform */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[platformRadius, platformRadius + 0.05, platformHeight, 32]} />
        <meshBasicMaterial
          color={auroraColor1}
          opacity={0.25}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* Holographic Ring */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[platformRadius - 0.02, platformRadius + 0.02, 32]} />
        <meshBasicMaterial
          color={auroraColor2}
          opacity={ringOpacity}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Projection Light Cone */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[platformRadius + 0.05, 1.7, 32, 1, true]} />
        <meshBasicMaterial
          color={auroraColor1}
          opacity={coneOpacity}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
