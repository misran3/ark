'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { VIEWPORT_BOUNDS_PX } from '@/lib/constants/cockpit-layout';

/**
 * CanopyStruts — 4 tapered structural beams converging from viewport corners
 * to a central vanishing point, forming a pyramidal canopy frame.
 *
 * Renders as a single merged BufferGeometry (1 draw call, ~48 triangles).
 * Static — no per-frame updates.
 */

// Vanishing point: 50% from left, 45% from top (slightly above center)
const VP_X_FRAC = 0.5;
const VP_Y_FRAC = 0.55; // measured from bottom, so 0.55 = 45% from top

// Strut width at frame edge vs center (world units, scaled at render)
const STRUT_WIDTH_EDGE = 0.045;
const STRUT_WIDTH_CENTER = 0.022;
const STRUT_DEPTH = 0.02; // thickness in Z

// Z-plane and depth offset for curvature feel
const Z_PLANE = 1.5;
const Z_EDGE = 1.35; // strut corners are closer to camera
const Z_CENTER = 1.65; // vanishing point is further

/**
 * Build a tapered rectangular prism (8 vertices, 12 triangles)
 * from `start` to `end` with different widths at each end.
 * Width is applied perpendicular to the strut direction in the XY plane.
 */
function buildTaperedStrut(
  start: THREE.Vector3,
  end: THREE.Vector3,
  widthStart: number,
  widthEnd: number,
  depth: number,
): THREE.BufferGeometry {
  // Perpendicular direction in XY plane
  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();

  const halfDepth = depth / 2;

  // 8 vertices: 4 at start face, 4 at end face
  // Each face: top-left, top-right, bottom-right, bottom-left
  const s = start;
  const e = end;
  const ws = widthStart / 2;
  const we = widthEnd / 2;

  const vertices = new Float32Array([
    // Start face (frame edge) — 4 vertices
    s.x + perp.x * ws, s.y + perp.y * ws, s.z + halfDepth,  // 0: start top-left
    s.x - perp.x * ws, s.y - perp.y * ws, s.z + halfDepth,  // 1: start top-right
    s.x - perp.x * ws, s.y - perp.y * ws, s.z - halfDepth,  // 2: start bottom-right
    s.x + perp.x * ws, s.y + perp.y * ws, s.z - halfDepth,  // 3: start bottom-left
    // End face (center) — 4 vertices
    e.x + perp.x * we, e.y + perp.y * we, e.z + halfDepth,  // 4: end top-left
    e.x - perp.x * we, e.y - perp.y * we, e.z + halfDepth,  // 5: end top-right
    e.x - perp.x * we, e.y - perp.y * we, e.z - halfDepth,  // 6: end bottom-right
    e.x + perp.x * we, e.y + perp.y * we, e.z - halfDepth,  // 7: end bottom-left
  ]);

  // 12 triangles (6 faces × 2 tris)
  // prettier-ignore
  const indices = new Uint16Array([
    // Front face (facing camera, +Z)
    0, 1, 5,  0, 5, 4,
    // Back face (-Z)
    3, 6, 2,  3, 7, 6,
    // Top face (+perp direction, catches overhead light)
    0, 4, 7,  0, 7, 3,
    // Bottom face (-perp direction, self-shadow)
    1, 2, 6,  1, 6, 5,
    // Start cap (frame edge)
    0, 3, 2,  0, 2, 1,
    // End cap (center)
    4, 5, 6,  4, 6, 7,
  ]);

  // Vertex colors: lighter on top faces (catching overhead light), darker on bottom
  // Layout: 8 vertices, each gets RGB
  const topColor = [0.14, 0.16, 0.22]; // lighter gunmetal
  const bottomColor = [0.07, 0.08, 0.12]; // darker shadow
  const midColor = [0.10, 0.12, 0.17]; // intermediate for sides

  // Vertices 0,3,4,7 are on the +perp side (top), 1,2,5,6 on -perp side (bottom)
  // For front/back faces, use mid tones
  const colors = new Float32Array([
    ...topColor,     // 0
    ...bottomColor,  // 1
    ...bottomColor,  // 2
    ...topColor,     // 3
    ...topColor,     // 4
    ...bottomColor,  // 5
    ...bottomColor,  // 6
    ...topColor,     // 7
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();

  return geo;
}

export function CanopyStruts() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  const geometry = useMemo(() => {
    // Get viewport dimensions in world units at Z_PLANE
    const aspect = size.width / size.height;
    const fovRad = (75 * Math.PI) / 180;
    const dist = 5 - Z_PLANE; // camera at Z=5, strut plane at Z_PLANE
    const halfH = Math.tan(fovRad / 2) * dist;
    const halfW = halfH * aspect;

    // Viewport inset fractions (how much the cockpit frame eats from each edge)
    const insetLeft = VIEWPORT_BOUNDS_PX.left / size.width;
    const insetRight = VIEWPORT_BOUNDS_PX.right / size.width;
    const insetTop = VIEWPORT_BOUNDS_PX.top / size.height;
    const insetBottom = VIEWPORT_BOUNDS_PX.bottom / size.height;

    // Corner positions in world XY at the frame edges
    const xMin = -halfW + (2 * halfW * insetLeft); // left frame edge
    const xMax = halfW - (2 * halfW * insetRight); // right frame edge
    const yMin = -halfH + (2 * halfH * insetBottom); // bottom frame edge
    const yMax = halfH - (2 * halfH * insetTop); // top frame edge

    // Vanishing point in viewport-relative coords mapped to world
    const vpWorldX = xMin + (xMax - xMin) * VP_X_FRAC;
    const vpWorldY = yMin + (yMax - yMin) * VP_Y_FRAC;

    // Four corners
    const corners = [
      new THREE.Vector3(xMin, yMax, Z_EDGE),  // Top-left
      new THREE.Vector3(xMax, yMax, Z_EDGE),  // Top-right
      new THREE.Vector3(xMin, yMin, Z_EDGE),  // Bottom-left
      new THREE.Vector3(xMax, yMin, Z_EDGE),  // Bottom-right
    ];

    const center = new THREE.Vector3(vpWorldX, vpWorldY, Z_CENTER);

    // Build 4 struts
    const struts = corners.map((corner) =>
      buildTaperedStrut(corner, center, STRUT_WIDTH_EDGE, STRUT_WIDTH_CENTER, STRUT_DEPTH),
    );

    const merged = mergeGeometries(struts, false);
    if (!merged) {
      console.warn('CanopyStruts: mergeGeometries returned null');
      return new THREE.BufferGeometry();
    }

    // Dispose individual strut geometries
    struts.forEach((s) => s.dispose());

    return merged;
  }, [size.width, size.height]);

  // Set static flags on mount
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.matrixAutoUpdate = false;
    meshRef.current.updateMatrix();
    meshRef.current.frustumCulled = false;
  }, []);

  // Cleanup geometry on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow={false} receiveShadow={false}>
      <meshLambertMaterial
        vertexColors
        emissive={new THREE.Color('#001a1f')}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
