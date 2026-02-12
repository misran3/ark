import { create } from 'zustand';

// ── Asset Types ──────────────────────────────────────────────────
export type AssetType = 'real-estate' | 'investment' | 'vehicle' | 'savings' | 'crypto';

export type AssetGeometry =
  | 'sphere'             // Home — terrestrial, stable
  | 'icosahedron-ringed' // Investment Portfolio — Saturn-style ring
  | 'octahedron'         // Vehicles — angular, compact
  | 'sphere-shielded'    // Emergency Fund — pulsing shield glow
  | 'crystal';           // Crypto — jagged/volatile

export type AssetStatus = 'NOMINAL' | 'CAUTION' | 'CRITICAL';

// ── Deep Scan Data ───────────────────────────────────────────────
export interface CostBreakdown {
  label: string;
  amount: number;
}

export interface DeepScanData {
  // real-estate
  purchasePrice?: number;
  appreciationRate?: number;   // e.g. 3.2 for +3.2%/yr
  monthlyCost?: number;
  costBreakdown?: CostBreakdown[];
  equityBuilt?: number;

  // investment
  allocation?: { label: string; pct: number }[];
  ytdReturn?: number;          // e.g. 8.4 for +8.4%
  monthlyContribution?: number;

  // vehicle
  depreciationRate?: number;   // e.g. -12 for -12%/yr
  mileage?: number;

  // savings
  apy?: number;                // e.g. 4.5 for 4.5%
  monthlyDeposit?: number;
  monthsCoverage?: number;

  // crypto
  holdings?: string[];         // e.g. ['BTC', 'ETH', 'SOL']
  volatility30d?: number;      // e.g. 18 for ±18%
  costBasis?: number;
}

// ── Liability ────────────────────────────────────────────────────
export interface Liability {
  id: string;
  name: string;
  amount: number;
}

// ── Asset ────────────────────────────────────────────────────────
export interface Asset {
  id: string;
  name: string;
  value: number;
  type: AssetType;
  geometry: AssetGeometry;
  status: AssetStatus;

  // Orbital layout
  orbitRing: number;           // 1–4 (inner to outer)
  orbitRadius: number;         // World-space distance from center
  fixedAngle: number;          // Radians — fixed position on ring

  // Computed from value
  size: number;                // Planet radius (log scale)

  // Trend
  trendPct: number;            // 6-month trend (e.g. +3.2)
  netWorthShare: number;       // Percentage of gross assets

  // Deep scan
  deepScan: DeepScanData;
}

// ── Sizing formula ───────────────────────────────────────────────
// size = 0.3 + log10(value / 1000) * 0.25
function computeSize(value: number): number {
  if (value <= 0) return 0.3;
  return 0.3 + Math.log10(value / 1000) * 0.25;
}

// ── Orbital radii ────────────────────────────────────────────────
const RING_RADII = {
  1: 2.8,   // Home
  2: 4.2,   // Investment Portfolio
  3: 5.8,   // Emergency Fund
  4: 7.2,   // Crypto
} as const;

export const DEBRIS_BELT_RADIUS = 5.0; // Between rings 2 and 3

// ── Angle helpers ────────────────────────────────────────────────
const deg = (d: number) => (d * Math.PI) / 180;

// ── Gross assets ─────────────────────────────────────────────────
const GROSS_ASSETS = 733_000;

function share(value: number): number {
  return Math.round((value / GROSS_ASSETS) * 1000) / 10; // one decimal
}

// ── Status from trend ────────────────────────────────────────────
function statusFromTrend(trendPct: number): AssetStatus {
  if (trendPct >= 0) return 'NOMINAL';
  if (trendPct >= -5) return 'CAUTION';
  return 'CRITICAL';
}

// ── Default assets ───────────────────────────────────────────────
const DEFAULT_ASSETS: Asset[] = [
  {
    id: 'home',
    name: 'Home',
    value: 520_000,
    type: 'real-estate',
    geometry: 'sphere',
    status: 'NOMINAL',
    orbitRing: 1,
    orbitRadius: RING_RADII[1],
    fixedAngle: deg(45),
    size: computeSize(520_000),
    trendPct: 3.2,
    netWorthShare: share(520_000),
    deepScan: {
      purchasePrice: 450_000,
      appreciationRate: 3.2,
      monthlyCost: 2_840,
      costBreakdown: [
        { label: 'Mortgage', amount: 2_200 },
        { label: 'Insurance', amount: 180 },
        { label: 'Maintenance', amount: 460 },
      ],
      equityBuilt: 140_000,
    },
  },
  {
    id: 'investments',
    name: 'Investment Portfolio',
    value: 180_000,
    type: 'investment',
    geometry: 'icosahedron-ringed',
    status: 'NOMINAL',
    orbitRing: 2,
    orbitRadius: RING_RADII[2],
    fixedAngle: deg(200),
    size: computeSize(180_000),
    trendPct: 8.4,
    netWorthShare: share(180_000),
    deepScan: {
      allocation: [
        { label: 'Stocks', pct: 70 },
        { label: 'Bonds', pct: 20 },
        { label: 'International', pct: 10 },
      ],
      ytdReturn: 8.4,
      monthlyContribution: 1_200,
    },
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    value: 25_000,
    type: 'savings',
    geometry: 'sphere-shielded',
    status: 'NOMINAL',
    orbitRing: 3,
    orbitRadius: RING_RADII[3],
    fixedAngle: deg(0),
    size: computeSize(25_000),
    trendPct: 2.1,
    netWorthShare: share(25_000),
    deepScan: {
      apy: 4.5,
      monthlyDeposit: 500,
      monthsCoverage: 5.2,
    },
  },
  {
    id: 'crypto',
    name: 'Crypto',
    value: 8_000,
    type: 'crypto',
    geometry: 'crystal',
    status: 'NOMINAL',
    orbitRing: 4,
    orbitRadius: RING_RADII[4],
    fixedAngle: deg(160),
    size: computeSize(8_000),
    trendPct: 22.5,
    netWorthShare: share(8_000),
    deepScan: {
      holdings: ['BTC', 'ETH', 'SOL'],
      volatility30d: 18,
      costBasis: 6_200,
    },
  },
];

/** Ordered asset IDs for keyboard navigation cycling */
export const ASSET_NAV_ORDER = DEFAULT_ASSETS.map((a) => a.id);

// ── Default liabilities ──────────────────────────────────────────
const DEFAULT_LIABILITIES: Liability[] = [
  { id: 'mortgage', name: 'Mortgage', amount: 380_000 },
];

// ── Store ────────────────────────────────────────────────────────
interface AssetState {
  assets: Asset[];
  liabilities: Liability[];
  totalLiabilities: number;
  netWorth: number;
  grossAssets: number;
  trendPct: number;
  getAssetHealth: () => number;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: DEFAULT_ASSETS,
  liabilities: DEFAULT_LIABILITIES,
  totalLiabilities: 380_000,
  netWorth: 353_000,
  grossAssets: 733_000,
  trendPct: 4.2,
  getAssetHealth: () => {
    const state = get();
    if (state.grossAssets === 0) return 0;
    return Math.max(0, Math.min(1, state.netWorth / state.grossAssets));
  },
}));

// ── Re-exports for convenience ───────────────────────────────────
export { RING_RADII };
