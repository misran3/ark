'use client';

interface GlassLensProps {
  /** Radius of the glass disc */
  radius?: number;
  /** Z-position (depth offset) */
  zOffset?: number;
}

/**
 * Glass lens — slightly convex transparent disc with specular arc highlight.
 * Placed over gauge faces to simulate instrument glass.
 */
export function GlassLens({
  radius = 0.85,
  zOffset = 0.05,
}: GlassLensProps) {
  return (
    <group position={[0, 0, zOffset]}>
      {/* Glass surface — very subtle tint */}
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial
          color="#8cc8d8"
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>

      {/* Specular arc highlight — light reflection on convex glass */}
      <mesh position={[-radius * 0.15, radius * 0.2, 0.001]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[radius * 0.8, radius * 0.12]} />
        <meshBasicMaterial
          color="#c0d8ff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Edge darkening — vignette ring */}
      <mesh>
        <ringGeometry args={[radius * 0.7, radius, 48]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Glass bezel rim */}
      <mesh>
        <ringGeometry args={[radius * 0.96, radius * 1.02, 48]} />
        <meshBasicMaterial
          color="#2a3a50"
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
