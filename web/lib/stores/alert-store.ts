import { create } from 'zustand';

export type AlertLevel = 'normal' | 'caution' | 'alert' | 'red-alert';

/**
 * Cascade stage for sequential alert propagation.
 *
 * When an alert triggers, stages fire in sequence (100-150ms apart):
 * 1. frame — Status indicator lights react first (closest to sensors)
 * 2. hud — HUD elements shift color temperature
 * 3. glass — Viewport glass reflection gains tint
 * 4. backlight — Instrument backlights shift
 * 5. instruments — Gauge needles respond to new values
 */
export type CascadeStage = 'idle' | 'frame' | 'hud' | 'glass' | 'backlight' | 'instruments';

const CASCADE_STAGES: CascadeStage[] = ['frame', 'hud', 'glass', 'backlight', 'instruments'];
const CASCADE_DELAY = 120; // ms between stages

interface AlertState {
  level: AlertLevel;
  /** Current cascade stage (which elements have received the alert) */
  cascadeStage: CascadeStage;
  /** Whether the cascade is in progress */
  cascading: boolean;
  /** Set alert level with cascade animation */
  setLevel: (level: AlertLevel) => void;
  /** Set alert level instantly (skip cascade) */
  setLevelImmediate: (level: AlertLevel) => void;
  /** Check if a specific stage has been reached in the current cascade */
  hasReachedStage: (stage: CascadeStage) => boolean;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  level: 'normal',
  cascadeStage: 'idle',
  cascading: false,

  setLevel: (level) => {
    const current = get().level;
    if (current === level) return;

    set({ level, cascading: true, cascadeStage: 'idle' });

    // Fire cascade stages sequentially
    CASCADE_STAGES.forEach((stage, i) => {
      setTimeout(() => {
        set({ cascadeStage: stage });
        // Mark cascade complete after last stage
        if (i === CASCADE_STAGES.length - 1) {
          setTimeout(() => set({ cascading: false }), 100);
        }
      }, i * CASCADE_DELAY);
    });
  },

  setLevelImmediate: (level) => {
    set({ level, cascadeStage: 'instruments', cascading: false });
  },

  hasReachedStage: (stage) => {
    const { cascadeStage } = get();
    if (cascadeStage === 'idle') return false;
    const currentIdx = CASCADE_STAGES.indexOf(cascadeStage);
    const targetIdx = CASCADE_STAGES.indexOf(stage);
    return currentIdx >= targetIdx;
  },
}));

// CSS custom property values per alert level
export const ALERT_COLORS: Record<AlertLevel, { hud: string; glow: string; border: string }> = {
  normal: { hud: 'rgba(0, 240, 255, 0.7)', glow: 'rgba(0, 240, 255, 0.15)', border: 'rgba(0, 240, 255, 0.3)' },
  caution: { hud: 'rgba(251, 191, 36, 0.8)', glow: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)' },
  alert: { hud: 'rgba(249, 115, 22, 0.85)', glow: 'rgba(249, 115, 22, 0.25)', border: 'rgba(249, 115, 22, 0.5)' },
  'red-alert': { hud: 'rgba(239, 68, 68, 0.9)', glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.6)' },
};
