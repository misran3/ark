'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Color, MathUtils, type Mesh, type BufferGeometry, BufferAttribute, DoubleSide, AdditiveBlending } from 'three';
import type { CreditCardData } from '@/lib/data/fleet-cards';
import '@/lib/hologram/card-hologram-material';

// Brand mark geometries — simple wireframe shapes
function HexagonMark({ color }: { color: Color }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
      pts.push(Math.cos(a1) * 0.06, Math.sin(a1) * 0.06, 0);
      pts.push(Math.cos(a2) * 0.06, Math.sin(a2) * 0.06, 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo} position={[-0.35, 0.2, 0.015]}>
      <lineBasicMaterial color={color} transparent opacity={0.6} blending={AdditiveBlending} />
    </lineSegments>
  );
}

function SquaresMark({ color }: { color: Color }) {
  const geo = useMemo(() => {
    const s = 0.045;
    const g = 0.01;
    const pts: number[] = [];
    // 2x2 grid of squares
    for (const ox of [-s - g / 2, g / 2]) {
      for (const oy of [-s - g / 2, g / 2]) {
        pts.push(ox, oy, 0, ox + s, oy, 0);
        pts.push(ox + s, oy, 0, ox + s, oy + s, 0);
        pts.push(ox + s, oy + s, 0, ox, oy + s, 0);
        pts.push(ox, oy + s, 0, ox, oy, 0);
      }
    }
    const g2 = new BufferGeometry();
    g2.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
    return g2;
  }, []);
  return (
    <lineSegments geometry={geo} position={[-0.35, 0.2, 0.015]}>
      <lineBasicMaterial color={color} transparent opacity={0.6} blending={AdditiveBlending} />
    </lineSegments>
  );
}

function ArcMark({ color }: { color: Color }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const segs = 12;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI - Math.PI / 2;
      const a2 = ((i + 1) / segs) * Math.PI - Math.PI / 2;
      pts.push(Math.cos(a1) * 0.06, Math.sin(a1) * 0.06, 0);
      pts.push(Math.cos(a2) * 0.06, Math.sin(a2) * 0.06, 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo} position={[-0.35, 0.2, 0.015]}>
      <lineBasicMaterial color={color} transparent opacity={0.6} blending={AdditiveBlending} />
    </lineSegments>
  );
}

const BRAND_MARKS = { hexagon: HexagonMark, squares: SquaresMark, arc: ArcMark } as const;

interface CreditCard3DProps {
  card: CreditCardData;
  systemColor: Color;
  reveal: number;
  rotationOffset: number;
}

export function CreditCard3D({ card, systemColor, reveal, rotationOffset }: CreditCard3DProps) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1);

  const brandColor = useMemo(
    () => new Color(card.brandColor[0] / 255, card.brandColor[1] / 255, card.brandColor[2] / 255),
    [card.brandColor]
  );

  const BrandMark = BRAND_MARKS[card.brandMark];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    // Rotation — slow Y-axis spin
    mesh.rotation.y = t * (0.2 + card.utilization * 0.001) + rotationOffset;

    // Breathing motion
    mesh.position.y = Math.sin(t * 0.8 + rotationOffset) * 0.05;

    // Reveal scale
    const targetScale = reveal * (hovered ? 1.08 : 1.0);
    hoverScale.current = MathUtils.lerp(hoverScale.current, targetScale, 0.1);
    const s = Math.max(hoverScale.current, 0.001);
    mesh.scale.setScalar(s);

    // Update uniforms
    mat.uTime = t;
    mat.uUtilization = card.utilization / 100;
    mat.uBrandColor = brandColor;
    mat.uColor = systemColor;
  });

  return (
    <mesh
      ref={meshRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <boxGeometry args={[1.0, 0.63, 0.02]} />
      <cardHologramMaterial
        ref={matRef}
        transparent
        side={DoubleSide}
        depthWrite={false}
        blending={AdditiveBlending}
      />

      {/* Card name */}
      <Text
        fontSize={0.06}
        letterSpacing={0.2}
        color={brandColor}
        anchorX="left"
        anchorY="top"
        fillOpacity={0.8}
        position={[-0.42, 0.25, 0.015]}
      >
        {card.name}
      </Text>

      {/* Card number */}
      <Text
        fontSize={0.04}
        letterSpacing={0.08}
        color={systemColor}
        anchorX="left"
        anchorY="bottom"
        fillOpacity={0.45}
        position={[-0.42, -0.22, 0.015]}
      >
        {card.cardNumber}
      </Text>

      {/* Brand mark */}
      <BrandMark color={brandColor} />
    </mesh>
  );
}
