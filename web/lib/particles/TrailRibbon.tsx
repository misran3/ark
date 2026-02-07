'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrailRibbonProps {
  /** Ref to the object being trailed */
  targetRef: React.RefObject<THREE.Object3D | null>;
  /** Max trail points stored */
  maxPoints?: number;
  /** How long each point lives (seconds) */
  lifetime?: number;
  /** Ribbon half-width */
  width?: number;
  /** Head color */
  color?: THREE.ColorRepresentation;
  /** Tail color */
  colorEnd?: THREE.ColorRepresentation;
  opacity?: number;
}

export default function TrailRibbon({
  targetRef,
  maxPoints = 60,
  lifetime = 1.0,
  width = 0.15,
  color = '#ffffff',
  colorEnd,
  opacity = 0.6,
}: TrailRibbonProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const headColor = useMemo(() => new THREE.Color(color), [color]);
  const tailColor = useMemo(() => (colorEnd ? new THREE.Color(colorEnd) : headColor.clone().multiplyScalar(0.2)), [colorEnd, headColor]);

  // Ring-buffer of world positions + ages
  const trail = useRef<{ pos: THREE.Vector3; age: number }[]>([]);
  const lastPos = useRef(new THREE.Vector3());

  // Pre-allocate geometry buffers (2 verts per point for ribbon)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 2 * 3);
    const colors = new Float32Array(maxPoints * 2 * 3);
    const indices: number[] = [];

    for (let i = 0; i < maxPoints - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    return geo;
  }, [maxPoints]);

  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  useFrame(({ camera }, delta) => {
    if (!targetRef.current || !meshRef.current) return;

    const wp = new THREE.Vector3();
    targetRef.current.getWorldPosition(wp);

    // Only record if moved enough
    if (wp.distanceTo(lastPos.current) > 0.01) {
      trail.current.unshift({ pos: wp.clone(), age: 0 });
      lastPos.current.copy(wp);
      if (trail.current.length > maxPoints) trail.current.pop();
    }

    // Age and cull
    trail.current = trail.current.filter(p => { p.age += delta; return p.age < lifetime; });

    // Write geometry
    const posArr = geometry.attributes.position.array as Float32Array;
    const colArr = geometry.attributes.color.array as Float32Array;
    const up = camera.up.clone();
    const _c = new THREE.Color();

    for (let i = 0; i < maxPoints; i++) {
      if (i < trail.current.length) {
        const pt = trail.current[i];
        const t = pt.age / lifetime;
        const w = width * (1.0 - t);

        // Direction for ribbon expansion
        let dir = up;
        if (i < trail.current.length - 1) {
          dir = new THREE.Vector3().subVectors(trail.current[i + 1].pos, pt.pos).normalize();
          dir.cross(new THREE.Vector3().subVectors(camera.position, pt.pos).normalize()).normalize();
        }
        const off = dir.clone().multiplyScalar(w);

        const idx = i * 6;
        posArr[idx] = pt.pos.x - off.x;
        posArr[idx + 1] = pt.pos.y - off.y;
        posArr[idx + 2] = pt.pos.z - off.z;
        posArr[idx + 3] = pt.pos.x + off.x;
        posArr[idx + 4] = pt.pos.y + off.y;
        posArr[idx + 5] = pt.pos.z + off.z;

        _c.copy(headColor).lerp(tailColor, t);
        colArr[idx] = _c.r; colArr[idx + 1] = _c.g; colArr[idx + 2] = _c.b;
        colArr[idx + 3] = _c.r; colArr[idx + 4] = _c.g; colArr[idx + 5] = _c.b;
      } else {
        const idx = i * 6;
        posArr[idx] = posArr[idx + 1] = posArr[idx + 2] = 0;
        posArr[idx + 3] = posArr[idx + 4] = posArr[idx + 5] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
