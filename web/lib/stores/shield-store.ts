import { create } from 'zustand';

export interface BudgetSubcategory {
  name: string;
  spent: number;
  budgeted: number;
  percentUsed: number;
}

export interface Shield {
  id: 'life-support' | 'recreation-deck' | 'warp-fuel';
  name: string;
  icon: string;
  budgetCategory: 'needs' | 'wants' | 'savings';
  currentPercent: number; // 0-100
  status: 'optimal' | 'nominal' | 'caution' | 'warning' | 'critical' | 'breached';
  gradient: { from: string; to: string }; // Tailwind gradient classes
  budgetAllocationPct: number; // Target allocation (50, 30, 20)
  actualSpendPct: number; // Actual spending percentage
  actualSpendAmount: number; // Dollar amount spent
  budgetAmount: number; // Dollar amount budgeted
  subcategories: BudgetSubcategory[];
}

interface ShieldState {
  shields: Record<string, Shield>;
  overallPercent: number;
  updateShield: (id: string, percent: number) => void;
  applyDeflection: (shieldId: string, amount: number) => void;
  applyDamage: (shieldId: string, amount: number) => void;
  getShield: (id: string) => Shield;
}

export function getStatusFromPercent(percent: number): Shield['status'] {
  if (percent >= 90) return 'optimal';
  if (percent >= 75) return 'nominal';
  if (percent >= 60) return 'caution';
  if (percent >= 40) return 'warning';
  if (percent >= 20) return 'critical';
  return 'breached';
}

export const useShieldStore = create<ShieldState>((set, get) => ({
  shields: {
    'life-support': {
      id: 'life-support',
      name: 'Life Support',
      icon: '⚡',
      budgetCategory: 'needs',
      currentPercent: 82,
      status: 'optimal',
      gradient: { from: 'from-green-500', to: 'to-cyan-500' },
      budgetAllocationPct: 50,
      actualSpendPct: 48,
      actualSpendAmount: 2995,
      budgetAmount: 3120,
      subcategories: [
        { name: 'Rent', spent: 1400, budgeted: 1500, percentUsed: 93 },
        { name: 'Utilities', spent: 285, budgeted: 350, percentUsed: 81 },
        { name: 'Groceries', spent: 620, budgeted: 700, percentUsed: 89 },
        { name: 'Transport', spent: 380, budgeted: 350, percentUsed: 109 },
      ],
    },
    'recreation-deck': {
      id: 'recreation-deck',
      name: 'Recreation Deck',
      icon: '🎮',
      budgetCategory: 'wants',
      currentPercent: 42,
      status: 'warning',
      gradient: { from: 'from-purple-500', to: 'to-pink-500' },
      budgetAllocationPct: 30,
      actualSpendPct: 37,
      actualSpendAmount: 2309,
      budgetAmount: 1872,
      subcategories: [
        { name: 'Dining', spent: 884, budgeted: 600, percentUsed: 147 },
        { name: 'Entertainment', spent: 425, budgeted: 400, percentUsed: 106 },
        { name: 'Subscriptions', spent: 132, budgeted: 100, percentUsed: 132 },
        { name: 'Shopping', spent: 548, budgeted: 500, percentUsed: 110 },
      ],
    },
    'warp-fuel': {
      id: 'warp-fuel',
      name: 'Warp Fuel',
      icon: '🚀',
      budgetCategory: 'savings',
      currentPercent: 91,
      status: 'optimal',
      gradient: { from: 'from-yellow-400', to: 'to-amber-500' },
      budgetAllocationPct: 20,
      actualSpendPct: 15,
      actualSpendAmount: 936,
      budgetAmount: 1248,
      subcategories: [
        { name: 'Emergency Fund', spent: 500, budgeted: 500, percentUsed: 100 },
        { name: 'Investments', spent: 300, budgeted: 400, percentUsed: 75 },
        { name: 'Debt Payoff', spent: 136, budgeted: 348, percentUsed: 39 },
      ],
    },
  },
  overallPercent: 82 * 0.5 + 42 * 0.3 + 91 * 0.2, // 72.1

  updateShield: (id: string, percent: number) =>
    set((state) => {
      const clampedPercent = Math.max(0, Math.min(100, percent));
      const newShields = {
        ...state.shields,
        [id]: {
          ...state.shields[id],
          currentPercent: clampedPercent,
          status: getStatusFromPercent(clampedPercent),
        },
      };

      // Recalculate overall percent
      const ls = newShields['life-support'].currentPercent;
      const rd = newShields['recreation-deck'].currentPercent;
      const wf = newShields['warp-fuel'].currentPercent;
      const overallPercent = ls * 0.5 + rd * 0.3 + wf * 0.2;

      return {
        shields: newShields,
        overallPercent,
      };
    }),

  applyDeflection: (shieldId: string, amount: number) => {
    const state = get();
    const shield = state.shields[shieldId];
    if (shield) {
      const newPercent = Math.min(100, shield.currentPercent + amount);
      state.updateShield(shieldId, newPercent);
    }
  },

  applyDamage: (shieldId: string, amount: number) => {
    const state = get();
    const shield = state.shields[shieldId];
    if (shield) {
      const newPercent = Math.max(0, shield.currentPercent - amount);
      state.updateShield(shieldId, newPercent);
    }
  },

  getShield: (id: string) => {
    const state = get();
    return state.shields[id];
  },
}));
