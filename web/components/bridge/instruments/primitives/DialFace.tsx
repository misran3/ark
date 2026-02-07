'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface DialFaceProps {
  /** Radius of the dial disc */
  radius?: number;
  /** Min value for scale labeling */
  minValue?: number;
  /** Max value for scale labeling */
  maxValue?: number;
  /** Number of major tick marks */
  majorTicks?: number;
  /** Number of minor ticks between each major */
  minorTicks?: number;
  /** Range considered danger zone (drawn in red) */
  dangerRange?: [number, number];
  /** Color for normal tick marks */
  tickColor?: string;
  /** Color for danger zone ticks */
  dangerColor?: string;
  /** Start angle in radians (gauge sweep start) */
  startAngle?: number;
  /** Sweep angle in radians (total arc) */
  sweepAngle?: number;
}

/**
 * Circular dial face — flat disc with printed tick marks.
 * Used as the base for gauge instruments.
 */
export function DialFace({
  radius = 0.85,
  minValue = 0,
  maxValue = 100,
  majorTicks = 11,
  minorTicks = 4,
  dangerRange = [0, 25],
  tickColor = '#4a6580',
  dangerColor = '#ef4444',
  startAngle = Math.PI * 0.75,
  sweepAngle = -Math.PI * 1.5,
}: DialFaceProps) {
  const tickGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const totalTicks = (majorTicks - 1) * (minorTicks + 1) + 1;

    const normalColor = new THREE.Color(tickColor);
    const dangerCol = new THREE.Color(dangerColor);
    const valueRange = maxValue - minValue;
    const dangerStart = (dangerRange[0] - minValue) / valueRange;
    const dangerEnd = (dangerRange[1] - minValue) / valueRange;

    for (let i = 0; i < totalTicks; i++) {
      const t = i / (totalTicks - 1);
      const angle = startAngle + sweepAngle * t;
      const isMajor = i % (minorTicks + 1) === 0;
      const innerR = isMajor ? radius * 0.72 : radius * 0.80;
      const outerR = radius * 0.88;

      const isDanger = t >= dangerStart && t <= dangerEnd;
      const color = isDanger ? dangerCol : normalColor;

      // Line segment (two vertices)
      positions.push(
        Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0.01,
        Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0.01,
      );
      colors.push(
        color.r, color.g, color.b,
        color.r, color.g, color.b,
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [radius, majorTicks, minorTicks, dangerRange, tickColor, dangerColor, startAngle, sweepAngle, minValue, maxValue]);

  return (
    <group>
      {/* Dial disc background */}
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color="#080c1a" transparent opacity={0.9} />
      </mesh>

      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[radius * 0.92, radius, 48]} />
        <meshBasicMaterial color="#1a2235" transparent opacity={0.8} />
      </mesh>

      {/* Tick marks */}
      <lineSegments geometry={tickGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
