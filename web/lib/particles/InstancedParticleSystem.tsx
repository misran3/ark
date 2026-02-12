'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleConfig {
  /** Number of particles */
  count: number;
  /** Base size of each particle sprite */
  size?: number;
  /** [min, max] lifetime in seconds */
  lifespan?: [number, number];
  /** Min and max initial velocity components */
  velocityMin?: [number, number, number];
  velocityMax?: [number, number, number];
  /** Spawn region radius */
  spawnRadius?: number;
  /** Continuous force (e.g. gravity) */
  gravity?: [number, number, number];
  /** Particles emitted per second (0 = burst all at start) */
  emitRate?: number;
  /** Loop particles (respawn after death) */
  loop?: boolean;
}

export interface InstancedParticleSystemProps extends ParticleConfig {
  /** Starting color */
  color?: THREE.ColorRepresentation;
  /** Ending color (fades to this over lifetime) */
  colorEnd?: THREE.ColorRepresentation;
  /** THREE.Blending mode */
  blending?: THREE.Blending;
  /** Custom per-frame updater — mutate positions/velocities directly */
  onTick?: (data: ParticleState, delta: number, elapsed: number) => void;
}

export interface ParticleState {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  count: number;
  /** @deprecated Use positions/velocities arrays directly */
  mesh: THREE.Points;
}

// Vertex shader: GPU-side size attenuation (replaces CPU lookAt billboarding)
const particleVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aOpacity;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = aColor;
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader: soft circle particle
const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, d) * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const _color = new THREE.Color();

export default function InstancedParticleSystem({
  count,
  size = 0.08,
  lifespan = [1.0, 2.5],
  velocityMin = [-0.5, -0.5, -0.5],
  velocityMax = [0.5, 0.5, 0.5],
  spawnRadius = 0.2,
  gravity = [0, 0, 0],
  emitRate = 0,
  loop = true,
  color = '#ffffff',
  colorEnd,
  blending = THREE.AdditiveBlending,
  onTick,
}: InstancedParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const emitAccRef = useRef(0);

  const state = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const maxLifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      lifetimes[i] = emitRate > 0 ? -(Math.random() * (count / Math.max(emitRate, 1))) : 0;
      maxLifetimes[i] = lifespan[0] + Math.random() * (lifespan[1] - lifespan[0]);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * spawnRadius;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      velocities[i * 3] = velocityMin[0] + Math.random() * (velocityMax[0] - velocityMin[0]);
      velocities[i * 3 + 1] = velocityMin[1] + Math.random() * (velocityMax[1] - velocityMin[1]);
      velocities[i * 3 + 2] = velocityMin[2] + Math.random() * (velocityMax[2] - velocityMin[2]);
    }

    return { positions, velocities, lifetimes, maxLifetimes, count } as Omit<ParticleState, 'mesh'>;
  }, [count, lifespan, velocityMin, velocityMax, spawnRadius, emitRate]);

  // Pre-built ParticleState object for onTick — avoids allocation every frame
  const tickStateRef = useRef<ParticleState | null>(null);

  const startColor = useMemo(() => new THREE.Color(color), [color]);
  const endColor = useMemo(() => (colorEnd ? new THREE.Color(colorEnd) : null), [colorEnd]);

  // Buffer attributes for per-particle size, color, opacity
  const buffers = useMemo(() => {
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    sizes.fill(size);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = startColor.r;
      colors[i * 3 + 1] = startColor.g;
      colors[i * 3 + 2] = startColor.b;
      opacities[i] = 1.0;
    }
    return { sizes, colors, opacities };
  }, [count, size, startColor]);

  // Geometry with buffer attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(state.positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(buffers.sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(buffers.colors, 3));
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(buffers.opacities, 1));
    return geo;
  }, [state.positions, buffers]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending,
        toneMapped: false,
      }),
    [blending],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const elapsed = clock.getElapsedTime();
    const { positions, velocities, lifetimes, maxLifetimes } = state;

    // Let external code do custom work
    if (onTick) {
      if (!tickStateRef.current) {
        tickStateRef.current = { ...state, mesh: points } as ParticleState;
      } else {
        tickStateRef.current.mesh = points;
      }
      onTick(tickStateRef.current, delta, elapsed);
    }

    const sizeArr = buffers.sizes;
    const colorArr = buffers.colors;
    const opacityArr = buffers.opacities;

    for (let i = 0; i < count; i++) {
      lifetimes[i] += delta;
      const life = lifetimes[i];
      const maxLife = maxLifetimes[i];

      if (life < 0) {
        // Not yet born — hide via zero size
        sizeArr[i] = 0;
        continue;
      }

      if (life >= maxLife) {
        if (loop) {
          lifetimes[i] = 0;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.random() * spawnRadius;
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);
          velocities[i * 3] = velocityMin[0] + Math.random() * (velocityMax[0] - velocityMin[0]);
          velocities[i * 3 + 1] = velocityMin[1] + Math.random() * (velocityMax[1] - velocityMin[1]);
          velocities[i * 3 + 2] = velocityMin[2] + Math.random() * (velocityMax[2] - velocityMin[2]);
          maxLifetimes[i] = lifespan[0] + Math.random() * (lifespan[1] - lifespan[0]);
        } else {
          sizeArr[i] = 0;
          continue;
        }
      }

      const t = life / maxLife; // 0 → 1

      // Physics
      positions[i * 3] += velocities[i * 3] * delta;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;
      velocities[i * 3] += gravity[0] * delta;
      velocities[i * 3 + 1] += gravity[1] * delta;
      velocities[i * 3 + 2] += gravity[2] * delta;

      // Size: shrink over lifetime
      sizeArr[i] = size * (1.0 - t * 0.6);

      // Color fade
      if (endColor) {
        _color.copy(startColor).lerp(endColor, t);
      } else {
        _color.copy(startColor).multiplyScalar(1.0 - t * 0.5);
      }
      colorArr[i * 3] = _color.r;
      colorArr[i * 3 + 1] = _color.g;
      colorArr[i * 3 + 2] = _color.b;

      // Opacity: fade out near end of life
      opacityArr[i] = 1.0 - t * t;
    }

    // Mark buffer attributes as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aColor.needsUpdate = true;
    geometry.attributes.aOpacity.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
