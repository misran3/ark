"""
Shared API contract models for SynesthesiaPay.

These Pydantic models define the data shapes used across all modules.
TypeScript types are generated from these via pydantic-to-typescript2.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


# =============================================================================
# Data Layer Models (Module 1: Nessie Data Service)
# =============================================================================


class AccountSummary(BaseModel):
    """Bank account summary from Nessie or other data source."""

    account_id: str
    type: Literal["checking", "savings", "credit_card"]
    balance: float
    nickname: str
    source: Literal["nessie", "plaid", "visa", "mock"]


class Transaction(BaseModel):
    """Individual financial transaction with categorization."""

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
    """Aggregated view of user's financial state at a point in time."""

    accounts: list[AccountSummary]
    recent_transactions: list[Transaction]
    total_net_worth: float
    monthly_income: float
    monthly_spending: float
    snapshot_timestamp: datetime


# =============================================================================
# Budget Engine Models (Module 1: Budget Engine + Asteroid Detection)
# =============================================================================


class BucketBreakdown(BaseModel):
    """Single bucket (needs/wants/savings) in 50/30/20 budget."""

    target_pct: float
    target_amount: float
    actual_amount: float
    actual_pct: float
    status: Literal["on_track", "warning", "critical"]
    breakdown: dict[str, float]  # category -> amount


class BudgetReport(BaseModel):
    """Full 50/30/20 budget analysis."""

    monthly_income: float
    needs: BucketBreakdown
    wants: BucketBreakdown
    savings: BucketBreakdown
    overall_health: float  # 0-100 score
    overspend_categories: list[dict]  # [{category, amount, pct_over}]
    credit_card_impact: float


class Asteroid(BaseModel):
    """Financial threat requiring user attention."""

    id: str
    threat_type: Literal[
        "subscription_renewal",
        "budget_overrun",
        "unused_service",
        "spending_spike",
        "bill_due",
    ]
    severity: Literal["danger", "warning", "info"]
    title: str
    detail: str
    amount: float
    days_until: int
    recommended_action: Literal["deflect", "absorb", "redirect"]
    reasoning: str


# =============================================================================
# VISA Integration Models (Module 2: VISA Integration)
# =============================================================================


class VisaControlRule(BaseModel):
    """VISA Transaction Control rule for spending limits."""

    rule_id: str
    card_id: str
    control_type: Literal[
        "spending_limit",
        "merchant_category_block",
        "transaction_type_block",
        "location_block",
    ]
    threshold: float | None = None
    merchant_categories: list[str] | None = None
    is_active: bool
    created_by: Literal["user", "captain_nova"]


class VisaAlert(BaseModel):
    """VISA transaction alert notification."""

    alert_id: str
    card_id: str
    alert_type: Literal[
        "threshold_exceeded",
        "category_spike",
        "unusual_transaction",
        "budget_breach",
    ]
    transaction_amount: float
    merchant: str
    message: str
    timestamp: datetime


# =============================================================================
# Agent Output Models (Module 3: Captain Nova)
# =============================================================================


class CaptainResponse(BaseModel):
    """Captain Nova's response to user query."""

    message: str
    tools_used: list[str]
    confidence: float  # 0-1
    suggested_visa_controls: list[VisaControlRule] | None = None


# =============================================================================
# Financial Summary Report Models
# =============================================================================


class CreditCardSummary(BaseModel):
    """Individual credit card summary."""

    nickname: str
    balance: float
    limit: float
    utilization: float


class AccountsSummary(BaseModel):
    """Summary of all accounts by type."""

    checking_count: int
    checking_balance: float
    savings_count: int
    savings_balance: float
    credit_card_count: int
    credit_card_balance: float
    credit_card_limit: float
    credit_card_utilization: float
    credit_cards: list[CreditCardSummary]
    net_worth: float


class MonthlySummary(BaseModel):
    """Single month financial summary."""

    month: str  # YYYY-MM format
    income: float
    spending: float
    net: float
    spending_ratio: float  # spending / income
    categories: dict[str, float]  # category -> amount


class FinancialSummaryReport(BaseModel):
    """6-month financial summary report."""

    user_id: str
    generated_at: datetime
    period_start: str  # YYYY-MM-DD
    period_end: str  # YYYY-MM-DD
    accounts: AccountsSummary
    monthly: list[MonthlySummary]
    aggregate: MonthlySummary