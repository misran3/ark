import { create } from 'zustand';
import {
  generateSpawnPosition,
  STATIC_THREAT_TYPES,
  BLACK_HOLE_POSITION,
} from '@/lib/constants/scene-layout';

export interface Threat {
  id: string;
  type: 'asteroid' | 'ion_storm' | 'solar_flare' | 'black_hole' | 'wormhole' | 'enemy_cruiser';
  position: [number, number, number];
  size: number;
  color: string;
  label: string;
  detail: string;
  amount: number;
  severity: 'danger' | 'warning' | 'info';
  deflected: boolean;
  createdAt: number;
  seed?: number;
  angularVelocity?: [number, number, number];
}

function demoPosition(id: string, type: Threat['type']): [number, number, number] {
  if (STATIC_THREAT_TYPES.has(type)) return BLACK_HOLE_POSITION;
  return generateSpawnPosition(id, type);
}

export const DEMO_THREATS: Threat[] = [
  {
    id: 'gym-membership',
    type: 'asteroid',
    position: demoPosition('gym-membership', 'asteroid'),
    size: 3.0,
    color: '#ff5733',
    label: 'GYM $49.99/mo',
    detail: 'Zero usage for 47 days — renews in 5d',
    amount: 49.99,
    severity: 'danger',
    deflected: false,
    createdAt: Date.now() - 3600_000,
    seed: 42,
    angularVelocity: [0.35, 0.5, 0.2],
  },
  {
    id: 'missed-rewards',
    type: 'asteroid',
    position: demoPosition('missed-rewards', 'asteroid'),
    size: 2.2,
    color: '#06b6d4',
    label: 'MISSED REWARDS',
    detail: 'Card routing error - $12/mo lost',
    amount: 12,
    severity: 'info',
    deflected: false,
    createdAt: Date.now() - 86400_000,
    seed: 137,
    angularVelocity: [0.25, 0.4, 0.15],
  },
];

interface ThreatState {
  threats: Threat[];
  hoveredThreat: string | null;
  addThreat: (threat: Threat) => void;
  removeThreat: (id: string) => void;
  deflectThreat: (id: string) => void;
  updateThreat: (id: string, updates: Partial<Threat>) => void;
  setHoveredThreat: (id: string | null) => void;
  loadDemoThreats: () => void;
  loadFromAPI: (threats: Threat[]) => void;
}

export const useThreatStore = create<ThreatState>((set) => ({
  threats: [],
  hoveredThreat: null,

  addThreat: (threat) =>
    set((state) => ({
      threats: [...state.threats, { ...threat, createdAt: threat.createdAt || Date.now() }],
    })),

  removeThreat: (id) =>
    set((state) => ({
      threats: state.threats.filter((t) => t.id !== id),
    })),

  deflectThreat: (id) =>
    set((state) => ({
      threats: state.threats.map((t) =>
        t.id === id ? { ...t, deflected: true } : t
      ),
    })),

  updateThreat: (id, updates) =>
    set((state) => ({
      threats: state.threats.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  setHoveredThreat: (id) =>
    set(() => ({
      hoveredThreat: id,
    })),

  loadDemoThreats: () =>
    set(() => ({
      threats: DEMO_THREATS.map((t) => ({ ...t, deflected: false })),
    })),

  loadFromAPI: (threats) =>
    set(() => ({
      threats: threats.map((t) => ({ ...t, deflected: false })),
    })),
}));
