'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

/**
 * Prototype test canvas — validates Phase 2→3 pipeline:
 * - Canvas sizing inside instrument well
 * - Alpha transparency (CSS backplate shows through)
 * - Render-on-demand behavior
 * - CSS perspective tilt interaction with R3F canvas
 *
 * This is a temporary component. Remove after Phase 3 begins.
 */

function TestNeedle() {
  const needleRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!needleRef.current) return;
    // Slowly oscillating needle — validates render loop works inside well
    const t = state.clock.elapsedTime;
    needleRef.current.rotation.z = Math.sin(t * 0.5) * 0.8 - 0.4;
  });

  return (
    <group>
      {/* Gauge face */}
      <mesh>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color="#0a0e1a" transparent opacity={0.8} />
      </mesh>

      {/* Tick marks */}
      {Array.from({ length: 11 }, (_, i) => {
        const angle = (-Math.PI * 0.75) + (i / 10) * Math.PI * 1.5;
        const inner = 0.7;
        const outer = 0.85;
        return (
          <mesh key={i} position={[0, 0, 0.01]}>
            <bufferGeometry>
              <float32BufferAttribute
                attach="attributes-position"
                args={[new Float32Array([
                  Math.cos(angle) * inner, Math.sin(angle) * inner, 0,
                  Math.cos(angle) * outer, Math.sin(angle) * outer, 0,
                  Math.cos(angle) * outer + 0.01, Math.sin(angle) * outer, 0,
                ]), 3]}
              />
            </bufferGeometry>
            <meshBasicMaterial
              color={i <= 2 ? '#ef4444' : '#4a6580'}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}

      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.02]}>
        <boxGeometry args={[0.03, 0.7, 0.01]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} />
      </mesh>

      {/* Center pivot */}
      <mesh position={[0, 0, 0.03]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial color="#2a3a50" />
      </mesh>
    </group>
  );
}

export function TestWellCanvas() {
  return (
    <div className="absolute inset-0" style={{ zIndex: 5 }}>
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 2], fov: 50 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <TestNeedle />
      </Canvas>
    </div>
  );
}
