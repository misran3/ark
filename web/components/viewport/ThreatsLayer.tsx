'use client';

import { useThreatStore, type Threat } from '@/lib/stores/threat-store';
import { ThreatObject } from './ThreatObject';

interface ThreatsLayerProps {
  threats: Threat[];
}

export function ThreatsLayer({ threats }: ThreatsLayerProps) {
  const deflectThreat = useThreatStore((state) => state.deflectThreat);

  return (
    <group>
      {threats.map((threat) => (
        <ThreatObject
          key={threat.id}
          threat={threat}
          onDeflect={deflectThreat}
        />
      ))}
    </group>
  );
}
