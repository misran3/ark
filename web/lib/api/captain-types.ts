// web/lib/api/captain-types.ts

// --- Specialist response types ---

export interface FinancialMeaningScan {
  greeting: string;
  verdict: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface SubscriptionItem {
  name: string;
  monthly_cost: number;
  last_used_days_ago: number;
  verdict: string;
}

export interface SubscriptionScan {
  subscriptions: SubscriptionItem[];
  total_annual_waste: number;
  verdict: string;
}

export interface BudgetOverrunItem {
  category: string;
  budget_amount: number;
  actual_amount: number;
  overspend_amount: number;
  pct_over: number;
  volatility: 'low' | 'medium' | 'high';
  verdict: string;
}

export interface BudgetOverrunScan {
  overruns: BudgetOverrunItem[];
  overall_budget_status: 'healthy' | 'warning' | 'critical';
  verdict: string;
}

export interface UpcomingBillItem {
  name: string;
  amount: number;
  due_date: string;
  verdict: string;
}

export interface UpcomingBillScan {
  bills: UpcomingBillItem[];
  total_upcoming_30_days: number;
  verdict: string;
}

export interface DebtItem {
  account: string;
  balance: number;
  apr: number;
  monthly_interest: number;
  minimum_payment_months: number;
  recommended_payment: number;
  recommended_months: number;
  interest_saved: number;
  verdict: string;
}

export interface DebtSpiralScan {
  debts: DebtItem[];
  total_debt: number;
  total_monthly_interest: number;
  urgency: 'low' | 'warning' | 'critical';
  verdict: string;
}

export interface MissedRewardItem {
  category: string;
  current_card: string;
  optimal_card: string;
  transactions_affected: number;
  points_lost: number;
  cash_value_lost: number;
  verdict: string;
}

export interface MissedRewardScan {
  missed_rewards: MissedRewardItem[];
  annual_opportunity_cost: number;
  verdict: string;
}

export interface FraudAlertItem {
  merchant: string;
  amount: number;
  date: string;
  risk_score: number;
  indicators: string[];
  recommended_action: 'allow' | 'monitor' | 'block';
  verdict: string;
}

export interface FraudAlertScan {
  alerts: FraudAlertItem[];
  overall_risk: 'low' | 'elevated' | 'high';
  verdict: string;
}

/** All 7 scan results bundled together */
export interface AllScansResult {
  financialMeaning: FinancialMeaningScan | null;
  subscriptions: SubscriptionScan | null;
  budgetOverruns: BudgetOverrunScan | null;
  upcomingBills: UpcomingBillScan | null;
  debtSpirals: DebtSpiralScan | null;
  missedRewards: MissedRewardScan | null;
  fraudAlerts: FraudAlertScan | null;
}
