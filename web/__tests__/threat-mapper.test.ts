import { describe, expect, test } from 'bun:test';
import { mapScansToThreats } from '@/lib/api/threat-mapper';
import type { AllScansResult } from '@/lib/api/captain-types';

const EMPTY_SCANS: AllScansResult = {
  financialMeaning: null,
  subscriptions: null,
  budgetOverruns: null,
  upcomingBills: null,
  debtSpirals: null,
  missedRewards: null,
  fraudAlerts: null,
};

describe('mapScansToThreats', () => {
  test('returns empty array when all scans are null', () => {
    const threats = mapScansToThreats(EMPTY_SCANS);
    expect(threats).toEqual([]);
  });

  test('maps budget overruns to ion_storm threats', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      budgetOverruns: {
        overruns: [
          {
            category: 'rent',
            budget_amount: 500,
            actual_amount: 1650,
            overspend_amount: 1150,
            pct_over: 230,
            volatility: 'low',
            verdict: 'Reroute power from crew quarters',
          },
        ],
        overall_budget_status: 'critical',
        verdict: 'Massive ion storm detected',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(1);
    expect(threats[0].type).toBe('ion_storm');
    expect(threats[0].label).toBe('RENT +230%');
    expect(threats[0].detail).toBe('Reroute power from crew quarters');
    expect(threats[0].amount).toBe(1150);
    expect(threats[0].severity).toBe('danger');
  });

  test('maps subscriptions to asteroid threats', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      subscriptions: {
        subscriptions: [
          {
            name: 'Gym Membership',
            monthly_cost: 49.99,
            last_used_days_ago: 47,
            verdict: 'Cancel immediately',
          },
        ],
        total_annual_waste: 599.88,
        verdict: 'Asteroid field detected',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(1);
    expect(threats[0].type).toBe('asteroid');
    expect(threats[0].amount).toBe(49.99);
  });

  test('maps debt spirals to black_hole threats', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      debtSpirals: {
        debts: [
          {
            account: 'Rewards Card',
            balance: 1847,
            apr: 24.99,
            monthly_interest: 38.25,
            minimum_payment_months: 58,
            recommended_payment: 350,
            recommended_months: 6,
            interest_saved: 1207.36,
            verdict: 'Orbiting the event horizon',
          },
        ],
        total_debt: 1847,
        total_monthly_interest: 38.25,
        urgency: 'critical',
        verdict: 'Black hole detected',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(1);
    expect(threats[0].type).toBe('black_hole');
    expect(threats[0].severity).toBe('danger');
  });

  test('maps fraud alerts to enemy_cruiser threats', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      fraudAlerts: {
        alerts: [
          {
            merchant: 'Best Buy',
            amount: 199.99,
            date: '2026-01-10T00:00:00Z',
            risk_score: 0.5,
            indicators: ['amount_anomaly'],
            recommended_action: 'monitor',
            verdict: 'High-value unidentified bogey',
          },
        ],
        overall_risk: 'elevated',
        verdict: 'Hostile transactions detected',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(1);
    expect(threats[0].type).toBe('enemy_cruiser');
    expect(threats[0].label).toBe('BEST BUY $199.99');
  });

  test('maps missed rewards to wormhole threats', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      missedRewards: {
        missed_rewards: [
          {
            category: 'shopping',
            current_card: 'Main Checking',
            optimal_card: 'Rewards Card',
            transactions_affected: 8,
            points_lost: 500,
            cash_value_lost: 5.0,
            verdict: 'Redirect shopping transactions',
          },
        ],
        annual_opportunity_cost: 96,
        verdict: 'Missed wormhole shortcuts',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(1);
    expect(threats[0].type).toBe('wormhole');
    expect(threats[0].severity).toBe('info');
  });

  test('maps upcoming bills to solar_flare threats', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      upcomingBills: {
        bills: [
          {
            name: 'Electric Bill',
            amount: 150,
            due_date: '2026-02-15',
            verdict: 'Solar flare approaching',
          },
        ],
        total_upcoming_30_days: 150,
        verdict: 'Flares detected',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(1);
    expect(threats[0].type).toBe('solar_flare');
  });

  test('skips empty item arrays (no threats for clear categories)', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      subscriptions: {
        subscriptions: [],
        total_annual_waste: 0,
        verdict: 'Asteroid field clear',
      },
      budgetOverruns: {
        overruns: [],
        overall_budget_status: 'healthy',
        verdict: 'All clear',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats).toEqual([]);
  });

  test('assigns deterministic positions by threat type sector', () => {
    const scans: AllScansResult = {
      ...EMPTY_SCANS,
      budgetOverruns: {
        overruns: [
          { category: 'rent', budget_amount: 500, actual_amount: 1650, overspend_amount: 1150, pct_over: 230, volatility: 'low', verdict: 'v1' },
          { category: 'shopping', budget_amount: 300, actual_amount: 647, overspend_amount: 347, pct_over: 115, volatility: 'high', verdict: 'v2' },
        ],
        overall_budget_status: 'critical',
        verdict: 'Storm detected',
      },
    };

    const threats = mapScansToThreats(scans);
    expect(threats.length).toBe(2);
    // Both are ion_storms, so positions should be in the same sector but not identical
    expect(threats[0].position).not.toEqual(threats[1].position);
  });
});
