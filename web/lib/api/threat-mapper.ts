import type { Threat } from '@/lib/stores/threat-store';
import type {
  AllScansResult,
  BudgetOverrunItem,
  SubscriptionItem,
  UpcomingBillItem,
  DebtItem,
  MissedRewardItem,
  FraudAlertItem,
} from './captain-types';

/** Simple hash for deterministic positioning from a string key */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Each threat type gets a sector angle (radians) so they cluster in different regions */
const SECTOR_ANGLES: Record<Threat['type'], number> = {
  asteroid: 0,                    // 12 o'clock
  ion_storm: Math.PI / 3,        // 2 o'clock
  solar_flare: (2 * Math.PI) / 3, // 4 o'clock
  black_hole: Math.PI,           // 6 o'clock
  wormhole: (4 * Math.PI) / 3,   // 8 o'clock
  enemy_cruiser: (5 * Math.PI) / 3, // 10 o'clock
};

const THREAT_COLORS: Record<Threat['type'], string> = {
  asteroid: '#ff5733',
  ion_storm: '#a855f7',
  solar_flare: '#fbbf24',
  black_hole: '#4c1d95',
  wormhole: '#60a5fa',
  enemy_cruiser: '#991b1b',
};

function positionInSector(
  type: Threat['type'],
  index: number,
  key: string,
): [number, number, number] {
  const baseAngle = SECTOR_ANGLES[type];
  const h = hashCode(key);
  // Spread items within a ±30° arc of their sector
  const spread = ((h % 100) / 100 - 0.5) * (Math.PI / 3);
  const angle = baseAngle + spread;
  // Distance from origin: 15-25 range
  const distance = 15 + (index * 4) + ((Math.abs(h) % 5));
  const x = Math.sin(angle) * (distance * 0.3);
  const y = ((h % 50) / 50 - 0.5) * 4; // -2 to +2 vertical
  const z = -distance;
  return [
    Math.round(x * 10) / 10,
    Math.round(y * 10) / 10,
    Math.round(z * 10) / 10,
  ];
}

function severityFromPctOver(pct: number): Threat['severity'] {
  if (pct > 100) return 'danger';
  if (pct > 50) return 'warning';
  return 'info';
}

export function mapScansToThreats(scans: AllScansResult): Threat[] {
  const threats: Threat[] = [];

  // Subscriptions → Asteroids
  if (scans.subscriptions) {
    scans.subscriptions.subscriptions.forEach((item: SubscriptionItem, i: number) => {
      threats.push({
        id: `sub-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'asteroid',
        position: positionInSector('asteroid', i, item.name),
        size: Math.min(0.5 + item.monthly_cost / 30, 2.5),
        color: THREAT_COLORS.asteroid,
        label: `${item.name.toUpperCase()} $${item.monthly_cost}/mo`,
        detail: item.verdict,
        amount: item.monthly_cost,
        severity: item.last_used_days_ago > 30 ? 'danger' : 'warning',
        deflected: false,
        createdAt: Date.now(),
        seed: hashCode(item.name),
        angularVelocity: [0.35, 0.5, 0.2],
      });
    });
  }

  // Budget Overruns → Ion Storms
  if (scans.budgetOverruns) {
    scans.budgetOverruns.overruns.forEach((item: BudgetOverrunItem, i: number) => {
      if (item.overspend_amount <= 0) return; // Under budget — not a threat
      threats.push({
        id: `overrun-${item.category}`,
        type: 'ion_storm',
        position: positionInSector('ion_storm', i, item.category),
        size: Math.min(0.8 + item.pct_over / 100, 3),
        color: THREAT_COLORS.ion_storm,
        label: `${item.category.toUpperCase()} +${Math.round(item.pct_over)}%`,
        detail: item.verdict,
        amount: item.overspend_amount,
        severity: severityFromPctOver(item.pct_over),
        deflected: false,
        createdAt: Date.now(),
      });
    });
  }

  // Upcoming Bills → Solar Flares
  if (scans.upcomingBills) {
    scans.upcomingBills.bills.forEach((item: UpcomingBillItem, i: number) => {
      threats.push({
        id: `bill-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'solar_flare',
        position: positionInSector('solar_flare', i, item.name),
        size: Math.min(0.8 + item.amount / 200, 3),
        color: THREAT_COLORS.solar_flare,
        label: `${item.name.toUpperCase()} $${item.amount}`,
        detail: item.verdict,
        amount: item.amount,
        severity: item.amount > 500 ? 'danger' : item.amount > 100 ? 'warning' : 'info',
        deflected: false,
        createdAt: Date.now(),
      });
    });
  }

  // Debt Spirals → Black Holes
  if (scans.debtSpirals) {
    scans.debtSpirals.debts.forEach((item: DebtItem, i: number) => {
      threats.push({
        id: `debt-${item.account.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'black_hole',
        position: positionInSector('black_hole', i, item.account),
        size: Math.min(1 + item.balance / 2000, 3),
        color: THREAT_COLORS.black_hole,
        label: `${item.account.toUpperCase()} $${item.balance.toLocaleString()}`,
        detail: item.verdict,
        amount: item.balance,
        severity: item.apr > 20 ? 'danger' : item.apr > 10 ? 'warning' : 'info',
        deflected: false,
        createdAt: Date.now(),
      });
    });
  }

  // Missed Rewards → Wormholes
  if (scans.missedRewards) {
    scans.missedRewards.missed_rewards.forEach((item: MissedRewardItem, i: number) => {
      threats.push({
        id: `reward-${item.category}`,
        type: 'wormhole',
        position: positionInSector('wormhole', i, item.category),
        size: Math.min(0.6 + item.cash_value_lost / 5, 2),
        color: THREAT_COLORS.wormhole,
        label: `${item.category.toUpperCase()} REWARDS`,
        detail: item.verdict,
        amount: item.cash_value_lost,
        severity: 'info',
        deflected: false,
        createdAt: Date.now(),
      });
    });
  }

  // Fraud Alerts → Enemy Cruisers
  if (scans.fraudAlerts) {
    scans.fraudAlerts.alerts.forEach((item: FraudAlertItem, i: number) => {
      threats.push({
        id: `fraud-${item.merchant.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'enemy_cruiser',
        position: positionInSector('enemy_cruiser', i, item.merchant),
        size: Math.min(0.8 + item.amount / 200, 2.5),
        color: THREAT_COLORS.enemy_cruiser,
        label: `${item.merchant.toUpperCase()} $${item.amount}`,
        detail: item.verdict,
        amount: item.amount,
        severity: item.risk_score > 0.4 ? 'danger' : item.risk_score > 0.2 ? 'warning' : 'info',
        deflected: false,
        createdAt: Date.now(),
      });
    });
  }

  return threats;
}
