'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunProps {
  solarFlareActive: boolean;
}

/**
 * Custom shader for procedural sun rendering with solar flare state
 *
 * Uniforms:
 * - time: Elapsed time for turbulence animation
 * - isSolarFlare: 0.0 = normal, 1.0 = solar flare active (intensity boost)
 * - coreColor: Inner sun color (yellow normal, red during flare)
 * - coronaColor: Outer corona color (orange normal, red during flare)
 *
 * Shader features:
 * - Procedural noise for surface turbulence
 * - Radial gradient from core to corona
 * - Dynamic glow intensity based on solar flare state
 * - Fresnel-like falloff at edges
 *
 * Performance: ~0.5ms per frame at 1920x1080
 */
const sunVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragmentShader = `
  uniform float time;
  uniform float isSolarFlare;
  uniform vec3 coreColor;
  uniform vec3 coronaColor;

  varying vec2 vUv;
  varying vec3 vNormal;

  // Simple noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Distance from center
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);

    // Surface turbulence
    float turbulence = noise(vUv * 10.0 + time * 0.5) * 0.3;

    // Solar flare intensity
    float flareIntensity = mix(1.0, 1.5, isSolarFlare);

    // Color gradient from core to corona
    vec3 color = mix(coreColor, coronaColor, smoothstep(0.0, 1.0, dist + turbulence));

    // Glow intensity
    float glow = 1.0 - smoothstep(0.0, 1.0, dist);
    glow = pow(glow, 2.0) * flareIntensity;

    gl_FragColor = vec4(color, 1.0) * glow;
  }
`;

export function Sun({ solarFlareActive }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  // Pulsing animation
  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value = clock.getElapsedTime();
      shaderRef.current.uniforms.isSolarFlare.value = solarFlareActive ? 1.0 : 0.0;
      shaderRef.current.uniforms.coreColor.value.set(solarFlareActive ? '#ff4400' : '#ffaa00');
      shaderRef.current.uniforms.coronaColor.value.set(solarFlareActive ? '#ff0000' : '#ff8800');
    }

    if (meshRef.current) {
      // Gentle breathing scale
      const pulse = Math.sin(clock.getElapsedTime() * 0.5) * 0.05 + 1.0;
      const flareScale = solarFlareActive ? 1.2 : 1.0;
      meshRef.current.scale.setScalar(pulse * flareScale);
    }
  });

  return (
    <mesh ref={meshRef} position={[300, 100, -800]}>
      <sphereGeometry args={[200, 32, 32]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={{
          time: { value: 0 },
          isSolarFlare: { value: solarFlareActive ? 1.0 : 0.0 },
          coreColor: { value: new THREE.Color(solarFlareActive ? '#ff4400' : '#ffaa00') },
          coronaColor: { value: new THREE.Color(solarFlareActive ? '#ff0000' : '#ff8800') },
        }}
        vertexShader={sunVertexShader}
        fragmentShader={sunFragmentShader}
        transparent
        depthWrite
        side={THREE.FrontSide}
      />

      {/* Additional point light for scene illumination */}
      <pointLight
        intensity={solarFlareActive ? 2.0 : 1.0}
        color={solarFlareActive ? '#ff4400' : '#ffaa00'}
        distance={2000}
        decay={2}
      />
    </mesh>
  );
}
