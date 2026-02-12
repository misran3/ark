'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Group, Color, ShaderMaterial, AdditiveBlending, DoubleSide } from 'three';

export type StationType =
  | 'fuel-depot'
  | 'cargo-bay'
  | 'docking-authority'
  | 'trade-exchange'
  | 'cantina'
  | 'armory'
  | 'med-bay'
  | 'comm-relay'
  | 'salvage-yard'
  | 'black-market';

export interface StationConfig {
  type: StationType;
  label: string;
  position: [number, number, number];
  amount: number; // credits for dispatch display
  isIncome: boolean;
}

interface StationNodeProps {
  config: StationConfig;
  color: Color;
  materializeProgress: number; // 0-1, for spawn-in effect
  onClick?: () => void;
}

const hologramVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const hologramFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uMaterialize;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;

  void main() {
    // Fresnel rim
    float rim = pow(1.0 - abs(dot(vViewDir, vNormal)), 2.5);

    // Scanlines
    float scanline = sin(vWorldPosition.y * 60.0 + uTime * 2.0) * 0.5 + 0.5;
    scanline = mix(1.0, scanline, 0.2);

    // Materialization: dissolve from bottom to top
    float dissolveEdge = mix(-1.5, 1.5, uMaterialize);
    float dissolve = smoothstep(dissolveEdge - 0.3, dissolveEdge, vWorldPosition.y);

    // Static noise during materialization
    float noise = fract(sin(dot(vWorldPosition.xz * 40.0, vec2(12.9898, 78.233)) + uTime * 10.0) * 43758.5453);
    float staticEffect = uMaterialize < 0.95 ? noise * 0.3 * (1.0 - uMaterialize) : 0.0;

    vec3 color = uColor * (1.0 + rim * 1.5) + vec3(staticEffect);
    float alpha = uOpacity * scanline * dissolve * (0.5 + rim * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

function useStationMaterial(color: Color) {
  return useMemo(() => {
    return new ShaderMaterial({
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uOpacity: { value: 0.7 },
        uMaterialize: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
  }, [color]);
}

// Each station type returns a group of primitive meshes
function FuelDepot({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Base tank */}
      <mesh material={material} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 8]} />
      </mesh>
      {/* Pump arm */}
      <mesh material={material} position={[0.06, 0.25, 0]}>
        <boxGeometry args={[0.02, 0.12, 0.02]} />
      </mesh>
      {/* Top cap */}
      <mesh material={material} position={[0, 0.32, 0]}>
        <coneGeometry args={[0.06, 0.06, 8]} />
      </mesh>
    </group>
  );
}

function CargoBay({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Bottom crate */}
      <mesh material={material} position={[0, 0.06, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.1]} />
      </mesh>
      {/* Top crate (offset) */}
      <mesh material={material} position={[0.02, 0.17, 0.01]}>
        <boxGeometry args={[0.1, 0.1, 0.08]} />
      </mesh>
      {/* Small side crate */}
      <mesh material={material} position={[-0.06, 0.06, 0.06]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
      </mesh>
    </group>
  );
}

function DockingAuthority({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Tower base */}
      <mesh material={material} position={[0, 0.08, 0]}>
        <boxGeometry args={[0.1, 0.16, 0.1]} />
      </mesh>
      {/* Tower shaft */}
      <mesh material={material} position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.2, 6]} />
      </mesh>
      {/* Antenna top */}
      <mesh material={material} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>
    </group>
  );
}

function TradeExchange({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Central pillar */}
      <mesh material={material} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.24, 6]} />
      </mesh>
      {/* Rotating ring */}
      <mesh material={material} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, 16]} />
      </mesh>
      {/* Platform disc */}
      <mesh material={material} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
      </mesh>
    </group>
  );
}

function Cantina({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Dome */}
      <mesh material={material} position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Base */}
      <mesh material={material} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.06, 12]} />
      </mesh>
      {/* Door */}
      <mesh material={material} position={[0.1, 0.06, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.04]} />
      </mesh>
    </group>
  );
}

function Armory({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Base platform */}
      <mesh material={material} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.14, 0.04, 0.1]} />
      </mesh>
      {/* Turret base */}
      <mesh material={material} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.08, 8]} />
      </mesh>
      {/* Barrel */}
      <mesh material={material} position={[0.06, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.1, 6]} />
      </mesh>
    </group>
  );
}

function MedBay({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Pod body */}
      <mesh material={material} position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.05, 0.1, 4, 8]} />
      </mesh>
      {/* Cross - vertical */}
      <mesh material={material} position={[0, 0.26, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
      </mesh>
      {/* Cross - horizontal */}
      <mesh material={material} position={[0, 0.26, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.02]} />
      </mesh>
    </group>
  );
}

function CommRelay({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Mast */}
      <mesh material={material} position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.36, 6]} />
      </mesh>
      {/* Dish */}
      <mesh material={material} position={[0, 0.32, 0.03]} rotation={[0.4, 0, 0]}>
        <sphereGeometry args={[0.06, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Base */}
      <mesh material={material} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
      </mesh>
    </group>
  );
}

function SalvageYard({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Junk pile */}
      <mesh material={material} position={[-0.03, 0.04, 0]}>
        <dodecahedronGeometry args={[0.06, 0]} />
      </mesh>
      <mesh material={material} position={[0.04, 0.03, 0.02]}>
        <octahedronGeometry args={[0.04, 0]} />
      </mesh>
      {/* Crane arm */}
      <mesh material={material} position={[0.02, 0.16, 0]}>
        <cylinderGeometry args={[0.01, 0.015, 0.2, 4]} />
      </mesh>
      {/* Crane boom */}
      <mesh material={material} position={[0.06, 0.24, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.12, 0.015, 0.015]} />
      </mesh>
    </group>
  );
}

function BlackMarket({ material }: { material: ShaderMaterial }) {
  return (
    <group>
      {/* Glitched cube */}
      <mesh material={material} position={[0, 0.1, 0]} rotation={[0.3, 0.5, 0.2]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>
      {/* Smaller offset cube */}
      <mesh material={material} position={[0.03, 0.15, 0.03]} rotation={[-0.2, 0.8, 0.1]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
      </mesh>
    </group>
  );
}

const STATION_COMPONENTS: Record<StationType, React.FC<{ material: ShaderMaterial }>> = {
  'fuel-depot': FuelDepot,
  'cargo-bay': CargoBay,
  'docking-authority': DockingAuthority,
  'trade-exchange': TradeExchange,
  'cantina': Cantina,
  'armory': Armory,
  'med-bay': MedBay,
  'comm-relay': CommRelay,
  'salvage-yard': SalvageYard,
  'black-market': BlackMarket,
};

export function StationNode({ config, color, materializeProgress, onClick }: StationNodeProps) {
  const groupRef = useRef<Group>(null);
  const material = useStationMaterial(color);
  const StationComponent = STATION_COMPONENTS[config.type as StationType] || CargoBay;

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uMaterialize.value = materializeProgress;

    // Gentle hover bob
    if (groupRef.current && materializeProgress > 0.5) {
      groupRef.current.position.y =
        config.position[1] + Math.sin(clock.getElapsedTime() * 0.8 + config.position[0]) * 0.02;
    }
  });

  if (materializeProgress <= 0) return null;

  return (
    <group
      ref={groupRef}
      position={config.position}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <group scale={materializeProgress}>
        <StationComponent material={material} />
      </group>

      {/* Station label */}
      {materializeProgress > 0.5 && (
        <Text
          fontSize={0.06}
          letterSpacing={0.15}
          color={color}
          anchorX="center"
          anchorY="middle"
          fillOpacity={Math.min(1, (materializeProgress - 0.5) * 2) * 0.7}
          position={[0, -0.1, 0]}
          outlineWidth="5%"
          outlineColor={color}
          outlineOpacity={0.2}
        >
          {config.label}
        </Text>
      )}
    </group>
  );
}
