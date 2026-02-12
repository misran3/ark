'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import {
  Group,
  Color,
  SphereGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  WireframeGeometry,
  LineBasicMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  TorusGeometry,
  BufferGeometry,
  Float32BufferAttribute,
} from 'three';
import type { AssetGeometry } from '@/lib/stores/asset-store';

interface AssetPlanetProps {
  name: string;
  value: number;
  orbitRadius: number;
  fixedAngle: number;    // Radians — static position on ring
  size: number;
  geometry: AssetGeometry;
  color: Color;
  onClick?: () => void;
}

const formatDollars = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

// Create a jagged crystal geometry by offsetting icosahedron vertices
function createCrystalGeometry(radius: number): BufferGeometry {
  const ico = new IcosahedronGeometry(radius, 1);
  const positions = ico.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const jitter = 0.7 + Math.random() * 0.6; // 0.7–1.3x offset
    positions.setX(i, positions.getX(i) * jitter);
    positions.setY(i, positions.getY(i) * jitter);
    positions.setZ(i, positions.getZ(i) * jitter);
  }
  positions.needsUpdate = true;
  ico.computeVertexNormals();
  return ico;
}

export function AssetPlanet({
  name,
  value,
  orbitRadius,
  fixedAngle,
  size,
  geometry: geoType,
  color,
  onClick,
}: AssetPlanetProps) {
  const wireGroupRef = useRef<Group>(null);
  const shieldRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Position on the orbital ring (parent group handles tilt + slow rotation)
  const position = useMemo<[number, number, number]>(() => {
    const x = Math.cos(fixedAngle) * orbitRadius;
    const z = Math.sin(fixedAngle) * orbitRadius;
    return [x, 0, z];
  }, [fixedAngle, orbitRadius]);

  // ── Geometry per asset type ────────────────────────────────────
  const wireGeo = useMemo(() => {
    let base: BufferGeometry;
    switch (geoType) {
      case 'sphere':
        base = new SphereGeometry(size, 32, 24);
        break;
      case 'icosahedron-ringed':
        base = new IcosahedronGeometry(size, 1);
        break;
      case 'octahedron':
        base = new OctahedronGeometry(size, 0);
        break;
      case 'sphere-shielded':
        base = new SphereGeometry(size, 32, 24);
        break;
      case 'crystal':
        base = createCrystalGeometry(size);
        break;
      default:
        base = new IcosahedronGeometry(size, 1);
    }
    return new WireframeGeometry(base);
  }, [size, geoType]);

  const wireMat = useMemo(
    () =>
      new LineBasicMaterial({
        color,
        transparent: true,
        opacity: hovered ? 0.9 : 0.7,
      }),
    [color, hovered]
  );

  // Inner fill (subtle holographic volume)
  const fillGeo = useMemo(() => {
    switch (geoType) {
      case 'sphere':
      case 'sphere-shielded':
        return new SphereGeometry(size * 0.95, 16, 12);
      case 'octahedron':
        return new OctahedronGeometry(size * 0.95, 0);
      case 'crystal':
        return createCrystalGeometry(size * 0.95);
      default:
        return new IcosahedronGeometry(size * 0.95, 1);
    }
  }, [size, geoType]);

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

  // Saturn ring for icosahedron-ringed (Investment Portfolio)
  const saturnRingGeo = useMemo(() => {
    if (geoType !== 'icosahedron-ringed') return null;
    const torus = new TorusGeometry(size * 1.8, 0.02, 4, 32);
    return new WireframeGeometry(torus);
  }, [size, geoType]);

  const ringMat = useMemo(
    () => new LineBasicMaterial({ color, transparent: true, opacity: 0.35 }),
    [color]
  );

  // Shield glow for sphere-shielded (Emergency Fund)
  const shieldGeo = useMemo(() => {
    if (geoType !== 'sphere-shielded') return null;
    return new SphereGeometry(size * 1.3, 16, 12);
  }, [size, geoType]);

  const shieldMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    // Self-rotation (~10s per revolution)
    if (wireGroupRef.current) {
      wireGroupRef.current.rotation.y += 0.01;
      wireGroupRef.current.rotation.x += 0.003;
    }

    // Pulsing shield glow
    if (shieldRef.current && geoType === 'sphere-shielded') {
      const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 2.0) * 0.08;
      shieldRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Wireframe planet */}
      <group ref={wireGroupRef} scale={hovered ? 1.15 : 1}>
        <lineSegments geometry={wireGeo} material={wireMat} />
        <mesh geometry={fillGeo} material={fillMat} />

        {/* Saturn ring (Investment Portfolio) */}
        {saturnRingGeo && (
          <lineSegments
            geometry={saturnRingGeo}
            material={ringMat}
            rotation-x={Math.PI / 3}
          />
        )}
      </group>

      {/* Pulsing shield (Emergency Fund) */}
      {shieldGeo && (
        <group ref={shieldRef}>
          <mesh geometry={shieldGeo} material={shieldMat} />
        </group>
      )}

      {/* Labels — billboard to always face camera */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.14}
          letterSpacing={0.15}
          color={color}
          anchorX="center"
          anchorY="bottom"
          fillOpacity={hovered ? 0.9 : 0.7}
          outlineWidth="6%"
          outlineColor="#000000"
          outlineOpacity={0.5}
          position={[0, size + 0.25, 0]}
        >
          {formatDollars(value)}
        </Text>
        <Text
          fontSize={0.08}
          letterSpacing={0.2}
          color={color}
          anchorX="center"
          anchorY="bottom"
          fillOpacity={hovered ? 0.7 : 0.5}
          outlineWidth="6%"
          outlineColor="#000000"
          outlineOpacity={0.4}
          position={[0, size + 0.08, 0]}
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}
