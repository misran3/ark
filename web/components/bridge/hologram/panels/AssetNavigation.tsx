'use client';

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useConsoleStore } from '@/lib/stores/console-store';
import { getSystemColor, getSystemCSSColor, getSystemCSSGlow } from '@/lib/hologram/colors';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';

export function AssetNavigation() {
  const health = useConsoleStore((s) => s.panelHealth.networth);
  const color = useMemo(() => getSystemColor('networth', health).clone(), [health]);
  const cssColor = getSystemCSSColor('networth', health);
  const cssGlow = getSystemCSSGlow('networth', health, 0.3);

  return (
    <group>
      <HologramParticles count={30} color={color} spread={[3, 3, 0.5]} />
      <Html center position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
        <div className="text-center font-mono" style={{ color: cssColor, textShadow: `0 0 12px ${cssGlow}` }}>
          <div className="text-[10px] tracking-[0.3em] opacity-70 mb-2">ASSET NAVIGATION</div>
          <div className="text-sm opacity-50 tracking-widest">COMING ONLINE</div>
        </div>
      </Html>
    </group>
  );
}
