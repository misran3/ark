# SynesthesiaPay — Full Bridge Experience v3

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, TailwindCSS, Mobile-first |
| Backend | AWS Lambda Powertools (Python) |
| AI/ML | AWS Bedrock (Claude Sonnet 4.5 / Haiku 4.5), Pydantic AI |
| Database | DynamoDB (single-table or table-per-entity) |
| Auth | Cognito (lightweight for demo) |
| Banking | Capital One Nessie (primary), Plaid sandbox (stretch) |
| Payments | VISA Developer APIs — Transaction Controls + Transaction Alerts (sandbox) |
| Deployment | Amplify (frontend), CDK (backend) — ✅ already deployed |
| Dev Tools | Claude Code, Cursor |
| Code Review | CodeRabbit (sponsor prize!) |

---

## Team Assignments

| Person | Role | Modules Owned |
|--------|------|---------------|
| **Varun** | Backend — Data & Logic | Module 1 (Nessie Data) + Module 2 (Budget Engine) |
| **Misran/Varun** | Backend — AI & Integrations | Module 3 (Captain Nova Agent) + Module 4 (VISA Integration) |
| **Ben** | Frontend — Core Experience | Module 5 (Bridge UI Core: Shell, Captain Panel, Shield Bars) |
| **Akshat** | Frontend — Data Displays | Module 6 (Bridge UI Data: Balance HUD, Tx Log, Asteroid UI) |

Asteroid detection logic lives inside Module 2 (Budget Engine) as a sub-function, not a separate module. This keeps Akshat's scope clean — the budget analysis naturally produces both the `BudgetReport` and the `list[Asteroid]` from the same transaction data.

---

## Isolation Tiers

### Hour 0: Shared Contract (30 minutes, Misran)

Before anyone writes a line of code, agree on these Pydantic models in a single `models.py` file. Also generate TypeScript types from these for the frontend team. This is the API contract. Every module builds against these shapes, not against each other.

```python
# models.py — the shared contract

from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class AccountSummary(BaseModel):
    account_id: str
    type: Literal["checking", "savings", "credit_card"]
    balance: float
    nickname: str
    source: Literal["nessie", "plaid", "visa", "mock"]

class Transaction(BaseModel):
    id: str
    account_id: str
    date: datetime
    merchant: str
    category: str
    amount: float
    is_recurring: bool
    next_expected_date: datetime | None = None
    bucket: Literal["needs", "wants", "savings", "income"] | None = None

class FinancialSnapshot(BaseModel):
    accounts: list[AccountSummary]
    recent_transactions: list[Transaction]
    total_net_worth: float
    monthly_income: float
    monthly_spending: float
    snapshot_timestamp: datetime

class BucketBreakdown(BaseModel):
    target_pct: float
    target_amount: float
    actual_amount: float
    actual_pct: float
    status: Literal["on_track", "warning", "critical"]
    breakdown: dict[str, float]

class BudgetReport(BaseModel):
    monthly_income: float
    needs: BucketBreakdown
    wants: BucketBreakdown
    savings: BucketBreakdown
    overall_health: float
    overspend_categories: list[dict]
    credit_card_impact: float

class Asteroid(BaseModel):
    id: str
    threat_type: Literal[
        "subscription_renewal", "budget_overrun",
        "unused_service", "spending_spike", "bill_due"
    ]
    severity: Literal["danger", "warning", "info"]
    title: str
    detail: str
    amount: float
    days_until: int
    recommended_action: Literal["deflect", "absorb", "redirect"]
    reasoning: str

class VisaControlRule(BaseModel):
    rule_id: str
    card_id: str
    control_type: Literal[
        "spending_limit", "merchant_category_block",
        "transaction_type_block", "location_block"
    ]
    threshold: float | None = None
    merchant_categories: list[str] | None = None
    is_active: bool
    created_by: Literal["user", "captain_nova"]

class VisaAlert(BaseModel):
    alert_id: str
    card_id: str
    alert_type: Literal[
        "threshold_exceeded", "category_spike",
        "unusual_transaction", "budget_breach"
    ]
    transaction_amount: float
    merchant: str
    message: str
    timestamp: datetime

class CaptainResponse(BaseModel):
    message: str
    tools_used: list[str]
    confidence: float
    suggested_visa_controls: list[VisaControlRule] | None = None
```

Also create a `mocks/` folder with JSON files matching each model. Every module loads from mocks during solo development.

---

### Tier 1: Zero Dependencies (build immediately, all four scatter)

| Module | Owner | Builds Against | Outputs |
|--------|-------|---------------|---------|
| **Module 1: Nessie Data + Budget Engine** | Varun | Nessie API + shared models | `FinancialSnapshot`, `BudgetReport`, `list[Asteroid]` |
| **Module 3: Captain Nova Agent** | Misran | Stubbed tools + Bedrock | `CaptainResponse` |
| **Module 5: Bridge UI Core** | Ben | Mock JSON files | Next.js shell, Captain panel, Shield bars |
| **Module 6: Bridge UI Data** | Akshat | Mock JSON files | Balance HUD, Tx Log, Asteroid UI |

Every module builds against mocks or stubs. Nobody waits on anyone.

### Tier 2: Integration swap (Hour 8-10)

| What happens | Who |
|---|---|
| Frontend swaps mock JSON → real API Gateway endpoints | Misran + Ben |
| Captain Nova swaps stub tools → real Modules 1 & 2 endpoints | Akshat/Misran |
| VISA integration wired to Captain Nova as additional tools | Varun/Misran |

### Tier 3: Polish (Hour 10-12)

| What happens | Who |
|---|---|
| VISA controls UI (if time) | Ben |
| Captain Nova prompt tuning | All |
| Mobile responsiveness pass | Akshat |
| Edge cases and error states | Misran |

---

## Module 1: Nessie Data Service + Budget Engine + Asteroid Detection

**Owner:** Varun
**Priority:** P0
**Estimated time:** 5-6 hours
**Infra:** Lambda Powertools REST resolver, DynamoDB for caching

### Why these are one module
The data pipeline flows linearly: Nessie → normalize transactions → categorize into 50/30/20 → detect threats. Splitting these across people creates integration seams that waste time. One person owns the entire data→analysis pipeline.

### Lambda Powertools Setup
```python
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger(service="synesthesia-data")
tracer = Tracer(service="synesthesia-data")
cors = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors, enable_validation=True)

@app.get("/api/snapshot")
@tracer.capture_method
def get_snapshot() -> dict:
    """Pull accounts + transactions from Nessie, return FinancialSnapshot."""
    snapshot = nessie_service.get_snapshot(user_id="demo_user")
    # Cache in DynamoDB
    cache_snapshot(snapshot)
    return snapshot.model_dump()

@app.get("/api/budget")
@tracer.capture_method
def get_budget() -> dict:
    """Calculate 50/30/20 budget from snapshot."""
    snapshot = get_cached_snapshot_or_fetch()
    report = budget_engine.calculate(snapshot)
    return report.model_dump()

@app.get("/api/asteroids")
@tracer.capture_method
def get_asteroids() -> list[dict]:
    """Detect financial threats from snapshot + budget."""
    snapshot = get_cached_snapshot_or_fetch()
    report = budget_engine.calculate(snapshot)
    asteroids = threat_detector.scan(snapshot, report)
    return [a.model_dump() for a in asteroids]

@app.post("/api/asteroids/<asteroid_id>/action")
@tracer.capture_method
def asteroid_action(asteroid_id: str) -> dict:
    """User takes action on an asteroid."""
    body = app.current_event.json_body
    action = body.get("action")  # deflect | absorb | redirect
    result = threat_detector.resolve(asteroid_id, action)
    return result

@app.get("/api/transactions")
@tracer.capture_method
def get_transactions() -> list[dict]:
    """Get categorized transactions."""
    days = int(app.current_event.get_query_string_value("days", "30"))
    snapshot = get_cached_snapshot_or_fetch()
    return [t.model_dump() for t in snapshot.recent_transactions[-days:]]

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
```

### Nessie Data Layer
- Pull accounts: `GET /accounts?key={api_key}`
- Pull transactions: `GET /accounts/{id}/purchases?key={api_key}`
- Normalize into `FinancialSnapshot` Pydantic model
- Apply recurring detection heuristic (group by merchant, flag if 2+ in 30 days with ±10% amounts)

### Budget Engine (50/30/20 Categorizer)

Category mapping:
```python
NEEDS = ["rent", "mortgage", "utilities", "insurance", "loan_payment",
         "groceries", "transportation", "medical", "minimum_cc_payment"]

WANTS = ["dining", "restaurants", "entertainment", "shopping", "clothing",
         "subscriptions", "streaming", "travel", "hobbies", "gym", "personal_care"]

SAVINGS = ["savings_transfer", "investment", "emergency_fund"]
```

Key rule: Credit card lifestyle transactions (dining, entertainment, shopping) count toward WANTS. Only the minimum CC payment obligation counts as NEEDS.

### Asteroid Detection Rules
1. **Subscription Renewal:** recurring transaction expected within 14 days → warning; within 3 days → danger
2. **Budget Overrun:** any 50/30/20 bucket over 90% → warning; over 100% → danger
3. **Unused Service:** recurring charge with no correlated activity → warning, recommend cancel
4. **Spending Spike:** single transaction > 2× category average → info

### DynamoDB Schema
```
Table: synesthesia-data
PK: USER#{user_id}  SK: SNAPSHOT#latest     → cached FinancialSnapshot (TTL: 5 min)
PK: USER#{user_id}  SK: BUDGET#latest       → cached BudgetReport
PK: USER#{user_id}  SK: ASTEROID#{id}       → asteroid state (active/deflected/absorbed/redirected)
```

### Fallback
`mock_snapshot.json` matching the Pydantic models. Toggle via env variable `DATA_SOURCE=nessie|mock`.

### Pre-Demo Setup
Seed Nessie sandbox with:
- 1 checking, 1 savings, 1-2 credit cards
- 60-90 days of transactions: Netflix, Spotify, Gym, DoorDash, salary deposits, rent
- Make patterns obvious (gym unused for 47 days, dining over budget)

---

## Module 2: VISA Integration

**Owner:** Varun/Misran (builds after Captain Nova agent is functional)
**Priority:** P1 — stretch but high-impact for VISA prize
**Estimated time:** 3-4 hours
**Infra:** Lambda Powertools REST resolver, VISA Developer Sandbox

### What VISA APIs are actually available in sandbox

**Visa Transaction Controls (VTC)** — the primary integration. Sandbox is publicly available.

VTC lets cardholders set spending rules on their cards. This maps directly to SynesthesiaPay's concept: Captain Nova detects a threat → recommends a spending control → user approves → control is set via VISA API.

Key VTC sandbox endpoints:
```
POST /vctc/customerrules/v1/consumertransactioncontrols
  → Register a card and set initial controls

PUT  /vctc/customerrules/v1/consumertransactioncontrols
  → Update control rules (spending limits, category blocks)

GET  /vctc/customerrules/v1/consumertransactioncontrols/{documentID}
  → Retrieve current controls on a card

DELETE /vctc/customerrules/v1/consumertransactioncontrols/{documentID}
  → Remove a control
```

VTC control types available:
- **Spending limits** — set max per transaction or per time period
- **Merchant category blocks** — block spending at specific merchant categories (e.g., block restaurants if dining is over budget)
- **Transaction type blocks** — block online-only, in-store-only, ATM-only
- **Location controls** — restrict transactions to geographic areas
- **Card on/off** — enable/disable the entire card

**Visa Transaction Alerts** — notification when transactions hit thresholds.
```
POST /vctc/customerrules/v1/consumertransactioncontrols
  → Set alert thresholds (e.g., alert if transaction > $50)

Callback: Visa sends alert payload when threshold is triggered
  → In sandbox, this is simulated
```

### How it connects to SynesthesiaPay

This is the **agentic** play that VISA wants to see:

1. Captain Nova analyzes budget via Modules 1 tools
2. Captain detects dining spending at 142% of budget
3. Captain recommends: "Commander, I recommend activating spending shields on your dining sector. Shall I set a $25/transaction limit on restaurant purchases?"
4. User approves → Captain calls VISA VTC API to set the merchant category control
5. UI shows a new "shield" with the VISA control active
6. If user tries to spend over limit → VISA would decline (in sandbox, we simulate this)

This is **Captain Nova acting as an AI agent that takes real actions** — not just advising. That's the VISA Intelligent Commerce thesis in action.

### Lambda Powertools Setup
```python
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig

logger = Logger(service="synesthesia-visa")
tracer = Tracer(service="synesthesia-visa")
cors = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors, enable_validation=True)

@app.get("/api/visa/controls/<card_id>")
@tracer.capture_method
def get_controls(card_id: str) -> list[dict]:
    """Get active VISA transaction controls for a card."""
    controls = visa_service.get_controls(card_id)
    return [c.model_dump() for c in controls]

@app.post("/api/visa/controls")
@tracer.capture_method
def set_control() -> dict:
    """Set a new VISA transaction control (can be triggered by Captain Nova)."""
    body = app.current_event.json_body
    rule = VisaControlRule(**body)
    result = visa_service.create_control(rule)
    return result

@app.delete("/api/visa/controls/<rule_id>")
@tracer.capture_method
def remove_control(rule_id: str) -> dict:
    """Remove a VISA transaction control."""
    return visa_service.delete_control(rule_id)

@app.get("/api/visa/alerts/<card_id>")
@tracer.capture_method
def get_alerts(card_id: str) -> list[dict]:
    """Get recent VISA transaction alerts."""
    alerts = visa_service.get_alerts(card_id)
    return [a.model_dump() for a in alerts]

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
```

### VISA Authentication
VISA sandbox uses Two-Way SSL (mutual TLS):
- Generate a CSR via VISA Developer Portal
- Download: `cert.pem` (client cert), `key.pem` (private key), `VDPCA-SBX.pem` (CA cert)
- Store certs in Lambda environment (or in Secrets Manager, pull at cold start)
- All requests require: `cert=(cert_path, key_path), verify=ca_path`

```python
import httpx

VISA_SANDBOX_BASE = "https://sandbox.api.visa.com"

class VisaService:
    def __init__(self):
        self.client = httpx.Client(
            base_url=VISA_SANDBOX_BASE,
            cert=("/tmp/cert.pem", "/tmp/key.pem"),
            verify="/tmp/VDPCA-SBX.pem",
            auth=(VISA_USER_ID, VISA_PASSWORD),
        )

    def create_control(self, rule: VisaControlRule) -> dict:
        payload = self._build_vtc_payload(rule)
        resp = self.client.post(
            "/vctc/customerrules/v1/consumertransactioncontrols",
            json=payload,
        )
        return resp.json()
```

### DynamoDB Schema
```
Table: synesthesia-visa
PK: USER#{user_id}  SK: CONTROL#{rule_id}  → VisaControlRule (active controls)
PK: USER#{user_id}  SK: ALERT#{alert_id}   → VisaAlert (recent alerts)
```

### Fallback
If VISA sandbox auth is painful or slow to set up, mock the entire VISA service locally. The VTC payload shapes are well-documented — return realistic mock responses. The demo value is showing the *flow* (Captain recommends → user approves → control is set), not proving you hit a real VISA endpoint.

### Critical Note for the VISA Prize
The prize description says "Intelligent Budget Planner." Your pitch angle:
> "SynesthesiaPay doesn't just *tell* you you're overspending — it *acts*. Captain Nova uses VISA Transaction Controls to set real spending limits on your behalf. This is the Intelligent Budget Planner as an **agentic** system: AI that advises, then executes with your permission."

That sentence alone could win the VISA prize.

---

## Module 3: Captain Nova (AI Agent)

**Owner:** Misran
**Priority:** P0
**Estimated time:** 3-4 hours
**Infra:** Pydantic AI agent → AWS Bedrock (Claude Sonnet 4.5), Lambda Powertools

### What it does
A single Pydantic AI agent on Bedrock with tool access. Receives queries, decides which tools to call, synthesizes results, responds in-character as Captain Nova. Now also has VISA control tools for the agentic play.

### Model Selection
- **Claude Sonnet 4.5** for all Captain Nova responses. Sweet spot of intelligence and speed.
- **Claude Haiku 4.5** as fallback if Sonnet latency > 8s. Switch via env variable `BEDROCK_MODEL_ID`.

### System Prompt
```
You are Captain Nova, the AI financial advisor aboard the user's personal
starship in SynesthesiaPay. You speak like a calm, competent starship
captain — professional but warm, using space metaphors naturally.

Your job:
- Analyze the commander's financial data using your tools
- Identify threats (overspending, wasteful subscriptions, budget drift)
- Give specific, actionable recommendations
- ALWAYS explain your reasoning transparently (show your work)
- Reference specific dollar amounts and merchant names — never be vague
- Frame the 50/30/20 budget as ship systems:
    NEEDS = Life Support (50%)
    WANTS = Recreation Deck (30%)
    SAVINGS = Warp Fuel Reserves (20%)

You can also TAKE ACTION via VISA Transaction Controls:
- If spending in a category is dangerously over budget, you may recommend
  setting a spending limit or category block via VISA
- Always ASK the commander for permission before activating controls
- When recommending a control, explain: what it does, why, and dollar impact

Tone: Confident, dry humor, never condescending. Think Commander Shepard
meets a sharp financial advisor.

CONSTRAINTS:
- Keep responses under 150 words. Bridge briefing, not a report.
- Every recommendation must include WHY and the dollar impact.
- If multiple threats exist, prioritize by dollar amount.
- When you use VISA controls, explain in terms of "activating shields"
```

### Pydantic AI Tools
```python
@agent.tool
async def get_financial_snapshot() -> FinancialSnapshot:
    """Get current account balances, net worth, and recent transactions."""

@agent.tool
async def get_budget_report() -> BudgetReport:
    """Get 50/30/20 budget breakdown with health metrics."""

@agent.tool
async def get_active_threats() -> list[Asteroid]:
    """Get incoming financial threats — subscriptions, overruns, anomalies."""

@agent.tool
async def get_savings_projection(additional_monthly: float = 0) -> dict:
    """Project savings growth. Optionally model adding extra monthly savings."""

@agent.tool
async def get_spending_by_category(days: int = 30) -> dict[str, float]:
    """Get spending breakdown by category for the last N days."""

# ---- VISA AGENTIC TOOLS ---- #

@agent.tool
async def get_active_visa_controls(card_id: str) -> list[VisaControlRule]:
    """Get currently active VISA spending controls on a card."""

@agent.tool
async def recommend_visa_control(
    card_id: str,
    control_type: str,
    threshold: float | None = None,
    merchant_categories: list[str] | None = None,
    reason: str = ""
) -> VisaControlRule:
    """Recommend a VISA Transaction Control. This stages the control
    for user approval — it does NOT activate it yet. The user must
    confirm before activation."""

@agent.tool
async def activate_visa_control(rule_id: str) -> dict:
    """Activate a previously recommended VISA control after user approval.
    This calls the VISA Transaction Controls API to set the rule."""
```

### Request Types → Tool Chains
| UI Button | Query Type | Expected Tools |
|-----------|------------|----------------|
| Page load | `bridge_briefing` | snapshot + threats + budget |
| Budget Scan | `budget_scan` | budget + spending_by_category |
| Threat Report | `threat_report` | threats + budget + visa_controls |
| Savings ETA | `savings_eta` | savings_projection + budget |
| Activate Shield | `activate_shield` | recommend_visa_control → (user confirms) → activate_visa_control |
| Free text | `custom` | Agent decides |

### Lambda Powertools Setup
```python
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig

logger = Logger(service="synesthesia-captain")
tracer = Tracer(service="synesthesia-captain")
cors = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors, enable_validation=True)

@app.post("/api/captain/query")
@tracer.capture_method
async def captain_query() -> dict:
    body = app.current_event.json_body
    query_type = body.get("type")
    message = body.get("message", "")

    try:
        result = await nova_agent.run(
            build_prompt(query_type, message)
        )
        return CaptainResponse(
            message=result.data,
            tools_used=extract_tools_used(result),
            confidence=calculate_confidence(result),
            suggested_visa_controls=extract_visa_suggestions(result),
        ).model_dump()
    except Exception as e:
        logger.error(f"Captain Nova error: {e}")
        return get_fallback_response(query_type)

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
```

### Why `tools_used` and `suggested_visa_controls` in the response?
- `tools_used` → Conway "Best AI for Decision Support" prize. Transparent reasoning.
- `suggested_visa_controls` → Frontend can render a "Activate Shield?" confirmation button when Captain recommends a VISA control. This is the agentic loop: AI recommends → human approves → AI executes.

### Fallback
If Bedrock times out, return pre-written responses per query type with template variables filled from the data API (which is fast, no LLM involved):
```python
FALLBACK = {
    "bridge_briefing": "Commander, systems nominal. Net worth at ${net_worth}. "
                       "Life Support at {needs_pct}% capacity. "
                       "{threat_count} incoming objects detected.",
}
```

---

## Module 4: VISA Integration

(See Module 2 above — owned by Varun, built after Module 3 is functional)

---

## Module 5: Bridge UI Core

**Owner:** Ben
**Priority:** P0
**Estimated time:** 6-8 hours
**Infra:** Next.js 16 on Amplify, TailwindCSS, mobile-first

### What Ben owns
The structural shell and the interactive panels that require the most design sensitivity.

### Submodule 5a: Dashboard Shell
- Port HTML prototype layout → Next.js App Router + TailwindCSS
- Starfield canvas, scanlines, hex overlay → wrap in React client components
- Responsive grid: desktop = 3-column bridge, mobile = stacked panels
- Navigation state management
- Theme CSS variables ported to Tailwind config

### Submodule 5b: Captain Nova Panel
- On mount: fire `POST /api/captain/query { type: "bridge_briefing" }`
- Loading state: "Captain is analyzing..." with pulsing avatar
- On response: typewriter-animate `message` field
- Quick action buttons fire respective query types
- Show `tools_used` as small cyan pills below message (Conway play)
- **VISA shield activation:** When `suggested_visa_controls` is present in response, render a confirmation card: "Captain recommends activating dining shields ($25/tx limit). Approve?" with Approve/Dismiss buttons
- On approve: `POST /api/visa/controls` → show "Shield activated" animation

### Submodule 5c: Shield Bars
- "Budget Integrity" → `BudgetReport.overall_health`
- "Savings Trajectory" → % toward savings goal
- "Spending Control" → inverse of WANTS overspend
- **VISA Shields indicator** → show active VISA controls as additional shield bars with VISA branding
- Animate on load, re-animate after asteroid actions or VISA control changes

### Submodule 5d: Cognito Auth
- "Commander, identify yourself" screen → Cognito hosted UI
- Store JWT in React state (not localStorage)
- Pass JWT in Authorization header
- **1 hour max.** If it takes longer, hardcode user ID and move on.

### Mobile Layout
- Left nav → hamburger menu
- Main view + right panel → vertical stack
- Captain panel → sticky bottom sheet
- Asteroids → horizontal scroll or stacked cards

---

## Module 6: Bridge UI Data

**Owner:** Akshat
**Priority:** P0
**Estimated time:** 5-6 hours
**Infra:** Next.js 16 components consuming API data

### What Akshat owns
The data-driven display components that render financial information.

### Submodule 6a: Balance HUD
- `useEffect` → `GET /api/snapshot` on mount
- Populate: total net worth, balance change indicator
- Orbit ring animations (keep from prototype)
- Account type indicators (checking vs savings vs credit card)

### Submodule 6b: Bottom Metrics Bar
- Income, Savings, Spending, Investments cards
- Pull real numbers from snapshot
- Sparkline bars: last 12 weeks of weekly spending
- Color-coded by theme (cyan, green, magenta, gold)

### Submodule 6c: Transaction Log
- `GET /api/transactions?days=30`
- Map to tx-item components with space-themed icons
- Color-code by 50/30/20 bucket: needs=cyan, wants=magenta, savings=green, income=gold
- Show recurring badge for `is_recurring: true` transactions

### Submodule 6d: Asteroid UI
- `GET /api/asteroids` on mount
- Render threat cards with severity styling (danger=red, warning=gold, info=cyan)
- Click → expand to show `reasoning` field + three action buttons (Deflect/Absorb/Redirect)
- On action → `POST /api/asteroids/{id}/action`, animate asteroid out
- After action: refetch budget, update shield bars (trigger via shared state or event)

### Submodule 6e: VISA Controls Display (Stretch)
- Show active VISA controls as "active shields" in the UI
- `GET /api/visa/controls/{card_id}`
- Each control rendered as a shield icon with description
- Toggle to deactivate → `DELETE /api/visa/controls/{rule_id}`
- Only build this if Modules 1-5 are solid by Hour 10

---

## Module 7: Infrastructure (CDK) — ✅ ALREADY DEPLOYED

**Owner:** Misran
**Status:** Done. CDK stack is live with Lambda, Cognito, DynamoDB, and Amplify.

### What's left (implementation only, done via Claude Code)
- Wire Lambda handlers to Powertools route code from Modules 1-4
- Set Bedrock IAM permissions on Captain Nova Lambda (512MB memory, 60s timeout)
- Set env variables: `BEDROCK_MODEL_ID`, `DATA_SOURCE`, Nessie API key, VISA certs
- Amplify env variable for API Gateway URL
- VISA sandbox certs stored in Lambda environment or Secrets Manager

### Lambda Configuration
```
synesthesia-data-fn:     512MB, 30s timeout  (Modules 1: Nessie + Budget + Asteroids)
synesthesia-captain-fn:  512MB, 60s timeout  (Module 3: Captain Nova + Bedrock)
synesthesia-visa-fn:     256MB, 30s timeout  (Module 2: VISA APIs)
```

### CodeRabbit Integration (Sponsor Prize!)
- Install CodeRabbit on the GitHub repo at Hour 0
- Open PRs for every module (don't push to main)
- CodeRabbit auto-reviews every PR
- Screenshot CodeRabbit reviews for pitch deck
- Show a PR where CodeRabbit caught a real issue

---

## Build Sequence

```
HOUR 0-0.5:  ALL FOUR: Shared contract (models.py + mocks/ + TS types)
             GitHub repo setup, install CodeRabbit, branch strategy
             Seed Nessie sandbox data

HOUR 0.5-3:  TIER 1 — all four in parallel, zero dependencies
             Akshat: Nessie data fetching + normalization
             Varun:  Captain Nova agent skeleton + Bedrock connection
             Misran: Dashboard shell (Next.js port from HTML prototype)
             Ben:    Balance HUD + Transaction Log components (mock data)

HOUR 3-6:    TIER 1 continued
             Akshat: Budget engine (50/30/20) + asteroid detection
             Varun:  Captain Nova tools (stubbed) + prompt engineering
             Misran: Captain Nova panel + shield bars (mock data)
             Ben:    Bottom metrics bar + asteroid UI (mock data)

HOUR 6-8:    Akshat: API endpoints finalized, tested with mock + Nessie
             Varun:  Captain Nova end-to-end working with stubs
             Misran: Cognito auth (1 hour max)
             Ben:    Polish data components, loading/error states

HOUR 8-10:   INTEGRATION — swap mocks for real endpoints
             Misran + Ben: Frontend → API Gateway
             Varun: Captain Nova tools → real Module 1 endpoints
             Akshat: Support integration, fix data shape issues
             First CodeRabbit PR reviews happen here

HOUR 10-12:  Varun:  VISA integration (VTC sandbox setup + basic flow)
             Varun:  Wire VISA tools into Captain Nova agent
             Misran: VISA shield activation UI in Captain panel
             Ben:    VISA controls display (stretch)
             Akshat: Edge cases, error handling, DynamoDB caching

HOUR 12:     *** FEATURE FREEZE — NO NEW FEATURES ***

HOUR 12-16:  Polish: animations, loading states, error handling
             Captain Nova prompt tuning (ALL FOUR contribute ideas)
             Mobile responsiveness pass (Misran)
             Demo rehearsal #1

HOUR 16-20:  Demo script finalization
             Pitch deck (5-6 slides max)
             Demo rehearsal #2 and #3

HOUR 20-24:  Final deploy. Final rehearsal. Ship it.
```

---

## Demo Script (60 seconds)

1. **Open** (10s): Dashboard loads. Starfield. Captain Nova auto-briefs: "Commander, welcome aboard. I've scanned your financial systems across 3 accounts..."

2. **Asteroids** (10s): Three threats animate in. Click the unused gym membership — show AI reasoning: "No correlated activity in 47 days. Deflecting saves $49.99/month." Hit Deflect. Shield bar climbs.

3. **Captain AI** (15s): Tap "Budget Scan." Loading: "Analyzing, Commander..." Captain types personalized analysis. Show `tools_used` pills underneath. "Your Recreation Deck is at 142% — dining sector is the primary drain."

4. **VISA Agentic Play** (15s): Captain continues: "I recommend activating spending shields on dining. Shall I set a $25/transaction limit via VISA?" Tap Approve. "Shield activated" animation plays. New VISA shield bar appears.

5. **Close** (10s): "SynesthesiaPay doesn't just show you your finances — it commands them. Built on Capital One Nessie, powered by Claude on Bedrock, secured by VISA Transaction Controls, reviewed by CodeRabbit. Your money deserves a captain."

---

## Prize Alignment

| Prize | How We Win It |
|-------|--------------|
| **VISA — Intelligent Budget Planner** | 50/30/20 engine + Captain Nova as agentic advisor + VISA Transaction Controls for real spending limits. AI that advises then acts. |
| **Capital One — Best Financial Hack** | Built on Nessie, transforms financial data into immersive spatial interface, AI transfers cognitive burden into command decisions |
| **Conway — Best AI for Decision Support** | Transparent tool usage pills, visible reasoning in asteroid cards, confidence scores, explained recommendations |
| **CodeRabbit — Best Use of CodeRabbit** | PR-per-module workflow, CodeRabbit reviews documented, at least one accepted suggestion shown in pitch |
| **Polychrome Mosaic** (theme) | Crosses Finance × Entertainment/Gaming × UX Design |
| **Shattered Glass** (theme) | Disrupts the entire concept of what a banking interface looks like |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Nessie API down during demo | Fatal | DynamoDB cache + mock JSON fallback |
| Bedrock latency > 8s | Captain feels broken | Fallback to Haiku; pre-baked templates with real data |
| VISA sandbox auth (mTLS) is painful | Lose VISA integration | Mock VISA responses locally. Demo the flow, not the cert. |
| Cognito setup eats too much time | Wasted hours | Hard cutoff at 1 hour. Skip if needed. |
| 50/30/20 categorization wrong | Judges notice bad math | Manually verify with seeded Nessie data |
| Mobile layout breaks | Loses "mobile-first" credibility | Test on real phone at Hour 14 |
| CodeRabbit doesn't catch anything useful | Weak prize submission | Write focused PRs with clear diffs |
| Scope creep after Hour 12 | Don't finish | **No new features after Hour 12. Only polish.** |
| Lambda cold starts during demo | 5-10s first load | Warm Lambdas with scheduled ping, or use provisioned concurrency |
