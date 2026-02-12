'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, PointLight, Vector3 } from 'three';
import { useConsoleStore, type PanelType } from '@/lib/stores/console-store';
import { getSystemColor } from '@/lib/hologram/colors';

/** World-space Y position — centered in visible area above console bar */
const HOLOGRAM_Y = 0.6;
/** World-space Z position (in front of scene, behind canopy struts) */
const HOLOGRAM_Z = 0.8;
/** X offsets per panel — tighter toward center so hologram stays visible */
const PANEL_X_OFFSETS: Record<PanelType, number> = {
  shields: -0.8,
  networth: -0.3,
  transactions: 0.3,
  cards: 0.8,
};

/** Camera rest position */
const CAM_REST = new Vector3(0, 0, 5);
/** Camera drift target (subtle lean forward + up) */
const CAM_DRIFT = new Vector3(0, 0.1, 4.75);

const REVEAL_DURATION = 600; // ms — total iris reveal time
const DISMISS_DURATION = 300; // ms — collapse time (faster out than in)

/** Ease-out cubic: fast start, smooth settle */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface HologramOverlayProps {
  children?: React.ReactNode;
}

export function HologramOverlay({ children }: HologramOverlayProps) {
  const groupRef = useRef<Group>(null);
  const dimPlaneRef = useRef<Mesh>(null);
  const glowLightRef = useRef<PointLight>(null);
  const phaseTimerRef = useRef(0);
  const lastProgressRef = useRef(-1);

  const { expandedPanel, activationPhase, setActivationPhase, panelHealth, setRevealProgress } =
    useConsoleStore();

  const camera = useThree((s) => s.camera);

  // Dim plane material (rendered behind hologram, in front of scene)
  const dimMaterial = useMemo(
    () => new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }),
    []
  );
  const dimGeometry = useMemo(() => new PlaneGeometry(20, 20), []);

  // Track phase transitions
  useEffect(() => {
    phaseTimerRef.current = 0;
  }, [activationPhase]);

  useFrame((_, delta) => {
    if (!expandedPanel) return;

    const dt = delta * 1000; // ms
    phaseTimerRef.current += dt;
    const t = phaseTimerRef.current;
    const health = panelHealth[expandedPanel];
    const systemColor = getSystemColor(expandedPanel, health);

    // --- Camera micro-drift (disabled for networth — useCameraFollow handles it) ---
    if (expandedPanel !== 'networth') {
      const camTarget = activationPhase === 'idle' || activationPhase === 'dismissing'
        ? CAM_REST
        : CAM_DRIFT;
      camera.position.lerp(camTarget, delta * 4);
    }

    // --- Dim plane ---
    if (dimPlaneRef.current) {
      const targetOpacity =
        activationPhase !== 'idle' && activationPhase !== 'dismissing'
          ? 0.6
          : 0;
      dimMaterial.opacity += (targetOpacity - dimMaterial.opacity) * delta * 8;
    }

    // --- Hologram group: instant scale, no dead zone ---
    if (groupRef.current) {
      const isShowing = activationPhase !== 'idle' && activationPhase !== 'dismissing';

      if (isShowing) {
        // Snap to full scale immediately
        const currentScale = groupRef.current.scale.x;
        const newScale = currentScale + (1.0 - currentScale) * Math.min(1, delta * 12);
        groupRef.current.scale.setScalar(Math.max(0.001, newScale));
      } else {
        // Dismiss: shrink out
        const currentScale = groupRef.current.scale.x;
        const newScale = currentScale + (0.0 - currentScale) * Math.min(1, delta * 10);
        groupRef.current.scale.setScalar(Math.max(0.001, newScale));
      }

      // Position above source panel
      const panelX = PANEL_X_OFFSETS[expandedPanel];
      groupRef.current.position.set(
        panelX + (0 - panelX) * 0.7,
        HOLOGRAM_Y,
        HOLOGRAM_Z
      );
    }

    // --- Reveal progress (iris animation) ---
    // Only update Zustand when value actually changes (avoids 120 reconciliations/sec)
    if (activationPhase === 'beat1') {
      const rawProgress = Math.min(1, t / REVEAL_DURATION);
      const progress = easeOutCubic(rawProgress);
      if (Math.abs(progress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = progress;
        setRevealProgress(progress);
      }
    } else if (activationPhase === 'dismissing') {
      const rawProgress = Math.max(0, 1 - t / DISMISS_DURATION);
      const progress = rawProgress * rawProgress;
      if (Math.abs(progress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = progress;
        setRevealProgress(progress);
      }
    }
    // 'active' phase: progress is already 1.0 — no update needed

    // --- Glow cast light ---
    if (glowLightRef.current) {
      const targetIntensity =
        activationPhase === 'active' || activationPhase === 'beat1' ? 2.0 : 0;
      glowLightRef.current.intensity +=
        (targetIntensity - glowLightRef.current.intensity) * delta * 6;
      glowLightRef.current.color.copy(systemColor);
    }

    // --- Phase transitions ---
    if (activationPhase === 'beat1' && t >= REVEAL_DURATION) {
      setActivationPhase('active');
    }
    if (activationPhase === 'dismissing' && t >= DISMISS_DURATION) {
      setActivationPhase('idle');
    }
  });

  // Don't render anything if no panel is expanded and we're idle
  const isVisible = expandedPanel !== null;
  if (!isVisible) return null;

  return (
    <>
      {/* Dimming plane — positioned behind hologram, in front of scene content */}
      <mesh
        ref={dimPlaneRef}
        position={[0, 0, 0.8]}
        geometry={dimGeometry}
        material={dimMaterial}
        renderOrder={1}
      />

      {/* Hologram group */}
      <group ref={groupRef} scale={0.001} renderOrder={2}>
        {/* Glow cast light — shines downward onto console bar */}
        <pointLight
          ref={glowLightRef}
          position={[0, -1, 0]}
          intensity={0}
          distance={4}
          decay={2}
        />

        {children}
      </group>
    </>
  );
}
