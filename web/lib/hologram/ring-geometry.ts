import { RingGeometry } from 'three';

/**
 * Creates a ring arc segment geometry.
 * @param innerRadius - Inner radius
 * @param outerRadius - Outer radius
 * @param startAngle - Start angle in radians
 * @param arcAngle - Arc sweep in radians
 * @param segments - Number of segments for smoothness
 */
export function createRingArc(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  arcAngle: number,
  segments: number = 32
) {
  const geo = new RingGeometry(
    innerRadius,
    outerRadius,
    segments,
    1,
    startAngle,
    arcAngle
  );

  // Remap UV.y so 0 = inner edge, 1 = outer edge (for fill-level shader)
  const uvs = geo.attributes.uv.array as Float32Array;
  const positions = geo.attributes.position.array as Float32Array;

  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const r = Math.sqrt(x * x + y * y);
    const normalizedR = (r - innerRadius) / (outerRadius - innerRadius);
    uvs[i * 2 + 1] = normalizedR; // UV.y = radial position (0=inner, 1=outer)
  }

  geo.attributes.uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
