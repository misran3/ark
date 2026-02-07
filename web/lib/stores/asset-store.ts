import { create } from 'zustand';

export interface Asset {
  id: string;
  name: string;
  value: number;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;       // Planet radius
  detail: number;     // Icosahedron detail level (1 or 2)
  hasRing?: boolean;  // Saturn-like ring (e.g., Cargo Hold)
}

interface AssetState {
  assets: Asset[];
  liabilities: number;
  netWorth: number;
  trendPct: number;
  getAssetHealth: () => number; // 0-1, ratio of net worth to gross assets
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [
    { id: 'hull', name: 'HULL & MODULES', value: 620_000, orbitRadius: 2.8, orbitSpeed: 0.15, size: 0.30, detail: 1 },
    { id: 'cargo', name: 'CARGO HOLD', value: 412_830, orbitRadius: 4.2, orbitSpeed: 0.25, size: 0.24, detail: 2, hasRing: true },
    { id: 'liquid', name: 'LIQUID CREDITS', value: 315_000, orbitRadius: 5.8, orbitSpeed: 0.45, size: 0.22, detail: 2 },
    { id: 'stationed', name: 'STATIONED ASSETS', value: 0, orbitRadius: 7.2, orbitSpeed: 0.08, size: 0.16, detail: 1 },
  ],
  liabilities: 100_000,
  netWorth: 1_247_830,
  trendPct: 4.2,
  getAssetHealth: () => {
    const state = get();
    const gross = state.assets.reduce((sum, a) => sum + a.value, 0);
    if (gross === 0) return 0;
    return Math.max(0, Math.min(1, state.netWorth / gross));
  },
}));
