'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
  Vector3,
} from 'three';

interface RouteBeamProps {
  from: [number, number, number];
  to: [number, number, number];
  color: THREE.Color;
  /** 0 = dim idle, 1 = fully energized */
  energize: number;
  visible: boolean;
}

const vertexShader = /* glsl */ `
  attribute float aProgress;
  varying float vProgress;

  void main() {
    vProgress = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uEnergize;
  uniform float uTime;
  varying float vProgress;

  void main() {
    // Base dim beam
    float baseAlpha = 0.08;

    // Energize: traveling pulse from 0→1 along route
    float pulseCenter = fract(uTime * 0.8);
    float pulse = smoothstep(0.15, 0.0, abs(vProgress - pulseCenter)) * uEnergize;

    // Overall brightness when energized
    float energizedAlpha = uEnergize * 0.25;

    float alpha = baseAlpha + energizedAlpha + pulse * 0.5;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function RouteBeam({ from, to, color, energize, visible }: RouteBeamProps) {
  const materialRef = useRef<ShaderMaterial>(null!);

  const { geometry, material } = useMemo(() => {
    const segments = 32;
    const positions = new Float32Array((segments + 1) * 3);
    const progress = new Float32Array(segments + 1);

    const start = new Vector3(...from);
    const end = new Vector3(...to);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = start.clone().lerp(end, t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      progress[i] = t;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aProgress', new Float32BufferAttribute(progress, 1));

    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: color },
        uEnergize: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, [from, to, color]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uEnergize.value = energize;
  });

  if (!visible) return null;

  return <line geometry={geometry} material={material} />;
}
