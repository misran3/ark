"""
Lambda handler for Captain Nova AI agent.

Routes:
- GET  /api/captain/health                           - Health check
- POST /api/captain/query                            - Legacy conversational agent
- POST /api/captain/complete-analysis                - Full 7-specialist analysis
- POST /api/captain/specialists/financial-meaning     - Bridge briefing
- POST /api/captain/specialists/subscriptions         - Wasteful subscriptions
- POST /api/captain/specialists/budget-overruns       - Budget overruns
- POST /api/captain/specialists/upcoming-bills        - Upcoming bills
- POST /api/captain/specialists/debt-spirals          - Debt spirals
- POST /api/captain/specialists/missed-rewards        - Missed rewards
- POST /api/captain/specialists/fraud-detection       - Fraud detection
"""

import asyncio
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, Response
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from pydantic import ValidationError

from agent import QueryRequest, run_captain_nova
from agent.models import SpecialistDeps
from agent.orchestrator import (
    analyze_finances,
    fetch_all_financial_data,
    slice_financial_meaning,
    slice_wasteful_subscriptions,
    slice_budget_overruns,
    slice_upcoming_bills,
    slice_debt_spirals,
    slice_missed_rewards,
    slice_fraud_detection,
    FM_FALLBACK,
    WS_FALLBACK,
    BO_FALLBACK,
    UB_FALLBACK,
    DS_FALLBACK,
    MR_FALLBACK,
    FD_FALLBACK,
)
from agent.specialists import (
    financial_meaning_agent,
    wasteful_subscriptions_agent,
    budget_overruns_agent,
    upcoming_bills_agent,
    debt_spirals_agent,
    missed_rewards_agent,
    fraud_detection_agent,
    safe_run_specialist,
)

logger = Logger(service="CaptainNovaHandler")
tracer = Tracer()
app = APIGatewayRestResolver()

# ---------------------------------------------------------------------------
# Specialist registry: name -> (agent, slice_fn, fallback)
# ---------------------------------------------------------------------------
SPECIALIST_REGISTRY = {
    "financial-meaning":  (financial_meaning_agent,      slice_financial_meaning,      FM_FALLBACK),
    "subscriptions":      (wasteful_subscriptions_agent, slice_wasteful_subscriptions, WS_FALLBACK),
    "budget-overruns":    (budget_overruns_agent,         slice_budget_overruns,         BO_FALLBACK),
    "upcoming-bills":     (upcoming_bills_agent,          slice_upcoming_bills,          UB_FALLBACK),
    "debt-spirals":       (debt_spirals_agent,            slice_debt_spirals,            DS_FALLBACK),
    "missed-rewards":     (missed_rewards_agent,          slice_missed_rewards,          MR_FALLBACK),
    "fraud-detection":    (fraud_detection_agent,          slice_fraud_detection,          FD_FALLBACK),
}


async def _run_single_specialist_async(name: str, user_id: str = "demo_user"):
    """Fetch data, slice for the named specialist, and run it."""
    agent, slice_fn, fallback = SPECIALIST_REGISTRY[name]
    data = await fetch_all_financial_data(user_id)
    deps = SpecialistDeps(user_id=user_id, financial_data=slice_fn(data))
    return await safe_run_specialist(agent, deps, fallback)


def _error_response(status_code: int, message: str) -> Response:
    """Build a standard error Response."""
    return Response(
        status_code=status_code,
        body={"error": message},
        content_type="application/json",
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/captain/health")
@tracer.capture_method
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    logger.info("Health check endpoint called")
    return {"status": "ok", "service": "captain-nova"}


# ---------------------------------------------------------------------------
# Legacy conversational query
# ---------------------------------------------------------------------------

@app.post("/api/captain/query")
@tracer.capture_method
def captain_query() -> Response:
    """Legacy conversational Captain Nova query."""
    logger.info("Captain query endpoint called")
    try:
        body = app.current_event.json_body
        request = QueryRequest(**body)
        logger.info(f"Query type: {request.type}, message_len: {len(request.message) if request.message else 0}")
        response = asyncio.run(run_captain_nova(request))
        logger.info(f"Response tools used: {response.tools_used}")
        return Response(status_code=200, body=response.model_dump(), content_type="application/json")
    except ValidationError as ve:
        logger.warning("Invalid captain query payload", extra={"errors": ve.errors(include_input=False)})
        return Response(
            status_code=400,
            body={"message": "Invalid request payload.", "tools_used": [], "confidence": 0.0, "suggested_visa_controls": None},
            content_type="application/json",
        )
    except Exception as e:
        logger.exception(f"Error processing captain query: {e}")
        return Response(
            status_code=500,
            body={"message": "Captain Nova encountered an error. Please try again, Commander.", "tools_used": [], "confidence": 0.0, "suggested_visa_controls": None},
            content_type="application/json",
        )


# ---------------------------------------------------------------------------
# Complete multi-agent analysis
# ---------------------------------------------------------------------------

@app.post("/api/captain/complete-analysis")
@tracer.capture_method
def complete_analysis() -> Response:
    """Run all 7 specialists in parallel and return combined CaptainAnalysis."""
    logger.info("Complete analysis endpoint called")
    try:
        result = asyncio.run(analyze_finances("demo_user"))
        return Response(
            status_code=200,
            body=result.model_dump(mode="json"),
            content_type="application/json",
        )
    except Exception as e:
        logger.exception(f"Error in complete analysis: {e}")
        return _error_response(500, "Complete analysis failed. Please try again, Commander.")


# ---------------------------------------------------------------------------
# Individual specialist endpoints
# ---------------------------------------------------------------------------

@app.post("/api/captain/specialists/financial-meaning")
@tracer.capture_method
def specialist_financial_meaning() -> Response:
    """Run Financial Meaning (bridge briefing) specialist."""
    logger.info("Specialist endpoint called", specialist="financial-meaning")
    try:
        result = asyncio.run(_run_single_specialist_async("financial-meaning"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in financial-meaning specialist: {e}")
        return _error_response(500, "Financial meaning analysis failed.")


@app.post("/api/captain/specialists/subscriptions")
@tracer.capture_method
def specialist_subscriptions() -> Response:
    """Run Wasteful Subscriptions (asteroid) specialist."""
    logger.info("Specialist endpoint called", specialist="subscriptions")
    try:
        result = asyncio.run(_run_single_specialist_async("subscriptions"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in subscriptions specialist: {e}")
        return _error_response(500, "Subscriptions analysis failed.")


@app.post("/api/captain/specialists/budget-overruns")
@tracer.capture_method
def specialist_budget_overruns() -> Response:
    """Run Budget Overruns (ion storm) specialist."""
    logger.info("Specialist endpoint called", specialist="budget-overruns")
    try:
        result = asyncio.run(_run_single_specialist_async("budget-overruns"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in budget-overruns specialist: {e}")
        return _error_response(500, "Budget overruns analysis failed.")


@app.post("/api/captain/specialists/upcoming-bills")
@tracer.capture_method
def specialist_upcoming_bills() -> Response:
    """Run Upcoming Bills (solar flare) specialist."""
    logger.info("Specialist endpoint called", specialist="upcoming-bills")
    try:
        result = asyncio.run(_run_single_specialist_async("upcoming-bills"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in upcoming-bills specialist: {e}")
        return _error_response(500, "Upcoming bills analysis failed.")


@app.post("/api/captain/specialists/debt-spirals")
@tracer.capture_method
def specialist_debt_spirals() -> Response:
    """Run Debt Spirals (black hole) specialist."""
    logger.info("Specialist endpoint called", specialist="debt-spirals")
    try:
        result = asyncio.run(_run_single_specialist_async("debt-spirals"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in debt-spirals specialist: {e}")
        return _error_response(500, "Debt spirals analysis failed.")


@app.post("/api/captain/specialists/missed-rewards")
@tracer.capture_method
def specialist_missed_rewards() -> Response:
    """Run Missed Rewards (wormhole) specialist."""
    logger.info("Specialist endpoint called", specialist="missed-rewards")
    try:
        result = asyncio.run(_run_single_specialist_async("missed-rewards"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in missed-rewards specialist: {e}")
        return _error_response(500, "Missed rewards analysis failed.")


@app.post("/api/captain/specialists/fraud-detection")
@tracer.capture_method
def specialist_fraud_detection() -> Response:
    """Run Fraud Detection (enemy cruiser) specialist."""
    logger.info("Specialist endpoint called", specialist="fraud-detection")
    try:
        result = asyncio.run(_run_single_specialist_async("fraud-detection"))
        return Response(status_code=200, body=result.model_dump(mode="json"), content_type="application/json")
    except Exception as e:
        logger.exception(f"Error in fraud-detection specialist: {e}")
        return _error_response(500, "Fraud detection analysis failed.")


# ---------------------------------------------------------------------------
# Lambda entry point
# ---------------------------------------------------------------------------

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict[str, Any]:
    """Main Lambda handler function."""
    return app.resolve(event, context)
