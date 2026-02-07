'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial, Color, AdditiveBlending, DoubleSide } from 'three';

interface RadarSweepProps {
  color: Color;
  radius?: number;
  opacity?: number;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x);

    // Circular mask
    if (dist > 0.48) discard;

    // Concentric rings (radar scope lines)
    float rings = smoothstep(0.01, 0.0, abs(fract(dist * 8.0) - 0.5) - 0.48);
    rings *= 0.15;

    // Radial lines (crosshairs)
    float radials = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 3.14159 / 4.0;
      float d = abs(sin(angle - a));
      radials += smoothstep(0.01, 0.0, d) * step(dist, 0.48) * 0.05;
    }

    // Sweep line
    float sweepAngle = uTime * 0.8; // ~8 sec rotation
    float sweepDelta = mod(angle - sweepAngle + 3.14159, 6.28318) - 3.14159;
    float sweep = smoothstep(0.4, 0.0, abs(sweepDelta)) * 0.4;
    // Sweep trail (fades behind the line)
    float trail = smoothstep(0.0, -1.5, sweepDelta) * smoothstep(-2.0, -1.5, sweepDelta) * 0.15;

    float alpha = (rings + radials + sweep + trail) * smoothstep(0.48, 0.4, dist);

    gl_FragColor = vec4(uColor * 0.5, alpha * uOpacity);
  }
`;

export function RadarSweep({ color, radius = 4, opacity = 1 }: RadarSweepProps) {
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: color },
          uOpacity: { value: opacity },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uOpacity.value = opacity;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} material={material}>
      <planeGeometry args={[radius * 2, radius * 2]} />
    </mesh>
  );
}
