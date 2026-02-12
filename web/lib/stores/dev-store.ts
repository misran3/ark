'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── FPS Ring Buffer (outside Zustand to avoid 60fps store updates) ──────────
const FPS_BUFFER_SIZE = 600;
const _fpsBuffer = new Float32Array(FPS_BUFFER_SIZE).fill(60);
let _fpsWriteIndex = 0;

/** Record an FPS sample without triggering any React re-renders */
export function recordFps(fps: number) {
  _fpsBuffer[_fpsWriteIndex] = fps;
  _fpsWriteIndex = (_fpsWriteIndex + 1) % FPS_BUFFER_SIZE;
}

/** Read the FPS ring buffer as an ordered array (oldest → newest) */
export function readFpsHistory(): Float32Array {
  return _fpsBuffer;
}

/** Get the current write index for ordered iteration */
export function getFpsWriteIndex(): number {
  return _fpsWriteIndex;
}

interface DevDashboardState {
  // Panel state
  isOpen: boolean;
  activeTab: 'threats' | 'shields' | 'data' | 'animation' | 'performance' | 'nova';
  panelPosition: { x: number; y: number };
  panelWidth: number;

  // Animation controls
  animationSpeed: number;
  isPaused: boolean;
  previousSpeed: number;
  animationToggles: Record<string, boolean>;

  // Scenario & overlay
  activeScenarioId: string | null;
  showFullOverlay: boolean;

  // Actions
  toggle: () => void;
  setActiveTab: (tab: 'threats' | 'shields' | 'data' | 'animation' | 'performance' | 'nova') => void;
  setPanelPosition: (pos: { x: number; y: number }) => void;
  setPanelWidth: (width: number) => void;
  setAnimationSpeed: (speed: number) => void;
  togglePause: () => void;
  setAnimationToggle: (key: string, enabled: boolean) => void;
  setActiveScenario: (id: string | null) => void;
  toggleFullOverlay: () => void;
}

const defaultAnimationToggles = {
  pageTransitions: true,
  threatAnimations: true,
  shieldAnimations: true,
  auroraColorCycle: true,
  captainNovaBreathing: true,
  starfieldTwinkling: true,
  particleSystems: true,
  cameraController: true,
};

export const useDevStore = create<DevDashboardState>()(
  persist(
    (set) => ({
      // Initial state
      isOpen: false,
      activeTab: 'threats',
      panelPosition: { x: -1, y: 60 },
      panelWidth: 340,
      animationSpeed: 1.0,
      isPaused: false,
      previousSpeed: 1.0,
      animationToggles: defaultAnimationToggles,
      activeScenarioId: null,
      showFullOverlay: false,

      // Actions
      toggle: () =>
        set((state) => ({
          isOpen: !state.isOpen,
        })),

      setActiveTab: (tab) =>
        set({
          activeTab: tab,
        }),

      setPanelPosition: (pos) =>
        set({
          panelPosition: pos,
        }),

      setPanelWidth: (width) => {
        const clamped = Math.max(280, Math.min(500, width));
        set({
          panelWidth: clamped,
        });
      },

      setAnimationSpeed: (speed) =>
        set({
          animationSpeed: speed,
          isPaused: speed === 0,
        }),

      togglePause: () =>
        set((state) => {
          if (state.isPaused) {
            // Restore previous speed
            return {
              isPaused: false,
              animationSpeed: state.previousSpeed,
            };
          } else {
            // Save current speed and pause
            return {
              isPaused: true,
              previousSpeed: state.animationSpeed,
              animationSpeed: 0,
            };
          }
        }),

      setAnimationToggle: (key, enabled) =>
        set((state) => ({
          animationToggles: {
            ...state.animationToggles,
            [key]: enabled,
          },
        })),

      setActiveScenario: (id) =>
        set({
          activeScenarioId: id,
        }),

      toggleFullOverlay: () =>
        set((state) => ({
          showFullOverlay: !state.showFullOverlay,
        })),
    }),
    {
      name: 'ark-dev-dashboard',
      partialize: (state) => ({
        isOpen: state.isOpen,
        activeTab: state.activeTab,
        panelPosition: state.panelPosition,
        panelWidth: state.panelWidth,
        animationSpeed: state.animationSpeed,
        animationToggles: state.animationToggles,
        activeScenarioId: state.activeScenarioId,
        showFullOverlay: state.showFullOverlay,
      }),
    }
  )
);
