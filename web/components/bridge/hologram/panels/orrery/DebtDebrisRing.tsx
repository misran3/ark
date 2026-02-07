'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Color,
  InstancedMesh,
  OctahedronGeometry,
  WireframeGeometry,
  ShaderMaterial,
  AdditiveBlending,
  Object3D,
} from 'three';

interface DebtDebrisRingProps {
  color: Color;
  beltRadius?: number;
  beltWidth?: number;
  count?: number;
  tilt: number;
}

const vertexShader = /* glsl */ `
  varying float vFlicker;

  void main() {
    // Use instance matrix position to derive flicker phase
    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vFlicker = sin(worldPos.x * 10.0 + worldPos.z * 7.0) * 0.5 + 0.5;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
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
  beltRadius = 3.5,
  beltWidth = 0.5,
  count = 80,
  tilt,
}: DebtDebrisRingProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<InstancedMesh>(null);

  // Wireframe octahedron geometry (tiny shards)
  const geo = useMemo(() => {
    const oct = new OctahedronGeometry(0.06, 0);
    return new WireframeGeometry(oct);
  }, []);

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
      }),
    [color]
  );

  // Pre-compute shard positions
  const shardData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const r = beltRadius + (Math.random() - 0.5) * beltWidth;
      const y = (Math.random() - 0.5) * 0.2;
      const scale = 0.5 + Math.random() * 1.5;
      const rotX = Math.random() * Math.PI;
      const rotY = Math.random() * Math.PI;
      data.push({ angle, r, y, scale, rotX, rotY });
    }
    return data;
  }, [count, beltRadius, beltWidth]);

  const dummy = useMemo(() => new Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001; // Slow counter-rotation
    }

    // Update instance matrices (shards drift slightly)
    if (meshRef.current) {
      shardData.forEach((s, i) => {
        const driftAngle = s.angle + t * 0.02;
        const x = Math.cos(driftAngle) * s.r;
        const z = Math.sin(driftAngle) * s.r;
        dummy.position.set(x, s.y, z);
        dummy.rotation.set(s.rotX + t * 0.5, s.rotY + t * 0.3, 0);
        dummy.scale.setScalar(s.scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} rotation-x={tilt}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} geometry={geo} material={mat} />
    </group>
  );
}
