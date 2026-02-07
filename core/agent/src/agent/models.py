"""
Models for Captain Nova agent.
"""

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

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
    user_id: str = Field(description="Unique identifier for the user being analyzed.")
    financial_data: str = Field(description="Serialized JSON financial data slice for this specialist.")


# --- 1. Financial Meaning (Cold Boot) ---

class FinancialMeaningOutput(BaseModel):
    """Captain Nova's opening briefing — a spoken greeting, headline verdict, and status level."""
    greeting: str = Field(description="Warm, conversational greeting (30-50 words) addressing the user as Commander with space metaphors.")
    verdict: str = Field(description="One sentence capturing the single most important financial insight with exact dollar amounts.")
    status: Literal["stable", "warning", "critical"] = Field(description="Overall financial health: stable (score>=70), warning (40-69), critical (<40).")


# --- 2. Wasteful Subscriptions (Asteroid) ---

class WastefulSubscription(BaseModel):
    """A single recurring charge identified as unused or underused."""
    merchant: str = Field(description="Exact merchant name from transaction data.")
    monthly_cost: float = Field(description="Monthly charge amount in dollars (positive number).")
    last_used_days_ago: int = Field(description="Days since the most recent charge from this merchant.")
    annual_waste: float = Field(description="Projected yearly cost if the subscription continues unused.")
    verdict: str = Field(description="One sentence explaining why this is wasteful and the savings opportunity.")

class AsteroidAnalysis(BaseModel):
    """Wasteful subscription scan — recurring charges with low or zero usage."""
    subscriptions: list[WastefulSubscription] = Field(description="List of wasteful subscriptions found, ranked by annual_waste descending.")
    total_annual_waste: float = Field(description="Sum of all annual_waste values across identified subscriptions.")
    verdict: str = Field(description="One sentence summary of total subscription waste and recommended action.")


# --- 3. Budget Overruns (Ion Storm) ---

class BudgetOverrun(BaseModel):
    """A single spending category that exceeded its 50/30/20 budget target."""
    category: str = Field(description="Exact spending category name (e.g. rent, groceries, dining).")
    budget_amount: float = Field(description="Proportional budget target for this category in dollars.")
    actual_amount: float = Field(description="Actual spending in this category in dollars.")
    overspend_amount: float = Field(description="Dollar amount over budget (actual - budget, positive number).")
    pct_over: float = Field(description="Percentage over budget target.")
    volatility: Literal["high", "medium", "low"] = Field(description="Spending trend volatility: rising=high, stable=medium, falling=low.")
    verdict: str = Field(description="One actionable sentence to reduce spending in this category.")

class IonStormAnalysis(BaseModel):
    """Budget overrun scan — categories exceeding 50/30/20 targets."""
    overruns: list[BudgetOverrun] = Field(description="Categories exceeding budget, ordered by largest dollar overspend first.")
    overall_budget_status: Literal["on_track", "warning", "critical"] = Field(description="Critical if any bucket >120% target, warning if >100%, on_track otherwise.")
    verdict: str = Field(description="One sentence summary of budget health and the biggest area to cut back.")


# --- 4. Upcoming Bills (Solar Flare) ---

class UpcomingBill(BaseModel):
    """A single recurring bill expected within the next 30 days."""
    merchant: str = Field(description="Exact merchant name for the upcoming charge.")
    amount: float = Field(description="Expected charge amount in dollars (positive number).")
    due_date: str = Field(description="ISO date string (YYYY-MM-DD) when the charge is expected.")
    days_until: int = Field(description="Integer days from today until the charge.")
    recommended_card: str | None = Field(default=None, description="Best card for this merchant category, or null if not applicable.")
    estimated_rewards_value: float | None = Field(default=None, description="Estimated reward cash value if using the recommended card, or null.")

class SolarFlareAnalysis(BaseModel):
    """Upcoming bills scan — recurring charges due within 30 days."""
    bills: list[UpcomingBill] = Field(description="Upcoming bills sorted by days_until ascending (most urgent first).")
    total_upcoming_30_days: float = Field(description="Sum of all upcoming bill amounts in the next 30 days.")
    verdict: str = Field(description="One sentence summary of upcoming financial obligations and any card optimization tips.")


# --- 5. Debt Spirals (Black Hole) ---

class DebtSpiral(BaseModel):
    """A single debt account with payoff analysis comparing minimum vs recommended payments."""
    account: str = Field(description="Account nickname from the financial data.")
    balance: float = Field(description="Outstanding balance in dollars (positive number).")
    apr: float = Field(description="Annual percentage rate for this debt.")
    monthly_interest: float = Field(description="Monthly interest charge at current balance (balance * APR / 12).")
    minimum_payment_months: int = Field(description="Months to pay off at minimum payment (-1 if payment doesn't cover interest).")
    recommended_payment: float = Field(description="Suggested monthly payment to clear debt in 6-12 months.")
    recommended_months: int = Field(description="Months to pay off at recommended payment.")
    interest_saved: float = Field(description="Dollar amount saved by paying recommended vs minimum.")
    verdict: str = Field(description="One sentence about the true cost of minimum payments on this debt.")

class BlackHoleAnalysis(BaseModel):
    """Debt spiral scan — compounding debt risks across credit cards and loans."""
    debts: list[DebtSpiral] = Field(description="All debt accounts with payoff analysis.")
    total_debt: float = Field(description="Sum of all outstanding balances.")
    total_monthly_interest: float = Field(description="Sum of monthly interest charges across all debts.")
    urgency: Literal["critical", "warning", "stable"] = Field(description="Critical if any debt >60 months at minimum, warning if >24, stable otherwise.")
    verdict: str = Field(description="One sentence summary of overall debt situation and recommended strategy.")


# --- 6. Missed Rewards (Wormhole) ---

class MissedReward(BaseModel):
    """A spending category where using a different card would have earned more rewards."""
    category: str = Field(description="Spending category where rewards were suboptimal.")
    current_card: str = Field(description="Card actually used for these transactions.")
    optimal_card: str = Field(description="Card that should have been used for better rewards.")
    transactions_affected: int = Field(description="Number of transactions in this category on the wrong card.")
    points_lost: int = Field(description="Total reward points missed by using the wrong card.")
    cash_value_lost: float = Field(description="Dollar value of lost rewards at $0.01/point.")
    verdict: str = Field(description="One sentence explaining the card routing recommendation.")

class WormholeAnalysis(BaseModel):
    """Missed rewards scan — transactions where a different card would earn more points."""
    missed_rewards: list[MissedReward] = Field(description="Categories with suboptimal card usage, ranked by cash_value_lost.")
    annual_opportunity_cost: float = Field(description="Annualized dollar value of all missed rewards.")
    verdict: str = Field(description="One sentence summary of total missed rewards and top card routing fix.")


# --- 7. Fraud Detection (Enemy Cruiser) ---

class FraudAlert(BaseModel):
    """A single transaction flagged as potentially fraudulent or unauthorized."""
    merchant: str = Field(description="Exact merchant name from the suspicious transaction.")
    amount: float = Field(description="Transaction amount in dollars (positive number).")
    date: str = Field(description="ISO date string of the transaction.")
    risk_score: float = Field(description="Risk score 0.0-1.0 based on number of triggered indicators (each adds 0.25).")
    indicators: list[str] = Field(description="List of triggered fraud indicators (e.g. amount_anomaly, new_merchant, unusual_category).")
    recommended_action: Literal["block", "monitor", "allow"] = Field(description="Block if risk>0.7, monitor if 0.4-0.7, allow if <0.4.")
    verdict: str = Field(description="One sentence explaining why this transaction is suspicious.")

class EnemyCruiserAnalysis(BaseModel):
    """Fraud detection scan — anomalous transactions that may indicate unauthorized charges."""
    alerts: list[FraudAlert] = Field(description="Suspicious transactions ranked by risk_score descending.")
    overall_risk: Literal["critical", "elevated", "normal"] = Field(description="Critical if any risk>0.7, elevated if any >0.4, normal otherwise.")
    verdict: str = Field(description="One sentence summary of fraud risk level and recommended immediate actions.")


# --- Combined Output ---

class CaptainAnalysis(BaseModel):
    """Complete analysis returned to frontend. One object, 7 specialist results."""
    financial_meaning: FinancialMeaningOutput = Field(description="Cold boot briefing — greeting, verdict, and health status.")
    wasteful_subscriptions: AsteroidAnalysis = Field(description="Asteroid scan — unused or underused recurring subscriptions.")
    budget_overruns: IonStormAnalysis = Field(description="Ion storm scan — categories exceeding 50/30/20 budget targets.")
    upcoming_bills: SolarFlareAnalysis = Field(description="Solar flare scan — bills due within 30 days.")
    debt_spirals: BlackHoleAnalysis = Field(description="Black hole scan — compounding debt risks.")
    missed_rewards: WormholeAnalysis = Field(description="Wormhole scan — suboptimal card usage costing reward points.")
    fraud_alerts: EnemyCruiserAnalysis = Field(description="Enemy cruiser scan — potentially fraudulent transactions.")


@dataclass
class PreFetchedData:
    """All financial data fetched once before dispatching specialists."""
    snapshot: FinancialSnapshot
    budget: BudgetReport
    transactions: list[Transaction]
