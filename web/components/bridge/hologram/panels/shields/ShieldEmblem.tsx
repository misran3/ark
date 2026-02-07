'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color, CylinderGeometry, ShaderMaterial, AdditiveBlending } from 'three';

interface ShieldEmblemProps {
  health: number;
  color: Color;
  size?: number;
}

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uHealth;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float rim = pow(1.0 - abs(dot(vViewDir, vNormal)), 2.0);

    // Gentle pulse
    float pulse = sin(uTime * 1.5) * 0.1 + 0.9;

    // Health drives brightness
    float brightness = mix(0.3, 1.0, uHealth) * pulse;

    vec3 color = uColor * brightness * (1.0 + rim * 2.0);
    float alpha = 0.7 + rim * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function ShieldEmblem({ health, color, size = 0.5 }: ShieldEmblemProps) {
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: color },
          uHealth: { value: health },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [color, health]
  );

  // Hexagonal prism: CylinderGeometry with 6 radial segments
  const geometry = useMemo(
    () => new CylinderGeometry(size, size, 0.05, 6),
    [size]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uHealth.value = health;
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 2; // Face camera
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
