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
