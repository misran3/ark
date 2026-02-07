import { create } from 'zustand';

interface TransitionState {
  isTransitioning: boolean;
  targetRoute: string | null;
  cameraZ: number;
  starfieldOpacity: number;
  startTransition: (route: string) => void;
  completeTransition: () => void;
  setCameraZ: (z: number) => void;
  setStarfieldOpacity: (opacity: number) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  isTransitioning: false,
  targetRoute: null,
  cameraZ: 10,
  starfieldOpacity: 1,

  startTransition: (route) =>
    set({
      isTransitioning: true,
      targetRoute: route,
    }),

  completeTransition: () =>
    set({
      isTransitioning: false,
      targetRoute: null,
    }),

  setCameraZ: (z) => set({ cameraZ: z }),

  setStarfieldOpacity: (opacity) => set({ starfieldOpacity: opacity }),

  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
}));
