'use client';

import Asteroid from './threats/Asteroid';
import IonStorm from './threats/IonStorm';
import SolarFlare from './threats/SolarFlare';
import { useThreatStore } from '@/lib/stores/threat-store';

export default function Threats() {
  const threats = useThreatStore((state) => state.threats);
  const deflectThreat = useThreatStore((state) => state.deflectThreat);
  const setHoveredThreat = useThreatStore((state) => state.setHoveredThreat);

  const renderThreat = (threat: any) => {
    const commonProps = {
      key: threat.id,
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
        return <Asteroid {...commonProps} label={threat.label} />;
      case 'ion_storm':
        return <IonStorm {...commonProps} />;
      case 'solar_flare':
        return <SolarFlare {...commonProps} />;
      default:
        return <Asteroid {...commonProps} label={threat.label} />;
    }
  };

  return (
    <group>
      {threats.filter((threat) => !threat.deflected).map(renderThreat)}
    </group>
  );
}
