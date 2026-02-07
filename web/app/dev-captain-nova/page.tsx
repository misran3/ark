'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress, Html } from '@react-three/drei';
import CaptainNova, {
  type CaptainNovaHandle,
  type AnimationConfig,
} from '@/components/three/captain-nova';
import { NovaVariantDropdown, type NovaVariant } from '@/components/ui/NovaVariantDropdown';
import { HARDCODED_VARIANTS } from '@/lib/nova-variants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const defaultAnimConfig: AnimationConfig = {
  breathing: { enabled: true, cycleDuration: 4, scaleAmount: 0.015 },
  headTracking: {
    enabled: true,
    maxRotationY: 0.15,
    maxRotationX: 0.1,
    lerpSpeed: 0.05,
  },
  idleSway: { enabled: true, speed: 0.3, amount: 0.02 },
};

function LoadingIndicator() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-cyan-400 font-orbitron text-sm tracking-wider text-center">
        <div className="mb-2">LOADING MODEL</div>
        <div className="w-48 h-1 bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-cyan-400/60">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

function GLBModel({ path, scale, rotationY }: { path: string; scale: number; rotationY: number }) {
  const { scene } = useGLTF(path);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -box.min.y, -center.z);
    return clone;
  }, [scene]);

  return (
    <group scale={scale} rotation-y={rotationY}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function DevCaptainNovaPage() {
  const router = useRouter();
  const novaRef = useRef<CaptainNovaHandle>(null);

  const [variants] = useState<NovaVariant[]>(HARDCODED_VARIANTS);

  const [activeVariant, setActiveVariant] = useState<NovaVariant>(variants[0]);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [modelScale, setModelScale] = useState(1);
  const [modelRotationY, setModelRotationY] = useState(0);
  const [animConfig, setAnimConfig] =
    useState<AnimationConfig>(defaultAnimConfig);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/dev');
      // Quick switch: 1/2/3/4 keys
      if (e.key === '1' && variants[0]) setActiveVariant(variants[0]);
      if (e.key === '2' && variants[1]) setActiveVariant(variants[1]);
      if (e.key === '3' && variants[2]) setActiveVariant(variants[2]);
      if (e.key === '4' && variants[3]) setActiveVariant(variants[3]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, variants]);

  const toggleAnim = (key: keyof AnimationConfig) => {
    setAnimConfig((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), enabled: !(prev[key] as { enabled?: boolean })?.enabled },
    }));
  };

  const isGLB = activeVariant.type === 'community';

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/dev"
              className="inline-block font-rajdhani text-2xl px-9 py-4.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              &larr; Dev Hub
            </Link>
            <h1 className="font-orbitron text-xl text-cyan-400 tracking-wider mt-2">
              DEV: Captain Nova v3.0
            </h1>
            <p className="font-rajdhani text-xs text-cyan-400/60 mt-1">
              Model variant selector &middot; Press 1/2/3/4 to quick-switch
            </p>
          </div>
        </div>

        {/* Variant Switcher Dropdown */}
        <div className="mt-3">
          <div className="font-rajdhani text-xs text-cyan-400/60 mb-1">
            Captain Nova Variant (or 1/2/3/4 keys)
          </div>
          <NovaVariantDropdown
            value={activeVariant}
            onChange={setActiveVariant}
            variants={variants}
            className="max-w-sm"
          />
          <p className="font-rajdhani text-xs text-cyan-400/60 mt-1">
            {activeVariant.type === 'skeletal'
              ? 'Built-in primitives with hologram shader'
              : `GLB model: ${activeVariant.path?.split('/').pop()}`
            }
          </p>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 2, 8],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />

        <gridHelper args={[20, 20, '#333333', '#111111']} />

        <Suspense fallback={<LoadingIndicator />}>
          <group position={position}>
            {activeVariant.type === 'skeletal' && (
              <CaptainNova
                ref={novaRef}
                position={[0, 0, 0]}
                animationConfig={animConfig}
              />
            )}
            {activeVariant.type === 'community' && activeVariant.path && (
              <GLBModel
                path={activeVariant.path}
                scale={modelScale}
                rotationY={modelRotationY}
              />
            )}
          </group>
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={30}
        />
      </Canvas>

      {/* Controls Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Nova Controls - only when Nova is active */}
          {activeVariant.type === 'skeletal' && (
            <>
              {/* Gesture Controls */}
              <div>
                <div className="font-rajdhani text-xs text-cyan-400/60 mb-2">
                  Gesture Controls
                </div>
                <div className="flex gap-2">
                  {(['point', 'salute', 'at-ease'] as const).map((gesture) => (
                    <button
                      key={gesture}
                      onClick={() => novaRef.current?.playGesture(gesture)}
                      className="px-4 py-2 rounded border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 font-orbitron text-xs tracking-wider hover:bg-cyan-500/30 transition-colors"
                    >
                      {gesture.charAt(0).toUpperCase() + gesture.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Toggles */}
              <div>
                <div className="font-rajdhani text-xs text-cyan-400/60 mb-2">
                  Animation Controls
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['breathing', 'Breathing'],
                      ['headTracking', 'Head Track'],
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
            </>
          )}

          {/* GLB Model Controls */}
          {isGLB && (
            <div>
              <div className="font-rajdhani text-xs text-cyan-400/60 mb-2">
                Model Controls
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <span className="w-20 font-rajdhani text-cyan-400/60">Scale:</span>
                  <input
                    type="range"
                    min="0.01"
                    max="5"
                    step="0.01"
                    value={modelScale}
                    onChange={(e) => setModelScale(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-mono">{modelScale.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <span className="w-20 font-rajdhani text-cyan-400/60">Rotate Y:</span>
                  <input
                    type="range"
                    min={-Math.PI}
                    max={Math.PI}
                    step="0.01"
                    value={modelRotationY}
                    onChange={(e) => setModelRotationY(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-mono">{(modelRotationY * (180 / Math.PI)).toFixed(0)}&deg;</span>
                </div>
                <button
                  onClick={() => { setModelScale(1); setModelRotationY(0); }}
                  className="w-full px-3 py-1.5 mt-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-xs tracking-wider hover:bg-cyan-500/20 transition-colors"
                >
                  Reset Scale &amp; Rotation
                </button>
              </div>
            </div>
          )}

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
