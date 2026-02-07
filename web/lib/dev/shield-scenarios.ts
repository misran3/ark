// Shield scenarios for different user financial situations
export const SHIELD_SCENARIOS: Record<string, Record<string, number>> = {
  'Healthy User': {
    'life-support': 88,
    'recreation-deck': 75,
    'warp-fuel': 95,
  },
  'Struggling': {
    'life-support': 65,
    'recreation-deck': 35,
    'warp-fuel': 50,
  },
  'Critical': {
    'life-support': 40,
    'recreation-deck': 15,
    'warp-fuel': 22,
  },
  'Just Got Paid': {
    'life-support': 95,
    'recreation-deck': 92,
    'warp-fuel': 98,
  },
};
