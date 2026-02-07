import { create } from 'zustand';

export type AlertLevel = 'normal' | 'caution' | 'alert' | 'red-alert';

interface AlertState {
  level: AlertLevel;
  setLevel: (level: AlertLevel) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  level: 'normal',
  setLevel: (level) => set({ level }),
}));

// CSS custom property values per alert level
export const ALERT_COLORS: Record<AlertLevel, { hud: string; glow: string; border: string }> = {
  normal: { hud: 'rgba(0, 240, 255, 0.7)', glow: 'rgba(0, 240, 255, 0.15)', border: 'rgba(0, 240, 255, 0.3)' },
  caution: { hud: 'rgba(251, 191, 36, 0.8)', glow: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)' },
  alert: { hud: 'rgba(249, 115, 22, 0.85)', glow: 'rgba(249, 115, 22, 0.25)', border: 'rgba(249, 115, 22, 0.5)' },
  'red-alert': { hud: 'rgba(239, 68, 68, 0.9)', glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.6)' },
};
