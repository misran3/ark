'use client';

import { useMemo } from 'react';
import { Color, ShaderMaterial, AdditiveBlending, DoubleSide } from 'three';

interface OrbitPathProps {
  radius: number;
  color: Color;
  opacity?: number;
  tilt: number; // radians to tilt on X axis
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
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // Ring center at UV center
    vec2 center = vUv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x);

    // Thin ring mask (only visible at the orbit radius)
    float ringWidth = 0.005;
    float ringDist = abs(dist - 0.48);
    float ring = smoothstep(ringWidth, 0.0, ringDist);

    // Dashed pattern: 32 dashes around the circle
    float dashes = step(0.5, fract(angle * 32.0 / 6.28318));

    float alpha = ring * dashes * uOpacity;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor * 0.7, alpha);
  }
`;

export function OrbitPath({ radius, color, opacity = 0.2, tilt }: OrbitPathProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: color },
          uOpacity: { value: opacity },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    [color, opacity]
  );

  const planeSize = radius * 2.1;

  return (
    <mesh rotation-x={-Math.PI / 2 + tilt} material={material}>
      <planeGeometry args={[planeSize, planeSize]} />
    </mesh>
  );
}
