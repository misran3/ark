import { create } from 'zustand';

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
  seed?: number;
  angularVelocity?: [number, number, number];
}

interface ThreatState {
  threats: Threat[];
  hoveredThreat: string | null;
  addThreat: (threat: Threat) => void;
  removeThreat: (id: string) => void;
  deflectThreat: (id: string) => void;
  updateThreat: (id: string, updates: Partial<Threat>) => void;
  setHoveredThreat: (id: string | null) => void;
}

export const useThreatStore = create<ThreatState>((set) => ({
  threats: [
    {
      id: 'gym-membership',
      type: 'asteroid',
      position: [3, 2, -15],
      size: 1.3,
      color: '#ff5733',
      label: 'GYM $49.99/mo',
      detail: 'Zero usage for 47 days — renews in 5d',
      amount: 49.99,
      severity: 'danger',
      deflected: false,
      seed: 42,
      angularVelocity: [0.35, 0.5, 0.2],
    },
    {
      id: 'dining-overspend',
      type: 'ion_storm',
      position: [-4, -1, -20],
      size: 1.5,
      color: '#a855f7',
      label: 'DINING +142%',
      detail: 'Recreation Deck at 142% capacity',
      amount: 284,
      severity: 'warning',
      deflected: false,
    },
    {
      id: 'streaming',
      type: 'solar_flare',
      position: [0, 3, -25],
      size: 2,
      color: '#fbbf24',
      label: 'STREAMING $31.98',
      detail: 'Netflix + Hulu auto-renew in 48h',
      amount: 31.98,
      severity: 'danger',
      deflected: false,
    },
    {
      id: 'missed-rewards',
      type: 'asteroid',
      position: [-2, -3, -18],
      size: 0.7,
      color: '#06b6d4',
      label: 'MISSED REWARDS',
      detail: 'Card routing error - $12/mo lost',
      amount: 12,
      severity: 'info',
      deflected: false,
      seed: 137,
      angularVelocity: [0.25, 0.4, 0.15],
    },
    {
      id: 'credit-card-debt',
      type: 'black_hole',
      position: [5, -2, -22],
      size: 1.5,
      color: '#4c1d95',
      label: 'DEBT SPIRAL',
      detail: 'Compounding interest pulling $2,400 deeper',
      amount: 2400,
      severity: 'danger',
      deflected: false,
    },
    {
      id: 'savings-opportunity',
      type: 'wormhole',
      position: [-5, 1, -30],
      size: 1,
      color: '#60a5fa',
      label: 'SAVINGS PORTAL',
      detail: 'High-yield account opportunity — $180/yr missed',
      amount: 180,
      severity: 'info',
      deflected: false,
    },
    {
      id: 'fraud-alert',
      type: 'enemy_cruiser',
      position: [2, -3, -18],
      size: 1.2,
      color: '#991b1b',
      label: 'FRAUD ALERT',
      detail: 'Suspicious $892 charge from unknown merchant',
      amount: 892,
      severity: 'danger',
      deflected: false,
    },
  ],
  hoveredThreat: null,

  addThreat: (threat) =>
    set((state) => ({
      threats: [...state.threats, threat],
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
}));
