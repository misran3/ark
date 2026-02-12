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
  return generateSpawnPosition(id);
}

export const DEMO_THREATS: Threat[] = [
  {
    id: 'gym-membership',
    type: 'asteroid',
    position: demoPosition('gym-membership', 'asteroid'),
    size: 1.3,
    color: '#ff5733',
    label: 'GYM $49.99/mo',
    detail: 'Zero usage for 47 days — renews in 5d',
    amount: 49.99,
    severity: 'danger',
    deflected: false,
    createdAt: Date.now() - 3600_000, // 1 hour ago
    seed: 42,
    angularVelocity: [0.35, 0.5, 0.2],
  },
  {
    id: 'dining-overspend',
    type: 'ion_storm',
    position: demoPosition('dining-overspend', 'ion_storm'),
    size: 1.5,
    color: '#a855f7',
    label: 'DINING +142%',
    detail: 'Recreation Deck at 142% capacity',
    amount: 284,
    severity: 'warning',
    deflected: false,
    createdAt: Date.now() - 7200_000, // 2 hours ago
  },
  {
    id: 'streaming',
    type: 'solar_flare',
    position: demoPosition('streaming', 'solar_flare'),
    size: 2,
    color: '#fbbf24',
    label: 'STREAMING $31.98',
    detail: 'Netflix + Hulu auto-renew in 48h',
    amount: 31.98,
    severity: 'danger',
    deflected: false,
    createdAt: Date.now() - 1800_000, // 30 min ago
  },
  {
    id: 'missed-rewards',
    type: 'asteroid',
    position: demoPosition('missed-rewards', 'asteroid'),
    size: 0.7,
    color: '#06b6d4',
    label: 'MISSED REWARDS',
    detail: 'Card routing error - $12/mo lost',
    amount: 12,
    severity: 'info',
    deflected: false,
    createdAt: Date.now() - 86400_000, // 1 day ago
    seed: 137,
    angularVelocity: [0.25, 0.4, 0.15],
  },
  {
    id: 'credit-card-debt',
    type: 'black_hole',
    position: demoPosition('credit-card-debt', 'black_hole'),
    size: 1.5,
    color: '#4c1d95',
    label: 'DEBT SPIRAL',
    detail: 'Compounding interest pulling $2,400 deeper',
    amount: 2400,
    severity: 'danger',
    deflected: false,
    createdAt: Date.now() - 172800_000, // 2 days ago
  },
  {
    id: 'savings-opportunity',
    type: 'wormhole',
    position: demoPosition('savings-opportunity', 'wormhole'),
    size: 1,
    color: '#60a5fa',
    label: 'SAVINGS PORTAL',
    detail: 'High-yield account opportunity — $180/yr missed',
    amount: 180,
    severity: 'info',
    deflected: false,
    createdAt: Date.now() - 43200_000, // 12 hours ago
  },
  {
    id: 'fraud-alert',
    type: 'enemy_cruiser',
    position: demoPosition('fraud-alert', 'enemy_cruiser'),
    size: 1.2,
    color: '#991b1b',
    label: 'FRAUD ALERT',
    detail: 'Suspicious $892 charge from unknown merchant',
    amount: 892,
    severity: 'danger',
    deflected: false,
    createdAt: Date.now() - 600_000, // 10 min ago
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
