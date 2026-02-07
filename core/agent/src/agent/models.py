"""
Models for Captain Nova agent.
"""

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel

from shared.models import BudgetReport, FinancialSnapshot, Transaction, VisaControlRule


class QueryRequest(BaseModel):
    """Request to Captain Nova."""

    type: Literal[
        "bridge_briefing",
        "budget_scan",
        "threat_report",
        "savings_eta",
        "activate_shield",
        "custom",
    ]
    message: str = ""


class CaptainDeps(BaseModel):
    """Dependencies injected into Captain Nova agent via RunContext."""

    user_id: str = "demo_user"
    query_type: str = "custom"
    query_message: str = ""

    # This field is set dynamically if a Bedrock parallel tool call error occurs, to trigger the instruction callback to include an error message in the prompt for the next retry.
    parallel_tool_call_error: str = ""


class CaptainOutput(BaseModel):
    """Raw output from Captain Nova agent."""

    message: str
    suggested_visa_controls: list[VisaControlRule] | None = None


# =============================================================================
# Multi-Agent Specialist Models
# =============================================================================


class SpecialistDeps(BaseModel):
    """Injected by orchestrator into every specialist agent."""
    user_id: str
    financial_data: str  # Serialized JSON — orchestrator controls the slice


# --- 1. Financial Meaning (Cold Boot) ---

class FinancialMeaningOutput(BaseModel):
    """Spoken by Nova during cold boot materialization."""
    greeting: str
    verdict: str
    status: Literal["stable", "warning", "critical"]


# --- 2. Wasteful Subscriptions (Asteroid) ---

class WastefulSubscription(BaseModel):
    merchant: str
    monthly_cost: float
    last_used_days_ago: int
    annual_waste: float
    verdict: str

class AsteroidAnalysis(BaseModel):
    subscriptions: list[WastefulSubscription]
    total_annual_waste: float


# --- 3. Budget Overruns (Ion Storm) ---

class BudgetOverrun(BaseModel):
    category: str
    budget_amount: float
    actual_amount: float
    overspend_amount: float
    pct_over: float
    volatility: Literal["high", "medium", "low"]
    verdict: str

class IonStormAnalysis(BaseModel):
    overruns: list[BudgetOverrun]
    overall_budget_status: Literal["on_track", "warning", "critical"]


# --- 4. Upcoming Bills (Solar Flare) ---

class UpcomingBill(BaseModel):
    merchant: str
    amount: float
    due_date: str
    days_until: int
    recommended_card: str | None = None
    estimated_rewards_value: float | None = None

class SolarFlareAnalysis(BaseModel):
    bills: list[UpcomingBill]
    total_upcoming_30_days: float


# --- 5. Debt Spirals (Black Hole) ---

class DebtSpiral(BaseModel):
    account: str
    balance: float
    apr: float
    monthly_interest: float
    minimum_payment_months: int
    recommended_payment: float
    recommended_months: int
    interest_saved: float
    verdict: str

class BlackHoleAnalysis(BaseModel):
    debts: list[DebtSpiral]
    total_debt: float
    total_monthly_interest: float
    urgency: Literal["critical", "warning", "stable"]


# --- 6. Missed Rewards (Wormhole) ---

class MissedReward(BaseModel):
    category: str
    current_card: str
    optimal_card: str
    transactions_affected: int
    points_lost: int
    cash_value_lost: float
    verdict: str

class WormholeAnalysis(BaseModel):
    missed_rewards: list[MissedReward]
    annual_opportunity_cost: float


# --- 7. Fraud Detection (Enemy Cruiser) ---

class FraudAlert(BaseModel):
    merchant: str
    amount: float
    date: str
    risk_score: float
    indicators: list[str]
    recommended_action: Literal["block", "monitor", "allow"]
    verdict: str

class EnemyCruiserAnalysis(BaseModel):
    alerts: list[FraudAlert]
    overall_risk: Literal["critical", "elevated", "normal"]


# --- Combined Output ---

class CaptainAnalysis(BaseModel):
    """Complete analysis returned to frontend. One object, 7 specialist results."""
    financial_meaning: FinancialMeaningOutput
    wasteful_subscriptions: AsteroidAnalysis
    budget_overruns: IonStormAnalysis
    upcoming_bills: SolarFlareAnalysis
    debt_spirals: BlackHoleAnalysis
    missed_rewards: WormholeAnalysis
    fraud_alerts: EnemyCruiserAnalysis


@dataclass
class PreFetchedData:
    """All financial data fetched once before dispatching specialists."""
    snapshot: FinancialSnapshot
    budget: BudgetReport
    transactions: list[Transaction]
