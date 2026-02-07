'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uSeed;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p + uSeed, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Very slow drift
    vec2 uv = vUv + vec2(uTime * 0.002, uTime * 0.001);

    // Layered cloud shapes
    float n1 = fbm(uv * 2.0);
    float n2 = fbm(uv * 3.5 + 5.0);
    float n3 = fbm(uv * 1.5 + 10.0);

    // Color mixing driven by noise layers
    vec3 color = mix(uColor1, uColor2, smoothstep(0.3, 0.7, n1));
    color = mix(color, uColor3, smoothstep(0.4, 0.8, n2) * 0.5);

    // Alpha: fade edges to transparent, keep dim overall
    float alpha = smoothstep(0.3, 0.6, n1) * smoothstep(0.25, 0.55, n3);
    alpha *= 0.35; // max brightness cap

    // Fade out at quad edges
    float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x)
                   * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    alpha *= edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

interface NebulaPlaneProps {
  position: [number, number, number];
  scale: [number, number, number];
  color1: string;
  color2: string;
  color3: string;
  seed: number;
}

function NebulaPlane({ position, scale, color1, color2, color3, seed }: NebulaPlaneProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uColor3: { value: new THREE.Color(color3) },
      uSeed: { value: seed },
    }),
    [color1, color2, color3, seed],
  );

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * NebulaBackground — 3 overlapping shader planes behind the starfield.
 * Cool-toned gas clouds (blues, teals, muted purple) with near-imperceptible drift.
 * Max alpha ~0.35, additive blending for natural layering.
 */
export function NebulaBackground() {
  return (
    <group>
      {/* Large central cloud — deep blue + teal */}
      <NebulaPlane
        position={[-200, 50, -1950]}
        scale={[1200, 800, 1]}
        color1="#0f172a"
        color2="#115e59"
        color3="#1e3a5f"
        seed={1.0}
      />
      {/* Upper-right wisp — teal + purple */}
      <NebulaPlane
        position={[400, 300, -1980]}
        scale={[900, 600, 1]}
        color1="#0d9488"
        color2="#2e1065"
        color3="#1e3a5f"
        seed={2.0}
      />
      {/* Lower-left accent — deep blue + muted purple */}
      <NebulaPlane
        position={[-350, -200, -1920]}
        scale={[800, 500, 1]}
        color1="#0f172a"
        color2="#4c1d95"
        color3="#115e59"
        seed={3.0}
      />
    </group>
  );
}
