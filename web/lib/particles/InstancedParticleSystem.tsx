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
  /** Custom per-frame updater — mutate matrices directly */
  onTick?: (data: ParticleState, delta: number, elapsed: number) => void;
}

export interface ParticleState {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  count: number;
  mesh: THREE.InstancedMesh;
}

const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();

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
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const emitAccRef = useRef(0);

  const state = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const maxLifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Stagger spawns so they don't all appear at once
      lifetimes[i] = emitRate > 0 ? -(Math.random() * (count / Math.max(emitRate, 1))) : 0;
      maxLifetimes[i] = lifespan[0] + Math.random() * (lifespan[1] - lifespan[0]);

      // Random position in spawn sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * spawnRadius;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Random velocity in range
      velocities[i * 3] = velocityMin[0] + Math.random() * (velocityMax[0] - velocityMin[0]);
      velocities[i * 3 + 1] = velocityMin[1] + Math.random() * (velocityMax[1] - velocityMin[1]);
      velocities[i * 3 + 2] = velocityMin[2] + Math.random() * (velocityMax[2] - velocityMin[2]);
    }

    return { positions, velocities, lifetimes, maxLifetimes, count } as Omit<ParticleState, 'mesh'>;
  }, [count, lifespan, velocityMin, velocityMax, spawnRadius, emitRate]);

  const startColor = useMemo(() => new THREE.Color(color), [color]);
  const endColor = useMemo(() => (colorEnd ? new THREE.Color(colorEnd) : null), [colorEnd]);

  // Geometry: small plane quad (billboard-friendly)
  const geo = useMemo(() => new THREE.PlaneGeometry(size, size), [size]);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: startColor,
        transparent: true,
        depthWrite: false,
        blending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [startColor, blending]
  );

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame(({ clock, camera }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();
    const { positions, velocities, lifetimes, maxLifetimes } = state;

    // Let external code do custom work
    if (onTick) {
      onTick({ ...state, mesh } as ParticleState, delta, elapsed);
    }

    for (let i = 0; i < count; i++) {
      lifetimes[i] += delta;
      const life = lifetimes[i];
      const maxLife = maxLifetimes[i];

      if (life < 0) {
        // Not yet born — hide
        _matrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, _matrix);
        continue;
      }

      if (life >= maxLife) {
        if (loop) {
          // Respawn
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
          _matrix.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, _matrix);
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

      // Billboard toward camera
      _position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const scaleFactor = (1.0 - t * 0.6); // Shrink over life
      _scale.setScalar(scaleFactor);

      _matrix.identity();
      _matrix.lookAt(_position, camera.position, camera.up);
      _matrix.setPosition(_position);
      _matrix.scale(_scale);
      mesh.setMatrixAt(i, _matrix);

      // Color fade
      if (endColor) {
        _color.copy(startColor).lerp(endColor, t);
      } else {
        _color.copy(startColor).multiplyScalar(1.0 - t * 0.5);
      }
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}
