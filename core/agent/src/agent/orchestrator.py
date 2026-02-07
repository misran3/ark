"""
Captain Nova Multi-Agent Orchestrator.

Fetches financial data once, slices it per specialist, dispatches
7 specialist agents in parallel via asyncio.gather, and combines
results into a single CaptainAnalysis response.
"""

import asyncio
import json
import os

from aws_lambda_powertools.logging import Logger
from datetime import datetime, timedelta, timezone

from shared.budget_engine import calculate as calculate_budget
from shared.models import FinancialSnapshot, Transaction
from shared.nessie_service import NessieService

from .models import (
    AsteroidAnalysis,
    BlackHoleAnalysis,
    CaptainAnalysis,
    EnemyCruiserAnalysis,
    FinancialMeaningOutput,
    IonStormAnalysis,
    PreFetchedData,
    SolarFlareAnalysis,
    SpecialistDeps,
    WormholeAnalysis,
)
from .specialists import (
    budget_overruns_agent,
    debt_spirals_agent,
    financial_meaning_agent,
    fraud_detection_agent,
    missed_rewards_agent,
    safe_run_specialist,
    upcoming_bills_agent,
    wasteful_subscriptions_agent,
)

logger = Logger(service="Orchestrator")

# Default data source
DATA_SOURCE = os.getenv("DATA_SOURCE", "mock")


async def fetch_all_financial_data(user_id: str) -> PreFetchedData:
    """Fetch all financial data once from Nessie or mock."""
    if DATA_SOURCE == "nessie":
        api_key = os.getenv("NESSIE_API_KEY", "")
        nessie = NessieService(api_key=api_key)
        snapshot = nessie.build_snapshot()
    else:
        from shared.mocks import get_mock_snapshot
        snapshot = get_mock_snapshot()

    budget = calculate_budget(snapshot)

    return PreFetchedData(
        snapshot=snapshot,
        budget=budget,
        transactions=snapshot.recent_transactions,
    )


def _serialize_default(obj):
    """JSON serializer for datetime objects."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def _slice_financial_meaning(data: PreFetchedData) -> str:
    """Slice data for Financial Meaning specialist."""
    return json.dumps({
        "total_net_worth": data.snapshot.total_net_worth,
        "monthly_income": data.snapshot.monthly_income,
        "monthly_spending": data.snapshot.monthly_spending,
        "health_score": data.budget.overall_health,
        "needs_status": data.budget.needs.status,
        "wants_status": data.budget.wants.status,
        "savings_status": data.budget.savings.status,
        "savings_balance": next(
            (a.balance for a in data.snapshot.accounts if a.type == "savings"), 0.0
        ),
    })


def _slice_wasteful_subscriptions(data: PreFetchedData) -> str:
    """Slice data for Wasteful Subscriptions specialist."""
    recurring = [
        t.model_dump(mode="json") for t in data.transactions
        if t.is_recurring and t.bucket != "income"
    ]
    return json.dumps({"recurring_transactions": recurring}, default=_serialize_default)


def _slice_budget_overruns(data: PreFetchedData) -> str:
    """Slice data for Budget Overruns specialist."""
    return json.dumps({
        "budget_report": data.budget.model_dump(mode="json"),
        "recent_transactions": [
            t.model_dump(mode="json") for t in data.transactions
            if t.bucket in ("needs", "wants") and t.date >= datetime.now(timezone.utc) - timedelta(days=30)
        ],
    }, default=_serialize_default)


def _slice_upcoming_bills(data: PreFetchedData) -> str:
    """Slice data for Upcoming Bills specialist."""
    recurring_with_dates = [
        t.model_dump(mode="json") for t in data.transactions
        if t.is_recurring and t.next_expected_date is not None
    ]
    accounts = [a.model_dump(mode="json") for a in data.snapshot.accounts]
    return json.dumps({
        "recurring_transactions": recurring_with_dates,
        "accounts": accounts,
    }, default=_serialize_default)


def _slice_debt_spirals(data: PreFetchedData) -> str:
    """Slice data for Debt Spirals specialist."""
    credit_cards = [
        a.model_dump(mode="json") for a in data.snapshot.accounts
        if a.type == "credit_card"
    ]
    loan_transactions = [
        t.model_dump(mode="json") for t in data.transactions
        if t.category in ("loan_payment", "minimum_cc_payment")
    ]
    return json.dumps({
        "credit_card_accounts": credit_cards,
        "loan_transactions": loan_transactions,
        "credit_card_impact": data.budget.credit_card_impact,
    }, default=_serialize_default)


def _slice_missed_rewards(data: PreFetchedData) -> str:
    """Slice data for Missed Rewards specialist."""
    recent_30 = [
        t.model_dump(mode="json") for t in data.transactions
        if t.bucket in ("needs", "wants") and t.date >= datetime.now(timezone.utc) - timedelta(days=30)
    ]
    accounts = [a.model_dump(mode="json") for a in data.snapshot.accounts]
    return json.dumps({
        "recent_transactions": recent_30,
        "accounts": accounts,
    }, default=_serialize_default)


def _slice_fraud_detection(data: PreFetchedData) -> str:
    """Slice data for Fraud Detection specialist."""
    all_txns = [t.model_dump(mode="json") for t in data.transactions]
    return json.dumps({
        "transactions": all_txns,
    }, default=_serialize_default)


# Fallback values when a specialist fails
_FM_FALLBACK = FinancialMeaningOutput(
    greeting="Commander, systems are coming online. Stand by for full analysis.",
    verdict="Unable to complete financial analysis at this time.",
    status="warning",
)
_WS_FALLBACK = AsteroidAnalysis(subscriptions=[], total_annual_waste=0.0, verdict="Subscription analysis unavailable.")
_BO_FALLBACK = IonStormAnalysis(overruns=[], overall_budget_status="on_track", verdict="Budget analysis unavailable.")
_UB_FALLBACK = SolarFlareAnalysis(bills=[], total_upcoming_30_days=0.0, verdict="Upcoming bills analysis unavailable.")
_DS_FALLBACK = BlackHoleAnalysis(
    debts=[], total_debt=0.0, total_monthly_interest=0.0, urgency="stable", verdict="Debt analysis unavailable."
)
_MR_FALLBACK = WormholeAnalysis(missed_rewards=[], annual_opportunity_cost=0.0, verdict="Rewards analysis unavailable.")
_FD_FALLBACK = EnemyCruiserAnalysis(alerts=[], overall_risk="normal", verdict="Fraud analysis unavailable.")


async def analyze_finances(user_id: str = "demo_user") -> CaptainAnalysis:
    """One-shot analysis: fetch data, dispatch 7 specialists, return combined result."""

    # 1. Fetch all data once
    data = await fetch_all_financial_data(user_id)
    logger.info("Financial data fetched", user_id=user_id)

    # 2. Build specialist deps with sliced data
    def make_deps(slice_fn) -> SpecialistDeps:
        return SpecialistDeps(user_id=user_id, financial_data=slice_fn(data))

    # 3. Dispatch all 7 in parallel
    fm, ws, bo, ub, ds, mr, fd = await asyncio.gather(
        safe_run_specialist(
            financial_meaning_agent,
            make_deps(_slice_financial_meaning),
            _FM_FALLBACK,
        ),
        safe_run_specialist(
            wasteful_subscriptions_agent,
            make_deps(_slice_wasteful_subscriptions),
            _WS_FALLBACK,
        ),
        safe_run_specialist(
            budget_overruns_agent,
            make_deps(_slice_budget_overruns),
            _BO_FALLBACK,
        ),
        safe_run_specialist(
            upcoming_bills_agent,
            make_deps(_slice_upcoming_bills),
            _UB_FALLBACK,
        ),
        safe_run_specialist(
            debt_spirals_agent,
            make_deps(_slice_debt_spirals),
            _DS_FALLBACK,
        ),
        safe_run_specialist(
            missed_rewards_agent,
            make_deps(_slice_missed_rewards),
            _MR_FALLBACK,
        ),
        safe_run_specialist(
            fraud_detection_agent,
            make_deps(_slice_fraud_detection),
            _FD_FALLBACK,
        ),
    )

    logger.info("All specialists completed", user_id=user_id)

    # 4. Combine into CaptainAnalysis
    return CaptainAnalysis(
        financial_meaning=fm,
        wasteful_subscriptions=ws,
        budget_overruns=bo,
        upcoming_bills=ub,
        debt_spirals=ds,
        missed_rewards=mr,
        fraud_alerts=fd,
    )
