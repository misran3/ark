import { FinancialSnapshot, BudgetReport } from '@/lib/api-client';

export interface MockScenario {
  id: string;
  name: string;
  description: string;
  snapshot: FinancialSnapshot;
  budget: BudgetReport;
}

// Default scenario uses values from api-client.ts
const DEFAULT_SNAPSHOT: FinancialSnapshot = {
  accounts: [
    { account_id: '1', type: 'checking', balance: 4832, nickname: 'Main Checking' },
    { account_id: '2', type: 'savings', balance: 18400, nickname: 'Emergency Fund' },
    { account_id: '3', type: 'credit_card', balance: -1240, nickname: 'Chase Sapphire' },
  ],
  total_net_worth: 47832,
  monthly_income: 6240,
  monthly_spending: 3891,
  snapshot_timestamp: new Date().toISOString(),
};

const DEFAULT_BUDGET: BudgetReport = {
  monthly_income: 6240,
  needs: {
    target_pct: 50,
    actual_pct: 48,
    actual_amount: 2995,
    status: 'on_track',
  },
  wants: {
    target_pct: 30,
    actual_pct: 37,
    actual_amount: 2309,
    status: 'warning',
  },
  savings: {
    target_pct: 20,
    actual_pct: 15,
    actual_amount: 936,
    status: 'warning',
  },
  overall_health: 72,
};

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Balanced user with solid income and moderate spending',
    snapshot: DEFAULT_SNAPSHOT,
    budget: DEFAULT_BUDGET,
  },
  {
    id: 'high-earner',
    name: 'High Earner',
    description: 'High income with strong savings discipline',
    snapshot: {
      accounts: [
        { account_id: '1', type: 'checking', balance: 15000, nickname: 'Main Checking' },
        { account_id: '2', type: 'savings', balance: 85000, nickname: 'Emergency Fund' },
        { account_id: '3', type: 'credit_card', balance: -500, nickname: 'Chase Sapphire' },
      ],
      total_net_worth: 250000,
      monthly_income: 18000,
      monthly_spending: 6500,
      snapshot_timestamp: new Date().toISOString(),
    },
    budget: {
      monthly_income: 18000,
      needs: {
        target_pct: 50,
        actual_pct: 28,
        actual_amount: 5040,
        status: 'on_track',
      },
      wants: {
        target_pct: 30,
        actual_pct: 18,
        actual_amount: 3240,
        status: 'on_track',
      },
      savings: {
        target_pct: 20,
        actual_pct: 54,
        actual_amount: 9720,
        status: 'on_track',
      },
      overall_health: 92,
    },
  },
  {
    id: 'college-student',
    name: 'College Student',
    description: 'Student with limited income and student loans',
    snapshot: {
      accounts: [
        { account_id: '1', type: 'checking', balance: 892, nickname: 'Checking' },
        { account_id: '2', type: 'savings', balance: 1200, nickname: 'Savings' },
        { account_id: '3', type: 'credit_card', balance: -2845, nickname: 'Student Credit Card' },
      ],
      total_net_worth: -32000,
      monthly_income: 1800,
      monthly_spending: 1650,
      snapshot_timestamp: new Date().toISOString(),
    },
    budget: {
      monthly_income: 1800,
      needs: {
        target_pct: 50,
        actual_pct: 72,
        actual_amount: 1296,
        status: 'critical',
      },
      wants: {
        target_pct: 30,
        actual_pct: 22,
        actual_amount: 396,
        status: 'on_track',
      },
      savings: {
        target_pct: 20,
        actual_pct: 6,
        actual_amount: 108,
        status: 'critical',
      },
      overall_health: 42,
    },
  },
  {
    id: 'debt-crisis',
    name: 'Debt Crisis',
    description: 'High debt load with negative net worth',
    snapshot: {
      accounts: [
        { account_id: '1', type: 'checking', balance: 1200, nickname: 'Checking' },
        { account_id: '2', type: 'savings', balance: 500, nickname: 'Savings' },
        { account_id: '3', type: 'credit_card', balance: -15000, nickname: 'Credit Card 1' },
      ],
      total_net_worth: -32000,
      monthly_income: 4200,
      monthly_spending: 5800,
      snapshot_timestamp: new Date().toISOString(),
    },
    budget: {
      monthly_income: 4200,
      needs: {
        target_pct: 50,
        actual_pct: 76,
        actual_amount: 3192,
        status: 'critical',
      },
      wants: {
        target_pct: 30,
        actual_pct: 24,
        actual_amount: 1008,
        status: 'warning',
      },
      savings: {
        target_pct: 20,
        actual_pct: 0,
        actual_amount: 0,
        status: 'critical',
      },
      overall_health: 28,
    },
  },
  {
    id: 'new-user',
    name: 'New User (Empty)',
    description: 'Fresh account with minimal financial history',
    snapshot: {
      accounts: [],
      total_net_worth: 0,
      monthly_income: 0,
      monthly_spending: 0,
      snapshot_timestamp: new Date().toISOString(),
    },
    budget: {
      monthly_income: 0,
      needs: {
        target_pct: 50,
        actual_pct: 0,
        actual_amount: 0,
        status: 'on_track',
      },
      wants: {
        target_pct: 30,
        actual_pct: 0,
        actual_amount: 0,
        status: 'on_track',
      },
      savings: {
        target_pct: 20,
        actual_pct: 0,
        actual_amount: 0,
        status: 'on_track',
      },
      overall_health: 0,
    },
  },
];
