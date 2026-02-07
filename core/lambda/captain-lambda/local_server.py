"""
FastAPI local dev server for Captain Nova AI agent.

Usage:
    cd core/lambda/captain-lambda
    uv run uvicorn local_server:app --reload --port 8000

Routes (same as Lambda):
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

import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CaptainNovaLocal")

app = FastAPI(title="Captain Nova Local Dev", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/captain/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    logger.info("Health check endpoint called")
    return {"status": "ok", "service": "captain-nova-local"}


# ---------------------------------------------------------------------------
# Legacy conversational query
# ---------------------------------------------------------------------------

@app.post("/api/captain/query")
async def captain_query(request: QueryRequest) -> dict[str, Any]:
    """Legacy conversational Captain Nova query."""
    logger.info("Captain query endpoint called")
    try:
        logger.info(f"Query type: {request.type}, message_len: {len(request.message) if request.message else 0}")
        response = await run_captain_nova(request)
        logger.info(f"Response tools used: {response.tools_used}")
        return response.model_dump()
    except ValidationError as ve:
        logger.warning(f"Invalid captain query payload: {ve.errors(include_input=False)}")
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid request payload.", "tools_used": [], "confidence": 0.0, "suggested_visa_controls": None},
        )
    except Exception as e:
        logger.exception(f"Error processing captain query: {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Captain Nova encountered an error. Please try again, Commander.", "tools_used": [], "confidence": 0.0, "suggested_visa_controls": None},
        )


# ---------------------------------------------------------------------------
# Complete multi-agent analysis
# ---------------------------------------------------------------------------

@app.post("/api/captain/complete-analysis")
async def complete_analysis() -> dict[str, Any]:
    """Run all 7 specialists in parallel and return combined CaptainAnalysis."""
    logger.info("Complete analysis endpoint called")
    try:
        result = await analyze_finances("demo_user")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in complete analysis: {e}")
        raise HTTPException(status_code=500, detail="Complete analysis failed. Please try again, Commander.")


# ---------------------------------------------------------------------------
# Individual specialist endpoints
# ---------------------------------------------------------------------------

@app.post("/api/captain/specialists/financial-meaning")
async def specialist_financial_meaning() -> dict[str, Any]:
    """Run Financial Meaning (bridge briefing) specialist."""
    logger.info("Specialist endpoint called: financial-meaning")
    try:
        result = await _run_single_specialist_async("financial-meaning")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in financial-meaning specialist: {e}")
        raise HTTPException(status_code=500, detail="Financial meaning analysis failed.")


@app.post("/api/captain/specialists/subscriptions")
async def specialist_subscriptions() -> dict[str, Any]:
    """Run Wasteful Subscriptions (asteroid) specialist."""
    logger.info("Specialist endpoint called: subscriptions")
    try:
        result = await _run_single_specialist_async("subscriptions")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in subscriptions specialist: {e}")
        raise HTTPException(status_code=500, detail="Subscriptions analysis failed.")


@app.post("/api/captain/specialists/budget-overruns")
async def specialist_budget_overruns() -> dict[str, Any]:
    """Run Budget Overruns (ion storm) specialist."""
    logger.info("Specialist endpoint called: budget-overruns")
    try:
        result = await _run_single_specialist_async("budget-overruns")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in budget-overruns specialist: {e}")
        raise HTTPException(status_code=500, detail="Budget overruns analysis failed.")


@app.post("/api/captain/specialists/upcoming-bills")
async def specialist_upcoming_bills() -> dict[str, Any]:
    """Run Upcoming Bills (solar flare) specialist."""
    logger.info("Specialist endpoint called: upcoming-bills")
    try:
        result = await _run_single_specialist_async("upcoming-bills")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in upcoming-bills specialist: {e}")
        raise HTTPException(status_code=500, detail="Upcoming bills analysis failed.")


@app.post("/api/captain/specialists/debt-spirals")
async def specialist_debt_spirals() -> dict[str, Any]:
    """Run Debt Spirals (black hole) specialist."""
    logger.info("Specialist endpoint called: debt-spirals")
    try:
        result = await _run_single_specialist_async("debt-spirals")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in debt-spirals specialist: {e}")
        raise HTTPException(status_code=500, detail="Debt spirals analysis failed.")


@app.post("/api/captain/specialists/missed-rewards")
async def specialist_missed_rewards() -> dict[str, Any]:
    """Run Missed Rewards (wormhole) specialist."""
    logger.info("Specialist endpoint called: missed-rewards")
    try:
        result = await _run_single_specialist_async("missed-rewards")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in missed-rewards specialist: {e}")
        raise HTTPException(status_code=500, detail="Missed rewards analysis failed.")


@app.post("/api/captain/specialists/fraud-detection")
async def specialist_fraud_detection() -> dict[str, Any]:
    """Run Fraud Detection (enemy cruiser) specialist."""
    logger.info("Specialist endpoint called: fraud-detection")
    try:
        result = await _run_single_specialist_async("fraud-detection")
        return result.model_dump(mode="json")
    except Exception as e:
        logger.exception(f"Error in fraud-detection specialist: {e}")
        raise HTTPException(status_code=500, detail="Fraud detection analysis failed.")


# ---------------------------------------------------------------------------
# Run with: uv run uvicorn local_server:app --reload --port 8000
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
