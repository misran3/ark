import type { CreditCardData } from './fleet-cards';

// ─── Demo Transactions ─────────────────────────────────────────────────────
// Consistent with Captain_Analysis.md data:
//   Rent: $1,650 | Shopping: $647.06 | Groceries: $434.33
//   Fraud flags: Best Buy $199.99, Sushi Palace $72
//   Missed rewards: shopping + dining on Main Checking instead of Rewards Card

export interface DemoTransaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  cardUsed: string;
  cardLastFour: string;
  bucket: 'needs' | 'wants' | 'savings' | 'income';
  isRecurring: boolean;
}

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  // ── Rent ──
  { id: 'tx-01', merchant: 'Rent Payment', category: 'rent', amount: -1650.00, date: '2026-01-01', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: true },
  // ── Groceries ($434.33 total) ──
  { id: 'tx-02', merchant: 'Whole Foods', category: 'groceries', amount: -112.50, date: '2026-01-03', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: false },
  { id: 'tx-03', merchant: 'Kroger', category: 'groceries', amount: -145.83, date: '2026-01-12', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: false },
  { id: 'tx-04', merchant: "Trader Joe's", category: 'groceries', amount: -98.50, date: '2026-01-18', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: false },
  { id: 'tx-05', merchant: 'Whole Foods', category: 'groceries', amount: -77.50, date: '2026-01-24', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: false },
  // ── Shopping ($647.06 total — on Main Checking = missed rewards) ──
  { id: 'tx-06', merchant: 'Target', category: 'shopping', amount: -62.18, date: '2026-01-05', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  { id: 'tx-07', merchant: 'Best Buy', category: 'shopping', amount: -199.99, date: '2026-01-10', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  { id: 'tx-08', merchant: 'Amazon', category: 'shopping', amount: -89.99, date: '2026-01-17', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  { id: 'tx-09', merchant: 'H&M', category: 'shopping', amount: -134.90, date: '2026-01-22', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  { id: 'tx-10', merchant: 'Nordstrom', category: 'shopping', amount: -160.00, date: '2026-01-28', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  // ── Dining (on Main Checking = missed rewards) ──
  { id: 'tx-11', merchant: 'Uber Eats', category: 'dining', amount: -34.50, date: '2026-01-06', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  { id: 'tx-12', merchant: 'Sushi Palace', category: 'dining', amount: -72.00, date: '2026-01-14', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  { id: 'tx-13', merchant: 'Chipotle', category: 'dining', amount: -14.85, date: '2026-01-25', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'wants', isRecurring: false },
  // ── Subscriptions (on Rewards Card) ──
  { id: 'tx-14', merchant: 'Netflix', category: 'entertainment', amount: -15.99, date: '2026-01-07', cardUsed: 'Rewards Card', cardLastFour: '4829', bucket: 'wants', isRecurring: true },
  { id: 'tx-15', merchant: 'Spotify', category: 'entertainment', amount: -10.99, date: '2026-01-20', cardUsed: 'Rewards Card', cardLastFour: '4829', bucket: 'wants', isRecurring: true },
  { id: 'tx-16', merchant: 'Gym Membership', category: 'fitness', amount: -49.99, date: '2026-01-30', cardUsed: 'Rewards Card', cardLastFour: '4829', bucket: 'wants', isRecurring: true },
  // ── Utilities & Transport ──
  { id: 'tx-17', merchant: 'Electric Bill', category: 'utilities', amount: -142.00, date: '2026-01-28', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: true },
  { id: 'tx-18', merchant: 'Shell Gas', category: 'transport', amount: -48.30, date: '2026-01-15', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'needs', isRecurring: false },
  // ── Income ──
  { id: 'tx-19', merchant: 'Payroll Deposit', category: 'income', amount: 1200.00, date: '2026-01-15', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'income', isRecurring: true },
  { id: 'tx-20', merchant: 'Payroll Deposit', category: 'income', amount: 1200.00, date: '2026-01-31', cardUsed: 'Main Checking', cardLastFour: '8821', bucket: 'income', isRecurring: true },
];

// ─── Demo Fleet Cards ───────────────────────────────────────────────────────
// Aligned to Captain_Analysis.md: "Main Checking" + "Rewards Card"
// Third card fills the 3-card hologram display

export const DEMO_FLEET_CARDS: CreditCardData[] = [
  {
    id: 'rewards-card',
    name: 'REWARDS CARD',
    cardNumber: '•••• •••• •••• 4829',
    brandMark: 'hexagon',
    brandColor: [50, 100, 220],
    utilization: 37, // $1,847 / $5,000
    limit: 5000,
    benefits: ['2X all purchases', '3X dining', 'No foreign transaction fees', '$100 travel credit'],
  },
  {
    id: 'travel-plus',
    name: 'TRAVEL PLUS',
    cardNumber: '•••• •••• •••• 7103',
    brandMark: 'squares',
    brandColor: [210, 170, 50],
    utilization: 12,
    limit: 10000,
    benefits: ['5X flights & hotels', 'Airport lounge access', 'Trip insurance', '$300 travel credit'],
  },
  {
    id: 'cashback',
    name: 'CASHBACK',
    cardNumber: '•••• •••• •••• 5561',
    brandMark: 'arc',
    brandColor: [230, 120, 50],
    utilization: 5,
    limit: 8000,
    benefits: ['1.5% unlimited cashback', 'No annual fee', 'Free FICO score', '0% intro APR 15mo'],
  },
];

export const DEMO_FLEET_STATS = {
  totalLimit: DEMO_FLEET_CARDS.reduce((sum, c) => sum + c.limit, 0),
  totalBalance: DEMO_FLEET_CARDS.reduce((sum, c) => sum + Math.round(c.limit * (c.utilization / 100)), 0),
  avgUtilization: Math.round(DEMO_FLEET_CARDS.reduce((sum, c) => sum + c.utilization, 0) / DEMO_FLEET_CARDS.length),
};

// ─── Demo Financial Snapshot ────────────────────────────────────────────────
// Aspirational mid-career portfolio for orrery visualization
// Gross: $790K | Liabilities: $395K | Net Worth: $395K

export const DEMO_SNAPSHOT = {
  accounts: [
    { account_id: 'home', type: 'real-estate' as const, balance: 520_000, nickname: 'Home' },
    { account_id: 'investments', type: 'investment' as const, balance: 180_000, nickname: 'Investment Portfolio' },
    { account_id: 'emergency-fund', type: 'savings' as const, balance: 25_000, nickname: 'Emergency Fund' },
    { account_id: 'suv', type: 'vehicle' as const, balance: 35_000, nickname: 'Vehicle — SUV' },
    { account_id: 'sedan', type: 'vehicle' as const, balance: 22_000, nickname: 'Vehicle — Sedan' },
    { account_id: 'crypto', type: 'crypto' as const, balance: 8_000, nickname: 'Crypto' },
    { account_id: 'mortgage', type: 'liability' as const, balance: -380_000, nickname: 'Mortgage' },
    { account_id: 'auto-loan', type: 'liability' as const, balance: -15_000, nickname: 'Auto Loan' },
  ],
  total_net_worth: 395_000,
  gross_assets: 790_000,
  total_liabilities: 395_000,
  monthly_income: 8_500,
  monthly_spending: 6_200,
  snapshot_timestamp: new Date().toISOString(),
};

// ─── Transaction Log Format ─────────────────────────────────────────────────
// Simplified format for TransactionLogFace console display

export const DEMO_TRANSACTION_LOG = DEMO_TRANSACTIONS
  .filter((t) => t.category !== 'income')
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map((t) => ({
    time: new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    label: t.merchant.toUpperCase(),
    amount: t.amount,
  }));

// ─── Demo Star Chart Stations ───────────────────────────────────────────────
// Groups DEMO_TRANSACTIONS by category into StationConfig format

export interface DemoStationConfig {
  type: string;
  label: string;
  position: [number, number, number];
  amount: number;
  isIncome: boolean;
  transactions: DemoTransaction[];
}

function groupTransactionsByCategory(): DemoStationConfig[] {
  const groups = new Map<string, DemoTransaction[]>();
  for (const tx of DEMO_TRANSACTIONS) {
    const existing = groups.get(tx.category) || [];
    existing.push(tx);
    groups.set(tx.category, existing);
  }

  const positions: [number, number, number][] = [
    [-1.2, 0.8, -0.3],
    [1.0, 0.4, 0.2],
    [-0.6, -0.5, 0.1],
    [0.8, -0.8, -0.2],
    [-1.4, -0.3, 0.3],
    [1.4, 0.9, -0.1],
    [-0.3, 1.2, 0.2],
    [0.4, -1.1, -0.3],
    [-1.0, 0.0, -0.4],
    [1.3, -0.2, 0.4],
  ];

  let i = 0;
  const stations: DemoStationConfig[] = [];
  for (const [category, txns] of groups) {
    const total = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const isIncome = category === 'income';
    stations.push({
      type: category,
      label: category.toUpperCase(),
      position: positions[i % positions.length],
      amount: Math.round(total),
      isIncome,
      transactions: txns,
    });
    i++;
  }
  return stations;
}

export const DEMO_STATIONS = groupTransactionsByCategory();
