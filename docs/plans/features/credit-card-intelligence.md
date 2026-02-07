# Feature Spec: Credit Card Intelligence

**Feature ID:** `FINANCIAL-001`
**Category:** Financial Intelligence
**Priority:** P0 (Must-have for MVP)
**Status:** 🔴 Not Started
**Current Version:** 0.0
**Target Version:** 1.0

---

## Overview

Credit Card Intelligence is the AI-powered system that analyzes your credit card portfolio, understands each card's rewards structure, and provides smart recommendations for which card to use for each transaction to maximize value. It's the brain behind wormhole threats, solar flare routing, and the overall card optimization strategy.

**The Core Magic:** AI learns your cards' rules (categories, bonuses, caps) and automatically suggests the optimal card for every spend, turning every transaction into a rewards-maximizing opportunity.

---

## System Architecture

### Data Model

**Card Profile:**
```typescript
interface CreditCard {
  id: string;
  name: string; // "Chase Sapphire Reserve"
  issuer: string; // "Chase"
  network: string; // "Visa"
  last4: string; // "1234"

  // Rewards structure
  rewards: RewardsRule[];
  annualFee: number;
  bonusCategories: BonusCategory[];
  spendingCaps: SpendingCap[];

  // Benefits
  benefits: Benefit[];
  protections: Protection[];

  // Usage tracking
  currentSpend: number; // Month-to-date
  pointsEarned: number; // This month
  status: 'active' | 'inactive' | 'locked';
}

interface RewardsRule {
  category: string; // "dining", "travel", "all"
  multiplier: number; // 3 (means 3x points)
  pointType: string; // "Chase UR", "Cash Back"
  conditions?: string[]; // ["Direct with airline", "Not resellers"]
}

interface BonusCategory {
  category: string;
  multiplier: number;
  cap?: number; // Quarterly cap (e.g., $1,500 spend limit)
  expires?: Date; // Rotating category end date
}

interface SpendingCap {
  category: string;
  monthlyLimit?: number;
  quarterlyLimit?: number;
  annualLimit?: number;
}
```

**Example Card Data:**
```json
{
  "id": "card_sapphire_reserve",
  "name": "Chase Sapphire Reserve",
  "issuer": "Chase",
  "network": "Visa",
  "last4": "5678",
  "annualFee": 550,
  "rewards": [
    {
      "category": "travel",
      "multiplier": 3,
      "pointType": "Chase Ultimate Rewards"
    },
    {
      "category": "dining",
      "multiplier": 3,
      "pointType": "Chase Ultimate Rewards"
    },
    {
      "category": "all",
      "multiplier": 1,
      "pointType": "Chase Ultimate Rewards"
    }
  ],
  "bonusCategories": [],
  "spendingCaps": []
}
```

---

## AI Analysis Engine

### Card Optimization Algorithm

**Pydantic AI Agent:**

```python
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import List

class CardRecommendation(BaseModel):
    recommended_card_id: str
    card_name: str
    points_earned: float
    value_estimate: float  # In dollars
    reasoning: str
    alternative_cards: List[dict]  # Runner-ups

class TransactionAnalysis(BaseModel):
    transaction_category: str
    merchant: str
    amount: float
    recommendation: CardRecommendation

card_optimizer = Agent(
    model='claude-sonnet-4-5',
    result_type=TransactionAnalysis,
    system_prompt="""You are a credit card rewards optimization AI.

Your job: Recommend the best card for each transaction to maximize rewards value.

Consider:
1. Category multipliers (dining, travel, gas, etc.)
2. Spending caps (quarterly limits on bonus categories)
3. Point value (Chase UR = $0.015, Cash back = $0.01, etc.)
4. Annual fees (amortize over year)
5. Current spend toward caps

Logic:
- Choose card with highest $ value (points × value_per_point)
- If tied, prefer card with lower annual fee
- Warn if category cap approaching
- Suggest activation if rotating category not active

Output:
- Clear recommendation with reasoning
- Show math: "3x points × $0.015 = $0.045 per dollar"
- Alternative options if close
"""
)

async def analyze_transaction(
    merchant: str,
    amount: float,
    category: str,
    cards: List[CreditCard]
) -> TransactionAnalysis:
    """Get AI recommendation for which card to use."""

    # Build card portfolio summary
    portfolio_summary = "\n".join([
        f"- {card.name} ({card.last4}): "
        f"{', '.join([f'{r.category}={r.multiplier}x' for r in card.rewards])}"
        for card in cards
    ])

    result = await card_optimizer.run(
        f"""Transaction: ${amount:.2f} at {merchant}
Category: {category}

Available cards:
{portfolio_summary}

Which card should be used to maximize rewards value?"""
    )

    return result.data
```

---

## Frontend Integration

### Card Selector Component

**CardSelector.tsx:**

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassPanel } from '@/components/ui/GlassPanel';

interface CardOption {
  id: string;
  name: string;
  last4: string;
  pointsEarned: number;
  valueEstimate: number;
  reasoning: string;
  isRecommended: boolean;
}

export function CardSelector({
  merchant,
  amount,
  category,
  onSelect
}: CardSelectorProps) {
  const { data: recommendation } = useQuery({
    queryKey: ['card-recommendation', merchant, amount, category],
    queryFn: () => apiClient.post('/cards/recommend', {
      merchant,
      amount,
      category
    })
  });

  return (
    <GlassPanel level={3} className="card-selector">
      <h3>Select Payment Card</h3>

      <div className="recommended-card">
        <div className="badge">✨ Recommended</div>
        <CardOption
          card={recommendation.recommended}
          highlight
        />
        <div className="reasoning">
          {recommendation.reasoning}
        </div>
      </div>

      {recommendation.alternatives.length > 0 && (
        <details className="alternatives">
          <summary>Other options</summary>
          {recommendation.alternatives.map(alt => (
            <CardOption key={alt.id} card={alt} />
          ))}
        </details>
      )}

      <button onClick={() => onSelect(recommendation.recommended.id)}>
        Confirm — Use {recommendation.recommended.name}
      </button>
    </GlassPanel>
  );
}
```

---

## Intelligence Features

### 1. Automatic Category Detection

**Merchant → Category Mapping:**

```python
# Use AI to categorize merchants
async def categorize_merchant(merchant: str) -> str:
    """Determine transaction category from merchant name."""
    categories = [
        "dining", "groceries", "gas", "travel",
        "entertainment", "shopping", "bills", "other"
    ]

    # Use Claude to intelligently categorize
    result = await category_agent.run(
        f"Categorize this merchant: {merchant}\n"
        f"Choose from: {', '.join(categories)}"
    )

    return result.data.category
```

**Learning from Past:**
```python
# Cache user's category choices
def learn_from_transaction(txn: Transaction):
    """Remember user's category assignment for merchant."""
    merchant_cache[txn.merchant] = txn.category
    # Future txns from same merchant auto-categorized
```

### 2. Spending Cap Tracking

**Quarterly Cap Monitor:**

```python
def check_spending_cap(card: CreditCard, category: str, amount: float) -> dict:
    """Check if spending cap is approaching."""
    cap = get_cap_for_category(card, category)
    if not cap:
        return {'status': 'unlimited'}

    current_spend = get_category_spend(card, category, 'quarter')
    remaining = cap - current_spend
    utilization = (current_spend / cap) * 100

    if utilization >= 100:
        return {
            'status': 'exceeded',
            'message': f"Cap reached: ${cap:,.0f} limit"
        }
    elif utilization >= 80:
        return {
            'status': 'warning',
            'message': f"Cap approaching: ${remaining:,.0f} left"
        }
    else:
        return {
            'status': 'ok',
            'remaining': remaining
        }
```

**UI Indicator:**
```
Chase Freedom: Grocery 5x
⚠️ Cap: $680 / $1,500 (45% used)
```

### 3. Rotating Category Activation

**Reminder System:**

```python
def check_activation_needed(card: CreditCard) -> Optional[str]:
    """Check if rotating category needs activation."""
    if card.issuer == "Chase" and card.name.includes("Freedom"):
        current_quarter = get_current_quarter()
        if not is_category_activated(card, current_quarter):
            return f"Activate Q{current_quarter} 5x category: {get_category_name(current_quarter)}"
    return None
```

**Activation CTA:**
```
🔔 ACTION REQUIRED
Activate Q1 2026 bonus: Grocery stores (5x)
[ACTIVATE NOW] → Opens Chase website
```

### 4. Annual Fee Justification

**ROI Calculator:**

```python
def calculate_card_roi(card: CreditCard) -> dict:
    """Calculate if annual fee is worth it."""
    annual_fee = card.annualFee
    annual_rewards_value = sum([
        txn.amount * get_multiplier(card, txn.category) * point_value
        for txn in get_transactions(card, 'year')
    ])

    roi = annual_rewards_value - annual_fee

    return {
        'fee': annual_fee,
        'rewards': annual_rewards_value,
        'net': roi,
        'worth_it': roi > 0,
        'breakeven_spend': annual_fee / average_multiplier / point_value
    }
```

**UI Display:**
```
Chase Sapphire Reserve
Annual Fee: $550
Rewards Earned: $1,245
Net Value: +$695 ✅ Worth it!

To break even: Spend $3,667/mo on bonus categories
Current pace: $4,200/mo ✅ On track
```

---

## Acceptance Criteria

### ✅ Intelligence Quality

- [ ] Recommendations match manual calculations (100% accuracy)
- [ ] Category detection is correct (> 90% accuracy)
- [ ] Spending cap warnings trigger at right time (80% utilization)
- [ ] ROI calculations account for all factors (fees, caps, multipliers)

### ✅ User Experience

- [ ] Recommendations are fast (< 500ms response)
- [ ] Reasoning is clear and understandable
- [ ] Alternative cards are shown (user choice preserved)
- [ ] Card selector UI is intuitive
- [ ] Value estimates are trustworthy (cite math)

### ✅ Integration

- [ ] Works with VISA transaction data
- [ ] Syncs with card portfolio (DynamoDB)
- [ ] Updates in real-time (new transactions)
- [ ] Persists user overrides (learns from choices)

---

## Design Alternatives Considered

### Alternative 1: Rule-Based System (No AI)
**Approach:** Hardcode multiplier logic, simple comparison
**Pros:** Fast, predictable, no API costs
**Cons:** Can't handle complex scenarios, doesn't learn
**Decision:** ❌ Rejected - too rigid for real-world card rules

### Alternative 2: Static Lookup Table
**Approach:** Pre-calculate best card for each category
**Pros:** Instant results
**Cons:** Ignores spending caps, merchant-specific bonuses, context
**Decision:** ❌ Rejected - misses nuance

### Alternative 3: AI-Powered Analysis (SELECTED)
**Approach:** Claude analyzes each transaction with full context
**Pros:** Handles complexity, learns, provides reasoning
**Cons:** Latency, API costs
**Decision:** ✅ **Selected** - best user value, worth the cost

---

## Related Features

- `THREAT-005`: Wormhole Threats (spawned by suboptimal choices)
- `THREAT-003`: Solar Flare Threats (routing optimization)
- `BACKEND-001`: Threat Detection Engine (uses card data)
- `UI-007`: Rewards Tracking Panel (shows optimized earnings)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.0 | 2026-02-06 | Specification created |
| 1.0 | TBD | Full implementation with AI integration |

---

**Status:** Ready for Pydantic AI agent development and card data modeling.
