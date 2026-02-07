'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Color,
  IcosahedronGeometry,
  WireframeGeometry,
  LineBasicMaterial,
  ShaderMaterial,
  AdditiveBlending,
  SphereGeometry,
  Mesh,
} from 'three';

interface OrreryCoreProps {
  color: Color;
  health: number;
}

const glowVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const glowFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uHealth;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float rim = pow(1.0 - abs(dot(vViewDir, vNormal)), 3.0);
    float pulse = sin(uTime * 3.0) * 0.04 + 1.0;
    float stress = uHealth < 0.4 ? 2.0 : 1.0;
    float brightness = mix(0.02, 0.1, uHealth) * pulse * stress;
    vec3 col = uColor * brightness;
    float alpha = rim * 0.3 * pulse;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function OrreryCore({ color, health }: OrreryCoreProps) {
  const groupRef = useRef<Group>(null);
  const outerRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);

  // Outer wireframe icosahedron (detail 2, radius 1.0)
  const outerWireGeo = useMemo(() => {
    const ico = new IcosahedronGeometry(1.0, 2);
    return new WireframeGeometry(ico);
  }, []);

  // Inner lattice icosahedron (detail 1, radius 0.6)
  const innerWireGeo = useMemo(() => {
    const ico = new IcosahedronGeometry(0.6, 1);
    return new WireframeGeometry(ico);
  }, []);

  const outerMat = useMemo(
    () => new LineBasicMaterial({ color, transparent: true, opacity: 0.6 }),
    [color]
  );

  const innerMat = useMemo(
    () => new LineBasicMaterial({ color, transparent: true, opacity: 0.25 }),
    [color]
  );

  // Glow sphere
  const glowGeo = useMemo(() => new SphereGeometry(1.3, 32, 32), []);
  const glowMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 3) * 0.04;

    // Rotate outer and inner in opposite directions
    if (outerRef.current) {
      outerRef.current.rotation.y += 0.003;
      outerRef.current.rotation.x += 0.001;
      outerRef.current.scale.setScalar(pulse);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.005;
      innerRef.current.rotation.z += 0.002;
      innerRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.3);
    }

    glowMat.uniforms.uTime.value = t;
    glowMat.uniforms.uHealth.value = health;
  });

  return (
    <group ref={groupRef}>
      {/* Outer wireframe */}
      <group ref={outerRef}>
        <lineSegments geometry={outerWireGeo} material={outerMat} />
      </group>

      {/* Inner lattice (counter-rotating) */}
      <group ref={innerRef}>
        <lineSegments geometry={innerWireGeo} material={innerMat} />
      </group>

      {/* Glow sphere */}
      <mesh ref={glowRef} geometry={glowGeo} material={glowMat} />

      {/* Central point light */}
      <pointLight color={color} intensity={1.5} decay={2} distance={8} />
    </group>
  );
}
