const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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

// API Functions
export async function fetchFinancialSnapshot(): Promise<FinancialSnapshot> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/snapshot`);
    if (!response.ok) throw new Error('Failed to fetch snapshot');
    return response.json();
  } catch (error) {
    console.warn('Using mock data for snapshot:', error);
    return MOCK_SNAPSHOT;
  }
}

export async function fetchBudgetReport(): Promise<BudgetReport> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/budget`);
    if (!response.ok) throw new Error('Failed to fetch budget');
    return response.json();
  } catch (error) {
    console.warn('Using mock data for budget:', error);
    return MOCK_BUDGET;
  }
}

export async function queryCaptainNova(query: {
  type: string;
  message?: string;
}): Promise<CaptainNovaResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/captain/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    if (!response.ok) throw new Error('Captain Nova query failed');
    return response.json();
  } catch (error) {
    console.warn('Captain Nova offline, using local responses:', error);

    // Fallback responses
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
}

export async function deflectAsteroid(asteroidId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/asteroids/${asteroidId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deflect' }),
    });
    if (!response.ok) throw new Error('Failed to deflect asteroid');
    return response.json();
  } catch (error) {
    console.warn('Asteroid deflection simulated locally:', error);
    return { success: true };
  }
}
