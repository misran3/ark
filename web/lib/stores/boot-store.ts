import { create } from 'zustand';

export type BootPhase =
  | 'start-screen'    // First visit only: name + Start button
  | 'name-exit'       // Name dropping off screen (0.6s)
  | 'darkness'        // Brief beat after name exits (0.5s)
  | 'console-glow'    // Consoles begin glowing (1.5s)
  | 'power-surge'     // Console lights surge bright (1s)
  | 'full-power'      // Room fully illuminated (1s)
  | 'complete';       // Normal operation

interface BootStore {
  phase: BootPhase;
  consoleIntensity: number; // 0-1, controls console brightness
  hasSeenBoot: boolean;
  isBooting: boolean;
  setPhase: (phase: BootPhase) => void;
  setConsoleIntensity: (intensity: number) => void;
  setHasSeenBoot: (seen: boolean) => void;
  startBoot: () => void;
  skipBoot: () => void;
  reset: () => void;
}

/**
 * Boot sequence state management (v2.0)
 *
 * State flow:
 * First visit: start-screen → name-exit → darkness → console-glow → power-surge → full-power → complete
 * Return visit: complete (immediately)
 *
 * Console intensity drives UI brightness via CSS variable.
 * LocalStorage managed by useBootSequence hook.
 */
export const useBootStore = create<BootStore>((set) => ({
  phase: 'start-screen',
  consoleIntensity: 0,
  hasSeenBoot: false,
  isBooting: true,

  setPhase: (phase) => set({
    phase,
    isBooting: phase !== 'complete',
  }),

  setConsoleIntensity: (intensity) => set({ consoleIntensity: intensity }),

  setHasSeenBoot: (seen) => set({ hasSeenBoot: seen }),

  startBoot: () => set({
    phase: 'name-exit',
    hasSeenBoot: true,
    isBooting: true,
  }),

  skipBoot: () => set({
    phase: 'complete',
    consoleIntensity: 0.96,
    isBooting: false,
  }),

  reset: () => set({
    phase: 'start-screen',
    consoleIntensity: 0,
    hasSeenBoot: false,
    isBooting: true,
  }),
}));
