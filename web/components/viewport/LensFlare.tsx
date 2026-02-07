'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PLANET_WORLD_POS = new THREE.Vector3(300, 100, -800);

const flareVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flareFragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // Horizontal anamorphic streak: wide in X, tight in Y
    float dx = (vUv.x - 0.5) * 2.0;
    float dy = (vUv.y - 0.5) * 2.0;

    // Elliptical falloff: wide horizontal, narrow vertical
    float dist = sqrt(dx * dx + dy * dy * 16.0);
    float alpha = smoothstep(1.0, 0.0, dist);
    alpha = pow(alpha, 2.0);

    // Pale blue-white
    vec3 color = vec3(0.5, 0.7, 0.9);

    gl_FragColor = vec4(color, alpha * uOpacity * 0.12);
  }
`;

interface LensFlareProps {
  brightness?: number;
}

/**
 * LensFlare — subtle anamorphic horizontal streaks from the planet.
 * Tracks the planet's screen-space position. Fades at viewport edges.
 */
export function LensFlare({ brightness = 1 }: LensFlareProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const projected = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!meshRef.current || !shaderRef.current) return;

    // Project planet position to NDC (-1 to 1)
    projected.copy(PLANET_WORLD_POS);
    projected.project(camera);

    // Check if planet is behind camera
    if (projected.z > 1) {
      shaderRef.current.uniforms.uOpacity.value = 0;
      return;
    }

    // Fade at viewport edges
    const edgeX = 1.0 - Math.abs(projected.x);
    const edgeY = 1.0 - Math.abs(projected.y);
    const edgeFade = Math.max(0, Math.min(edgeX, edgeY));
    const opacity = Math.pow(Math.min(edgeFade * 2, 1), 2);

    shaderRef.current.uniforms.uOpacity.value = opacity * brightness;

    // Position the flare mesh at the planet's projected world position
    // Use a Z slightly in front of canopy struts so it layers correctly
    meshRef.current.position.set(
      PLANET_WORLD_POS.x,
      PLANET_WORLD_POS.y,
      PLANET_WORLD_POS.z + 50,
    );
    meshRef.current.lookAt(camera.position);
  });

  return (
    <mesh ref={meshRef}>
      {/* Wide horizontal, narrow vertical */}
      <planeGeometry args={[600, 80]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={{
          uOpacity: { value: 1 },
        }}
        vertexShader={flareVertexShader}
        fragmentShader={flareFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
