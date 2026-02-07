'use client';

import { Canvas } from '@react-three/fiber';
import { DigitDrum } from './primitives';

interface NetWorthOdometer3DProps {
  /** Dollar value to display (e.g. 47832) */
  value: number;
}

/**
 * INST-02 Primary: Mechanical odometer showing net worth as individual digit drums.
 * Each digit is a cylinder that rotates to show the correct number.
 */
function OdometerScene({ value }: NetWorthOdometer3DProps) {
  // Format as string with commas stripped, padded to 6 digits
  const absValue = Math.abs(Math.round(value));
  const digits = String(absValue).padStart(6, '0').split('').map(Number);
  const isNegative = value < 0;

  const spacing = 0.26;
  const startX = -((digits.length - 1) * spacing) / 2;

  return (
    <group position={[0, 0.05, 0]} scale={0.9}>
      {/* Dollar sign or negative */}
      <group position={[startX - spacing * 0.9, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.15, 0.25]} />
          <meshBasicMaterial color="#060a16" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.12, 0.2]} />
          <meshBasicMaterial color={isNegative ? '#ef4444' : '#00f0ff'} transparent opacity={0.15} />
        </mesh>
      </group>

      {/* Digit drums */}
      {digits.map((digit, i) => (
        <group key={i} position={[startX + i * spacing, 0, 0]}>
          <DigitDrum
            value={digit}
            width={0.2}
            height={0.3}
            digitColor={isNegative ? '#ef4444' : '#00f0ff'}
            stiffness={60 + i * 10}
            damping={8}
          />
        </group>
      ))}
    </group>
  );
}

export function NetWorthOdometer3D({ value }: NetWorthOdometer3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 2], fov: 40 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="demand"
      resize={{ offsetSize: true }}
    >
      <OdometerScene value={value} />
    </Canvas>
  );
}
