import * as THREE from 'three';

/**
 * Displace every vertex of a geometry along its normal.
 * Returns a NEW geometry (original untouched).
 */
export function displaceGeometry(
  base: THREE.BufferGeometry,
  displaceFn: (vertex: THREE.Vector3, index: number) => number,
  strength = 1.0
): THREE.BufferGeometry {
  const geo = base.clone();
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const d = displaceFn(v, i);
    v.add(n.multiplyScalar(d * strength));
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Generate a jagged lightning-bolt path between two points.
 * Each intermediate point is jittered perpendicular to the main axis.
 */
export function generateLightningPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments = 8,
  jitter = 0.5
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [start.clone()];
  const mainDir = new THREE.Vector3().subVectors(end, start);

  // Pick an arbitrary perpendicular basis
  const up = Math.abs(mainDir.y) < 0.99
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const perp1 = new THREE.Vector3().crossVectors(mainDir, up).normalize();
  const perp2 = new THREE.Vector3().crossVectors(mainDir, perp1).normalize();

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    p.add(perp1.clone().multiplyScalar((Math.random() - 0.5) * jitter));
    p.add(perp2.clone().multiplyScalar((Math.random() - 0.5) * jitter));
    pts.push(p);
  }

  pts.push(end.clone());
  return pts;
}

/**
 * Create a THREE.TubeGeometry from a set of points.
 */
export function tubeFromPoints(
  points: THREE.Vector3[],
  radius = 0.05,
  tubularSegments = 32,
  radialSegments = 6
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

/**
 * Morph an existing TubeGeometry's vertices to follow a new lightning path.
 * Updates position attribute in-place — no new geometry allocation.
 * The tube must have been created with the same tubularSegments and radialSegments.
 */
export function morphTubeToPath(
  tube: THREE.TubeGeometry,
  newPoints: THREE.Vector3[],
  radius = 0.05
): void {
  const curve = new THREE.CatmullRomCurve3(newPoints);
  const pos = tube.attributes.position;
  const tubularSegments = tube.parameters.tubularSegments ?? 16;
  const radialSegments = tube.parameters.radialSegments ?? 4;

  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();

  // Compute Frenet frames and write vertex positions
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, P);
    curve.getTangentAt(t, T);

    // Minimal normal computation (stable for most arcs)
    if (Math.abs(T.y) > 0.99) {
      N.set(1, 0, 0);
    } else {
      N.set(0, 1, 0);
    }
    B.crossVectors(T, N).normalize();
    N.crossVectors(B, T).normalize();

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const idx = i * (radialSegments + 1) + j;

      pos.setXYZ(
        idx,
        P.x + radius * (cosT * N.x + sinT * B.x),
        P.y + radius * (cosT * N.y + sinT * B.y),
        P.z + radius * (cosT * N.z + sinT * B.z)
      );
    }
  }

  pos.needsUpdate = true;
}
