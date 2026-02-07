import { create } from 'zustand';

export interface Threat {
  id: string;
  type: 'asteroid' | 'ion_storm' | 'solar_flare' | 'black_hole' | 'wormhole';
  position: [number, number, number];
  size: number;
  color: string;
  label: string;
  detail: string;
  amount: number;
  severity: 'danger' | 'warning' | 'info';
  deflected: boolean;
}

interface ThreatState {
  threats: Threat[];
  hoveredThreat: string | null;
  addThreat: (threat: Threat) => void;
  removeThreat: (id: string) => void;
  deflectThreat: (id: string) => void;
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

  setHoveredThreat: (id) =>
    set(() => ({
      hoveredThreat: id,
    })),
}));
