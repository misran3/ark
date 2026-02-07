import { create } from 'zustand';

interface PostprocessingState {
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;

  vignetteEnabled: boolean;
  vignetteOffset: number;
  vignetteDarkness: number;

  chromaticEnabled: boolean;
  chromaticOffset: [number, number];

  noiseEnabled: boolean;
  noiseOpacity: number;

  setBloom: (params: Partial<Pick<PostprocessingState, 'bloomEnabled' | 'bloomIntensity' | 'bloomThreshold'>>) => void;
  setVignette: (params: Partial<Pick<PostprocessingState, 'vignetteEnabled' | 'vignetteOffset' | 'vignetteDarkness'>>) => void;
  setChromatic: (params: Partial<Pick<PostprocessingState, 'chromaticEnabled' | 'chromaticOffset'>>) => void;
  setNoise: (params: Partial<Pick<PostprocessingState, 'noiseEnabled' | 'noiseOpacity'>>) => void;
  setPreset: (preset: 'default' | 'cinematic' | 'intense' | 'subtle') => void;
}

const presets = {
  default: {
    bloomEnabled: true, bloomIntensity: 1.5, bloomThreshold: 0.5,
    vignetteEnabled: true, vignetteOffset: 0.5, vignetteDarkness: 0.6,
    chromaticEnabled: true, chromaticOffset: [0.001, 0.001] as [number, number],
    noiseEnabled: true, noiseOpacity: 0.05,
  },
  cinematic: {
    bloomEnabled: true, bloomIntensity: 2.0, bloomThreshold: 0.4,
    vignetteEnabled: true, vignetteOffset: 0.3, vignetteDarkness: 0.8,
    chromaticEnabled: true, chromaticOffset: [0.002, 0.002] as [number, number],
    noiseEnabled: true, noiseOpacity: 0.08,
  },
  intense: {
    bloomEnabled: true, bloomIntensity: 3.0, bloomThreshold: 0.3,
    vignetteEnabled: true, vignetteOffset: 0.2, vignetteDarkness: 1.0,
    chromaticEnabled: true, chromaticOffset: [0.005, 0.005] as [number, number],
    noiseEnabled: true, noiseOpacity: 0.12,
  },
  subtle: {
    bloomEnabled: true, bloomIntensity: 0.8, bloomThreshold: 0.6,
    vignetteEnabled: false, vignetteOffset: 0.5, vignetteDarkness: 0.3,
    chromaticEnabled: false, chromaticOffset: [0, 0] as [number, number],
    noiseEnabled: true, noiseOpacity: 0.02,
  },
};

export const usePostprocessingStore = create<PostprocessingState>((set) => ({
  ...presets.default,
  setBloom: (params) => set(params),
  setVignette: (params) => set(params),
  setChromatic: (params) => set(params),
  setNoise: (params) => set(params),
  setPreset: (preset) => set(presets[preset]),
}));
