'use client';

import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CaptainNova from '../index';
import { useSalute, usePoint } from '../gestures';

/**
 * Example: Using gesture animations
 */
export function GesturesExample() {
  const characterRef = useRef<THREE.Group>(null);
  const { play: playSalute } = useSalute(characterRef);
  const { play: playPoint } = usePoint(characterRef, {
    target: new THREE.Vector3(3, 1, 0),
  });

  useEffect(() => {
    // Play salute on mount
    const timeout = setTimeout(() => {
      playSalute();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [playSalute]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <CaptainNova position={[0, -2, 0]} />

        <button
          onClick={playSalute}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            padding: '10px 20px',
          }}
        >
          Salute
        </button>

        <button
          onClick={playPoint}
          style={{
            position: 'absolute',
            top: 60,
            left: 20,
            padding: '10px 20px',
          }}
        >
          Point
        </button>
      </Canvas>
    </div>
  );
}
