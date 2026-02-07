import { create } from 'zustand';

interface BootState {
  isBooting: boolean;
  bootComplete: boolean;
  skipBoot: () => void;
  completeBoot: () => void;
}

export const useBootStore = create<BootState>((set) => ({
  isBooting: true,
  bootComplete: false,

  skipBoot: () =>
    set({
      isBooting: false,
      bootComplete: true,
    }),

  completeBoot: () =>
    set({
      isBooting: false,
      bootComplete: true,
    }),
}));
