export interface CreditCardData {
  id: string;
  name: string;
  cardNumber: string;
  brandMark: 'hexagon' | 'squares' | 'arc';
  brandColor: [number, number, number];
  utilization: number; // 0-100
  limit: number;
  benefits: string[];
}

export const FLEET_CARDS: CreditCardData[] = [
  {
    id: 'sapphire',
    name: 'SAPPHIRE',
    cardNumber: '•••• •••• •••• 4829',
    brandMark: 'hexagon',
    brandColor: [50, 100, 220],
    utilization: 23,
    limit: 22000,
    benefits: ['3X dining & travel', '₡300 travel credit', 'Priority Pass', 'Trip insurance'],
  },
  {
    id: 'amex-gold',
    name: 'AMEX GOLD',
    cardNumber: '•••• •••• •••• 7103',
    brandMark: 'squares',
    brandColor: [210, 170, 50],
    utilization: 67,
    limit: 18000,
    benefits: ['4X restaurants', '4X supermarkets', '₡120 dining credit', '₡120 Uber Cash'],
  },
  {
    id: 'discover',
    name: 'DISCOVER',
    cardNumber: '•••• •••• •••• 5561',
    brandMark: 'arc',
    brandColor: [230, 120, 50],
    utilization: 82,
    limit: 12400,
    benefits: ['5% rotating categories', 'Cashback match yr 1', 'No annual fee', 'Free FICO'],
  },
];

export const FLEET_STATS = {
  totalLimit: FLEET_CARDS.reduce((sum, c) => sum + c.limit, 0),
  totalBalance: FLEET_CARDS.reduce((sum, c) => sum + Math.round(c.limit * (c.utilization / 100)), 0),
  avgUtilization: Math.round(FLEET_CARDS.reduce((sum, c) => sum + c.utilization, 0) / FLEET_CARDS.length),
};

// Demo mode re-exports — aligned to Captain_Analysis.md
import { DEMO_FLEET_CARDS, DEMO_FLEET_STATS } from './demo-financial-data';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const ACTIVE_FLEET_CARDS: CreditCardData[] = isDemo ? DEMO_FLEET_CARDS : FLEET_CARDS;
export const ACTIVE_FLEET_STATS = isDemo ? DEMO_FLEET_STATS : FLEET_STATS;
