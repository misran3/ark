'use client';

import React, { Suspense, useState, useEffect, useMemo, useRef, memo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAlertStore, ALERT_COLORS } from '@/lib/stores/alert-store';
import { useNovaDialogueStore } from '@/lib/stores/nova-dialogue-store';
import { useBootStore } from '@/lib/stores/boot-store';
import { useBootActivation } from '@/hooks/useBootActivation';
import { useNovaVariant } from '@/contexts/NovaVariantContext';
import CaptainNova from '@/components/three/captain-nova';
import { NovaVariantSelector } from './NovaVariantSelector';

type NovaState = 'idle' | 'analyzing' | 'ready' | 'alert';

const IDLE_MESSAGES = [
  'Standing by',
  'Monitoring subsystems',
  'Passive scan active',
  'Awaiting input',
  'Systems nominal',
];

const STATE_BORDER_COLORS: Record<NovaState, string> = {
  idle: 'rgba(0, 200, 255, 0.4)',
  analyzing: 'rgba(251, 191, 36, 0.5)',
  ready: 'rgba(34, 197, 94, 0.5)',
  alert: 'rgba(239, 68, 68, 0.6)',
};

// ---- Isolated timer sub-components (prevent Canvas re-renders) ----

/** Boot text typewriter — runs at 40ms, isolates re-renders from parent */
const BootTextDisplay = memo(function BootTextDisplay({ onComplete }: { onComplete: () => void }) {
  const [bootText, setBootText] = useState('');

  useEffect(() => {
    const bootMsg = 'INITIALIZING ADVISORY SYSTEMS...';
    let i = 0;
    const typeTimer = setInterval(() => {
      if (i <= bootMsg.length) {
        setBootText(bootMsg.slice(0, i));
        i++;
      } else {
        clearInterval(typeTimer);
        setTimeout(onComplete, 600);
      }
    }, 40);
    return () => clearInterval(typeTimer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="font-mono text-[8px] text-cyan-400/60 px-3 text-center">
        {bootText}
        <span className="animate-pulse-slow">_</span>
      </div>
    </div>
  );
});

/** Mission time clock — ticks every 1s, isolated from Canvas */
const MissionTimeClock = memo(function MissionTimeClock() {
  const [missionTime, setMissionTime] = useState('00:00:00');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setMissionTime(d.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[6px] text-cyan-400/20">
      {missionTime}
    </div>
  );
});

/** Cycling idle status — ticks every 8s, isolated from Canvas */
const IdleStatusDisplay = memo(function IdleStatusDisplay({ active }: { active: boolean }) {
  const [statusMsg, setStatusMsg] = useState(IDLE_MESSAGES[0]);
  const [prevStatus, setPrevStatus] = useState('');

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setStatusMsg((prev) => {
        setPrevStatus(prev);
        const idx = IDLE_MESSAGES.indexOf(prev);
        return IDLE_MESSAGES[(idx + 1) % IDLE_MESSAGES.length];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <>
      <div className="font-mono text-[8px] text-cyan-300/70">
        {statusMsg}
      </div>
      {prevStatus && (
        <div className="font-mono text-[6px] text-cyan-400/25 truncate">
          Prev: {prevStatus}
        </div>
      )}
    </>
  );
});

/** Renders the demand-mode Canvas at ~10fps instead of 60fps */
function ThrottledInvalidator() {
  const { invalidate } = useThree();
  const rafRef = useRef(0);

  useEffect(() => {
    let lastTime = 0;
    const interval = 100; // ~10fps
    const loop = (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (time - lastTime >= interval) {
        lastTime = time;
        invalidate();
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [invalidate]);

  return null;
}

function GLBModel({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim; // normalize to ~2 units tall
    // Center model at origin (not feet-on-ground)
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    clone.scale.setScalar(scale);
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

function NovaInlineRenderer() {
  const { activeVariant } = useNovaVariant();

  if (activeVariant.type === 'skeletal') {
    return <CaptainNova position={[0, -0.5, 0]} />;
  }

  if (activeVariant.type === 'community' && activeVariant.path) {
    return (
      <Suspense fallback={null}>
        <GLBModel path={activeVariant.path} />
      </Suspense>
    );
  }

  return null;
}

export function CaptainNovaStation() {
  const alertLevel = useAlertStore((state) => state.level);
  const dialogueState = useNovaDialogueStore((s) => s.state);
  const consoleIntensity = useBootStore((s) => s.consoleIntensity);
  const novaState: NovaState = dialogueState === 'speaking' ? 'analyzing' : 'idle';
  const [isBooted, setIsBooted] = useState(false);
  const borderColor = STATE_BORDER_COLORS[novaState];
  const colors = ALERT_COLORS[alertLevel];

  // Nova station activates during power-surge (after consoles)
  const stationActive = useBootActivation('power-surge', 400);

  // Stable callback for boot completion
  const handleBootComplete = React.useCallback(() => setIsBooted(true), []);

  return (
    <div className="h-full flex flex-col">
      {/* Station label */}
      <div className="hull-stencil text-center py-1.5" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.1)' }}>
        STN-R1: ADVISORY
      </div>

      {/* Station screen (CRT treatment) */}
      <div className="flex-1 mx-2 mb-2 console-well relative overflow-hidden">
        {/* Screen status border */}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{ border: `1px solid ${borderColor}`, transition: 'border-color 0.5s' }}
        />

        {/* CRT scanlines */}
        <div className="absolute inset-0 crt-screen pointer-events-none" />

        {/* Barrel distortion */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)' }}
        />

        {/* Signal strength dots — light up sequentially after boot */}
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[3px] h-[3px] rounded-full"
              style={{
                background: isBooted
                  ? 'rgba(34, 197, 94, 0.6)'
                  : stationActive
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                transition: `background 0.3s ease-out ${i * 150}ms`,
              }}
            />
          ))}
        </div>

        {!stationActive ? (
          /* Pre-activation: dark screen with interference */
          <div className="flex items-center justify-center h-full">
            <div
              className="absolute inset-0"
              style={{
                background: consoleIntensity > 0
                  ? 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,255,255,0.02) 2px, transparent 4px)'
                  : undefined,
                animation: consoleIntensity > 0 ? 'crt-static-burst 2s ease-in-out infinite' : undefined,
                opacity: 0.3,
              }}
            />
          </div>
        ) : !isBooted ? (
          /* Boot text crawl — isolated: 40ms timer won't re-render parent */
          <BootTextDisplay onComplete={handleBootComplete} />
        ) : (
          /* Booted content */
          <div className="flex flex-col items-center h-full pt-3 px-2">
            {/* 3D Captain Nova viewport */}
            <div className="relative flex-1 w-full min-h-0">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${borderColor} 0%, transparent 70%)`,
                  opacity: 0.15,
                }}
              />
              <Canvas
                camera={{ position: [0, 0, 3], fov: 45 }}
                gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
                style={{ background: 'transparent' }}
                frameloop="demand"
              >
                <ThrottledInvalidator />
                <ambientLight intensity={0.4} />
                <pointLight position={[2, 3, 3]} intensity={0.6} color="#06b6d4" />
                <pointLight position={[-2, -1, 2]} intensity={0.3} color="#8b5cf6" />
                <NovaInlineRenderer />
              </Canvas>
            </div>

            {/* Status area — all timer-driven, isolated from Canvas re-renders */}
            <div className="text-center flex flex-col justify-center gap-1 w-full py-1">
              {novaState === 'analyzing' ? (
                <div className="font-mono text-[8px] text-amber-300/70">
                  Transmitting...
                </div>
              ) : (
                <IdleStatusDisplay active={isBooted && novaState === 'idle'} />
              )}
              <MissionTimeClock />
            </div>

            {/* COMM button */}
            <button className="mb-2 px-3 py-1 rounded border border-cyan-500/25 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors flex items-center gap-1.5 pointer-events-auto">
              <svg width="8" height="8" viewBox="0 0 8 8" className="text-cyan-400/50">
                <path d="M4 0 L4 3 M2 2 L4 0 L6 2 M1 4 L7 4 M1 4 L1 7 L7 7 L7 4" stroke="currentColor" strokeWidth="0.8" fill="none" />
              </svg>
              <span className="font-mono text-[7px] text-cyan-400/50 uppercase">Comm</span>
              <span className="font-mono text-[5px] text-cyan-400/20">CH-01</span>
            </button>

            {/* Variant Selector */}
            <div className="w-full px-1 mb-2 pointer-events-auto">
              <NovaVariantSelector />
            </div>
          </div>
        )}

        {/* Cooling vent at bottom */}
        <div className="absolute bottom-0 left-2 right-2 h-[6px] vent-grille" />
      </div>

      {/* Manual disconnect toggle (decorative) */}
      <div className="flex items-center justify-center gap-1 pb-1">
        <div className="w-2 h-1 rounded-sm bg-white/[0.04] border border-white/[0.06]" />
        <div className="hull-stencil" style={{ fontSize: '5px', color: 'rgba(255,255,255,0.06)' }}>
          ADV SYS
        </div>
      </div>

      {/* Dedicated power conduit (from shared bus) */}
      <div
        className="absolute left-0 top-[70%] bottom-0 w-[2px]"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0, 240, 255, 0.08))',
          animation: 'conduit-pulse 4s ease-in-out infinite 1s',
        }}
      />
    </div>
  );
}
