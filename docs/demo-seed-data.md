# Demo Seed Data for Captain Nova

This document describes the demo seed data implementation for testing all 7 Captain Nova specialist agents.

## Overview

Three user personas were created to demonstrate the full range of financial health statuses:

| Persona | User ID | Status | Health Score |
|---------|---------|--------|--------------|
| Maya Torres | `user_maya_torres` | Critical | ~32 |
| James Chen | `user_james_chen` | Warning | ~54 |
| Sofia Ramirez | `user_sofia_ramirez` | Good | ~82 |

## User Personas

### Maya Torres (Critical)
**Profile:** Recent college graduate, 23, entry-level marketing coordinator

| Attribute | Value |
|-----------|-------|
| Monthly Income | $3,500 |
| Checking Balance | $847 |
| Savings Balance | $1,200 |
| Total CC Debt | $8,647 (4 cards) |
| Student Loans | $28,000 |

**Credit Cards:**
- Quicksilver: $4,892 / $5,000 (98% utilization)
- SavorOne: $1,847 / $3,000
- Discover it Student: $1,230 / $1,500
- Amazon Prime Visa: $678 / $2,500

**Agent Triggers:**
- **Debt Spirals:** $8.6K CC + $28K student loans = critical urgency
- **Budget Overruns:** Wants at 52% (should be 30%)
- **Wasteful Subscriptions:** Hulu, HBO Max, Disney+, Planet Fitness ($73/mo wasted)
- **Missed Rewards:** Uses debit/wrong cards, loses ~$504/year
- **Fraud Detection:** $299.99 suspicious charge at TechZone Electronics

---

### James Chen (Warning)
**Profile:** Young professional, 29, software developer

| Attribute | Value |
|-----------|-------|
| Monthly Income | $5,800 |
| Checking Balance | $3,420 |
| Savings Balance | $8,500 |
| Total CC Debt | $3,427 (2 cards) |

**Credit Cards:**
- Quicksilver: $1,247 / $8,000
- SavorOne: $2,180 / $10,000

**Agent Triggers:**
- **Debt Spirals:** $3.4K CC debt, 34 months at minimum payment
- **Budget Overruns:** Wants at 38% (warning level)
- **Wasteful Subscriptions:** Audible, ClassPass, duplicate Google One ($67/mo wasted)
- **Missed Rewards:** Uses Quicksilver for dining instead of SavorOne (3% vs 1.5%)
- **Fraud Detection:** $89 monitor-level alert at CloudServ Pro

---

### Sofia Ramirez (Good)
**Profile:** Established family, 38, senior accountant + spouse part-time

| Attribute | Value |
|-----------|-------|
| Monthly Income | $9,200 |
| Checking Balance | $6,840 |
| Savings Balance | $32,000 (3.5 months emergency fund) |
| Total CC Debt | $2,135 (paid monthly) |

**Credit Cards:**
- SavorOne: $890 / $15,000 (groceries/dining)
- Venture: $1,245 / $20,000 (travel)
- Quicksilver: $0 / $12,000 (backup)

**Agent Triggers:**
- **Debt Spirals:** Minimal, stable
- **Budget Overruns:** All buckets on track
- **Wasteful Subscriptions:** None (all services actively used)
- **Missed Rewards:** Optimized card routing
- **Fraud Detection:** All clear

---

## File Structure

```
core/
├── shared/src/shared/mocks/demo/
│   ├── merchants.json          # 67 merchant definitions
│   ├── maya_torres.json        # Critical user fixture
│   ├── james_chen.json         # Warning user fixture
│   └── sofia_ramirez.json      # Good user fixture
└── scripts/
    ├── seed_nessie_demo.py     # Nessie sandbox seeder
    ├── seed_dynamodb_demo.py   # DynamoDB seeder
    └── seed_demo.py            # Combined runner
```

## Usage

### Seed All Data
```bash
cd core
export NESSIE_API_KEY="your_key"
uv run python scripts/seed_demo.py --user all
```

### Seed Individual User
```bash
uv run python scripts/seed_demo.py --user maya
uv run python scripts/seed_demo.py --user james
uv run python scripts/seed_demo.py --user sofia
```

### Skip Specific Seeder
```bash
uv run python scripts/seed_demo.py --skip-nessie    # DynamoDB only
uv run python scripts/seed_demo.py --skip-dynamodb  # Nessie only
```

## Data Seeded

### Nessie Sandbox
- **Customers:** 3
- **Accounts:** 15 (checking, savings, credit cards)
- **Merchants:** 67 (groceries, dining, subscriptions, etc.)
- **Purchases:** ~335 transactions over 90 days
- **Deposits:** Income deposits for each user

### DynamoDB (SnatchedUsersTable)
- `PROFILE#settings` - User preferences and budget thresholds
- `SNAPSHOT#latest` - Financial snapshot with accounts and transactions
- `BUDGET#latest` - 50/30/20 budget report with health score
- `ASTEROID#{id}` - Demo subscription action states

## Credit Card Reward Structure

| Card | Last 4 | Rewards |
|------|--------|---------|
| Quicksilver | 4832 | 1.5% everything |
| SavorOne | 7291 | 3% dining/entertainment/groceries |
| Venture | 5508 | 2x miles on everything |
| Discover it Student | 6011 | 5% rotating categories |
| Amazon Prime Visa | 2945 | 5% Amazon, 2% groceries/dining/gas |

## Merchant Categories

67 merchants across 17 categories:
- groceries, dining, coffee, gas, shopping
- electronics, utilities, transportation, travel
- subscriptions, gym, rent, mortgage
- insurance, medical, loan_payment, salary
