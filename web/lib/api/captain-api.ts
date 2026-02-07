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

// Direct to deployed API Gateway — CORS is enabled (Access-Control-Allow-Origin: *)
export const CAPTAIN_API_BASE =
  'https://three-years-doubt.loca.lt/api/captain';

async function fetchEndpoint<T>(path: string): Promise<T | null> {
  try {
    console.log(`[CaptainAPI] Fetching ${path}...`);
    const res = await fetch(`${CAPTAIN_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[CaptainAPI] ${path} returned ${res.status}`);
      return null;
    }
    const data = (await res.json()) as T;
    console.log(`[CaptainAPI] ${path} OK`);
    return data;
  } catch (err) {
    console.error(`[CaptainAPI] ${path} FAILED:`, err);
    return null;
  }
}

/** 7 parallel calls — each stays under API Gateway's 29s timeout independently */
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
