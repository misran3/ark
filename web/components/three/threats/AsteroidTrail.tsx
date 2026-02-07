'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidTrailProps {
  count?: number;
  spread?: number;
  size?: number;
}

/**
 * GPU-friendly fire trail using a single Points mesh with pooled particles.
 * Particles emit from origin (0,0,0) in local space, drift backward (+Z),
 * and fade from orange -> red -> dark gray over their lifetime.
 */
export default function AsteroidTrail({
  count = 80,
  spread = 0.4,
  size = 0.08,
}: AsteroidTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const lifetimesRef = useRef<Float32Array>(null!);
  const velocitiesRef = useRef<Float32Array>(null!);
  const maxLifetimesRef = useRef<Float32Array>(null!);

  // Build geometry imperatively so we can mutate attributes in useFrame
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    const maxLifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Stagger initial lifetimes so particles don't all spawn at once
      lifetimes[i] = -Math.random() * 2.0;
      maxLifetimes[i] = 1.5 + Math.random() * 1.0;

      // Random drift velocity (mostly backward +Z, with spread)
      velocities[i * 3] = (Math.random() - 0.5) * spread;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
      velocities[i * 3 + 2] = 0.5 + Math.random() * 0.8;

      // Initial color: orange (#f97316)
      colors[i * 3] = 0.976;
      colors[i * 3 + 1] = 0.451;
      colors[i * 3 + 2] = 0.086;

      sizes[i] = size * (0.5 + Math.random() * 0.5);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    lifetimesRef.current = lifetimes;
    velocitiesRef.current = velocities;
    maxLifetimesRef.current = maxLifetimes;

    return geo;
  }, [count, spread, size]);

  // Dispose geometry on unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    if (!geometry) return;

    const posAttr = geometry.attributes.position;
    const colorAttr = geometry.attributes.color;
    const sizeAttr = geometry.attributes.size;
    const pos = posAttr.array as Float32Array;
    const col = colorAttr.array as Float32Array;
    const sz = sizeAttr.array as Float32Array;
    const lifetimes = lifetimesRef.current;
    const velocities = velocitiesRef.current;
    const maxLifetimes = maxLifetimesRef.current;

    for (let i = 0; i < count; i++) {
      lifetimes[i] += delta;

      if (lifetimes[i] >= maxLifetimes[i]) {
        // Reset particle at origin with new velocity
        lifetimes[i] = 0;
        pos[i * 3] = (Math.random() - 0.5) * 0.15;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

        velocities[i * 3] = (Math.random() - 0.5) * spread;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
        velocities[i * 3 + 2] = 0.5 + Math.random() * 0.8;

        maxLifetimes[i] = 1.5 + Math.random() * 1.0;
      }

      if (lifetimes[i] < 0) continue; // Still in stagger delay

      const t = lifetimes[i] / maxLifetimes[i]; // 0 -> 1 normalized lifetime

      // Move particle along velocity
      pos[i * 3] += velocities[i * 3] * delta;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      // Color fade: orange -> red -> dark gray
      if (t < 0.4) {
        const p = t / 0.4;
        col[i * 3] = 0.976 - p * 0.11;
        col[i * 3 + 1] = 0.451 - p * 0.3;
        col[i * 3 + 2] = 0.086 - p * 0.06;
      } else {
        const p = (t - 0.4) / 0.6;
        col[i * 3] = 0.863 - p * 0.66;
        col[i * 3 + 1] = 0.149 - p * 0.05;
        col[i * 3 + 2] = 0.024 + p * 0.08;
      }

      // Size: shrink over lifetime
      sz[i] = size * (1.0 - t * 0.7) * (lifetimes[i] > 0 ? 1 : 0);
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        size={size}
      />
    </points>
  );
}
