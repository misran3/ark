'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Color } from 'three';
import { Text } from '@react-three/drei';
import { createRingArc } from '@/lib/hologram/ring-geometry';
import '@/lib/hologram/ring-segment-material';

interface RingSegmentData {
  id: string;
  label: string;
  value: number;      // Current amount
  max: number;        // Budget/target amount
  health: number;     // 0-1
}

interface ShieldRingProps {
  innerRadius: number;
  outerRadius: number;
  segments: RingSegmentData[];
  color: Color;
  rotationSpeed?: number;
  label: string;
}

export function ShieldRing({
  innerRadius,
  outerRadius,
  segments,
  color,
  rotationSpeed = 0,
}: ShieldRingProps) {
  const groupRef = useRef<Group>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Pre-compute arc geometries
  const arcs = useMemo(() => {
    const totalValue = segments.reduce((sum, s) => sum + s.max, 0);
    let startAngle = -Math.PI / 2; // Start at top
    const gap = 0.03; // Small gap between segments

    return segments.map((seg) => {
      const arcAngle = (seg.max / totalValue) * Math.PI * 2 - gap;
      const geometry = createRingArc(innerRadius, outerRadius, startAngle, arcAngle, 24);
      const result = { ...seg, geometry, startAngle, arcAngle };
      startAngle += arcAngle + gap;
      return result;
    });
  }, [segments, innerRadius, outerRadius]);

  useFrame(({ clock }) => {
    if (groupRef.current && rotationSpeed) {
      groupRef.current.rotation.z += rotationSpeed * 0.001;
    }

    // Update shader uniforms
    groupRef.current?.children.forEach((child) => {
      const mesh = child as any;
      if (mesh.material?.uniforms) {
        mesh.material.uniforms.uTime.value = clock.getElapsedTime();
      }
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((arc) => {
        const fillLevel = Math.min(1, arc.value / arc.max);
        const isHovered = hoveredId === arc.id;
        const distress = arc.health < 0.4 ? 1 - arc.health / 0.4 : 0;

        return (
          <mesh
            key={arc.id}
            geometry={arc.geometry}
            scale={isHovered ? 1.08 : 1}
            onPointerEnter={(e) => {
              e.stopPropagation();
              setHoveredId(arc.id);
            }}
            onPointerLeave={() => setHoveredId(null)}
          >
            <ringSegmentMaterial
              uColor={color}
              uFillLevel={fillLevel}
              uOpacity={isHovered ? 0.95 : 0.8}
              uHighlight={isHovered ? 1 : 0}
              uDistress={distress}
              transparent
              depthWrite={false}
              side={2} // DoubleSide
            />
            {isHovered && (
              <group position={[0, 0, 0.1]}>
                <Text
                  fontSize={0.14}
                  color={color}
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth="5%"
                  outlineColor={color}
                  outlineOpacity={0.4}
                  position={[0, 0.15, 0]}
                >
                  {arc.label}
                </Text>
                <Text
                  fontSize={0.1}
                  color={color}
                  anchorX="center"
                  anchorY="middle"
                  fillOpacity={0.8}
                  position={[0, -0.05, 0]}
                >
                  {`${arc.value}% / ${arc.max}%  ·  ${(fillLevel * 100).toFixed(0)}% allocated`}
                </Text>
              </group>
            )}
          </mesh>
        );
      })}
    </group>
  );
}
