'use client';

import { useState, useCallback, useEffect } from 'react';
import DevThreatLayout from '@/components/dev/DevThreatLayout';
import Asteroid from '@/components/three/threats/Asteroid';
import AsteroidField from '@/components/three/threats/AsteroidField';

type ViewMode = 'field' | 'single';
type HpPreset = 'full' | 'damaged' | 'critical' | 'destroyed';

export default function DevAsteroidPage() {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('field');

  // --- Single Rock controls ---
  const [seed, setSeed] = useState(42);
  const [angularVelocity, setAngularVelocity] = useState<[number, number, number]>([0.3, 0.5, 0.2]);
  const [hpPreset, setHpPreset] = useState<HpPreset>('full');
  const [hitCount, setHitCount] = useState(0);

  // --- Field mode controls ---
  const [amount, setAmount] = useState(50);
  const [fieldSeed, setFieldSeed] = useState(42);
  const [driftEnabled, setDriftEnabled] = useState(true);
  const [growthEnabled, setGrowthEnabled] = useState(false);
  const [growthSpeed, setGrowthSpeed] = useState(1);
  const [rockCountOverride, setRockCountOverride] = useState<number | null>(null);
  const [fieldKey, setFieldKey] = useState(0); // For remounting

  // Compute HP from preset (for single rock, maxHp = 3)
  const hpFromPreset = (preset: HpPreset): { hp: number; maxHp: number } => {
    switch (preset) {
      case 'full': return { hp: 3, maxHp: 3 };
      case 'damaged': return { hp: 2, maxHp: 3 };
      case 'critical': return { hp: 1, maxHp: 3 };
      case 'destroyed': return { hp: 0, maxHp: 3 };
    }
  };

  // Stable timestamp for growth simulation (prevents continuous remounting)
  const [growthStartTime, setGrowthStartTime] = useState(Date.now());

  useEffect(() => {
    if (!growthEnabled) {
      setGrowthStartTime(Date.now());
    } else {
      // Set timestamp to simulate elapsed time
      setGrowthStartTime(Date.now() - growthSpeed * 10 * 60 * 1000);
    }
  }, [growthEnabled, growthSpeed]);

  const buttonClass =
    'px-2 py-1 rounded border text-xs font-orbitron tracking-wider transition-colors';
  const activeButton =
    'border-cyan-500/60 bg-cyan-500/20 text-cyan-400';
  const inactiveButton =
    'border-gray-600/30 bg-gray-800/30 text-gray-500 hover:bg-gray-700/30 hover:text-gray-400';

  return (
    <DevThreatLayout
      title="DEV: Asteroid"
      subtitle={viewMode === 'single' ? 'Single rock mode' : 'Asteroid field mode — click rocks to destroy'}
      accentColor="#f97316"
      defaultSize={1}
      defaultColor="#f97316"
      cameraZ={viewMode === 'field' ? 14 : 8}
      maxDistance={viewMode === 'field' ? 40 : 20}
      extraControls={
        <>
          {/* ===== View Mode Toggle ===== */}
          <div className="font-rajdhani text-xs text-cyan-400/60 mb-2 mt-3">
            View Mode
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('field')}
              className={`flex-1 ${buttonClass} ${viewMode === 'field' ? activeButton : inactiveButton}`}
            >
              Asteroid Field
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`flex-1 ${buttonClass} ${viewMode === 'single' ? activeButton : inactiveButton}`}
            >
              Single Rock
            </button>
          </div>

          {/* ===== Single Rock Controls ===== */}
          {viewMode === 'single' && (
            <>
              <div className="font-rajdhani text-xs text-cyan-400/60 mb-2 mt-3">
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

              {/* HP State Selector */}
              <div className="font-rajdhani text-xs text-cyan-400/60 mb-2 mt-3">
                Damage State
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['full', 'damaged', 'critical', 'destroyed'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setHpPreset(preset)}
                    className={`${buttonClass} ${hpPreset === preset ? activeButton : inactiveButton}`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>

              {/* Trigger Hit */}
              <button
                onClick={() => setHitCount((c) => c + 1)}
                className={`w-full mt-2 ${buttonClass} border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20`}
              >
                Trigger Hit ({hitCount} hits)
              </button>
            </>
          )}

          {/* ===== Field Mode Controls ===== */}
          {viewMode === 'field' && (
            <>
              <div className="font-rajdhani text-xs text-cyan-400/60 mb-2 mt-3">
                Field Controls
              </div>

              {/* Amount */}
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-24 font-rajdhani text-cyan-400/60">Amount $:</span>
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-14 text-right font-mono">${amount}</span>
              </div>

              {/* Field Seed */}
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-24 font-rajdhani text-cyan-400/60">Seed:</span>
                <input
                  type="number"
                  value={fieldSeed}
                  min={0}
                  max={9999}
                  onChange={(e) => setFieldSeed(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-gray-800/50 border border-gray-600/30 rounded px-2 py-0.5 font-mono text-cyan-400"
                />
              </div>

              {/* Drift Toggle */}
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-24 font-rajdhani text-cyan-400/60">Drift:</span>
                <button
                  onClick={() => setDriftEnabled(!driftEnabled)}
                  className={`flex-1 ${buttonClass} ${driftEnabled ? activeButton : inactiveButton}`}
                >
                  {driftEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Growth Toggle + Speed */}
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-24 font-rajdhani text-cyan-400/60">Growth:</span>
                <button
                  onClick={() => setGrowthEnabled(!growthEnabled)}
                  className={`${buttonClass} ${growthEnabled ? activeButton : inactiveButton}`}
                >
                  {growthEnabled ? 'ON' : 'OFF'}
                </button>
                {growthEnabled && (
                  <div className="flex gap-1">
                    {[1, 5, 20].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setGrowthSpeed(speed)}
                        className={`${buttonClass} ${growthSpeed === speed ? activeButton : inactiveButton}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rock Count Override */}
              <div className="space-y-1">
                <label className="text-xs text-cyan-400">
                  Rock Count {rockCountOverride !== null && `(${rockCountOverride})`}
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={rockCountOverride ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setRockCountOverride(val === 0 ? null : val);
                  }}
                  className="w-full"
                />
                {rockCountOverride !== null && (
                  <button
                    onClick={() => setRockCountOverride(null)}
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    Reset to auto (amount-based)
                  </button>
                )}
              </div>

              {/* Trigger Cascade Button */}
              <button
                onClick={() => {
                  console.log('Trigger cascade: Destroy rocks manually to trigger cascade');
                }}
                className={`w-full mt-2 ${buttonClass} border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30`}
              >
                Trigger Cascade (destroy rocks manually)
              </button>

              {/* Destroyed Count Display */}
              <div className="text-xs text-cyan-400 border-t border-cyan-900/30 pt-2 mt-2">
                <div>Destroyed: 0 / (varies by field size)</div>
                <div className="text-cyan-600 text-[10px] mt-1">
                  (Destroy threshold rocks to trigger cascade)
                </div>
              </div>

              {/* Regenerate */}
              <button
                onClick={() => setFieldKey((k) => k + 1)}
                className={`w-full mt-2 ${buttonClass} border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20`}
              >
                Regenerate Field
              </button>
            </>
          )}
        </>
      }
    >
      {({ size, color, position }) => (
        <>
          {viewMode === 'single' && (
            <Asteroid
              position={position}
              size={size}
              color={color}
              seed={seed}
              angularVelocity={angularVelocity}
              hp={hpFromPreset(hpPreset).hp}
              maxHp={hpFromPreset(hpPreset).maxHp}
              onHit={() => setHpPreset((prev) => {
                if (prev === 'full') return 'damaged';
                if (prev === 'damaged') return 'critical';
                return 'destroyed';
              })}
            />
          )}
          {viewMode === 'field' && (
            <AsteroidField
              key={`field-${fieldKey}-${fieldSeed}-${amount}`}
              position={position}
              size={size}
              color={color}
              amount={amount}
              seed={fieldSeed}
              createdAt={growthStartTime}
              driftEnabled={driftEnabled}
              onHover={() => {}}
              onDeflect={() => {
                console.log('Field cascade complete — threat deflected');
              }}
            />
          )}
        </>
      )}
    </DevThreatLayout>
  );
}
