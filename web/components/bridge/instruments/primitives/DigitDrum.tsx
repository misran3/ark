'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';

interface DigitDrumProps {
  /** Current digit value (0-9, can be fractional for animation) */
  value: number;
  /** Width of the drum */
  width?: number;
  /** Height of the drum */
  height?: number;
  /** Color for the digits */
  digitColor?: string;
  /** Spring stiffness for rotation */
  stiffness?: number;
  /** Spring damping */
  damping?: number;
}

/**
 * Mechanical digit drum — cylinder with numbers around circumference.
 * Drums physically rotate on value change with momentum easing.
 *
 * Uses canvas texture at 2x resolution for crisp text on 3D surfaces.
 */
export function DigitDrum({
  value,
  width = 0.22,
  height = 0.35,
  digitColor = '#00f0ff',
  stiffness = 80,
  damping = 10,
}: DigitDrumProps) {
  const drumRef = useRef<Group>(null);
  const currentRotRef = useRef(0);
  const velocityRef = useRef(0);
  const prevValueRef = useRef(value);

  // Create canvas texture with digits 0-9 around the cylinder
  const drumTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const dpr = 2;
    canvas.width = 128 * dpr;
    canvas.height = 512 * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, 128, 512);

    // Draw digits 0-9 evenly spaced vertically
    ctx.font = 'bold 36px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 10; i++) {
      const y = (i / 10) * 512 + 25.6;

      // Digit
      ctx.fillStyle = digitColor;
      ctx.globalAlpha = 0.85;
      ctx.fillText(String(i), 64, y);

      // Subtle line separators
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#4a6580';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(10, (i / 10) * 512);
      ctx.lineTo(118, (i / 10) * 512);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, [digitColor]);

  // Dispose GPU texture on unmount or when digitColor changes
  useEffect(() => {
    return () => {
      drumTexture.dispose();
    };
  }, [drumTexture]);

  // Handle value changes — add velocity for momentum
  useEffect(() => {
    const diff = value - prevValueRef.current;
    if (Math.abs(diff) > 0.01) {
      velocityRef.current += diff * 0.5; // initial kick
    }
    prevValueRef.current = value;
  }, [value]);

  // Target rotation for current value
  const targetRotation = -(value / 10) * Math.PI * 2;

  useFrame((_, delta) => {
    if (!drumRef.current) return;
    const dt = Math.min(delta, 0.05);

    // Spring physics
    const displacement = targetRotation - currentRotRef.current;
    const springForce = displacement * stiffness;
    const dampForce = -velocityRef.current * damping;
    velocityRef.current += (springForce + dampForce) * dt;
    currentRotRef.current += velocityRef.current * dt;

    drumRef.current.rotation.x = currentRotRef.current;
  });

  return (
    <group>
      {/* Recessed window frame */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width * 1.2, height * 0.6]} />
        <meshBasicMaterial color="#040810" transparent opacity={0.9} />
      </mesh>

      {/* Window border */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[width * 1.3, height * 0.65]} />
        <meshBasicMaterial color="#1a2235" transparent opacity={0.5} />
      </mesh>

      {/* Drum cylinder */}
      <group ref={drumRef} position={[0, 0, -0.02]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[height * 0.45, height * 0.45, width, 20, 1, true]} />
          <meshBasicMaterial map={drumTexture} side={THREE.DoubleSide} transparent />
        </mesh>
      </group>

      {/* Top/bottom shadow (visible drum edges) */}
      <mesh position={[0, height * 0.28, 0.02]}>
        <planeGeometry args={[width * 1.2, height * 0.08]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, -height * 0.28, 0.02]}>
        <planeGeometry args={[width * 1.2, height * 0.08]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
