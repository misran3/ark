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
| [ ] | Balance HUD component |
| [ ] | Bottom metrics bar |
| [ ] | Transaction log component |
| [ ] | Asteroid UI component |
| [ ] | Frontend → API Gateway integration |
| [ ] | Captain Nova tools → real endpoints |
| [ ] | VISA sandbox authentication (mTLS) |
| [ ] | VISA Transaction Controls API integration |
| [ ] | VISA controls Lambda endpoints |
| [ ] | Wire VISA tools into Captain Nova |
| [ ] | VISA shield activation UI |
| [ ] | VISA controls display (stretch) |
| [ ] | Mobile responsiveness pass |
| [ ] | Loading states + error handling |
| [ ] | Animation polish |
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
