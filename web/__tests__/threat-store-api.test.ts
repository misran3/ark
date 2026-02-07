import { describe, expect, test, beforeEach } from 'bun:test';
import { useThreatStore, type Threat } from '@/lib/stores/threat-store';

beforeEach(() => {
  useThreatStore.setState({ threats: [], hoveredThreat: null });
});

describe('loadFromAPI', () => {
  test('replaces all existing threats with new ones', () => {
    // Start with a threat
    useThreatStore.getState().addThreat({
      id: 'old',
      type: 'asteroid',
      position: [0, 0, -10],
      size: 1,
      color: '#fff',
      label: 'OLD',
      detail: 'old',
      amount: 10,
      severity: 'info',
      deflected: false,
      createdAt: Date.now(),
    });

    const newThreats: Threat[] = [
      {
        id: 'new-1',
        type: 'ion_storm',
        position: [1, 2, -15],
        size: 1.5,
        color: '#a855f7',
        label: 'NEW',
        detail: 'new',
        amount: 100,
        severity: 'warning',
        deflected: false,
        createdAt: Date.now(),
      },
    ];

    useThreatStore.getState().loadFromAPI(newThreats);
    const threats = useThreatStore.getState().threats;
    expect(threats.length).toBe(1);
    expect(threats[0].id).toBe('new-1');
  });
});
