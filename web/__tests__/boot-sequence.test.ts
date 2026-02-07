import { describe, expect, test } from 'bun:test';
import { useBootStore } from '@/lib/stores/boot-store';

describe('Boot Sequence State Machine', () => {
  test('boot store initializes with correct defaults', () => {
    useBootStore.getState().reset();
    const state = useBootStore.getState();

    expect(state.phase).toBe('black');
    expect(state.progress).toBe(0);
    expect(state.globalIntensity).toBe(1.0);
    expect(state.isBooting).toBe(true);
    expect(state.bootComplete).toBe(false);
  });

  test('phase transitions update derived state', () => {
    useBootStore.getState().reset();

    useBootStore.getState().setPhase('emergency');
    let state = useBootStore.getState();
    expect(state.phase).toBe('emergency');
    expect(state.isBooting).toBe(true);
    expect(state.bootComplete).toBe(false);

    useBootStore.getState().setPhase('complete');
    state = useBootStore.getState();
    expect(state.phase).toBe('complete');
    expect(state.isBooting).toBe(false);
    expect(state.bootComplete).toBe(true);
  });

  test('skipBoot sets correct end state', () => {
    useBootStore.getState().reset();

    useBootStore.getState().skipBoot();
    const state = useBootStore.getState();
    expect(state.phase).toBe('complete');
    expect(state.globalIntensity).toBe(0.96);
    expect(state.isBooting).toBe(false);
    expect(state.bootComplete).toBe(true);
  });

  test('globalIntensity can be updated', () => {
    useBootStore.getState().reset();
    let state = useBootStore.getState();

    expect(state.globalIntensity).toBe(1.0);

    useBootStore.getState().setGlobalIntensity(0.96);
    state = useBootStore.getState();
    expect(state.globalIntensity).toBe(0.96);

    useBootStore.getState().setGlobalIntensity(0.92);
    state = useBootStore.getState();
    expect(state.globalIntensity).toBe(0.92);
  });

  test('completeBoot sets correct end state', () => {
    useBootStore.getState().reset();

    useBootStore.getState().completeBoot();
    const state = useBootStore.getState();
    expect(state.phase).toBe('complete');
    expect(state.globalIntensity).toBe(0.96);
    expect(state.isBooting).toBe(false);
    expect(state.bootComplete).toBe(true);
  });

  test('reset returns to initial state', () => {
    // Modify state
    useBootStore.getState().setPhase('hud-rise');
    useBootStore.getState().setProgress(75);
    useBootStore.getState().setGlobalIntensity(0.96);

    // Reset
    useBootStore.getState().reset();
    const state = useBootStore.getState();

    expect(state.phase).toBe('black');
    expect(state.progress).toBe(0);
    expect(state.globalIntensity).toBe(1.0);
    expect(state.isBooting).toBe(true);
    expect(state.bootComplete).toBe(false);
  });
});
