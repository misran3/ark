'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial, AdditiveBlending, DoubleSide, Color } from 'three';

interface DeepScanPulseProps {
  color: Color;
  originAngle: number;   // Radians — planet's fixed angle on ring
  originRadius: number;  // Planet's orbital radius
  duration?: number;     // Pulse animation duration in seconds
  maxScale?: number;     // Max expansion scale
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
    float alpha = (1.0 - uProgress) * 0.6;

    // Thin ring with soft edges
    float ringFade = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
    alpha *= ringFade;

    // Brighten the leading edge
    float edge = smoothstep(0.4, 0.6, vUv.y);
    vec3 col = mix(uColor, uColor * 1.5, edge * (1.0 - uProgress));

    gl_FragColor = vec4(col, alpha);
  }
`;

export function DeepScanPulse({
  color,
  originAngle,
  originRadius,
  duration = 0.6,
  maxScale = 3.0,
}: DeepScanPulseProps) {
  const meshRef = useRef<Mesh>(null);
  const startTimeRef = useRef<number | null>(null);

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

  // Origin position on the orbital ring
  const originX = Math.cos(originAngle) * originRadius;
  const originZ = Math.sin(originAngle) * originRadius;

  // Reset start time when component mounts (new scan triggered)
  useEffect(() => {
    startTimeRef.current = null;
  }, [originAngle, originRadius]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (startTimeRef.current === null) startTimeRef.current = t;

    const elapsed = t - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    material.uniforms.uProgress.value = progress;

    if (meshRef.current) {
      const scale = 0.1 + progress * maxScale;
      meshRef.current.scale.setScalar(scale);
      // Fade out completely when done
      meshRef.current.visible = progress < 1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[originX, 0, originZ]}
      rotation-x={-Math.PI / 2}
      material={material}
    >
      <ringGeometry args={[0.85, 1.0, 64]} />
    </mesh>
  );
}
