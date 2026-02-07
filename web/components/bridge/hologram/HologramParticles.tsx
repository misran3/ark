'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, BufferGeometry, Float32BufferAttribute, ShaderMaterial, AdditiveBlending, Color } from 'three';

interface HologramParticlesProps {
  count?: number;
  color: Color;
  /** Bounding box half-extents */
  spread?: [number, number, number];
  speed?: number;
  size?: number;
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    float t = uTime * 0.3 + aPhase;
    vAlpha = sin(t * 2.0) * 0.3 + 0.5;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 3.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * vAlpha;
    gl_FragColor = vec4(uColor, alpha * 0.6);
  }
`;

export function HologramParticles({
  count = 60,
  color,
  spread = [2, 2, 1],
  speed = 0.02,
  size = 15,
}: HologramParticlesProps) {
  const pointsRef = useRef<Points>(null);
  const velocitiesRef = useRef<Float32Array>(null!);

  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread[0] * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1] * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2] * 2;
      sizes[i] = size * (0.5 + Math.random() * 0.5);
      phases[i] = Math.random() * Math.PI * 2;
      vels[i * 3] = (Math.random() - 0.5) * speed;
      vels[i * 3 + 1] = (Math.random() - 0.5) * speed;
      vels[i * 3 + 2] = (Math.random() - 0.5) * speed;
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uPixelRatio: { value: 1 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    velocitiesRef.current = vels;
    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, spread[0], spread[1], spread[2], speed, size, color]);

  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();

    const positions = geometry.attributes.position.array as Float32Array;
    const vels = velocitiesRef.current!;

    for (let i = 0; i < count; i++) {
      positions[i * 3] += vels[i * 3];
      positions[i * 3 + 1] += vels[i * 3 + 1];
      positions[i * 3 + 2] += vels[i * 3 + 2];

      // Wrap around
      for (let axis = 0; axis < 3; axis++) {
        const idx = i * 3 + axis;
        const limit = spread[axis];
        if (positions[idx] > limit) positions[idx] = -limit;
        if (positions[idx] < -limit) positions[idx] = limit;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
