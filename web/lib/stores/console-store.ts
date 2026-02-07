import { create } from 'zustand';

export type PanelType = 'shields' | 'networth' | 'transactions' | 'cards';

interface ConsoleStore {
  openPanel: PanelType | null;
  setOpenPanel: (panel: PanelType | null) => void;
  closePanel: () => void;
}

/**
 * Command console panel state (which panel popup is open)
 *
 * Panel types: shields | networth | transactions | cards
 *
 * Usage:
 * - setOpenPanel(type) to show popup
 * - closePanel() to hide current popup
 * - Only one panel can be open at a time
 */
export const useConsoleStore = create<ConsoleStore>((set) => ({
  openPanel: null,
  setOpenPanel: (panel) => set({ openPanel: panel }),
  closePanel: () => set({ openPanel: null }),
}));
