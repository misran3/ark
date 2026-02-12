'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Color,
  InstancedMesh,
  OctahedronGeometry,
  ShaderMaterial,
  AdditiveBlending,
  InstancedBufferAttribute,
} from 'three';

interface DebtDebrisRingProps {
  color: Color;
  beltRadius?: number;
  beltWidth?: number;
  count?: number;
}

const vertexShader = /* glsl */ `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aY;
  attribute float aScale;
  attribute vec2 aRotSpeed; // x = rotX speed, y = rotY speed

  uniform float uTime;
  varying float vFlicker;

  // Rotation helpers
  mat3 rotateX(float a) {
    float s = sin(a), c = cos(a);
    return mat3(1,0,0, 0,c,-s, 0,s,c);
  }
  mat3 rotateY(float a) {
    float s = sin(a), c = cos(a);
    return mat3(c,0,s, 0,1,0, -s,0,c);
  }

  void main() {
    // Drift angle over time (matches original: s.angle + t * 0.02)
    float driftAngle = aAngle + uTime * 0.02;

    // Shard self-rotation (matches original: s.rotX + t * 0.5, s.rotY + t * 0.3)
    mat3 rot = rotateX(aRotSpeed.x * uTime) * rotateY(aRotSpeed.y * uTime);
    vec3 localPos = rot * (position * aScale);

    // Orbital position
    float x = cos(driftAngle) * aRadius;
    float z = sin(driftAngle) * aRadius;
    vec3 worldPos = localPos + vec3(x, aY, z);

    // Flicker from spatial hash (same as before)
    vFlicker = sin(worldPos.x * 10.0 + worldPos.z * 7.0) * 0.5 + 0.5;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(worldPos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying float vFlicker;

  void main() {
    float flicker = sin(uTime * 3.0 + vFlicker * 6.28) * 0.3 + 0.7;
    float alpha = 0.35 * flicker;
    gl_FragColor = vec4(uColor * 0.8, alpha);
  }
`;

export function DebtDebrisRing({
  color,
  beltRadius = 5.0,
  beltWidth = 0.5,
  count = 80,
}: DebtDebrisRingProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<InstancedMesh>(null);

  const geo = useMemo(() => new OctahedronGeometry(0.06, 0), []);

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        wireframe: true,
      }),
    [color]
  );

  // Bake per-instance attributes (angles, radii, scales, rotation speeds)
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const ys = new Float32Array(count);
    const scales = new Float32Array(count);
    const rotSpeeds = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      angles[i] = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      radii[i] = beltRadius + (Math.random() - 0.5) * beltWidth;
      ys[i] = (Math.random() - 0.5) * 0.2;
      scales[i] = 0.5 + Math.random() * 1.5;
      rotSpeeds[i * 2] = 0.3 + Math.random() * 0.4;     // rotX speed (~0.5 avg)
      rotSpeeds[i * 2 + 1] = 0.2 + Math.random() * 0.2; // rotY speed (~0.3 avg)
    }

    mesh.geometry.setAttribute('aAngle', new InstancedBufferAttribute(angles, 1));
    mesh.geometry.setAttribute('aRadius', new InstancedBufferAttribute(radii, 1));
    mesh.geometry.setAttribute('aY', new InstancedBufferAttribute(ys, 1));
    mesh.geometry.setAttribute('aScale', new InstancedBufferAttribute(scales, 1));
    mesh.geometry.setAttribute('aRotSpeed', new InstancedBufferAttribute(rotSpeeds, 2));
  }, [count, beltRadius, beltWidth]);

  useFrame(({ clock }) => {
    // Single uniform update — all animation computed on GPU
    mat.uniforms.uTime.value = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} geometry={geo} material={mat} />
    </group>
  );
}
