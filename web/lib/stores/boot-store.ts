import { create } from 'zustand';

export type BootPhase =
  | 'black'           // Beat 0: True black (1.5s)
  | 'emergency'       // Beat 1: Emergency lighting (2s)
  | 'power-surge'     // Beat 2: Primary power surge (~1s)
  | 'viewport-awake'  // Beat 3: Viewport awakening (2s)
  | 'console-boot'    // Beat 4: Console cascade (1.5s)
  | 'hud-rise'        // Beat 5: HUD projection (1s)
  | 'settling'        // Beat 6: The settle (0.5s)
  | 'complete';       // Normal operation

interface BootStore {
  phase: BootPhase;
  progress: number; // 0-100
  globalIntensity: number; // 1.0 during boot, 0.96 after settle
  isBooting: boolean;
  bootComplete: boolean;
  setPhase: (phase: BootPhase) => void;
  setProgress: (progress: number) => void;
  setGlobalIntensity: (intensity: number) => void;
  reset: () => void;
  skipBoot: () => void;
  completeBoot: () => void;
}

/**
 * Boot sequence state management
 *
 * State flow:
 * black → emergency → power-surge → viewport-awake → console-boot → hud-rise → settling → complete
 *
 * Derived state:
 * - isBooting: true when phase !== 'complete'
 * - bootComplete: true when phase === 'complete'
 *
 * Side effects:
 * - setPhase() automatically updates derived state
 * - LocalStorage managed by useBootSequence hook
 */
export const useBootStore = create<BootStore>((set) => ({
  phase: 'black',
  progress: 0,
  globalIntensity: 1.0,
  isBooting: true,
  bootComplete: false,
  setPhase: (phase) => set({
    phase,
    isBooting: phase !== 'complete',
    bootComplete: phase === 'complete',
  }),
  setProgress: (progress) => set({ progress }),
  setGlobalIntensity: (intensity) => set({ globalIntensity: intensity }),
  reset: () => set({
    phase: 'black',
    progress: 0,
    globalIntensity: 1.0,
    isBooting: true,
    bootComplete: false
  }),
  skipBoot: () => set({
    phase: 'complete',
    globalIntensity: 0.96,
    isBooting: false,
    bootComplete: true
  }),
  completeBoot: () => set({
    phase: 'complete',
    globalIntensity: 0.96,
    isBooting: false,
    bootComplete: true
  }),
}));
