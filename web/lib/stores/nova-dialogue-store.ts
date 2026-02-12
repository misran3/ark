import { create } from 'zustand';

export interface DialogueMessage {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'normal';
  category: 'greeting' | 'nudge' | 'detail';
  threatId?: string;
}

type NovaDialogueState = 'idle' | 'speaking';

interface NovaDialogueStore {
  state: NovaDialogueState;
  queue: DialogueMessage[];
  currentMessage: DialogueMessage | null;
  enqueue: (msg: DialogueMessage) => void;
  next: () => void;
  dismiss: () => void;
  speakForThreat: (threatId: string, text: string) => void;
  reset: () => void;
}

const PRIORITY_ORDER: Record<DialogueMessage['priority'], number> = {
  high: 0,
  medium: 1,
  normal: 2,
};

export const useNovaDialogueStore = create<NovaDialogueStore>((set, get) => ({
  state: 'idle',
  queue: [],
  currentMessage: null,

  enqueue: (msg) => {
    set((s) => {
      const newQueue = [...s.queue, msg].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      );
      return { queue: newQueue };
    });
  },

  next: () => {
    const { queue } = get();
    if (queue.length === 0) {
      set({ state: 'idle', currentMessage: null });
      return;
    }
    const [first, ...rest] = queue;
    set({ state: 'speaking', currentMessage: first, queue: rest });
  },

  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [first, ...rest] = queue;
      set({ state: 'speaking', currentMessage: first, queue: rest });
    } else {
      set({ state: 'idle', currentMessage: null });
    }
  },

  speakForThreat: (threatId, text) => {
    set({
      state: 'speaking',
      queue: [], // clear stale queue so dismiss doesn't replay old messages
      currentMessage: {
        id: `threat-${threatId}`,
        text,
        priority: 'normal',
        category: 'detail',
        threatId,
      },
    });
  },

  reset: () => {
    set({ state: 'idle', queue: [], currentMessage: null });
  },
}));
