# SynesthesiaPay Checklist

| Done | Task |
|------|------|
| [x] | Create shared models.py contract |
| [x] | Create mocks/ folder with JSON files |
| [x] | Generate TypeScript types from Pydantic models |
| [ ] | Install CodeRabbit on GitHub repo |
| [ ] | Seed Nessie sandbox with demo data |
| [ ] | Nessie data fetching + normalization |
| [ ] | Budget engine (50/30/20 categorizer) |
| [ ] | Asteroid detection rules |
| [ ] | Data service API endpoints (/api/snapshot, /api/budget, /api/asteroids, /api/transactions) |
| [ ] | DynamoDB caching for snapshots |
| [ ] | Captain Nova agent skeleton |
| [ ] | Bedrock connection (Claude Sonnet 4.5) |
| [ ] | Captain Nova system prompt |
| [ ] | Captain Nova tools (stubbed) |
| [ ] | Captain Nova API endpoint (/api/captain/query) |
| [ ] | Dashboard shell (Next.js port) |
| [ ] | Starfield canvas + scanlines + hex overlay |
| [ ] | Responsive grid layout |
| [ ] | Captain Nova panel UI |
| [ ] | Shield bars component |
| [ ] | Cognito auth integration |
| [x] | Balance HUD component |
| [x] | Bottom metrics bar |
| [x] | Transaction log component |
| [x] | Asteroid UI component |
| [x] | Create web/public/mocks/ with official shared data |
| [x] | Implement type-safe API hooks (useFinance, useSecurity, useAI) |
| [x] | Isolation test page (/test/bridge-data) |
| [ ] | Frontend → API Gateway integration |
| [ ] | Captain Nova tools → real endpoints |
| [x] | VISA sandbox authentication (mTLS) |
| [x] | VISA Transaction Controls API integration |
| [x] | VISA controls Lambda endpoints |
| [ ] | Wire VISA tools into Captain Nova |
| [ ] | VISA shield activation UI |
| [ ] | VISA controls display (stretch) |
| [ ] | Mobile responsiveness pass |
| [x] | Loading states + error handling |
| [x] | Animation polish |
| [ ] | Captain Nova prompt tuning |
| [ ] | Demo rehearsal #1 |
| [ ] | Pitch deck (5-6 slides) |
| [ ] | Demo rehearsal #2 |
| [ ] | Demo rehearsal #3 |
| [ ] | Final deploy |
| [ ] | Lambda warmup / provisioned concurrency |

---

## Completed Features

### Hour 0: Shared Contract Implementation

**Commits:**
- `31f21c0` - chore(shared): add pydantic dependencies
- `8a43f28` - feat(shared): add all API contract Pydantic models
- `c8a8f02` - feat(shared): add 50/30/20 category mappings
- `169a794` - feat(shared): add mock data files and loaders
- `8512ebb` - feat(shared): export models and categories from package root
- `7243c68` - feat: add TypeScript type generation from Pydantic models
- `ebac5ec` - chore: update uv.lock with pydantic dependencies

**What was added:**
- **9 Pydantic models** in `core/shared/src/shared/models.py`:
  - `AccountSummary`, `Transaction`, `FinancialSnapshot` (Data Layer)
  - `BucketBreakdown`, `BudgetReport`, `Asteroid` (Budget Engine)
  - `VisaControlRule`, `VisaAlert` (VISA Integration)
  - `CaptainResponse` (Agent Output)
- **50/30/20 category mappings** in `core/shared/src/shared/categories.py` (12 needs, 14 wants, 5 savings)
- **Mock data files** with loaders in `core/shared/src/shared/mocks/`:
  - `snapshot.json` - 3 accounts, 25 transactions
  - `budget.json` - Full budget report with 58% health score
  - `asteroids.json` - 5 financial threats
  - `visa_controls.json` - VISA control rules
- **TypeScript types** auto-generated at `web/src/types/api.ts`
- **Generation script** at `scripts/generate-types.sh`

**What subsequent modules must be aware of:**
1. **All backend modules** must import shared models: `from shared import AccountSummary, Transaction, FinancialSnapshot`
2. **Data Service** must return data matching these exact Pydantic schemas
3. **Budget Engine** must use `categorize_transaction()` from `shared.categories` for consistent bucket assignment
4. **Frontend** must import TypeScript types: `import { Transaction, BudgetReport } from '@/types/api'`
5. **Mock mode** is available via `from shared.mocks import get_mock_snapshot, get_mock_budget, get_mock_asteroids` for parallel development
6. **Regenerate types** after any Pydantic model changes by running `./scripts/generate-types.sh`
7. **Captain Nova** must return `CaptainResponse` format with optional `suggested_visa_controls`
8. **VISA Integration** must use `VisaControlRule` and `VisaAlert` schemas

---

### Module 6: Bridge UI Data Implementation

**What was added:**
- **Dumb Components (Presentational):**
  - `BalanceHUD.tsx`: Orbital net worth display with animated rings and account breakdown.
  - `TransactionLog.tsx`: Categorized list of recent transmissions with bucket color-coding.
  - `BottomMetricsBar.tsx`: 4-card grid for Income, Spending, Savings Rate, and Net Worth Delta.
  - `AsteroidCard.tsx`: Expandable threat cards with severity-based glow and action buttons.
- **Smart Components (Containers):**
  - `BridgeDataContainer.tsx`: Orchestrates HUD, Metrics, and Transactions.
  - `AsteroidsContainer.tsx`: Manages threat list and removal animations.
  - `VisaShieldsContainer.tsx`: Displays active VISA transaction controls.
- **Isolation Test Page:**
  - Accessible at `/test/bridge-data` for rapid UI development and testing.
- **Official Mock Sync:**
  - Synced `web/public/mocks/` with `core/shared/src/shared/mocks/` to ensure frontend/backend data alignment.

### API Hooks & Integration Layer

**What was added:**
- **Centralized Axios Client:** `web/src/lib/api.ts` configured with base URLs and ready for Cognito JWT injection.
- **Feature-specific Hooks:**
  - `useFinance.ts`: `useFinancialSnapshot()`, `useTransactions()`
  - `useSecurity.ts`: `useAsteroids()`, `useVisaControls()`
  - `useAI.ts`: `useCaptainNova()`

**How the Hooks Work:**
- **Dual-Mode Logic:** Every hook contains both "Mock Mode" (active) using local JSON files and "Production Mode" (commented out) using Axios.
- **Type Safety:** Hooks are strictly typed using the generated `web/src/types/api.ts` interfaces.
- **Abstraction:** Containers now consume data through hooks rather than direct `fetch` calls, making the eventual swap to real APIs a single-line change per hook.
- **Documentation:** Added `web/src/hooks/README.md` for developer guidance.

---

### Module 2: VISA Integration Implementation

**What was added:**
- **VISA Service:** `core/lambda/data-lambda/services/visa_service.py`
  - Handles mTLS authentication with VISA Sandbox
  - Downloads certificates from S3 (`synesthesia-pay-artifacts/visa/*`) to Lambda `/tmp` on cold start
  - Provides methods: `create_control()`, `get_controls()`, `delete_control()`
- **Lambda Handler Routes:** Added to `core/lambda/data-lambda/handler.py`
  - `POST /api/visa/controls` - Create a spending limit or category block
  - `GET /api/visa/controls/{document_id}` - Retrieve active control
  - `DELETE /api/visa/controls/{document_id}` - Remove a control
- **Infrastructure Updates:** `infrastructure/lib/api-stack.ts`
  - Granted data-lambda S3 read access to `synesthesia-pay-artifacts/visa/*`
  - Added environment variables: `VISA_USER_ID`, `VISA_PASSWORD`
  - Added API Gateway routes for VISA endpoints

**Certificate Setup:**
- Client Cert: `s3://synesthesia-pay-artifacts/visa/visa-cert.pem`
- Private Key: `s3://synesthesia-pay-artifacts/visa/visa-pvtkey.pem`
- Root CA: `s3://synesthesia-pay-artifacts/visa/visa-sbx.pem`

**Next Steps for VISA:**
1. Set `VISA_USER_ID` and `VISA_PASSWORD` environment variables in AWS Lambda Console or via CDK deploy
2. Deploy updated stack: `cd infrastructure && bunx cdk deploy --all`
3. Test VISA endpoints using the frontend hooks
