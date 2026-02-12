'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThreatStore, type Threat } from '@/lib/stores/threat-store';
import {
  STATIC_THREAT_TYPES,
  DRIFT,
  generateConvergenceTarget,
} from '@/lib/constants/scene-layout';
import AsteroidField from '@/components/three/threats/AsteroidField';
import IonStorm from '@/components/three/threats/IonStorm';
import SolarFlare from '@/components/three/threats/SolarFlare';
import BlackHole from '@/components/three/threats/BlackHole';
import Wormhole from '@/components/three/threats/Wormhole';
import EnemyCruiser from '@/components/three/threats/EnemyCruiser';

interface ThreatsLayerProps {
  threats: Threat[];
}

function ThreatRenderer({ threat }: { threat: Threat }) {
  const deflectThreat = useThreatStore((state) => state.deflectThreat);
  const setHoveredThreat = useThreatStore((state) => state.setHoveredThreat);

  const onClick = () => deflectThreat(threat.id);
  const onHover = (hovered: boolean) =>
    setHoveredThreat(hovered ? threat.id : null);

  const common = {
    position: threat.position,
    size: threat.size,
    color: threat.color,
    onClick,
    onHover,
  };

  switch (threat.type) {
    case 'asteroid':
      return (
        <AsteroidField
          position={threat.position}
          size={threat.size}
          color={threat.color}
          label={threat.label}
          amount={threat.amount}
          seed={threat.seed}
          createdAt={threat.createdAt}
          driftEnabled={false}
          onHover={onHover}
          onDeflect={onClick}
        />
      );
    case 'ion_storm':
      return <IonStorm {...common} />;
    case 'solar_flare':
      return <SolarFlare {...common} />;
    case 'black_hole':
      return <BlackHole {...common} />;
    case 'wormhole':
      return <Wormhole {...common} />;
    case 'enemy_cruiser':
      return <EnemyCruiser {...common} />;
    default:
      return null;
  }
}

/** Static threat — rendered at its store position, no drift */
function StaticThreat({ threat }: { threat: Threat }) {
  const movedThreat = useMemo(
    () => ({ ...threat, position: [0, 0, 0] as [number, number, number] }),
    [threat],
  );

  return (
    <group position={threat.position}>
      <ThreatRenderer threat={movedThreat} />
    </group>
  );
}

/** Wraps a threat in a group that slowly drifts from its spawn toward center */
function DriftingThreat({ threat }: { threat: Threat }) {
  const groupRef = useRef<THREE.Group>(null!);

  const spawnPos = useMemo(
    () => new THREE.Vector3(...threat.position),
    // Only compute once per threat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threat.id],
  );

  const target = useMemo(
    () => generateConvergenceTarget(threat.id),
    [threat.id],
  );

  const currentPos = useRef(spawnPos.clone());

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!threat.deflected) {
      currentPos.current.lerp(target, delta * DRIFT.speed);
    }
    groupRef.current.position.copy(currentPos.current);
  });

  // Pass [0,0,0] position to the inner threat — outer group handles world position
  const movedThreat = useMemo(
    () => ({ ...threat, position: [0, 0, 0] as [number, number, number] }),
    [threat],
  );

  return (
    <group ref={groupRef}>
      <ThreatRenderer threat={movedThreat} />
    </group>
  );
}

export function ThreatsLayer({ threats }: ThreatsLayerProps) {
  return (
    <group>
      {threats.map((threat) =>
        STATIC_THREAT_TYPES.has(threat.type) ? (
          <StaticThreat key={threat.id} threat={threat} />
        ) : (
          <DriftingThreat key={threat.id} threat={threat} />
        ),
      )}
    </group>
  );
}
