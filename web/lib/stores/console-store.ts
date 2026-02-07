import { create } from 'zustand';

export type PanelType = 'shields' | 'networth' | 'transactions' | 'cards';
export type ActivationPhase = 'idle' | 'beat1' | 'beat2' | 'active' | 'dismissing';

/** Per-system signature colors: [healthy RGB, distress RGB] */
export const SYSTEM_HUES: Record<PanelType, { healthy: [number, number, number]; distress: [number, number, number] }> = {
  shields:      { healthy: [0, 200, 255],   distress: [255, 80, 40]  },
  networth:     { healthy: [255, 200, 50],  distress: [120, 100, 80] },
  transactions: { healthy: [50, 255, 120],  distress: [255, 100, 50] },
  cards:        { healthy: [220, 80, 255],  distress: [255, 60, 60]  },
};

interface ConsoleStore {
  // --- Existing ---
  openPanel: PanelType | null;
  setOpenPanel: (panel: PanelType | null) => void;
  closePanel: () => void;

  // --- Hologram expansion ---
  expandedPanel: PanelType | null;
  activationPhase: ActivationPhase;
  panelHealth: Record<PanelType, number>;

  expandPanel: (panel: PanelType) => void;
  collapsePanel: () => void;
  setActivationPhase: (phase: ActivationPhase) => void;
  setPanelHealth: (panel: PanelType, health: number) => void;
}

export const useConsoleStore = create<ConsoleStore>((set) => ({
  // Existing popup state (kept for backwards compat during migration)
  openPanel: null,
  setOpenPanel: (panel) => set({ openPanel: panel }),
  closePanel: () => set({ openPanel: null }),

  // Hologram expansion state
  expandedPanel: null,
  activationPhase: 'idle',
  panelHealth: { shields: 0.72, networth: 0.85, transactions: 0.65, cards: 0.78 },

  expandPanel: (panel) => set({ expandedPanel: panel, activationPhase: 'beat1' }),
  collapsePanel: () => set({ activationPhase: 'dismissing' }),
  setActivationPhase: (phase) => {
    if (phase === 'idle') {
      set({ activationPhase: 'idle', expandedPanel: null });
    } else {
      set({ activationPhase: phase });
    }
  },
  setPanelHealth: (panel, health) =>
    set((state) => ({
      panelHealth: { ...state.panelHealth, [panel]: Math.max(0, Math.min(1, health)) },
    })),
}));
