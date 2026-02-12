'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Group,
  Color,
  IcosahedronGeometry,
  WireframeGeometry,
  LineBasicMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  TorusGeometry,
} from 'three';

interface AssetPlanetProps {
  name: string;
  value: number;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  detail: number;
  hasRing?: boolean;
  color: Color;
  tilt: number;        // Orrery tilt in radians
  orbitOffset: number;  // Starting angle offset
  time: number;         // Current animation time (passed from parent useFrame)
  onClick?: () => void;
}

const formatCredits = (v: number) => {
  if (v >= 1_000_000) return `₡${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₡${(v / 1_000).toFixed(0)}K`;
  return `₡${v}`;
};

export function AssetPlanet({
  name,
  value,
  orbitRadius,
  orbitSpeed,
  size,
  detail,
  hasRing,
  color,
  tilt,
  orbitOffset,
  time,
  onClick,
}: AssetPlanetProps) {
  const groupRef = useRef<Group>(null);
  const wireGroupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Wireframe geometry
  const wireGeo = useMemo(() => {
    const ico = new IcosahedronGeometry(size, detail);
    return new WireframeGeometry(ico);
  }, [size, detail]);

  const wireMat = useMemo(
    () => new LineBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    [color]
  );

  // Inner fill (subtle holographic volume)
  const fillGeo = useMemo(() => new IcosahedronGeometry(size * 0.95, detail), [size, detail]);
  const fillMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.06,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  );

  // Saturn ring (torus wireframe) for cargo
  const ringWireGeo = useMemo(() => {
    if (!hasRing) return null;
    const torus = new TorusGeometry(size * 1.8, 0.02, 4, 32);
    return new WireframeGeometry(torus);
  }, [size, hasRing]);
  const ringMat = useMemo(
    () => new LineBasicMaterial({ color, transparent: true, opacity: 0.35 }),
    [color]
  );

  useFrame(() => {
    if (!groupRef.current) return;

    // Orbital position
    const angle = time * orbitSpeed + orbitOffset;
    const x = Math.cos(angle) * orbitRadius;
    const z = Math.sin(angle) * orbitRadius;
    // Apply tilt: Y is affected by the tilt angle
    const y = Math.sin(tilt) * z;
    const zTilted = Math.cos(tilt) * z;

    groupRef.current.position.set(x, y, zTilted);

    // Self-rotation
    if (wireGroupRef.current) {
      wireGroupRef.current.rotation.y += 0.015;
      wireGroupRef.current.rotation.x += 0.005;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Wireframe planet */}
      <group ref={wireGroupRef} scale={hovered ? 1.15 : 1}>
        <lineSegments geometry={wireGeo} material={wireMat} />
        <mesh geometry={fillGeo} material={fillMat} />
        {hasRing && ringWireGeo && (
          <lineSegments geometry={ringWireGeo} material={ringMat} rotation-x={Math.PI / 3} />
        )}
      </group>

      {/* Label: name + value */}
      <Text
        fontSize={0.12}
        letterSpacing={0.15}
        color={color}
        anchorX="center"
        anchorY="bottom"
        fillOpacity={0.6}
        outlineWidth="4%"
        outlineColor={color}
        outlineOpacity={0.15}
        position={[0, size + 0.25, 0]}
      >
        {formatCredits(value)}
      </Text>
      <Text
        fontSize={0.07}
        letterSpacing={0.2}
        color={color}
        anchorX="center"
        anchorY="bottom"
        fillOpacity={0.4}
        position={[0, size + 0.1, 0]}
      >
        {name}
      </Text>
    </group>
  );
}
