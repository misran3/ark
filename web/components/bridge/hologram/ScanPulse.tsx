'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial, AdditiveBlending, DoubleSide, Color } from 'three';

interface ScanPulseProps {
  color: Color;
  interval?: number;   // Seconds between pulses
  maxRadius?: number;
  speed?: number;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgress; // 0-1 pulse lifecycle

  varying vec2 vUv;

  void main() {
    // Fade out as pulse expands
    float alpha = (1.0 - uProgress) * 0.4;

    // Thin ring
    float ringFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    alpha *= ringFade;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function ScanPulse({ color, interval = 4, maxRadius = 4, speed = 1 }: ScanPulseProps) {
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: color },
          uProgress: { value: 0 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cycleProgress = (t * speed / interval) % 1;

    material.uniforms.uProgress.value = cycleProgress;

    if (meshRef.current) {
      const scale = 0.1 + cycleProgress * maxRadius;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.1]} material={material}>
      <ringGeometry args={[0.9, 1.0, 64]} />
    </mesh>
  );
}
