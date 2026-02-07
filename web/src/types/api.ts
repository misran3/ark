/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

/**
 * Bank account summary from Nessie or other data source.
 */
export interface AccountSummary {
  account_id: string;
  type: "checking" | "savings" | "credit_card";
  balance: number;
  nickname: string;
  source: "nessie" | "plaid" | "visa" | "mock";
}
/**
 * Financial threat requiring user attention.
 */
export interface Asteroid {
  id: string;
  threat_type: "subscription_renewal" | "budget_overrun" | "unused_service" | "spending_spike" | "bill_due";
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  amount: number;
  days_until: number;
  recommended_action: "deflect" | "absorb" | "redirect";
  reasoning: string;
}
/**
 * Single bucket (needs/wants/savings) in 50/30/20 budget.
 */
export interface BucketBreakdown {
  target_pct: number;
  target_amount: number;
  actual_amount: number;
  actual_pct: number;
  status: "on_track" | "warning" | "critical";
  breakdown: {
    [k: string]: number;
  };
}
/**
 * Full 50/30/20 budget analysis.
 */
export interface BudgetReport {
  monthly_income: number;
  needs: BucketBreakdown;
  wants: BucketBreakdown;
  savings: BucketBreakdown;
  overall_health: number;
  overspend_categories: {
    [k: string]: unknown;
  }[];
  credit_card_impact: number;
}
/**
 * Captain Nova's response to user query.
 */
export interface CaptainResponse {
  message: string;
  tools_used: string[];
  confidence: number;
  suggested_visa_controls?: VisaControlRule[] | null;
}
/**
 * VISA Transaction Control rule for spending limits.
 */
export interface VisaControlRule {
  rule_id: string;
  card_id: string;
  control_type: "spending_limit" | "merchant_category_block" | "transaction_type_block" | "location_block";
  threshold?: number | null;
  merchant_categories?: string[] | null;
  is_active: boolean;
  created_by: "user" | "captain_nova";
}
/**
 * Aggregated view of user's financial state at a point in time.
 */
export interface FinancialSnapshot {
  accounts: AccountSummary[];
  recent_transactions: Transaction[];
  total_net_worth: number;
  monthly_income: number;
  monthly_spending: number;
  snapshot_timestamp: string;
}
/**
 * Individual financial transaction with categorization.
 */
export interface Transaction {
  id: string;
  account_id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  is_recurring: boolean;
  next_expected_date?: string | null;
  bucket?: ("needs" | "wants" | "savings" | "income") | null;
}
/**
 * VISA transaction alert notification.
 */
export interface VisaAlert {
  alert_id: string;
  card_id: string;
  alert_type: "threshold_exceeded" | "category_spike" | "unusual_transaction" | "budget_breach";
  transaction_amount: number;
  merchant: string;
  message: string;
  timestamp: string;
}
