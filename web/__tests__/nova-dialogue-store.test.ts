import { describe, expect, test, beforeEach } from 'bun:test';
import { useNovaDialogueStore, type DialogueMessage } from '@/lib/stores/nova-dialogue-store';

beforeEach(() => {
  useNovaDialogueStore.getState().reset();
});

describe('NovaDialogueStore', () => {
  test('initializes idle with empty queue', () => {
    const state = useNovaDialogueStore.getState();
    expect(state.state).toBe('idle');
    expect(state.currentMessage).toBeNull();
    expect(state.queue).toEqual([]);
  });

  test('enqueue adds message to queue', () => {
    const msg: DialogueMessage = {
      id: 'test-1',
      text: 'Hello Commander',
      priority: 'high',
      category: 'greeting',
    };
    useNovaDialogueStore.getState().enqueue(msg);
    expect(useNovaDialogueStore.getState().queue.length).toBe(1);
  });

  test('high priority messages jump to front of queue', () => {
    const low: DialogueMessage = { id: 'low', text: 'Low', priority: 'normal', category: 'detail' };
    const high: DialogueMessage = { id: 'high', text: 'High', priority: 'high', category: 'greeting' };

    useNovaDialogueStore.getState().enqueue(low);
    useNovaDialogueStore.getState().enqueue(high);

    const queue = useNovaDialogueStore.getState().queue;
    expect(queue[0].id).toBe('high');
    expect(queue[1].id).toBe('low');
  });

  test('next() pops first message and sets state to speaking', () => {
    const msg: DialogueMessage = { id: 'test', text: 'Test', priority: 'normal', category: 'detail' };
    useNovaDialogueStore.getState().enqueue(msg);
    useNovaDialogueStore.getState().next();

    const state = useNovaDialogueStore.getState();
    expect(state.state).toBe('speaking');
    expect(state.currentMessage?.id).toBe('test');
    expect(state.queue.length).toBe(0);
  });

  test('dismiss() clears current and returns to idle when queue empty', () => {
    const msg: DialogueMessage = { id: 'test', text: 'Test', priority: 'normal', category: 'detail' };
    useNovaDialogueStore.getState().enqueue(msg);
    useNovaDialogueStore.getState().next();
    useNovaDialogueStore.getState().dismiss();

    const state = useNovaDialogueStore.getState();
    expect(state.state).toBe('idle');
    expect(state.currentMessage).toBeNull();
  });

  test('dismiss() auto-advances to next message when queue non-empty', () => {
    const msg1: DialogueMessage = { id: '1', text: 'First', priority: 'normal', category: 'detail' };
    const msg2: DialogueMessage = { id: '2', text: 'Second', priority: 'normal', category: 'detail' };
    useNovaDialogueStore.getState().enqueue(msg1);
    useNovaDialogueStore.getState().enqueue(msg2);
    useNovaDialogueStore.getState().next();
    useNovaDialogueStore.getState().dismiss();

    const state = useNovaDialogueStore.getState();
    expect(state.state).toBe('speaking');
    expect(state.currentMessage?.id).toBe('2');
  });

  test('speakForThreat replaces any existing normal-priority message', () => {
    const msg: DialogueMessage = { id: 'old', text: 'Old', priority: 'normal', category: 'detail', threatId: 'old-threat' };
    useNovaDialogueStore.getState().enqueue(msg);
    useNovaDialogueStore.getState().next();

    useNovaDialogueStore.getState().speakForThreat('new-threat', 'New threat verdict');

    const state = useNovaDialogueStore.getState();
    expect(state.currentMessage?.threatId).toBe('new-threat');
    expect(state.currentMessage?.text).toBe('New threat verdict');
  });

  test('reset clears everything', () => {
    const msg: DialogueMessage = { id: 'test', text: 'Test', priority: 'normal', category: 'detail' };
    useNovaDialogueStore.getState().enqueue(msg);
    useNovaDialogueStore.getState().next();
    useNovaDialogueStore.getState().reset();

    const state = useNovaDialogueStore.getState();
    expect(state.state).toBe('idle');
    expect(state.currentMessage).toBeNull();
    expect(state.queue).toEqual([]);
  });
});
