'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';

interface Transaction {
  merchant: string;
  amount: number;
  icon: string;
}

interface TransactionDrum3DProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  '🚀': '#3b82f6',
  '🌜': '#f59e0b',
  '💰': '#22c55e',
  '🎮': '#a855f7',
  '🛒': '#ec4899',
  '☕': '#f97316',
};

/**
 * Creates a canvas texture with transaction text for the drum surface.
 */
function createDrumTexture(transactions: Transaction[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = 512 * dpr;
  canvas.height = 256 * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Dark background
  ctx.fillStyle = '#060a16';
  ctx.fillRect(0, 0, 512, 256);

  const slotHeight = 256 / Math.max(transactions.length, 5);

  transactions.forEach((tx, i) => {
    const y = i * slotHeight + slotHeight / 2;

    // Separator line
    if (i > 0) {
      ctx.strokeStyle = 'rgba(74, 101, 128, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(20, i * slotHeight);
      ctx.lineTo(492, i * slotHeight);
      ctx.stroke();
    }

    // Icon background lamp
    ctx.fillStyle = 'rgba(20, 28, 40, 0.8)';
    ctx.beginPath();
    ctx.roundRect(15, y - 12, 24, 24, 3);
    ctx.fill();

    // Icon
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tx.icon, 27, y + 1);

    // Merchant name
    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.fillText(tx.merchant, 50, y);

    // Amount
    ctx.textAlign = 'right';
    ctx.fillStyle = tx.amount > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.7)';
    const amountStr = tx.amount > 0 ? `+$${tx.amount}` : `-$${Math.abs(tx.amount)}`;
    ctx.fillText(amountStr, 495, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/** Static fade mask — created once, reused across all instances */
const fadeMaskCanvas = (() => {
  if (typeof document === 'undefined') return null; // SSR guard
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(6, 10, 22, 1)');
  g.addColorStop(0.3, 'rgba(6, 10, 22, 0)');
  g.addColorStop(0.7, 'rgba(6, 10, 22, 0)');
  g.addColorStop(1, 'rgba(6, 10, 22, 1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 64);
  return c;
})();

function DrumScene({ transactions }: TransactionDrum3DProps) {
  const drumRef = useRef<Group>(null);
  const targetRotRef = useRef(0);
  const currentRotRef = useRef(0);
  const velocityRef = useRef(0);

  const drumTexture = useMemo(() => createDrumTexture(transactions), [transactions]);

  // Dispose GPU texture on unmount or when transactions change
  useEffect(() => {
    return () => {
      drumTexture.dispose();
    };
  }, [drumTexture]);

  useFrame((_, delta) => {
    if (!drumRef.current) return;
    const dt = Math.min(delta, 0.05);

    // Spring towards target
    const displacement = targetRotRef.current - currentRotRef.current;
    const springForce = displacement * 60;
    const dampForce = -velocityRef.current * 9;
    velocityRef.current += (springForce + dampForce) * dt;
    currentRotRef.current += velocityRef.current * dt;

    drumRef.current.rotation.x = currentRotRef.current;
  });

  return (
    <group>
      {/* Drum cylinder */}
      <group ref={drumRef}>
        <mesh rotation={[0, Math.PI, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 1.6, 24, 1, true]} />
          <meshBasicMaterial map={drumTexture} side={THREE.DoubleSide} transparent />
        </mesh>
      </group>

      {/* Center highlight band (most recent transaction) */}
      <mesh position={[0, 0, 0.61]}>
        <planeGeometry args={[1.7, 0.22]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.03} depthWrite={false} />
      </mesh>

      {/* Top/bottom fade masks */}
      <mesh position={[0, 0, 0.62]}>
        <planeGeometry args={[1.7, 1.2]} />
        <meshBasicMaterial transparent opacity={0.5} depthWrite={false}>
          {fadeMaskCanvas && (
            <canvasTexture attach="map" image={fadeMaskCanvas} />
          )}
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}

export function TransactionDrum3D({ transactions }: TransactionDrum3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 1.8], fov: 35 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="always"
      resize={{ offsetSize: true }}
    >
      <DrumScene transactions={transactions} />
    </Canvas>
  );
}
