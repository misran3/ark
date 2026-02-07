'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CaptainNova, {
  type NovaAnimationConfig,
} from '@/components/three/captain-nova';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const defaultAnimConfig: NovaAnimationConfig = {
  breathing: { enabled: true, cycleDuration: 4, scaleAmount: 0.02 },
  weightShift: {
    enabled: true,
    minInterval: 8,
    maxInterval: 16,
    rotationAmount: 0.05,
  },
  headTracking: {
    enabled: true,
    maxRotationY: 0.15,
    maxRotationX: 0.1,
    lerpSpeed: 0.05,
  },
  glitch: { enabled: true, frequency: 0.002, intensity: 0.5, cooldownMs: 100 },
  idleSway: { enabled: true, speed: 0.3, amount: 0.03 },
};

export default function DevCaptainNovaPage() {
  const router = useRouter();
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [animConfig, setAnimConfig] =
    useState<NovaAnimationConfig>(defaultAnimConfig);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/dev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const toggleAnim = (key: keyof NovaAnimationConfig) => {
    setAnimConfig((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), enabled: !(prev[key] as { enabled?: boolean })?.enabled },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Link
          href="/dev"
          className="inline-block font-rajdhani text-2xl px-9 py-4.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          &larr; Dev Hub
        </Link>
        <h1 className="font-orbitron text-xl text-cyan-400 tracking-wider mt-2">
          DEV: Captain Nova
        </h1>
        <p className="font-rajdhani text-xs text-cyan-400/60 mt-1">
          Isolated character testing environment
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />

        <gridHelper args={[20, 20, '#333333', '#111111']} />

        <CaptainNova position={position} animationConfig={animConfig} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={20}
        />
      </Canvas>

      {/* Controls Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Animation Toggles */}
          <div>
            <div className="font-rajdhani text-xs text-cyan-400/60 mb-2">
              Animation Controls
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['breathing', 'Breathing'],
                  ['weightShift', 'Weight Shift'],
                  ['headTracking', 'Head Track'],
                  ['glitch', 'Glitch'],
                  ['idleSway', 'Idle Sway'],
                ] as const
              ).map(([key, label]) => {
                const enabled = (
                  animConfig[key] as { enabled?: boolean } | undefined
                )?.enabled;
                return (
                  <button
                    key={key}
                    onClick={() => toggleAnim(key)}
                    className={`px-3 py-1.5 rounded border text-xs font-orbitron tracking-wider transition-colors ${
                      enabled
                        ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
                        : 'border-gray-600/30 bg-gray-800/30 text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Glitch Intensity */}
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="w-24 font-rajdhani text-cyan-400/60">
              Glitch Int:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={animConfig.glitch?.intensity ?? 0.5}
              onChange={(e) =>
                setAnimConfig((prev) => ({
                  ...prev,
                  glitch: {
                    ...prev.glitch,
                    intensity: parseFloat(e.target.value),
                  },
                }))
              }
              className="flex-1"
            />
            <span className="w-10 text-right font-mono">
              {(animConfig.glitch?.intensity ?? 0.5).toFixed(2)}
            </span>
          </div>

          {/* Position Controls */}
          <div>
            <div className="font-rajdhani text-xs text-cyan-400/60 mb-2">
              Position Controls
            </div>
            <div className="space-y-1">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis} className="flex items-center gap-2 text-xs text-cyan-400">
                  <span className="w-8">{axis}:</span>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={position[i]}
                    onChange={(e) => {
                      const next: [number, number, number] = [...position];
                      next[i] = parseFloat(e.target.value);
                      setPosition(next);
                    }}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-mono">
                    {position[i].toFixed(1)}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setPosition([0, 0, 0])}
                className="w-full px-3 py-1.5 mt-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-xs tracking-wider hover:bg-cyan-500/20 transition-colors"
              >
                Reset Position
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
