'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

interface ThreatControlState {
  size: number;
  color: string;
  position: [number, number, number];
}

interface DevThreatLayoutProps {
  title: string;
  subtitle: string;
  accentColor: string;
  defaultSize: number;
  defaultColor: string;
  sizeRange?: [number, number];
  cameraZ?: number;
  maxDistance?: number;
  children: (state: ThreatControlState) => ReactNode;
  extraControls?: ReactNode;
}

export default function DevThreatLayout({
  title,
  subtitle,
  accentColor,
  defaultSize,
  defaultColor,
  sizeRange = [0.1, 5],
  cameraZ = 8,
  maxDistance = 20,
  children,
  extraControls,
}: DevThreatLayoutProps) {
  const [size, setSize] = useState(defaultSize);
  const [color, setColor] = useState(defaultColor);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);

  const resetAll = () => {
    setSize(defaultSize);
    setColor(defaultColor);
    setPosition([0, 0, 0]);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Link
          href="/dev"
          className="font-rajdhani text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
        >
          &larr; Dev Hub
        </Link>
        <h1
          className="font-orbitron text-xl tracking-wider mt-1"
          style={{ color: accentColor }}
        >
          {title}
        </h1>
        <p className="font-rajdhani text-xs text-cyan-400/60 mt-1">
          {subtitle} &middot; Click threat to trigger collapse
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 0, cameraZ],
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

        {children({ size, color, position })}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={maxDistance}
        />
      </Canvas>

      {/* Controls Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Size */}
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="w-24 font-rajdhani text-cyan-400/60">Size:</span>
            <input
              type="range"
              min={sizeRange[0]}
              max={sizeRange[1]}
              step="0.1"
              value={size}
              onChange={(e) => setSize(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right font-mono">{size.toFixed(1)}</span>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="w-24 font-rajdhani text-cyan-400/60">Color:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-6 rounded border border-gray-600/30 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 bg-gray-800/50 border border-gray-600/30 rounded px-2 py-0.5 font-mono text-cyan-400"
            />
          </div>

          {/* Position */}
          <div>
            <div className="font-rajdhani text-xs text-cyan-400/60 mb-2">
              Position
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
            </div>
          </div>

          {/* Extra Controls Slot */}
          {extraControls}

          {/* Reset */}
          <button
            onClick={resetAll}
            className="w-full px-3 py-1.5 mt-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-xs tracking-wider hover:bg-cyan-500/20 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
