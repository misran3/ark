'use client';

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Group, Color, ShaderMaterial, AdditiveBlending, DoubleSide } from 'three';
import { useConsoleStore } from '@/lib/stores/console-store';
import { getSystemColor, getSystemCSSColor, getSystemCSSGlow } from '@/lib/hologram/colors';
import { HologramParticles } from '@/components/bridge/hologram/HologramParticles';
import { ScanPulse } from '@/components/bridge/hologram/ScanPulse';
import { StationNode, type StationConfig, type StationType } from './StationNode';
import { RouteBeam } from './RouteBeam';
import { DispatchPod } from './DispatchPod';

/** Returns 0-1 for a layer that starts appearing at `start` and is fully visible at `start + span` */
function layerAlpha(progress: number, start: number, span: number): number {
  if (progress <= start) return 0;
  if (progress >= start + span) return 1;
  return (progress - start) / span;
}

// ─── Station Definitions ───────────────────────────────────────────────

const ALL_STATIONS: StationConfig[] = [
  // Initial 4 (always present)
  { type: 'fuel-depot',        label: 'FUEL DEPOT',     position: [-1.2, 0.8, -0.3],  amount: 2400, isIncome: false },
  { type: 'cargo-bay',         label: 'CARGO BAY',      position: [1.0, 0.4, 0.2],    amount: 8500, isIncome: true },
  { type: 'docking-authority', label: 'DOCK AUTH',       position: [-0.6, -0.5, 0.1],  amount: 350,  isIncome: false },
  { type: 'trade-exchange',    label: 'TRADE EXCHANGE',  position: [0.8, -0.8, -0.2],  amount: 12000, isIncome: true },
  // Dynamic spawns (appear over time)
  { type: 'cantina',           label: 'CANTINA',         position: [-1.4, -0.3, 0.3],  amount: 180,  isIncome: false },
  { type: 'armory',            label: 'ARMORY',          position: [1.4, 0.9, -0.1],   amount: 4200, isIncome: false },
  { type: 'med-bay',           label: 'MED BAY',         position: [-0.3, 1.2, 0.2],   amount: 950,  isIncome: false },
  { type: 'comm-relay',        label: 'COMM RELAY',      position: [0.4, -1.1, -0.3],  amount: 620,  isIncome: false },
  { type: 'salvage-yard',      label: 'SALVAGE YARD',    position: [-1.0, 0.0, -0.4],  amount: 5800, isIncome: true },
  { type: 'black-market',      label: 'BLACK MARKET',    position: [1.3, -0.2, 0.4],   amount: 15000, isIncome: true },
];

const INITIAL_STATION_COUNT = 4;
const MAX_STATIONS = 10;
const DISPATCH_INTERVAL = 30; // seconds
const DISPATCH_TRAVEL_DURATION = 4; // seconds for pod to travel
const EMBLEM_POS: [number, number, number] = [0, 0, 0];

// ─── Dispatch State Machine ────────────────────────────────────────────

type DispatchPhase = 'idle' | 'origin-flash' | 'route-energize' | 'pod-travel' | 'arrival-pulse' | 'cooldown';

interface DispatchState {
  phase: DispatchPhase;
  stationIndex: number;
  phaseTimer: number;
  podProgress: number;
}

// ─── Central Emblem ────────────────────────────────────────────────────

const emblemVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const emblemFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulse;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    float rim = pow(1.0 - abs(dot(vViewDir, vNormal)), 2.5);

    // Pulse on arrival
    float pulse = 1.0 + uPulse * 0.5 * sin(uTime * 8.0);

    // Gentle breathing
    float breathe = sin(uTime * 1.5) * 0.05 + 0.95;

    vec3 color = uColor * (1.0 + rim * 1.5) * breathe * pulse;
    float alpha = (0.5 + rim * 0.5) * breathe;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function StarChart() {
  const health = useConsoleStore((s) => s.panelHealth.transactions);
  const revealProgress = useConsoleStore((s) => s.revealProgress);

  const systemColor = useMemo(() => getSystemColor('transactions', health).clone(), [health]);
  const cssColor = getSystemCSSColor('transactions', health);
  const cssGlow = getSystemCSSGlow('transactions', health, 0.3);

  // ─── Dynamic station spawning ──────────────────────────────────────
  const [activeStationCount, setActiveStationCount] = useState(INITIAL_STATION_COUNT);
  const stationMaterializeRef = useRef<number[]>(
    ALL_STATIONS.map((_, i) => (i < INITIAL_STATION_COUNT ? 1 : 0))
  );

  // ─── Dispatch state ───────────────────────────────────────────────
  const dispatchRef = useRef<DispatchState>({
    phase: 'idle',
    stationIndex: 0,
    phaseTimer: 0,
    podProgress: 0,
  });
  const [dispatchRender, setDispatchRender] = useState<DispatchState>({
    phase: 'idle',
    stationIndex: 0,
    phaseTimer: 0,
    podProgress: 0,
  });
  const lastDispatchTimeRef = useRef(0);
  const dispatchCountRef = useRef(0);

  // ─── Credit counter ───────────────────────────────────────────────
  const [creditTotal, setCreditTotal] = useState(1247830);
  const [creditFlash, setCreditFlash] = useState(false);

  // ─── Emblem material ──────────────────────────────────────────────
  const emblemMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: emblemVertexShader,
      fragmentShader: emblemFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: systemColor },
        uPulse: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
  }, [systemColor]);

  // ─── Origin flash state ───────────────────────────────────────────
  const [flashStationIndex, setFlashStationIndex] = useState<number | null>(null);

  // ─── Dispatch trigger ─────────────────────────────────────────────
  const triggerDispatch = useCallback(() => {
    const d = dispatchRef.current;
    // Pick a random active station
    const stationIdx = Math.floor(Math.random() * activeStationCount);
    d.phase = 'origin-flash';
    d.stationIndex = stationIdx;
    d.phaseTimer = 0;
    d.podProgress = 0;
    setFlashStationIndex(stationIdx);
    dispatchCountRef.current++;

    // Maybe spawn a new station
    if (activeStationCount < MAX_STATIONS && dispatchCountRef.current % 2 === 0) {
      setActiveStationCount((c) => Math.min(c + 1, MAX_STATIONS));
    }
  }, [activeStationCount]);

  // ─── Main animation loop ──────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    const d = dispatchRef.current;

    // Update emblem material
    emblemMaterial.uniforms.uTime.value = elapsed;

    // Materialize new stations (smooth lerp to 1)
    for (let i = 0; i < ALL_STATIONS.length; i++) {
      const target = i < activeStationCount ? 1 : 0;
      stationMaterializeRef.current[i] +=
        (target - stationMaterializeRef.current[i]) * delta * 2;
    }

    // ─── Dispatch timer ─────────────────────────────────────────
    if (d.phase === 'idle' && revealProgress > 0.9) {
      if (lastDispatchTimeRef.current === 0) {
        // First dispatch shortly after reveal
        lastDispatchTimeRef.current = elapsed - DISPATCH_INTERVAL + 3;
      }
      if (elapsed - lastDispatchTimeRef.current >= DISPATCH_INTERVAL) {
        lastDispatchTimeRef.current = elapsed;
        triggerDispatch();
      }
    }

    // ─── Dispatch state machine ─────────────────────────────────
    if (d.phase !== 'idle') {
      d.phaseTimer += delta;

      switch (d.phase) {
        case 'origin-flash':
          // Flash for 0.6s, then energize route
          if (d.phaseTimer >= 0.6) {
            d.phase = 'route-energize';
            d.phaseTimer = 0;
            setFlashStationIndex(null);
          }
          break;

        case 'route-energize':
          // Route lights up for 0.4s before pod launches
          if (d.phaseTimer >= 0.4) {
            d.phase = 'pod-travel';
            d.phaseTimer = 0;
            d.podProgress = 0;
          }
          break;

        case 'pod-travel':
          // Pod travels from station to emblem (or vice versa)
          d.podProgress = Math.min(1, d.phaseTimer / DISPATCH_TRAVEL_DURATION);
          if (d.podProgress >= 1) {
            d.phase = 'arrival-pulse';
            d.phaseTimer = 0;

            // Update credits
            const station = ALL_STATIONS[d.stationIndex];
            const delta = station.isIncome ? station.amount : -station.amount;
            setCreditTotal((c) => c + delta);
            setCreditFlash(true);
            setTimeout(() => setCreditFlash(false), 600);

            // Emblem pulse
            emblemMaterial.uniforms.uPulse.value = 1;
          }
          break;

        case 'arrival-pulse':
          // Emblem pulses for 1s
          emblemMaterial.uniforms.uPulse.value = Math.max(0, 1 - d.phaseTimer);
          if (d.phaseTimer >= 1.0) {
            d.phase = 'cooldown';
            d.phaseTimer = 0;
            emblemMaterial.uniforms.uPulse.value = 0;
          }
          break;

        case 'cooldown':
          if (d.phaseTimer >= 0.5) {
            d.phase = 'idle';
            d.phaseTimer = 0;
          }
          break;
      }

      // Sync render state (throttled)
      setDispatchRender({ ...d });
    }
  });

  // ─── Compute which routes are energized ────────────────────────────
  const isRouteEnergized = (stationIndex: number): number => {
    const d = dispatchRender;
    if (d.stationIndex !== stationIndex) return 0;
    if (d.phase === 'route-energize') return Math.min(1, d.phaseTimer / 0.3);
    if (d.phase === 'pod-travel') return 1;
    if (d.phase === 'arrival-pulse') return Math.max(0, 1 - d.phaseTimer * 2);
    return 0;
  };

  // ─── Pod direction: income goes station→emblem, expense goes emblem→station
  const activeStation = ALL_STATIONS[dispatchRender.stationIndex];
  const podFrom = activeStation?.isIncome ? activeStation.position : EMBLEM_POS;
  const podTo = activeStation?.isIncome ? EMBLEM_POS : activeStation?.position ?? EMBLEM_POS;

  return (
    <group scale={0.55}>
      {/* ─── Central Emblem (0% - 25%) ─────────────────────────── */}
      <group scale={0.3 + layerAlpha(revealProgress, 0, 0.25) * 0.7}>
        {/* Ship silhouette: hexagonal prism */}
        <mesh material={emblemMaterial} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 6]} />
        </mesh>
        {/* Inner diamond accent */}
        <mesh material={emblemMaterial} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 4]} />
        </mesh>
      </group>

      {/* ─── Station Nodes (staggered 10% - 70%) ──────────────── */}
      {ALL_STATIONS.map((station, i) => {
        const staggerStart = 0.1 + (i / MAX_STATIONS) * 0.4;
        const revealAlpha = layerAlpha(revealProgress, staggerStart, 0.25);
        // For initial stations: use reveal progress. For dynamic: use materialize ref
        const materialize = i < INITIAL_STATION_COUNT
          ? revealAlpha
          : stationMaterializeRef.current[i] ?? 0;

        return (
          <StationNode
            key={station.type}
            config={station}
            color={systemColor}
            materializeProgress={materialize}
          />
        );
      })}

      {/* ─── Route Beams ───────────────────────────────────────── */}
      {ALL_STATIONS.map((station, i) => (
        <RouteBeam
          key={`route-${station.type}`}
          from={station.position}
          to={EMBLEM_POS}
          color={systemColor}
          energize={isRouteEnergized(i)}
          visible={
            (i < INITIAL_STATION_COUNT
              ? layerAlpha(revealProgress, 0.2 + (i / MAX_STATIONS) * 0.3, 0.2) > 0
              : (stationMaterializeRef.current[i] ?? 0) > 0.3)
          }
        />
      ))}

      {/* ─── Dispatch Pod ──────────────────────────────────────── */}
      {dispatchRender.phase === 'pod-travel' && activeStation && (
        <DispatchPod
          from={podFrom as [number, number, number]}
          to={podTo as [number, number, number]}
          color={systemColor}
          progress={dispatchRender.podProgress}
          isIncome={activeStation.isIncome}
        />
      )}

      {/* ─── Origin flash (expanding ring at station) ──────────── */}
      {flashStationIndex !== null && (
        <group position={ALL_STATIONS[flashStationIndex].position}>
          <ScanPulse color={systemColor} interval={0.6} maxRadius={0.3} speed={1} />
        </group>
      )}

      {/* ─── Ambient Particles (50%+) ──────────────────────────── */}
      {revealProgress > 0.5 && (
        <HologramParticles count={50} color={systemColor} spread={[2.5, 2, 0.6]} />
      )}

      {/* ─── Scan pulse background (60%+) ──────────────────────── */}
      {revealProgress > 0.6 && (
        <ScanPulse color={systemColor} interval={6} maxRadius={2.5} />
      )}

      {/* ─── Title + Credit Display (15%+) ─────────────────────── */}
      {revealProgress > 0.15 && (
        <group position={[0, 2.8, 0]}>
          <Text
            fontSize={0.12}
            letterSpacing={0.3}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3) * 0.7}
            outlineWidth="5%"
            outlineColor={systemColor}
            outlineOpacity={0.3}
            position={[0, 0.35, 0]}
          >
            TRADE ROUTES
          </Text>

          {/* Credit total via Html overlay for SlotNumber-style display */}
          <Html center position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
            <div
              className="text-center font-mono"
              style={{
                color: cssColor,
                textShadow: `0 0 12px ${cssGlow}`,
                opacity: layerAlpha(revealProgress, 0.15, 0.3),
              }}
            >
              <div
                className="text-2xl font-bold transition-all duration-200"
                style={{
                  transform: creditFlash ? 'scale(1.15)' : 'scale(1)',
                  filter: creditFlash ? `brightness(1.5) drop-shadow(0 0 8px ${cssColor})` : 'none',
                }}
              >
                ₡ {creditTotal.toLocaleString()}
              </div>
            </div>
          </Html>

          <Text
            fontSize={0.08}
            letterSpacing={0.1}
            color={systemColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={layerAlpha(revealProgress, 0.15, 0.3) * 0.5}
            position={[0, -0.25, 0]}
          >
            {`${activeStationCount} STATIONS ONLINE`}
          </Text>
        </group>
      )}

      {/* ─── Dispatch status text ──────────────────────────────── */}
      {dispatchRender.phase !== 'idle' && dispatchRender.phase !== 'cooldown' && revealProgress > 0.9 && (
        <Text
          fontSize={0.07}
          letterSpacing={0.15}
          color={systemColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.6}
          position={[0, -2.2, 0.1]}
        >
          {dispatchRender.phase === 'origin-flash'
            ? `DISPATCH FROM ${ALL_STATIONS[dispatchRender.stationIndex].label}`
            : dispatchRender.phase === 'route-energize'
              ? 'ROUTE LOCK ACQUIRED'
              : dispatchRender.phase === 'pod-travel'
                ? `${activeStation?.isIncome ? 'INCOMING' : 'OUTGOING'} ₡${activeStation?.amount.toLocaleString()}`
                : `TRANSFER COMPLETE`}
        </Text>
      )}
    </group>
  );
}
