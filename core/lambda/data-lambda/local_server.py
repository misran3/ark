"""
FastAPI local dev server for Data Lambda.

Usage:
    cd core/lambda/data-lambda
    uv run uvicorn local_server:app --reload --port 8001

Routes (same as Lambda):
- GET  /api/health              - Health check (no auth)
- GET  /api/snapshot            - Financial snapshot
- GET  /api/budget              - Budget report
- GET  /api/asteroids           - Financial threats
- POST /api/asteroids/{id}/action - Take action on asteroid
- GET  /api/transactions        - Transaction list
- GET  /api/report/summary      - 6-month financial summary
"""

import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataLambdaLocal")

app = FastAPI(title="Data Lambda Local Dev", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_SOURCE = os.getenv("DATA_SOURCE", "mock")

# Lazy-initialized clients
_data_table_client = None
_nessie_service = None


def _get_data_table_client():
    global _data_table_client
    if _data_table_client is None:
        from database.data_table_client import DataTableClient
        _data_table_client = DataTableClient()
    return _data_table_client


def _get_nessie_service():
    global _nessie_service
    if _nessie_service is None:
        from shared.nessie_service import NessieService
        api_key = os.getenv("NESSIE_API_KEY", "")
        _nessie_service = NessieService(api_key=api_key)
    return _nessie_service


def _get_snapshot_data(user_id: str = "demo_user") -> dict:
    """Get financial snapshot, using cache or computing fresh."""
    if DATA_SOURCE == "nessie":
        # Check cache first
        db = _get_data_table_client()
        cached = db.get_cached_snapshot(user_id)
        if cached:
            logger.info(f"Returning cached snapshot for {user_id}")
            return cached

        # Fetch fresh from Nessie
        try:
            nessie = _get_nessie_service()
            snapshot = nessie.build_snapshot()
            snapshot_dict = snapshot.model_dump(mode="json")
            db.cache_snapshot(user_id, snapshot_dict)
            return snapshot_dict
        except Exception as e:
            logger.warning(f"Nessie API failed, falling back to mock: {e}")

    # Mock mode or Nessie fallback
    from shared.mocks import get_mock_snapshot
    return get_mock_snapshot().model_dump(mode="json")


def _get_budget_data(user_id: str = "demo_user") -> dict:
    """Get budget report, using cache or computing fresh."""
    if DATA_SOURCE == "nessie":
        db = _get_data_table_client()
        cached = db.get_cached_budget(user_id)
        if cached:
            logger.info(f"Returning cached budget for {user_id}")
            return cached

    # Compute from snapshot
    from shared.models import FinancialSnapshot
    from shared.budget_engine import calculate

    snapshot_dict = _get_snapshot_data(user_id)
    snapshot = FinancialSnapshot.model_validate(snapshot_dict)
    budget = calculate(snapshot)
    budget_dict = budget.model_dump(mode="json")

    if DATA_SOURCE == "nessie":
        db = _get_data_table_client()
        db.cache_budget(user_id, budget_dict)

    return budget_dict


# =============================================================================
# Routes
# =============================================================================


@app.get("/api/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint - no auth required."""
    return {"status": "ok", "data_source": DATA_SOURCE, "service": "data-lambda-local"}


@app.get("/api/snapshot")
async def get_snapshot(user_id: str = "demo_user") -> dict[str, Any]:
    """Return financial snapshot for the user."""
    logger.info(f"Snapshot endpoint called for {user_id}")
    return _get_snapshot_data(user_id)


@app.get("/api/budget")
async def get_budget(user_id: str = "demo_user") -> dict[str, Any]:
    """Return 50/30/20 budget report for the user."""
    logger.info(f"Budget endpoint called for {user_id}")
    return _get_budget_data(user_id)


@app.get("/api/asteroids")
async def get_asteroids(user_id: str = "demo_user") -> dict[str, Any]:
    """Return financial threats (asteroids) for the user."""
    logger.info(f"Asteroids endpoint called for {user_id}")

    from shared.models import BudgetReport, FinancialSnapshot
    from services.asteroid_detector import detect

    snapshot_dict = _get_snapshot_data(user_id)
    budget_dict = _get_budget_data(user_id)

    snapshot = FinancialSnapshot.model_validate(snapshot_dict)
    budget = BudgetReport.model_validate(budget_dict)

    asteroids = detect(snapshot, budget)
    asteroid_list = [a.model_dump(mode="json") for a in asteroids]

    # Merge with persisted action states
    if DATA_SOURCE == "nessie":
        try:
            db = _get_data_table_client()
            states = db.get_all_asteroid_states(user_id)
            state_map = {s["asteroid_id"]: s for s in states}
            for asteroid in asteroid_list:
                state = state_map.get(asteroid["id"])
                if state:
                    asteroid["user_action"] = state["action"]
                    asteroid["actioned_at"] = state["actioned_at"]
        except Exception as e:
            logger.warning(f"Failed to load asteroid states: {e}")

    return {"asteroids": asteroid_list}


@app.post("/api/asteroids/{asteroid_id}/action")
async def action_asteroid(asteroid_id: str, action: str = Query(...)) -> dict[str, Any]:
    """Record user action on an asteroid (deflect/absorb/redirect)."""
    user_id = "demo_user"
    logger.info(f"Asteroid action endpoint called: {user_id}, {asteroid_id}, {action}")

    if action not in ("deflect", "absorb", "redirect"):
        raise HTTPException(status_code=400, detail="Invalid action. Must be one of: deflect, absorb, redirect")

    try:
        db = _get_data_table_client()
        db.save_asteroid_action(user_id, asteroid_id, action)
    except Exception as e:
        logger.warning(f"Failed to save asteroid action (may be in mock mode): {e}")

    return {
        "asteroid_id": asteroid_id,
        "action": action,
        "status": "recorded",
    }


@app.get("/api/transactions")
async def get_transactions(
    user_id: str = "demo_user",
    days: int = 30,
) -> dict[str, Any]:
    """Return transaction list for the user."""
    logger.info(f"Transactions endpoint called for {user_id}")

    snapshot_dict = _get_snapshot_data(user_id)
    transactions = snapshot_dict.get("recent_transactions", [])

    # Filter by days if needed
    if days < 90:
        from datetime import datetime, timedelta, timezone
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        cutoff_str = cutoff.isoformat()
        transactions = [t for t in transactions if t.get("date", "") >= cutoff_str]

    return {"transactions": transactions, "count": len(transactions)}


@app.get("/api/report/summary")
async def get_financial_summary(user_id: str = "user_maya_torres") -> dict[str, Any]:
    """Return 6-month financial summary report.

    Query params:
        user_id: User ID to fetch report for (default: user_maya_torres)

    Data source priority:
        1. Nessie API (fresh data)
        2. DynamoDB cache (fallback)
    """
    logger.info(f"Financial summary endpoint called for {user_id}")

    from shared.models import FinancialSnapshot
    from services.report_service import build_report

    snapshot_dict = None

    # 1. Try Nessie API first
    if DATA_SOURCE == "nessie":
        try:
            nessie = _get_nessie_service()
            snapshot = nessie.build_snapshot(days=180)  # 6 months
            snapshot_dict = snapshot.model_dump(mode="json")
            logger.info(f"Got fresh data from Nessie for {user_id}")
        except Exception as e:
            logger.warning(f"Nessie API failed, trying cache: {e}")

    # 2. Fallback to DynamoDB cache
    if snapshot_dict is None:
        try:
            db = _get_data_table_client()
            snapshot_dict = db.get_cached_snapshot(user_id)
            if snapshot_dict:
                logger.info(f"Using cached snapshot from DynamoDB for {user_id}")
        except Exception as e:
            logger.warning(f"DynamoDB cache failed: {e}")

    # 3. Final fallback to mock data
    if snapshot_dict is None:
        from shared.mocks import get_mock_snapshot
        snapshot_dict = get_mock_snapshot().model_dump(mode="json")
        logger.info(f"Using mock data as final fallback for {user_id}")

    snapshot = FinancialSnapshot.model_validate(snapshot_dict)
    report = build_report(snapshot, user_id)

    return report.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Run with: uv run uvicorn local_server:app --reload --port 8001
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
