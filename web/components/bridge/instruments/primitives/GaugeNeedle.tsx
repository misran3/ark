'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface GaugeNeedleProps {
  /** Current value (0-1 normalized) */
  value: number;
  /** Needle length */
  length?: number;
  /** Needle color */
  color?: string;
  /** Start angle in radians */
  startAngle?: number;
  /** Sweep angle in radians */
  sweepAngle?: number;
  /** Spring stiffness (higher = snappier) */
  stiffness?: number;
  /** Spring damping (higher = less oscillation) */
  damping?: number;
  /** Ambient tremor magnitude in radians */
  tremorMagnitude?: number;
}

/**
 * Physical gauge needle with spring physics and ambient tremor.
 *
 * Spring physics: overshoots and settles on value change.
 * Ambient tremor: ±0.2-0.3 degree oscillation simulating micro-vibrations
 * of a running ship. Dead-still needles = "frozen UI."
 */
export function GaugeNeedle({
  value,
  length = 0.65,
  color = '#00f0ff',
  startAngle = Math.PI * 0.75,
  sweepAngle = -Math.PI * 1.5,
  stiffness = 120,
  damping = 12,
  tremorMagnitude = 0.005,
}: GaugeNeedleProps) {
  const groupRef = useRef<Group>(null);
  const velocityRef = useRef(0);
  const currentAngleRef = useRef(startAngle + sweepAngle * value);
  const tremorPhaseRef = useRef(Math.random() * Math.PI * 2);

  const targetAngle = startAngle + sweepAngle * Math.max(0, Math.min(1, value));

  // Needle geometry — thin extruded shape
  const needleShape = useMemo(() => {
    const width = 0.015;
    const positions = new Float32Array([
      // Tail (small counterweight)
      -width, -length * 0.1, 0.02,
       width, -length * 0.1, 0.02,
      // Tip (narrow)
       0.004,  length, 0.02,
      -0.004,  length, 0.02,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { positions, indices };
  }, [length]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Clamp delta to avoid physics explosion on tab-switch
    const dt = Math.min(delta, 0.05);

    // Spring physics — damped harmonic oscillator
    const displacement = targetAngle - currentAngleRef.current;
    const springForce = displacement * stiffness;
    const dampForce = -velocityRef.current * damping;
    const acceleration = springForce + dampForce;

    velocityRef.current += acceleration * dt;
    currentAngleRef.current += velocityRef.current * dt;

    // Ambient tremor — slow random cycle
    tremorPhaseRef.current += dt * (2 + Math.sin(dt * 0.7));
    const tremor =
      Math.sin(tremorPhaseRef.current * 3.7) * tremorMagnitude +
      Math.sin(tremorPhaseRef.current * 5.3) * tremorMagnitude * 0.6;

    groupRef.current.rotation.z = currentAngleRef.current + tremor - Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.03]}>
      {/* Needle body */}
      <mesh>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[needleShape.positions, 3]}
          />
          <bufferAttribute
            attach="index"
            args={[needleShape.indices, 1]}
          />
        </bufferGeometry>
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>

      {/* Needle shadow (offset slightly) */}
      <mesh position={[0.008, -0.008, -0.005]}>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[needleShape.positions, 3]}
          />
          <bufferAttribute
            attach="index"
            args={[needleShape.indices, 1]}
          />
        </bufferGeometry>
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Center pivot cap */}
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color="#1a2a3d" />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color="#2a3a50" />
      </mesh>
    </group>
  );
}
