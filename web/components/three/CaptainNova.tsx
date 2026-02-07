'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuroraColors } from '@/hooks/useAuroraColors';

const novaVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const novaFragmentShader = `
  uniform float uTime;
  uniform vec3 uAuroraColor1;
  uniform vec3 uAuroraColor2;
  uniform float uGlitchIntensity;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Fresnel effect
    vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0));
    float fresnel = pow(1.0 - dot(vNormal, viewDirection), 2.0);

    // Scanlines
    float scanline = sin(vUv.y * 500.0 + uTime * 2.0) * 0.05 + 0.95;

    // Aurora gradient
    vec3 auroraColor = mix(uAuroraColor1, uAuroraColor2, vUv.y);

    // Glitch
    float glitch = step(0.95, sin(uTime * 50.0)) * uGlitchIntensity;

    // Combine
    vec3 color = auroraColor * scanline;
    color += fresnel * auroraColor * 0.8;

    // Chromatic aberration on edges
    if (fresnel > 0.5) {
      color.r *= 1.1;
      color.b *= 0.9;
    }

    float alpha = uOpacity * scanline * (0.6 + fresnel * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function CaptainNova({ position = [-4, -2, 0] }: { position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const colors = useAuroraColors();

  const shaderUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAuroraColor1: { value: new THREE.Color(colors[0]) },
    uAuroraColor2: { value: new THREE.Color(colors[1]) },
    uGlitchIntensity: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  // Animation
  useFrame(({ clock }) => {
    if (!groupRef.current || !materialRef.current) return;

    const time = clock.getElapsedTime();

    // Update shader time
    materialRef.current.uniforms.uTime.value = time;

    // Update aurora colors
    materialRef.current.uniforms.uAuroraColor1.value.set(colors[0]);
    materialRef.current.uniforms.uAuroraColor2.value.set(colors[1]);

    // Breathing animation
    const breathe = Math.sin(time * 1.5) * 0.02 + 1;
    groupRef.current.scale.y = breathe;

    // Occasional glitch
    if (Math.random() < 0.002) {
      materialRef.current.uniforms.uGlitchIntensity.value = 0.5;
    } else {
      materialRef.current.uniforms.uGlitchIntensity.value *= 0.9;
    }

    // Subtle idle movement
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base platform */}
      <mesh position={[0, -2.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.1, 32]} />
        <meshBasicMaterial color={colors[0]} opacity={0.2} transparent />
      </mesh>

      {/* Projection cone */}
      <mesh position={[0, -2.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.5, 3, 32, 1, true]} />
        <meshBasicMaterial
          color={colors[0]}
          opacity={0.05}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Body (simplified capsule) */}
      <mesh>
        <capsuleGeometry args={[0.15, 1.2, 8, 16]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={novaVertexShader}
          fragmentShader={novaFragmentShader}
          uniforms={shaderUniforms}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <shaderMaterial
          vertexShader={novaVertexShader}
          fragmentShader={novaFragmentShader}
          uniforms={shaderUniforms}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
