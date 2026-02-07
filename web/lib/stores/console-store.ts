import { create } from 'zustand';

export type PanelType = 'shields' | 'networth' | 'transactions' | 'cards';

interface ConsoleStore {
  openPanel: PanelType | null;
  setOpenPanel: (panel: PanelType | null) => void;
  closePanel: () => void;
}

export const useConsoleStore = create<ConsoleStore>((set) => ({
  openPanel: null,
  setOpenPanel: (panel) => set({ openPanel: panel }),
  closePanel: () => set({ openPanel: null }),
}));
