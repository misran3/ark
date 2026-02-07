"""
Shared models and utilities for SynesthesiaPay.

This package contains the API contract (Pydantic models) and mock data
that all modules build against.
"""

from shared.categories import (
    BUDGET_TARGETS,
    INCOME,
    NEEDS,
    SAVINGS,
    WANTS,
    BucketType,
    categorize_transaction,
)
from shared.budget_engine import calculate as calculate_budget
from shared.models import (
    AccountSummary,
    Asteroid,
    BucketBreakdown,
    BudgetReport,
    CaptainResponse,
    FinancialSnapshot,
    Transaction,
    VisaAlert,
    VisaControlRule,
)
from shared.nessie_service import NessieApiError, NessieService

__all__ = [
    # Models
    "AccountSummary",
    "Transaction",
    "FinancialSnapshot",
    "BucketBreakdown",
    "BudgetReport",
    "Asteroid",
    "VisaControlRule",
    "VisaAlert",
    "CaptainResponse",
    "NessieService",
    "NessieApiError",
    "calculate_budget",
    # Categories
    "NEEDS",
    "WANTS",
    "SAVINGS",
    "INCOME",
    "BUDGET_TARGETS",
    "BucketType",
    "categorize_transaction",
]
