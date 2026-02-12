import type { AllScansResult } from './captain-types';

/**
 * Hardcoded scan data from Captain_Analysis.md for demo mode.
 * Activate with NEXT_PUBLIC_DEMO_MODE=true
 */
export const DEMO_SCANS: AllScansResult = {
  financialMeaning: {
    greeting:
      'Commander, incoming distress signal from your financial navigation system. Our sensors detect a critical hull breach in your income shields, with expenditure thrusters firing at full burn while our fuel reserves rapidly deplete.',
    verdict:
      'Survival forecast indicates financial life support will sustain operations for only 4.1 months before total system failure, with a monthly deficit of $3,072.13 consuming your $12,500 savings reserves.',
    status: 'critical',
  },
  subscriptions: {
    subscriptions: [
      {
        name: 'Gym Membership',
        monthly_cost: 49.99,
        last_used_days_ago: 47,
        verdict: 'Zero usage for 47 days — renews in 5d. Recommend immediate cancellation.',
      },
      {
        name: 'Netflix',
        monthly_cost: 15.99,
        last_used_days_ago: 3,
        verdict: 'Active usage detected — maintain current subscription.',
      },
      {
        name: 'Hulu',
        monthly_cost: 17.99,
        last_used_days_ago: 38,
        verdict: 'No usage in over a month — consider cancellation to recover fuel reserves.',
      },
      {
        name: 'Cloud Storage',
        monthly_cost: 9.99,
        last_used_days_ago: 60,
        verdict: 'Dormant storage module — 2.1 GB of 200 GB used. Downgrade or eliminate.',
      },
    ],
    total_annual_waste: 935.64,
    verdict:
      'Asteroid field detected — 3 dormant subscriptions draining $78/mo in fuel reserves.',
  },
  budgetOverruns: {
    overruns: [
      {
        category: 'rent',
        budget_amount: 500.0,
        actual_amount: 1650.0,
        overspend_amount: 1150.0,
        pct_over: 230.0,
        volatility: 'low',
        verdict:
          'Reroute power from crew quarters — stabilize life support sector by finding more affordable habitat module',
      },
      {
        category: 'shopping',
        budget_amount: 300.0,
        actual_amount: 647.06,
        overspend_amount: 347.06,
        pct_over: 115.69,
        volatility: 'high',
        verdict:
          'Divert excess power from crew entertainment — cut impulse purchases to recover critical energy reserves',
      },
      {
        category: 'groceries',
        budget_amount: 500.0,
        actual_amount: 434.33,
        overspend_amount: -65.67,
        pct_over: -13.13,
        volatility: 'medium',
        verdict:
          'Food sector consumption approaching critical levels — optimize supply chain efficiency',
      },
    ],
    overall_budget_status: 'critical',
    verdict:
      'Massive ion storm detected — multiple sectors drawing catastrophic levels of power, immediate grid recalibration required!',
  },
  upcomingBills: {
    bills: [],
    total_upcoming_30_days: 0.0,
    verdict:
      'No solar flares on the horizon — clear skies ahead, Commander. Our financial shields are fully charged with a Main Checking balance of $4,250 and an Emergency Fund of $12,500.',
  },
  debtSpirals: {
    debts: [
      {
        account: 'Rewards Card',
        balance: 1847.0,
        apr: 24.99,
        monthly_interest: 38.25,
        minimum_payment_months: 58,
        recommended_payment: 350.0,
        recommended_months: 6,
        interest_saved: 1207.36,
        verdict:
          'Orbiting the event horizon at minimum thrust — $1,207 in gravitational drag avoided by engaging full thrusters',
      },
    ],
    total_debt: 1847.0,
    total_monthly_interest: 38.25,
    urgency: 'critical',
    verdict:
      'Black hole detected with $1,847 gravitational pull — engage thrusters at $350/month to reach escape velocity',
  },
  missedRewards: {
    missed_rewards: [
      {
        category: 'shopping',
        current_card: 'Main Checking',
        optimal_card: 'Rewards Card',
        transactions_affected: 8,
        points_lost: 500,
        cash_value_lost: 5.0,
        verdict:
          'Redirect shopping transactions through the Rewards Card wormhole to capture bonus points',
      },
      {
        category: 'dining',
        current_card: 'Main Checking',
        optimal_card: 'Rewards Card',
        transactions_affected: 3,
        points_lost: 300,
        cash_value_lost: 3.0,
        verdict:
          'Plot a course through the dining rewards wormhole with the Rewards Card',
      },
    ],
    annual_opportunity_cost: 96.0,
    verdict:
      'Missed wormhole shortcuts totaling $96/year — recalibrate card routing to optimal reward frequencies!',
  },
  fraudAlerts: {
    alerts: [
      {
        merchant: 'Best Buy',
        amount: 199.99,
        date: '2026-01-10T00:00:00Z',
        risk_score: 0.5,
        indicators: ['amount_anomaly'],
        recommended_action: 'monitor',
        verdict:
          'High-value unidentified bogey detected in shopping sector - recommend tracking on long-range sensors',
      },
      {
        merchant: 'Sushi Palace',
        amount: 72.0,
        date: '2026-01-14T00:00:00Z',
        risk_score: 0.25,
        indicators: ['unusual_category'],
        recommended_action: 'allow',
        verdict:
          'Occasional culinary expedition detected - no immediate threat',
      },
    ],
    overall_risk: 'elevated',
    verdict:
      'Potential hostile transactions detected - recommend maintaining elevated sensor vigilance',
  },
};
