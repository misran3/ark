import { create } from 'zustand';

export type BootPhase =
  | 'loading'        // 0-3s: Progress bar
  | 'eyelid'         // 3-4s: Vertical panels open
  | 'blur'           // 4-4.5s: Blurred vision
  | 'blink'          // 4.5-5s: Quick fade to black and back
  | 'console-boot'   // 5-6s: Console screens power on
  | 'hud-rise'       // 6-7s: HUD elements slide in
  | 'complete';      // 7s+: Normal operation

interface BootStore {
  phase: BootPhase;
  progress: number; // 0-100
  // Legacy compat
  isBooting: boolean;
  bootComplete: boolean;
  setPhase: (phase: BootPhase) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
  // Legacy compat methods
  skipBoot: () => void;
  completeBoot: () => void;
}

/**
 * Boot sequence state management
 *
 * State flow:
 * loading → eyelid → blur → blink → console-boot → hud-rise → complete
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
  phase: 'loading',
  progress: 0,
  isBooting: true,
  bootComplete: false,
  setPhase: (phase) => set({
    phase,
    isBooting: phase !== 'complete',
    bootComplete: phase === 'complete',
  }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ phase: 'loading', progress: 0, isBooting: true, bootComplete: false }),
  skipBoot: () => set({ phase: 'complete', isBooting: false, bootComplete: true }),
  completeBoot: () => set({ phase: 'complete', isBooting: false, bootComplete: true }),
}));
