'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Performance tracking
  fpsHistory: number[];

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
  recordFps: (fps: number) => void;
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
      fpsHistory: Array(600).fill(60),

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

      recordFps: (fps) =>
        set((state) => {
          const newHistory = [...state.fpsHistory];
          if (newHistory.length >= 600) {
            newHistory.shift();
          }
          newHistory.push(fps);
          return {
            fpsHistory: newHistory,
          };
        }),
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
