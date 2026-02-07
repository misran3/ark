'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Color,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three';

interface DispatchPodProps {
  from: [number, number, number];
  to: [number, number, number];
  color: Color;
  /** 0-1 progress along route */
  progress: number;
  isIncome: boolean;
}

const trailVertexShader = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const trailFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(uColor, vAlpha * 0.4);
  }
`;

const TRAIL_SEGMENTS = 16;

export function DispatchPod({ from, to, color, progress, isIncome }: DispatchPodProps) {
  const groupRef = useRef<Group>(null);
  const trailGeoRef = useRef<BufferGeometry>(null!);

  const start = useMemo(() => new Vector3(...from), [from]);
  const end = useMemo(() => new Vector3(...to), [to]);

  const podMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float rim = pow(1.0 - abs(dot(vViewDir, vNormal)), 2.0);
          vec3 col = uColor * (1.0 + rim * 2.0);
          gl_FragColor = vec4(col, 0.8 + rim * 0.2);
        }
      `,
      uniforms: {
        uColor: { value: color },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
  }, [color]);

  const trailMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      uniforms: {
        uColor: { value: color },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  const trailGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array((TRAIL_SEGMENTS + 1) * 3);
    const alphas = new Float32Array(TRAIL_SEGMENTS + 1);
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aAlpha', new Float32BufferAttribute(alphas, 1));
    trailGeoRef.current = geo;
    return geo;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;

    // Position pod along route
    const currentPos = start.clone().lerp(end, progress);
    groupRef.current.position.copy(currentPos);

    // Update trail behind the pod
    const posAttr = trailGeometry.attributes.position;
    const alphaAttr = trailGeometry.attributes.aAlpha;
    const positions = posAttr.array as Float32Array;
    const alphas = alphaAttr.array as Float32Array;

    for (let i = 0; i <= TRAIL_SEGMENTS; i++) {
      const trailT = Math.max(0, progress - (i / TRAIL_SEGMENTS) * 0.15);
      const trailPos = start.clone().lerp(end, trailT);
      positions[i * 3] = trailPos.x;
      positions[i * 3 + 1] = trailPos.y;
      positions[i * 3 + 2] = trailPos.z;
      alphas[i] = 1 - i / TRAIL_SEGMENTS;
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });

  if (progress <= 0 || progress > 1) return null;

  return (
    <>
      {/* Pod body */}
      <group ref={groupRef}>
        {/* Main hull - small diamond shape */}
        <mesh material={podMaterial} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.025, 0]} />
        </mesh>
        {/* Engine glow */}
        <mesh material={podMaterial} position={[0, 0, 0]}>
          <sphereGeometry args={[0.015, 8, 8]} />
        </mesh>
      </group>

      {/* Trail */}
      <line geometry={trailGeometry} material={trailMaterial} />
    </>
  );
}
