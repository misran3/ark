import { describe, expect, test, beforeEach } from 'bun:test';
import { useBootStore } from '@/lib/stores/boot-store';

describe('Boot Sequence v2.0 State Machine', () => {
  beforeEach(() => {
    useBootStore.getState().reset();
  });

  test('boot store initializes with correct defaults', () => {
    const state = useBootStore.getState();

    expect(state.phase).toBe('start-screen');
    expect(state.consoleIntensity).toBe(0);
    expect(state.hasSeenBoot).toBe(false);
    expect(state.isBooting).toBe(true);
  });

  test('setPhase transitions to new phase', () => {
    useBootStore.getState().setPhase('console-glow');
    const state = useBootStore.getState();
    expect(state.phase).toBe('console-glow');
    expect(state.isBooting).toBe(true);
  });

  test('setPhase to complete sets isBooting false', () => {
    useBootStore.getState().setPhase('complete');
    const state = useBootStore.getState();
    expect(state.phase).toBe('complete');
    expect(state.isBooting).toBe(false);
  });

  test('startBoot transitions to name-exit and marks hasSeenBoot', () => {
    useBootStore.getState().startBoot();
    const state = useBootStore.getState();

    expect(state.phase).toBe('name-exit');
    expect(state.hasSeenBoot).toBe(true);
    expect(state.isBooting).toBe(true);
  });

  test('skipBoot sets correct end state', () => {
    useBootStore.getState().skipBoot();
    const state = useBootStore.getState();

    expect(state.phase).toBe('complete');
    expect(state.consoleIntensity).toBe(0.96);
    expect(state.isBooting).toBe(false);
  });

  test('setConsoleIntensity updates intensity', () => {
    useBootStore.getState().setConsoleIntensity(0.5);
    expect(useBootStore.getState().consoleIntensity).toBe(0.5);

    useBootStore.getState().setConsoleIntensity(0.96);
    expect(useBootStore.getState().consoleIntensity).toBe(0.96);
  });

  test('setHasSeenBoot updates flag', () => {
    expect(useBootStore.getState().hasSeenBoot).toBe(false);

    useBootStore.getState().setHasSeenBoot(true);
    expect(useBootStore.getState().hasSeenBoot).toBe(true);
  });

  test('reset returns to initial state', () => {
    // Modify state
    useBootStore.getState().startBoot();
    useBootStore.getState().setConsoleIntensity(0.8);
    useBootStore.getState().setPhase('power-surge');

    // Reset
    useBootStore.getState().reset();
    const state = useBootStore.getState();

    expect(state.phase).toBe('start-screen');
    expect(state.consoleIntensity).toBe(0);
    expect(state.hasSeenBoot).toBe(false);
    expect(state.isBooting).toBe(true);
  });

  test('full phase sequence is valid', () => {
    const phases = [
      'start-screen',
      'name-exit',
      'darkness',
      'console-glow',
      'power-surge',
      'full-power',
      'complete',
    ] as const;

    // Walk through all phases
    for (const phase of phases) {
      useBootStore.getState().setPhase(phase);
      expect(useBootStore.getState().phase).toBe(phase);
    }

    // Final phase should not be booting
    expect(useBootStore.getState().isBooting).toBe(false);
  });
});
