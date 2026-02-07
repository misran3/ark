'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, AdditiveBlending, type Mesh } from 'three';

interface CardUtilizationBarProps {
  utilization: number; // 0-100
  systemColor: Color;
  reveal: number; // 0-1
}

const BAR_WIDTH = 0.9;

function getBarColor(util: number): Color {
  if (util < 30) return new Color(0.2, 0.9, 0.3);
  if (util < 70) return new Color(0.95, 0.75, 0.15);
  return new Color(1.0, 0.2, 0.15);
}

export function CardUtilizationBar({ utilization, systemColor, reveal }: CardUtilizationBarProps) {
  const fillRef = useRef<Mesh>(null);
  const fillColor = getBarColor(utilization);
  const targetFill = utilization / 100;

  useFrame(({ clock }) => {
    const mesh = fillRef.current;
    if (!mesh) return;

    // Animate fill based on reveal progress
    const fill = MathUtils.lerp(0, targetFill, Math.min(reveal * 2, 1));
    mesh.scale.x = Math.max(fill, 0.001);
    mesh.position.x = -(BAR_WIDTH / 2) * (1 - fill);

    // Pulse when high utilization
    if (utilization > 70) {
      const pulse = Math.sin(clock.getElapsedTime() * 4) * 0.15 + 0.85;
      (mesh.material as any).opacity = pulse;
    }
  });

  return (
    <group position={[0, -0.35, 0.015]}>
      {/* Background bar */}
      <mesh>
        <boxGeometry args={[BAR_WIDTH, 0.025, 0.005]} />
        <meshBasicMaterial
          color={systemColor}
          transparent
          opacity={0.15}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Fill bar */}
      <mesh ref={fillRef}>
        <boxGeometry args={[BAR_WIDTH, 0.025, 0.006]} />
        <meshBasicMaterial
          color={fillColor}
          transparent
          opacity={0.7}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
