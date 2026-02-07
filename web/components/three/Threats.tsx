'use client';

import Asteroid from './threats/Asteroid';
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
          <Asteroid
            key={threat.id}
            {...commonProps}
            label={threat.label}
            seed={threat.seed}
            angularVelocity={threat.angularVelocity}
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
        return (
          <Asteroid
            key={threat.id}
            {...commonProps}
            label={threat.label}
            seed={threat.seed}
            angularVelocity={threat.angularVelocity}
          />
        );
    }
  };

  return (
    <group>
      {threats.filter((threat) => !threat.deflected).map(renderThreat)}
    </group>
  );
}
