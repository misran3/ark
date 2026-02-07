'use client';

import Asteroid from './threats/Asteroid';
import AsteroidField from './threats/AsteroidField';
import IonStorm from './threats/IonStorm';
import SolarFlare from './threats/SolarFlare';
import BlackHole from './threats/BlackHole';
import Wormhole from './threats/Wormhole';
import EnemyCruiser from './threats/EnemyCruiser';
import { useThreatStore } from '@/lib/stores/threat-store';

export default function Threats() {
  const threats = useThreatStore((state) => state.threats);
  const deflectThreat = useThreatStore((state) => state.deflectThreat);
  const setHoveredThreat = useThreatStore((state) => state.setHoveredThreat);

  const renderThreat = (threat: any) => {
    const commonProps = {
      position: threat.position,
      size: threat.size,
      color: threat.color,
      onHover: (hovered: boolean) => setHoveredThreat(hovered ? threat.id : null),
      onClick: () => {
        console.log('Deflecting threat:', threat.id);
        deflectThreat(threat.id);
      },
    };

    switch (threat.type) {
      case 'asteroid':
        return (
          <AsteroidField
            key={threat.id}
            position={threat.position}
            size={threat.size}
            color={threat.color}
            label={threat.label}
            amount={threat.amount ?? 10}
            seed={threat.seed}
            createdAt={threat.createdAt ?? Date.now()}
            onHover={(hovered: boolean) => setHoveredThreat(hovered ? threat.id : null)}
            onDeflect={() => {
              console.log('Deflecting threat:', threat.id);
              deflectThreat(threat.id);
            }}
          />
        );
      case 'ion_storm':
        return <IonStorm key={threat.id} {...commonProps} />;
      case 'solar_flare':
        return <SolarFlare key={threat.id} {...commonProps} />;
      case 'black_hole':
        return <BlackHole key={threat.id} {...commonProps} />;
      case 'wormhole':
        return <Wormhole key={threat.id} {...commonProps} />;
      case 'enemy_cruiser':
        return <EnemyCruiser key={threat.id} {...commonProps} />;
      default:
        console.warn(`Unknown threat type: ${threat.type}, skipping render`);
        return null;
    }
  };

  return (
    <group>
      {threats.filter((threat) => !threat.deflected).map(renderThreat)}
    </group>
  );
}
