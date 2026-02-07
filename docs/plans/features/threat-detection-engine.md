# Feature Spec: Threat Detection Engine

**Feature ID:** `BACKEND-001`
**Category:** Backend Integration / AI Analysis
**Priority:** P0 (Must-have for MVP)
**Status:** 🔴 Not Started
**Current Version:** 0.0 (Mock data only)
**Target Version:** 1.0

---

## Overview

The Threat Detection Engine is the AI-powered backend service that analyzes transaction data, budgets, and spending patterns to identify financial "threats" and spawn them as 3D objects in the Bridge view. It uses Pydantic AI with Claude Sonnet 4.5 to intelligently categorize transactions, detect wasteful patterns, and calculate urgency.

**The Core Magic:** Real financial data → AI analysis → Cosmic threats appearing in 3D space, creating a tangible visualization of abstract financial problems.

---

## System Architecture

### Data Flow

```
1. User's Financial Data (DynamoDB)
   ├─ Transactions (VISA API)
   ├─ Budget allocations
   └─ Subscription list

2. Threat Detection Lambda (Python)
   ├─ Fetch recent transactions (30 days)
   ├─ Analyze with Pydantic AI (Claude Sonnet 4.5)
   └─ Categorize threats

3. Threat API Response (JSON)
   ├─ Threat type (asteroid, ion-storm, etc.)
   ├─ Severity (size/urgency)
   ├─ Metadata (name, amount, days until impact)
   └─ Position (spawn location)

4. Frontend (Next.js)
   ├─ Fetch threats via React Query
   ├─ Spawn 3D objects in scene
   └─ Update every 30 seconds
```

### Threat Classification Logic

**Threat Type Mapping:**

| Financial Pattern | Threat Type | Detection Logic |
|-------------------|-------------|-----------------|
| Unused subscription (30+ days no activity) | Asteroid | Recurring charge + Zero usage |
| Budget category overrun (> 100%) | Ion Storm | Spending > budget allocation |
| Upcoming large bill (7 days) | Solar Flare | Known recurring charge approaching |
| Debt with high interest (> 15% APR) | Black Hole | Credit card balance + interest rate |
| Suboptimal card usage (lost rewards) | Wormhole | Transaction category mismatch |
| Multiple late payments (credit risk) | Enemy Cruiser | Payment history + credit score drop |

---

## AI Analysis Implementation

### Pydantic AI Agent

**File:** `core/agent/threat_analyzer.py`

```python
from pydantic_ai import Agent
from pydantic import BaseModel
from datetime import datetime, timedelta

class Transaction(BaseModel):
    id: str
    merchant: str
    amount: float
    category: str
    date: datetime
    card_id: str

class Threat(BaseModel):
    type: str  # 'asteroid', 'ion-storm', 'solar-flare', 'black-hole', 'wormhole'
    severity: float  # 0-1
    name: str
    description: str
    impact_amount: float
    days_until_impact: int
    metadata: dict

class ThreatAnalysis(BaseModel):
    threats: list[Threat]
    total_risk_score: float
    recommendations: list[str]

threat_agent = Agent(
    model='claude-sonnet-4-5',
    result_type=ThreatAnalysis,
    system_prompt="""You are a financial threat detection AI for a spaceship command center.

Analyze transaction data and identify financial "threats":

1. ASTEROID (Wasteful Subscriptions):
   - Recurring charges with no recent usage
   - Severity: amount / monthly_income
   - Days until impact: days until next charge

2. ION STORM (Budget Overruns):
   - Category spending > budget allocation
   - Severity: (actual - budget) / budget
   - Days until impact: days until month end

3. SOLAR FLARE (Upcoming Bills):
   - Known large charges approaching
   - Severity: amount / average_daily_spending
   - Days until impact: days until charge date

4. BLACK HOLE (Debt Spirals):
   - High-interest debt
   - Severity: (interest_rate / 100) * balance
   - Days until impact: always critical

5. WORMHOLE (Missed Rewards):
   - Transactions on suboptimal cards
   - Severity: lost_rewards / potential_rewards
   - Days until impact: already lost (retroactive)

Be concise, use space/ship terminology, and prioritize by severity."""
)

async def analyze_threats(
    transactions: list[Transaction],
    budgets: dict[str, float],
    subscriptions: list[dict],
    debts: list[dict]
) -> ThreatAnalysis:
    """Run AI analysis on financial data."""
    result = await threat_agent.run(
        f"""Analyze this financial data:

Transactions (last 30 days): {len(transactions)} transactions
Total spent: ${sum(t.amount for t in transactions):.2f}

Budget allocations:
{chr(10).join(f'- {cat}: ${amt:.2f}' for cat, amt in budgets.items())}

Active subscriptions:
{chr(10).join(f'- {sub["name"]}: ${sub["amount"]}/mo (last used: {sub["last_used"]})' for sub in subscriptions)}

Outstanding debts:
{chr(10).join(f'- {debt["name"]}: ${debt["balance"]} @ {debt["apr"]}% APR' for debt in debts)}

Identify all financial threats, categorize them, and assess severity."""
    )

    return result.data
```

### Lambda Handler

**File:** `core/lambda/threat_scanner.py`

```python
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from core.agent.threat_analyzer import analyze_threats
from core.database.users_client import UsersClient
from core.database.transactions_client import TransactionsClient
import json

logger = Logger()
tracer = Tracer()
resolver = APIGatewayRestResolver()

users_client = UsersClient()
transactions_client = TransactionsClient()

@resolver.get("/threats")
@tracer.capture_method
def get_threats():
    """Get all active threats for the current user."""
    # Get user ID from JWT (API Gateway authorizer)
    user_id = resolver.current_event.request_context.authorizer.claims['sub']

    # Fetch financial data
    user = users_client.get_user(user_id)
    transactions = transactions_client.get_recent_transactions(user_id, days=30)
    subscriptions = user.get('subscriptions', [])
    budgets = user.get('budgets', {})
    debts = user.get('debts', [])

    # Run AI analysis
    analysis = await analyze_threats(
        transactions=transactions,
        budgets=budgets,
        subscriptions=subscriptions,
        debts=debts
    )

    # Convert to frontend format
    threats_response = {
        'threats': [
            {
                'id': f"{threat.type}_{i}",
                'type': threat.type,
                'severity': threat.severity,
                'data': {
                    'name': threat.name,
                    'description': threat.description,
                    'impact': f"${threat.impact_amount:.2f}",
                    'daysUntil': threat.days_until_impact,
                },
                'position': generate_spawn_position(threat.severity),
                'seed': hash(threat.name),
            }
            for i, threat in enumerate(analysis.threats)
        ],
        'riskScore': analysis.total_risk_score,
        'recommendations': analysis.recommendations,
    }

    return {
        'statusCode': 200,
        'body': json.dumps(threats_response),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        }
    }

def generate_spawn_position(severity: float) -> dict:
    """Generate spawn position based on severity."""
    import random

    # More severe threats spawn closer
    distance = 1200 - (severity * 400)  # 1200-800 units

    # Random angle
    theta = random.uniform(0, 2 * 3.14159)
    phi = random.uniform(0, 3.14159)

    x = distance * math.sin(phi) * math.cos(theta)
    y = distance * math.sin(phi) * math.sin(theta)
    z = distance * math.cos(phi)

    return {'x': x, 'y': y, 'z': z}
```

---

## Frontend Integration

### React Query Hook

**File:** `web/hooks/useFinancialThreats.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Threat {
  id: string;
  type: 'asteroid' | 'ion-storm' | 'solar-flare' | 'black-hole' | 'wormhole' | 'enemy-cruiser';
  severity: number; // 0-1
  data: {
    name: string;
    description: string;
    impact: string;
    daysUntil: number;
  };
  position: { x: number; y: number; z: number };
  seed: number;
}

interface ThreatsResponse {
  threats: Threat[];
  riskScore: number;
  recommendations: string[];
}

export function useFinancialThreats() {
  return useQuery({
    queryKey: ['financial-threats'],
    queryFn: async () => {
      const response = await apiClient.get<ThreatsResponse>('/threats');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider stale after 20s
  });
}
```

### Threat Spawning

**In ThreeScene.tsx:**

```typescript
import { useFinancialThreats } from '@/hooks/useFinancialThreats';
import { useThreatStore } from '@/lib/stores/threat-store';

export function ThreeScene() {
  const { data: threatsData } = useFinancialThreats();
  const { addThreat, removeThreat, threats } = useThreatStore();

  // Sync backend threats with frontend store
  useEffect(() => {
    if (!threatsData) return;

    const backendThreatIds = new Set(threatsData.threats.map(t => t.id));
    const frontendThreatIds = new Set(threats.map(t => t.id));

    // Add new threats
    threatsData.threats.forEach(threat => {
      if (!frontendThreatIds.has(threat.id)) {
        addThreat({
          id: threat.id,
          type: threat.type,
          position: new THREE.Vector3(threat.position.x, threat.position.y, threat.position.z),
          velocity: new THREE.Vector3(0, 0, -threat.severity), // Speed based on severity
          size: 2 + threat.severity * 2, // Size based on severity
          data: threat.data,
          seed: threat.seed,
        });
      }
    });

    // Remove threats that no longer exist
    threats.forEach(threat => {
      if (!backendThreatIds.has(threat.id)) {
        removeThreat(threat.id);
      }
    });
  }, [threatsData, threats, addThreat, removeThreat]);

  // ... rest of scene
}
```

---

## Acceptance Criteria

### ✅ Detection Accuracy

- [ ] Unused subscriptions detected correctly (30+ days no usage)
- [ ] Budget overruns calculated accurately (spending vs allocation)
- [ ] Upcoming bills predicted with correct dates
- [ ] Debt interest calculated correctly (APR, balance, compounding)
- [ ] Card optimization opportunities identified (rewards mismatch)
- [ ] False positive rate < 5% (manual verification)

### ✅ AI Quality

- [ ] Threat descriptions are clear and actionable
- [ ] Severity scores correlate with actual financial impact
- [ ] Recommendations make sense (no hallucinations)
- [ ] Space/ship terminology is used correctly
- [ ] AI responses are fast (< 2s p95 latency)

### ✅ Integration

- [ ] Threats appear in 3D scene within 1s of backend update
- [ ] Threat positions are randomized but consistent (same seed = same position)
- [ ] Threats update every 30s without UI disruption
- [ ] Deflected threats are removed from backend (not re-spawned)
- [ ] Frontend gracefully handles API errors (shows cached threats)

### ✅ Performance

- [ ] API response time < 1s (p95)
- [ ] DynamoDB queries optimized (< 100ms)
- [ ] AI analysis completes in < 2s (batched transactions)
- [ ] Frontend doesn't lag when threats spawn (staggered animation)

---

## Design Alternatives Considered

### Alternative 1: Rule-Based Detection (No AI)
**Approach:** Hardcoded rules for threat detection
**Pros:** Fast, predictable, no API costs
**Cons:** Not adaptable, misses nuanced patterns, boring descriptions
**Decision:** ❌ Rejected - AI provides better user experience

### Alternative 2: Client-Side Analysis
**Approach:** Run threat detection in browser (JavaScript)
**Pros:** No backend latency, works offline
**Cons:** Exposes financial data in client, limited analysis capability, no AI
**Decision:** ❌ Rejected - security risk, limited power

### Alternative 3: AI-Powered Backend Analysis (SELECTED)
**Approach:** Pydantic AI on Lambda with Claude Sonnet 4.5
**Pros:** Powerful analysis, secure, scalable, adaptive
**Cons:** API costs, latency
**Decision:** ✅ **Selected** - best capability for serious financial insights

---

## Open Questions

### Resolved
- ✅ Q: Should threats persist if user doesn't deflect them?
  - A: Yes - until underlying financial issue is resolved

- ✅ Q: Should AI generate multiple threat types for same issue?
  - A: No - one threat per issue, choose most appropriate type

### Unresolved
- ⚠️ Q: Should threat detection run on-demand or on a schedule?
  - A: Both - on-demand for real-time + scheduled every 30s for updates

- ⚠️ Q: Should we cache AI responses to reduce costs?
  - A: Yes - cache for 5 minutes, invalidate on new transactions

---

## Implementation Checklist

### Phase 1: Data Pipeline
- [ ] Create DynamoDB transactions table
- [ ] Integrate VISA API (fetch transactions)
- [ ] Create budget data model in users table
- [ ] Create subscriptions tracking system

### Phase 2: AI Agent
- [ ] Implement Pydantic AI threat analyzer
- [ ] Write system prompt for Claude
- [ ] Test AI output quality (manual review)
- [ ] Tune severity calculation formulas

### Phase 3: Lambda API
- [ ] Create threat_scanner Lambda function
- [ ] Add API Gateway route (/threats)
- [ ] Implement JWT authentication
- [ ] Add error handling and logging

### Phase 4: Frontend Integration
- [ ] Create useFinancialThreats React Query hook
- [ ] Update threat store to sync with backend
- [ ] Implement spawn position generation
- [ ] Test real-time updates (30s interval)

### Phase 5: Optimization
- [ ] Add response caching (Redis or DynamoDB TTL)
- [ ] Batch AI calls (analyze multiple threats at once)
- [ ] Optimize DynamoDB queries (indexes, projections)
- [ ] Add CloudWatch alarms for errors/latency

### Phase 6: Testing
- [ ] Unit tests for threat classification logic
- [ ] Integration tests for Lambda function
- [ ] Load testing (simulate 100 concurrent users)
- [ ] End-to-end test (transaction → threat appears in UI)

### Phase 7: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark threat-detection-engine as complete`

---

## Related Features

- `THREAT-001`: Asteroid Threats (spawned by this engine)
- `THREAT-002`: Ion Storm Threats (spawned by this engine)
- `THREAT-004`: Black Hole Threats (spawned by this engine)
- VISA API Integration (provides transaction data)
- AI Analysis Pipeline via Pydantic AI + Bedrock (Claude Sonnet 4.5)

---

## Cost Estimation

**Per User Per Month:**
- VISA API calls: 1,440 requests (30s interval) × $0.0001 = $0.14
- Bedrock (Claude Sonnet 4.5): ~50K tokens/day × 30 days × $0.003/1K = $4.50
- Lambda invocations: 1,440 × $0.0000002 = $0.0003
- DynamoDB reads: 1,440 × $0.00000025 = $0.0004

**Total: ~$4.64/user/month**

**Optimization:**
- Cache AI responses (5 min): Reduce to 12 calls/hour = $0.75/user/month
- Batch processing: Reduce token usage 30% = $0.52/user/month

**Optimized Total: ~$1.40/user/month**

---

## Completion Protocol

When this feature's implementation is finished and all acceptance criteria pass, the implementing agent **must** update the following documents before considering the work done:

1. **This feature spec** — Set `Status` to 🟢 Complete (or 🔵 Needs Polish if partially done), update `Current Version`, and add a row to the Revision History table.
2. **Master Document** (`docs/plans/MASTER-synesthesiapay-bridge.md`) — Update this feature's row in the Feature Catalog to reflect the new status.
3. **Implementation Guide** (`docs/plans/IMPLEMENTATION-GUIDE.md`) — Record any learnings, update phase progress tracking, and note actual vs estimated time if a build guide was created.

These documentation updates should be committed separately from code changes. See the Implementation Guide's [Status Updates](../IMPLEMENTATION-GUIDE.md#status-updates) section for detailed instructions.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.0 | 2026-02-06 | Specification created |
| 1.0 | TBD | Full implementation with AI integration |

---

**Status:** Ready for DynamoDB schema design and Pydantic AI agent development.
