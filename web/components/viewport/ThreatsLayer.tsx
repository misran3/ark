'use client';

import { useThreatStore, type Threat } from '@/lib/stores/threat-store';
import Asteroid from '@/components/three/threats/Asteroid';
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
        <Asteroid
          {...common}
          label={threat.label}
          seed={threat.seed}
          angularVelocity={threat.angularVelocity}
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

export function ThreatsLayer({ threats }: ThreatsLayerProps) {
  return (
    <group>
      {threats.map((threat) => (
        <ThreatRenderer key={threat.id} threat={threat} />
      ))}
    </group>
  );
}
