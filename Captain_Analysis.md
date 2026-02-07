# Captain Nova Analysis

## 0. Complete Analysis
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/complete-analysis`

**Output**:
```json
{
    "financial_meaning": {
        "greeting": "Commander, incoming distress signal from your financial navigation system. Our sensors detect a critical hull breach in your income shields, with expenditure thrusters firing at full burn while our fuel reserves rapidly deplete.",
        "verdict": "Survival forecast indicates financial life support will sustain operations for only 4.1 months before total system failure, with a monthly deficit of $3,072.13 consuming your $12,500 savings reserves.",
        "status": "critical"
    },
    "wasteful_subscriptions": {
        "subscriptions": [],
        "total_annual_waste": 0.0,
        "verdict": "Asteroid field clear — no debris threatening fuel reserves."
    },
    "budget_overruns": {
        "overruns": [
            {
                "category": "rent",
                "budget_amount": 500.0,
                "actual_amount": 1650.0,
                "overspend_amount": 1150.0,
                "pct_over": 230.0,
                "volatility": "low",
                "verdict": "Reroute power from crew quarters — stabilize life support sector by finding more affordable habitat module"
            },
            {
                "category": "shopping",
                "budget_amount": 300.0,
                "actual_amount": 647.06,
                "overspend_amount": 347.06,
                "pct_over": 115.69,
                "volatility": "high",
                "verdict": "Divert excess power from crew entertainment — cut impulse purchases to recover critical energy reserves"
            },
            {
                "category": "groceries",
                "budget_amount": 500.0,
                "actual_amount": 434.33,
                "overspend_amount": -65.67,
                "pct_over": -13.13,
                "volatility": "medium",
                "verdict": "Food sector consumption approaching critical levels — optimize supply chain efficiency"
            }
        ],
        "overall_budget_status": "critical",
        "verdict": "Massive ion storm detected — multiple sectors drawing catastrophic levels of power, immediate grid recalibration required!"
    },
    "upcoming_bills": {
        "bills": [],
        "total_upcoming_30_days": 0.0,
        "verdict": "No solar flares on the horizon — clear skies ahead, Commander. Our financial shields are fully charged with a Main Checking balance of $4,250 and an Emergency Fund of $12,500."
    },
    "debt_spirals": {
        "debts": [
            {
                "account": "Rewards Card",
                "balance": 1847.0,
                "apr": 24.99,
                "monthly_interest": 38.25,
                "minimum_payment_months": 58,
                "recommended_payment": 350.0,
                "recommended_months": 6,
                "interest_saved": 1207.36,
                "verdict": "Orbiting the event horizon at minimum thrust — $1,207 in gravitational drag avoided by engaging full thrusters"
            }
        ],
        "total_debt": 1847.0,
        "total_monthly_interest": 38.25,
        "urgency": "critical",
        "verdict": "Black hole detected with $1,847 gravitational pull — engage thrusters at $350/month to reach escape velocity\">\n</invoke>"
    },
    "missed_rewards": {
        "missed_rewards": [
            {
                "category": "shopping",
                "current_card": "Main Checking",
                "optimal_card": "Rewards Card",
                "transactions_affected": 8,
                "points_lost": 500,
                "cash_value_lost": 5.0,
                "verdict": "Redirect shopping transactions through the Rewards Card wormhole to capture bonus points"
            },
            {
                "category": "dining",
                "current_card": "Main Checking",
                "optimal_card": "Rewards Card",
                "transactions_affected": 3,
                "points_lost": 300,
                "cash_value_lost": 3.0,
                "verdict": "Plot a course through the dining rewards wormhole with the Rewards Card"
            }
        ],
        "annual_opportunity_cost": 96.0,
        "verdict": "Missed wormhole shortcuts totaling $96/year — recalibrate card routing to optimal reward frequencies!"
    },
    "fraud_alerts": {
        "alerts": [
            {
                "merchant": "Best Buy",
                "amount": 199.99,
                "date": "2026-01-10T00:00:00Z",
                "risk_score": 0.5,
                "indicators": [
                    "amount_anomaly"
                ],
                "recommended_action": "monitor",
                "verdict": "High-value unidentified bogey detected in shopping sector - recommend tracking on long-range sensors"
            },
            {
                "merchant": "Sushi Palace",
                "amount": 72.0,
                "date": "2026-01-14T00:00:00Z",
                "risk_score": 0.25,
                "indicators": [
                    "unusual_category"
                ],
                "recommended_action": "allow",
                "verdict": "Occasional culinary expedition detected - no immediate threat"
            }
        ],
        "overall_risk": "elevated",
        "verdict": "Potential hostile transactions detected - recommend maintaining elevated sensor vigilance"
    }
}
```

## 1. Financial Meaning (or Boot Sequence)
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/financial-meaning`

**Output**:
```json
{
    "greeting": "Commander, our financial sensors are detecting critical system failures across multiple decks. We're running on emergency reserves with zero incoming thrust and a significant fuel burn threatening our mission survival.",
    "verdict": "Savings shields will sustain the ship for only 4.1 months before complete financial hull breach, with a monthly deficit of $3,072.13 rapidly depleting our reserves.",
    "status": "critical"
}
```

## 2. Wasteful Subscriptions (or Asteroids)
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/subscriptions`

**Output**:
```json
{
    "subscriptions": [],
    "total_annual_waste": 0.0,
    "verdict": "Asteroid field clear — no debris threatening fuel reserves."
}
```

## 3. Budget Overruns (or Ion Storms)
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/budget-overruns`

**Output**:
```json
{
    "overruns": [
        {
            "category": "rent",
            "budget_amount": 500.0,
            "actual_amount": 1650.0,
            "overspend_amount": 1150.0,
            "pct_over": 230.0,
            "volatility": "low",
            "verdict": "Reroute power from crew quarters — emergency housing reallocation required to stabilize life support sector"
        },
        {
            "category": "shopping",
            "budget_amount": 300.0,
            "actual_amount": 647.06,
            "overspend_amount": 347.06,
            "pct_over": 115.7,
            "volatility": "high",
            "verdict": "Critical ion surge in crew entertainment sector — cut unnecessary digital transmissions and impulse purchases"
        },
        {
            "category": "groceries",
            "budget_amount": 500.0,
            "actual_amount": 434.33,
            "overspend_amount": 434.33,
            "pct_over": 86.87,
            "volatility": "medium",
            "verdict": "Nutrition sector showing erratic power consumption — optimize supply chain and meal planning protocols"
        }
    ],
    "overall_budget_status": "critical",
    "verdict": "Massive ion storm detected — multiple sectors experiencing critical power overload, immediate energy conservation required to prevent total system failure!"
}
```

## 4. Upcoming Bills (or Solar Flares)
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/upcoming-bills`

**Output**:
```json
{
    "bills": [],
    "total_upcoming_30_days": 0.0,
    "verdict": "No solar flares on the horizon — clear skies ahead, Commander. Your financial navigation systems show calm space with no imminent monetary disturbances."
}
```

## 5. Debt Spirals (or Black Holes)
**Endpoint**: ``POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/debt-spirals`

**Output**:
```json
{
    "debts": [
        {
            "account": "Rewards Card",
            "balance": 1847.0,
            "apr": 24.99,
            "monthly_interest": 38.25,
            "minimum_payment_months": 58,
            "recommended_payment": 350.0,
            "recommended_months": 6,
            "interest_saved": 1207.36,
            "verdict": "Orbiting the event horizon at minimum thrust — $1,207 in gravitational drag avoided by engaging full thrusters"
        }
    ],
    "total_debt": 1847.0,
    "total_monthly_interest": 38.25,
    "urgency": "warning",
    "verdict": "Black hole detected with $1,847 gravitational pull — engage thrusters at $350/month to reach escape velocity\">"
}
```

## 6. Missed Rewards (or Wormholes)
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/missed-rewards`

**Output**:
```json
{
    "missed_rewards": [
        {
            "category": "shopping",
            "current_card": "Main Checking",
            "optimal_card": "Rewards Card",
            "transactions_affected": 9,
            "points_lost": 297,
            "cash_value_lost": 2.97,
            "verdict": "Reroute shopping transactions through the Rewards Card wormhole to capture more efficient point trajectories."
        },
        {
            "category": "transportation",
            "current_card": "Main Checking",
            "optimal_card": "Rewards Card",
            "transactions_affected": 1,
            "points_lost": 26,
            "cash_value_lost": 0.26,
            "verdict": "Realign transportation spending to maximize reward wormhole potential."
        }
    ],
    "annual_opportunity_cost": 35.64,
    "verdict": "Detected 10 wormhole navigation errors costing $35.64 annually — recalibrate card routing to optimal reward frequencies!"
}
```

## 7. Fraud Alerts (or Enemy Cruisers)
**Endpoint**: `POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/captain/specialists/fraud-detection`

**Output**:
```json
{
    "alerts": [
        {
            "merchant": "Best Buy",
            "amount": 199.99,
            "date": "2026-01-10T00:00:00Z",
            "risk_score": 0.5,
            "indicators": [
                "amount_anomaly"
            ],
            "recommended_action": "monitor",
            "verdict": "High-value unidentified bogey detected in shopping sector — recommend tracking on long-range sensors"
        },
        {
            "merchant": "Uber Eats",
            "amount": 42.5,
            "date": "2026-02-03T00:00:00Z",
            "risk_score": 0.25,
            "indicators": [
                "new_merchant"
            ],
            "recommended_action": "allow",
            "verdict": "New merchant transponder detected, but within standard parameters"
        }
    ],
    "overall_risk": "elevated",
    "verdict": "Potential hostile financial vessels detected on transaction grid — recommend heightened surveillance protocols"
}
```
