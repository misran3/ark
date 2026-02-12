// TODO: Wire up to deployed API when snapshot/budget endpoints exist
// For now, these functions return mock data directly (no localhost calls)
import { DEMO_SNAPSHOT } from '@/lib/data/demo-financial-data';

export interface FinancialSnapshot {
  accounts: Array<{
    account_id: string;
    type: 'checking' | 'savings' | 'credit_card';
    balance: number;
    nickname: string;
  }>;
  total_net_worth: number;
  monthly_income: number;
  monthly_spending: number;
  snapshot_timestamp: string;
}

export interface BudgetReport {
  monthly_income: number;
  needs: {
    target_pct: number;
    actual_pct: number;
    actual_amount: number;
    status: 'on_track' | 'warning' | 'critical';
  };
  wants: {
    target_pct: number;
    actual_pct: number;
    actual_amount: number;
    status: 'on_track' | 'warning' | 'critical';
  };
  savings: {
    target_pct: number;
    actual_pct: number;
    actual_amount: number;
    status: 'on_track' | 'warning' | 'critical';
  };
  overall_health: number;
}

export interface CaptainNovaResponse {
  message: string;
  tools_used: string[];
  confidence: number;
}

// Mock data for development
const MOCK_SNAPSHOT: FinancialSnapshot = {
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

const MOCK_BUDGET: BudgetReport = {
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

// API Functions — mock data until deployed endpoints exist
export async function fetchFinancialSnapshot(): Promise<FinancialSnapshot> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return DEMO_SNAPSHOT;
  return MOCK_SNAPSHOT;
}

export async function fetchBudgetReport(): Promise<BudgetReport> {
  return MOCK_BUDGET;
}

export async function queryCaptainNova(query: {
  type: string;
  message?: string;
}): Promise<CaptainNovaResponse> {
  const responses: Record<string, string> = {
    status: 'Systems nominal, Commander. All financial sectors operational. Life Support at optimal efficiency.',
    threats: 'Threat matrix analyzed. Multiple incoming objects detected. Recommend immediate defensive protocols.',
    shields: 'Shield systems ready for activation. VISA Transaction Controls standing by for your command.',
  };

  return {
    message: responses[query.type] || 'Systems online, Commander. Standing by.',
    tools_used: ['financial_snapshot', 'threat_scanner'],
    confidence: 0.85,
  };
}

export async function deflectAsteroid(asteroidId: string): Promise<{ success: boolean }> {
  return { success: true };
}
