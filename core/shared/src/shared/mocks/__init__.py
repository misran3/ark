"""
Mock data loaders for local development and testing.

Usage:
    from shared.mocks import get_mock_snapshot, get_mock_budget, get_mock_asteroids

Enable mock mode by setting DATA_SOURCE=mock environment variable.
"""

import json
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel

from shared.models import (
    Asteroid,
    BudgetReport,
    FinancialSnapshot,
    Transaction,
    VisaControlRule,
)

T = TypeVar("T", bound=BaseModel)

MOCKS_DIR = Path(__file__).parent


def _load_json(filename: str) -> dict | list:
    """Load JSON file from mocks directory."""
    filepath = MOCKS_DIR / filename
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def _load_model(filename: str, model: type[T]) -> T:
    """Load JSON and parse into Pydantic model."""
    data = _load_json(filename)
    return model.model_validate(data)


def _load_model_list(filename: str, model: type[T]) -> list[T]:
    """Load JSON array and parse into list of Pydantic models."""
    data = _load_json(filename)
    return [model.model_validate(item) for item in data]


# =============================================================================
# Public API
# =============================================================================


def get_mock_snapshot() -> FinancialSnapshot:
    """Load mock FinancialSnapshot."""
    return _load_model("snapshot.json", FinancialSnapshot)


def get_mock_budget() -> BudgetReport:
    """Load mock BudgetReport."""
    return _load_model("budget.json", BudgetReport)


def get_mock_asteroids() -> list[Asteroid]:
    """Load mock Asteroids list."""
    return _load_model_list("asteroids.json", Asteroid)


def get_mock_transactions() -> list[Transaction]:
    """Load mock Transactions list (extracted from snapshot)."""
    snapshot = get_mock_snapshot()
    return snapshot.recent_transactions


def get_mock_visa_controls() -> list[VisaControlRule]:
    """Load mock VISA controls list."""
    return _load_model_list("visa_controls.json", VisaControlRule)
