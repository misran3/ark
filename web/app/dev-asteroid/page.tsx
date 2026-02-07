'use client';

import { useState } from 'react';
import DevThreatLayout from '@/components/dev/DevThreatLayout';
import Asteroid from '@/components/three/threats/Asteroid';

export default function DevAsteroidPage() {
  const [seed, setSeed] = useState(42);
  const [angularVelocity, setAngularVelocity] = useState<[number, number, number]>([0.3, 0.5, 0.2]);

  return (
    <DevThreatLayout
      title="DEV: Asteroid Field"
      subtitle="Recurring charges & subscription fees"
      accentColor="#f97316"
      defaultSize={1}
      defaultColor="#f97316"
      extraControls={
        <>
          <div className="font-rajdhani text-xs text-cyan-400/60 mb-2 mt-2">
            Asteroid Controls
          </div>
          {/* Seed */}
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="w-24 font-rajdhani text-cyan-400/60">Seed:</span>
            <input
              type="number"
              value={seed}
              min={0}
              max={999}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              className="flex-1 bg-gray-800/50 border border-gray-600/30 rounded px-2 py-0.5 font-mono text-cyan-400"
            />
          </div>
          {/* Angular Velocity */}
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis} className="flex items-center gap-2 text-xs text-cyan-400">
              <span className="w-24 font-rajdhani text-cyan-400/60">Rot {axis}:</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={angularVelocity[i]}
                onChange={(e) => {
                  const next: [number, number, number] = [...angularVelocity];
                  next[i] = parseFloat(e.target.value);
                  setAngularVelocity(next);
                }}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono">
                {angularVelocity[i].toFixed(1)}
              </span>
            </div>
          ))}
        </>
      }
    >
      {({ size, color, position }) => (
        <Asteroid
          position={position}
          size={size}
          color={color}
          seed={seed}
          angularVelocity={angularVelocity}
        />
      )}
    </DevThreatLayout>
  );
}
