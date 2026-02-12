'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Color,
  Line as ThreeLine,
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
  /** Travel duration in seconds (self-animates progress) */
  duration: number;
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

// Pre-allocated temp vectors to avoid per-frame allocation
const _currentPos = new Vector3();
const _trailPos = new Vector3();

export function DispatchPod({ from, to, color, duration, isIncome }: DispatchPodProps) {
  const groupRef = useRef<Group>(null);
  const trailGeoRef = useRef<BufferGeometry>(null!);
  const elapsedRef = useRef(0);

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

  const { trailGeometry, trailLine } = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array((TRAIL_SEGMENTS + 1) * 3);
    const alphas = new Float32Array(TRAIL_SEGMENTS + 1);
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aAlpha', new Float32BufferAttribute(alphas, 1));
    trailGeoRef.current = geo;
    const line = new ThreeLine(geo, trailMaterial);
    return { trailGeometry: geo, trailLine: line };
  }, [trailMaterial]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Self-animate progress
    elapsedRef.current += delta;
    const progress = Math.min(1, elapsedRef.current / duration);

    // Position pod along route using pre-allocated temp
    _currentPos.copy(start).lerp(end, progress);
    groupRef.current.position.copy(_currentPos);

    // Update trail behind the pod
    const posAttr = trailGeometry.attributes.position;
    const alphaAttr = trailGeometry.attributes.aAlpha;
    const positions = posAttr.array as Float32Array;
    const alphas = alphaAttr.array as Float32Array;

    for (let i = 0; i <= TRAIL_SEGMENTS; i++) {
      const trailT = Math.max(0, progress - (i / TRAIL_SEGMENTS) * 0.15);
      _trailPos.copy(start).lerp(end, trailT);
      positions[i * 3] = _trailPos.x;
      positions[i * 3 + 1] = _trailPos.y;
      positions[i * 3 + 2] = _trailPos.z;
      alphas[i] = 1 - i / TRAIL_SEGMENTS;
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });

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
      <primitive object={trailLine} />
    </>
  );
}
