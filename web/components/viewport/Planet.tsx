'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BG_FPS = 15;

const planetVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const planetFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uBrightness;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  // FBM noise for cloud swirls
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
    for (int i = 0; i < 2; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Slowly rotating UV for cloud drift
    float rotation = uTime * 0.01;
    vec2 rotatedUv = vec2(
      vUv.x + rotation,
      vUv.y
    );

    // Ocean blue base - latitude-banded
    vec3 deepBlue = vec3(0.118, 0.227, 0.373);   // #1e3a5f
    vec3 brightBlue = vec3(0.145, 0.388, 0.922);  // #2563eb
    float latBand = smoothstep(0.2, 0.8, vUv.y);
    vec3 baseColor = mix(deepBlue, brightBlue, latBand * 0.6 + 0.2);

    // Gray cloud swirls
    vec3 cloudGray1 = vec3(0.42, 0.45, 0.50);   // #6b7280
    vec3 cloudGray2 = vec3(0.61, 0.64, 0.66);   // #9ca3af

    // Multi-scale cloud pattern
    float clouds1 = fbm(rotatedUv * vec2(4.0, 6.0) + vec2(0.0, uTime * 0.003));
    float clouds2 = fbm(rotatedUv * vec2(8.0, 3.0) - vec2(uTime * 0.005, 0.0));
    float cloudMask = smoothstep(0.35, 0.65, clouds1 * 0.6 + clouds2 * 0.4);

    // Blend clouds onto surface
    vec3 cloudColor = mix(cloudGray1, cloudGray2, clouds2);
    vec3 surfaceColor = mix(baseColor, cloudColor, cloudMask * 0.55);

    // Fresnel atmosphere rim - pale cyan glow
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    fresnel = pow(fresnel, 3.0);
    vec3 atmosphereColor = vec3(0.4, 0.75, 0.85); // pale cyan-teal
    surfaceColor = mix(surfaceColor, atmosphereColor, fresnel * 0.7);

    // Boost rim brightness for bloom pickup
    float rimGlow = pow(fresnel, 5.0) * 1.5;
    surfaceColor += atmosphereColor * rimGlow;

    gl_FragColor = vec4(surfaceColor * uBrightness, 1.0);
  }
`;

interface PlanetProps {
  brightness?: number;
}

export function Planet({ brightness = 1 }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBrightness: { value: brightness },
    }),
    [],
  );

  // Quantized to 15fps — planet rotates at 0.01 rad/sec, steps of 0.04° are invisible
  useFrame(({ clock }) => {
    if (!shaderRef.current) return;
    const qt = Math.floor(clock.getElapsedTime() * BG_FPS) / BG_FPS;
    shaderRef.current.uniforms.uBrightness.value = brightness;
    if (shaderRef.current.uniforms.uTime.value === qt) return;
    shaderRef.current.uniforms.uTime.value = qt;
  });

  return (
    <mesh ref={meshRef} position={[850, 500, -2400]}>
      <sphereGeometry args={[297, 32, 32]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={planetVertexShader}
        fragmentShader={planetFragmentShader}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
