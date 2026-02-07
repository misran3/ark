import { create } from 'zustand';

export type PowerState = 'off' | 'boot' | 'running';

interface PowerStore {
  /** Global power state for the bridge */
  state: PowerState;
  /** Per-element power states (keyed by element ID) */
  elements: Record<string, PowerState>;
  /** Per-element error states (data load failure → malfunction visuals) */
  errors: Record<string, boolean>;
  /** Set global power state */
  setPowerState: (state: PowerState) => void;
  /** Set individual element power state */
  setElementPower: (id: string, state: PowerState) => void;
  /** Set individual element error state */
  setElementError: (id: string, hasError: boolean) => void;
  /** Trigger cold start — sequence all elements from off → boot → running */
  coldStart: () => void;
  /** Trigger power failure — reverse all elements to off */
  powerFailure: () => void;
  /** Internal: tracked timeout IDs for sequence cancellation */
  _timeoutIds: ReturnType<typeof setTimeout>[];
}

/**
 * Power state lifecycle management
 *
 * Cold start sequence (staggered):
 * 1. Dashboard wells illuminate (200ms stagger per well)
 * 2. Instrument canvases initialize (needle sweep, drum roll)
 * 3. HUD elements appear
 * 4. Glass reflection fades in
 *
 * Power failure reverses this: running → off
 * Reversible for dramatic moments.
 */
export const usePowerStore = create<PowerStore>((set, get) => ({
  state: 'off',
  elements: {},
  errors: {},
  _timeoutIds: [],

  setPowerState: (state) => set({ state }),

  setElementPower: (id, state) =>
    set((prev) => ({
      elements: { ...prev.elements, [id]: state },
    })),

  setElementError: (id, hasError) =>
    set((prev) => ({
      errors: { ...prev.errors, [id]: hasError },
    })),

  coldStart: () => {
    const store = get();
    // Clear any in-flight sequence
    store._timeoutIds.forEach(clearTimeout);
    const ids: ReturnType<typeof setTimeout>[] = [];

    const { setElementPower, setPowerState } = store;
    setPowerState('boot');

    // Stage 1: Dashboard wells (0-400ms)
    const wells = ['inst-01', 'inst-02', 'inst-03', 'inst-04'];
    wells.forEach((id, i) => {
      ids.push(setTimeout(() => setElementPower(id, 'boot'), i * 100));
    });

    // Stage 2: Instruments initialize (400-1200ms)
    wells.forEach((id, i) => {
      ids.push(setTimeout(() => setElementPower(id, 'running'), 400 + i * 200));
    });

    // Stage 3: Left data strip
    ids.push(setTimeout(() => setElementPower('left-strip', 'boot'), 300));
    ids.push(setTimeout(() => setElementPower('left-strip', 'running'), 800));

    // Stage 4: HUD elements
    ids.push(setTimeout(() => setElementPower('hud-top', 'boot'), 800));
    ids.push(setTimeout(() => setElementPower('hud-top', 'running'), 1200));
    ids.push(setTimeout(() => setElementPower('hud-threats', 'boot'), 900));
    ids.push(setTimeout(() => setElementPower('hud-threats', 'running'), 1300));

    // Stage 5: Glass reflection
    ids.push(setTimeout(() => setElementPower('glass', 'boot'), 1000));
    ids.push(setTimeout(() => setElementPower('glass', 'running'), 1500));

    // Global running state
    ids.push(setTimeout(() => setPowerState('running'), 1500));

    set({ _timeoutIds: ids });
  },

  powerFailure: () => {
    const store = get();
    // Clear any in-flight cold start
    store._timeoutIds.forEach(clearTimeout);
    const ids: ReturnType<typeof setTimeout>[] = [];

    const { elements, setElementPower, setPowerState } = store;
    setPowerState('off');

    const elementIds = Object.keys(elements);
    elementIds.forEach((id, i) => {
      ids.push(setTimeout(() => setElementPower(id, 'off'), i * 50));
    });

    set({ _timeoutIds: ids });
  },
}));
