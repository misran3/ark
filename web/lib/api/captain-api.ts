import type {
  FinancialMeaningScan,
  SubscriptionScan,
  BudgetOverrunScan,
  UpcomingBillScan,
  DebtSpiralScan,
  MissedRewardScan,
  FraudAlertScan,
  AllScansResult,
} from './captain-types';

export const CAPTAIN_API_BASE =
  'https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain';

async function fetchEndpoint<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${CAPTAIN_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchAllScans(): Promise<AllScansResult> {
  const [
    financialMeaning,
    subscriptions,
    budgetOverruns,
    upcomingBills,
    debtSpirals,
    missedRewards,
    fraudAlerts,
  ] = await Promise.all([
    fetchEndpoint<FinancialMeaningScan>('/specialists/financial-meaning'),
    fetchEndpoint<SubscriptionScan>('/specialists/subscriptions'),
    fetchEndpoint<BudgetOverrunScan>('/specialists/budget-overruns'),
    fetchEndpoint<UpcomingBillScan>('/specialists/upcoming-bills'),
    fetchEndpoint<DebtSpiralScan>('/specialists/debt-spirals'),
    fetchEndpoint<MissedRewardScan>('/specialists/missed-rewards'),
    fetchEndpoint<FraudAlertScan>('/specialists/fraud-detection'),
  ]);

  return {
    financialMeaning,
    subscriptions,
    budgetOverruns,
    upcomingBills,
    debtSpirals,
    missedRewards,
    fraudAlerts,
  };
}
