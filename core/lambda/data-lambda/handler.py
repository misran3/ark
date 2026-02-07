"""
Data Lambda handler for SynesthesiaPay.

Routes:
- GET  /api/health       - Health check (no auth)
- GET  /api/snapshot      - Financial snapshot (Cognito auth)
- GET  /api/budget        - Budget report (Cognito auth)
- GET  /api/asteroids     - Financial threats (Cognito auth)
- POST /api/asteroids/<id>/action - Take action on asteroid (Cognito auth)
- GET  /api/transactions  - Transaction list (Cognito auth)

Supports mock mode (DATA_SOURCE=mock) and live Nessie mode (DATA_SOURCE=nessie).
"""

import os
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger(service="DataLambdaHandler")
tracer = Tracer()

cors_config = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors_config)

DATA_SOURCE = os.getenv("DATA_SOURCE", "mock")

# Lazy-initialized clients
_data_table_client = None
_nessie_service = None
_visa_service = None


def _get_data_table_client():
    global _data_table_client
    if _data_table_client is None:
        from database.data_table_client import DataTableClient
        _data_table_client = DataTableClient()
    return _data_table_client


def _get_nessie_service():
    global _nessie_service
    if _nessie_service is None:
        from services.nessie_service import NessieService
        api_key = os.getenv("NESSIE_API_KEY", "")
        _nessie_service = NessieService(api_key=api_key)
    return _nessie_service


def _get_visa_service():
    global _visa_service
    if _visa_service is None:
        from services.visa_service import VisaService
        _visa_service = VisaService()
    return _visa_service


def _get_user_id() -> str:
    """Extract user ID from Cognito JWT claims."""
    try:
        claims = app.current_event.request_context.authorizer
        if claims and hasattr(claims, "claims"):
            return claims.claims.get("sub", "demo_user")
        if isinstance(claims, dict):
            return claims.get("claims", {}).get("sub", "demo_user")
    except (AttributeError, KeyError, TypeError):
        pass
    return "demo_user"


def _get_snapshot_data() -> dict:
    """Get financial snapshot, using cache or computing fresh."""
    user_id = _get_user_id()

    if DATA_SOURCE == "nessie":
        # Check cache first
        db = _get_data_table_client()
        cached = db.get_cached_snapshot(user_id)
        if cached:
            logger.info("Returning cached snapshot", user_id=user_id)
            return cached

        # Fetch fresh from Nessie
        try:
            from services.nessie_service import NessieApiError
            nessie = _get_nessie_service()
            snapshot = nessie.build_snapshot()
            snapshot_dict = snapshot.model_dump(mode="json")
            db.cache_snapshot(user_id, snapshot_dict)
            return snapshot_dict
        except Exception as e:
            logger.warning("Nessie API failed, falling back to mock", error=str(e))

    # Mock mode or Nessie fallback
    from shared.mocks import get_mock_snapshot
    return get_mock_snapshot().model_dump(mode="json")


def _get_budget_data() -> dict:
    """Get budget report, using cache or computing fresh."""
    user_id = _get_user_id()

    if DATA_SOURCE == "nessie":
        db = _get_data_table_client()
        cached = db.get_cached_budget(user_id)
        if cached:
            logger.info("Returning cached budget", user_id=user_id)
            return cached

    # Compute from snapshot
    from shared.models import FinancialSnapshot
    from services.budget_engine import calculate

    snapshot_dict = _get_snapshot_data()
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
@tracer.capture_method
def health_check():
    """Health check endpoint - no auth required."""
    return {"status": "ok", "data_source": DATA_SOURCE}


@app.get("/api/snapshot")
@tracer.capture_method
def get_snapshot() -> dict[str, Any]:
    """Return financial snapshot for the authenticated user."""
    logger.info("Snapshot endpoint called", user_id=_get_user_id())
    return _get_snapshot_data()


@app.get("/api/budget")
@tracer.capture_method
def get_budget() -> dict[str, Any]:
    """Return 50/30/20 budget report for the authenticated user."""
    logger.info("Budget endpoint called", user_id=_get_user_id())
    return _get_budget_data()


@app.get("/api/asteroids")
@tracer.capture_method
def get_asteroids() -> dict[str, Any]:
    """Return financial threats (asteroids) for the authenticated user."""
    logger.info("Asteroids endpoint called", user_id=_get_user_id())

    from shared.models import BudgetReport, FinancialSnapshot
    from services.asteroid_detector import detect

    snapshot_dict = _get_snapshot_data()
    budget_dict = _get_budget_data()

    snapshot = FinancialSnapshot.model_validate(snapshot_dict)
    budget = BudgetReport.model_validate(budget_dict)

    asteroids = detect(snapshot, budget)
    asteroid_list = [a.model_dump(mode="json") for a in asteroids]

    # Merge with persisted action states
    user_id = _get_user_id()
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
            logger.warning("Failed to load asteroid states", error=str(e))

    return {"asteroids": asteroid_list}


@app.post("/api/asteroids/<asteroid_id>/action")
@tracer.capture_method
def action_asteroid(asteroid_id: str) -> dict[str, Any]:
    """Record user action on an asteroid (deflect/absorb/redirect)."""
    user_id = _get_user_id()
    logger.info("Asteroid action endpoint called", user_id=user_id, asteroid_id=asteroid_id)

    body = app.current_event.json_body or {}
    action = body.get("action")
    if action not in ("deflect", "absorb", "redirect"):
        return {"error": "Invalid action. Must be one of: deflect, absorb, redirect"}, 400

    try:
        db = _get_data_table_client()
        db.save_asteroid_action(user_id, asteroid_id, action)
    except Exception as e:
        logger.warning("Failed to save asteroid action (may be in mock mode)", error=str(e))

    return {
        "asteroid_id": asteroid_id,
        "action": action,
        "status": "recorded",
    }


@app.get("/api/transactions")
@tracer.capture_method
def get_transactions() -> dict[str, Any]:
    """Return transaction list for the authenticated user."""
    logger.info("Transactions endpoint called", user_id=_get_user_id())

    days = int(app.current_event.query_string_parameters.get("days", "30") if app.current_event.query_string_parameters else "30")

    snapshot_dict = _get_snapshot_data()
    transactions = snapshot_dict.get("recent_transactions", [])

    # Filter by days if needed
    if days < 90:
        from datetime import datetime, timedelta, timezone
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        cutoff_str = cutoff.isoformat()
        transactions = [t for t in transactions if t.get("date", "") >= cutoff_str]

    return {"transactions": transactions, "count": len(transactions)}


# =============================================================================
# VISA Transaction Controls Routes
# =============================================================================


@app.post("/api/visa/controls")
@tracer.capture_method
def create_visa_control() -> dict[str, Any]:
    """Create a new VISA transaction control."""
    user_id = _get_user_id()
    logger.info("Create VISA control endpoint called", user_id=user_id)

    from shared.models import VisaControlRule

    body = app.current_event.json_body or {}
    try:
        rule = VisaControlRule(**body)
        visa = _get_visa_service()
        result = visa.create_control(rule)
        return result
    except Exception as e:
        logger.error(f"Failed to create VISA control: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.get("/api/visa/controls/<document_id>")
@tracer.capture_method
def get_visa_control(document_id: str) -> dict[str, Any]:
    """Get a VISA transaction control by document ID."""
    user_id = _get_user_id()
    logger.info("Get VISA control endpoint called", user_id=user_id, document_id=document_id)

    try:
        visa = _get_visa_service()
        result = visa.get_controls(document_id)
        return result
    except Exception as e:
        logger.error(f"Failed to get VISA control: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.delete("/api/visa/controls/<document_id>")
@tracer.capture_method
def delete_visa_control(document_id: str) -> dict[str, Any]:
    """Delete a VISA transaction control."""
    user_id = _get_user_id()
    logger.info("Delete VISA control endpoint called", user_id=user_id, document_id=document_id)

    try:
        visa = _get_visa_service()
        result = visa.delete_control(document_id)
        return result
    except Exception as e:
        logger.error(f"Failed to delete VISA control: {e}")
        return {"status": "error", "error": str(e)}, 400


# =============================================================================
# Lambda entry point
# =============================================================================


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict[str, Any]:
    """Main Lambda handler function."""
    return app.resolve(event, context)
