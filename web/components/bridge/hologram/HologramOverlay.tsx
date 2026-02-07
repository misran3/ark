'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, PointLight, Vector3 } from 'three';
import { useConsoleStore, type PanelType } from '@/lib/stores/console-store';
import { getSystemColor } from '@/lib/hologram/colors';

/** World-space Y position for the hologram group (above console bar) */
const HOLOGRAM_Y = -0.5;
/** World-space Z position (in front of scene, behind canopy struts) */
const HOLOGRAM_Z = 1.0;
/** X offsets per panel to position above the triggering console panel */
const PANEL_X_OFFSETS: Record<PanelType, number> = {
  shields: -1.2,
  networth: -0.4,
  transactions: 0.4,
  cards: 1.2,
};

/** Camera rest position */
const CAM_REST = new Vector3(0, 0, 5);
/** Camera drift target (subtle lean forward + up) */
const CAM_DRIFT = new Vector3(0, 0.1, 4.75);

const BEAT1_DURATION = 400;
const BEAT2_DURATION = 800;
const DISMISS_DURATION = 400;

interface HologramOverlayProps {
  children?: React.ReactNode;
}

export function HologramOverlay({ children }: HologramOverlayProps) {
  const groupRef = useRef<Group>(null);
  const dimPlaneRef = useRef<Mesh>(null);
  const glowLightRef = useRef<PointLight>(null);
  const phaseTimerRef = useRef(0);

  const { expandedPanel, activationPhase, setActivationPhase, panelHealth } =
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

    // --- Camera micro-drift ---
    const camTarget = activationPhase === 'idle' || activationPhase === 'dismissing'
      ? CAM_REST
      : CAM_DRIFT;
    camera.position.lerp(camTarget, delta * 4);

    // --- Dim plane ---
    if (dimPlaneRef.current) {
      const targetOpacity =
        activationPhase === 'beat1' || activationPhase === 'beat2' || activationPhase === 'active'
          ? 0.6
          : 0;
      dimMaterial.opacity += (targetOpacity - dimMaterial.opacity) * delta * 8;
    }

    // --- Hologram group ---
    if (groupRef.current) {
      const targetScale =
        activationPhase === 'beat2' || activationPhase === 'active' ? 1.0 : 0.0;

      // Scale animation
      const scaleSpeed = activationPhase === 'dismissing' ? 10 : 5;
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * delta * scaleSpeed;
      groupRef.current.scale.setScalar(Math.max(0.001, newScale));

      // Position above source panel
      const panelX = PANEL_X_OFFSETS[expandedPanel];
      groupRef.current.position.set(
        panelX + (0 - panelX) * 0.7, // Drift toward center
        HOLOGRAM_Y,
        HOLOGRAM_Z
      );
    }

    // --- Glow cast light ---
    if (glowLightRef.current) {
      const targetIntensity =
        activationPhase === 'active' || activationPhase === 'beat2' ? 2.0 : 0;
      glowLightRef.current.intensity +=
        (targetIntensity - glowLightRef.current.intensity) * delta * 6;
      glowLightRef.current.color.copy(systemColor);
    }

    // --- Phase transitions ---
    if (activationPhase === 'beat1' && t >= BEAT1_DURATION) {
      setActivationPhase('beat2');
    }
    if (activationPhase === 'beat2' && t >= BEAT2_DURATION) {
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
