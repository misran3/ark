'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import '@/lib/materials/AccretionDiskMaterial';

interface AccretionDiskProps {
  count: number;
  eventHorizonRadius: number;
  outerRadius: number;
  color: THREE.Color | string;
  colorInner: THREE.Color | string;
  spiralRate?: number;
  speedMult?: number;
  opacity?: number;
  /** Y-axis spread for disk thickness */
  diskHeight?: number;
  /** Base particle size */
  particleSize?: number;
}

export function AccretionDisk({
  count,
  eventHorizonRadius,
  outerRadius,
  color,
  colorInner,
  spiralRate = 0.15,
  speedMult = 1.0,
  opacity = 1.0,
  diskHeight = 0.15,
  particleSize = 3.0,
}: AccretionDiskProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const initAngles = new Float32Array(count);
    const initRadii = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const range = outerRadius - eventHorizonRadius;
    for (let i = 0; i < count; i++) {
      // Distribute across disk with slight bias toward outer edge
      const r = eventHorizonRadius + Math.random() * range;
      const angle = Math.random() * Math.PI * 2;

      // Y position is fixed vertical jitter (baked, not recomputed)
      positions[i * 3] = 0; // X computed in shader
      positions[i * 3 + 1] = (Math.random() - 0.5) * diskHeight;
      positions[i * 3 + 2] = 0; // Z computed in shader

      initAngles[i] = angle;
      initRadii[i] = r;
      sizes[i] = particleSize * (0.5 + Math.random() * 1.0);
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aInitAngle', new THREE.BufferAttribute(initAngles, 1));
    geo.setAttribute('aInitRadius', new THREE.BufferAttribute(initRadii, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    return { geometry: geo };
  }, [count, eventHorizonRadius, outerRadius, diskHeight, particleSize]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <accretionDiskMaterial
        ref={matRef}
        uColor={typeof color === 'string' ? new THREE.Color(color) : color}
        uColorInner={typeof colorInner === 'string' ? new THREE.Color(colorInner) : colorInner}
        uEventHorizonRadius={eventHorizonRadius}
        uOuterRadius={outerRadius}
        uSpeedMult={speedMult}
        uSpiralRate={spiralRate}
        uOpacity={opacity}
        uPixelRatio={viewport.dpr}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
