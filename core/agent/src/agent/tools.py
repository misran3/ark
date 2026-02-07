"""
Tools for Captain Nova agent.

These tools provide Captain Nova access to financial data and VISA controls.
Currently backed by mock data; will be swapped to real HTTP calls at integration.
"""

import uuid
from datetime import datetime, timedelta
from typing import Literal

from pydantic_ai import RunContext

from shared.mocks import (
    get_mock_asteroids,
    get_mock_budget,
    get_mock_snapshot,
    get_mock_visa_controls,
)
from shared.models import Asteroid, BudgetReport, FinancialSnapshot, VisaControlRule

from .models import CaptainDeps

# Type alias matching VisaControlRule.control_type
VisaControlType = Literal[
    "spending_limit",
    "merchant_category_block",
    "transaction_type_block",
    "location_block",
]

VALID_CONTROL_TYPES: set[str] = {
    "spending_limit",
    "merchant_category_block",
    "transaction_type_block",
    "location_block",
}


# =============================================================================
# Data Tools (backed by shared.mocks)
# =============================================================================


async def get_financial_snapshot(ctx: RunContext[CaptainDeps]) -> FinancialSnapshot:
    """Get current account balances, net worth, and recent transactions.

    Returns a complete financial snapshot including all accounts,
    recent transactions, and summary metrics.
    """
    return get_mock_snapshot()


async def get_budget_report(ctx: RunContext[CaptainDeps]) -> BudgetReport:
    """Get 50/30/20 budget breakdown with health metrics.

    Returns the budget analysis showing:
    - Life Support (Needs): 50% target
    - Recreation Deck (Wants): 30% target
    - Warp Fuel Reserves (Savings): 20% target
    """
    return get_mock_budget()


async def get_active_threats(ctx: RunContext[CaptainDeps]) -> list[Asteroid]:
    """Get incoming financial threats — subscriptions, overruns, anomalies.

    Returns a list of "asteroids" (financial threats) that require
    the commander's attention, sorted by severity.
    """
    return get_mock_asteroids()


async def get_spending_by_category(
    ctx: RunContext[CaptainDeps], days: int = 30
) -> dict[str, float]:
    """Get spending breakdown by category for the last N days.

    Args:
        days: Number of days to analyze (default 30)

    Returns:
        Dictionary mapping category names to total spending amounts
    """
    snapshot = get_mock_snapshot()
    cutoff = datetime.now() - timedelta(days=days)

    spending: dict[str, float] = {}
    for tx in snapshot.recent_transactions:
        # Only count expenses (negative amounts), skip income
        if tx.amount < 0 and tx.date >= cutoff:
            category = tx.category
            spending[category] = spending.get(category, 0) + abs(tx.amount)

    return spending


async def get_savings_projection(
    ctx: RunContext[CaptainDeps], additional_monthly: float = 0
) -> dict:
    """Project savings growth with optional additional monthly contribution.

    Args:
        additional_monthly: Extra amount to save per month beyond current rate

    Returns:
        Projection including months to emergency fund goal and growth trajectory
    """
    budget = get_mock_budget()
    snapshot = get_mock_snapshot()

    current_savings = budget.savings.actual_amount
    monthly_expenses = snapshot.monthly_spending
    emergency_fund_goal = monthly_expenses * 6  # 6 months of expenses

    # Find current savings account balance
    savings_balance = sum(
        acc.balance for acc in snapshot.accounts if acc.type == "savings"
    )

    total_monthly_savings = current_savings + additional_monthly

    if total_monthly_savings <= 0:
        months_to_goal = float("inf")
    else:
        remaining = emergency_fund_goal - savings_balance
        months_to_goal = max(0, remaining / total_monthly_savings)

    return {
        "current_monthly_savings": current_savings,
        "proposed_monthly_savings": total_monthly_savings,
        "current_savings_balance": savings_balance,
        "emergency_fund_goal": emergency_fund_goal,
        "months_to_goal": round(months_to_goal, 1),
        "monthly_expenses": monthly_expenses,
    }


# =============================================================================
# VISA Tools (stubbed - return mock data, log actions)
# =============================================================================


async def get_active_visa_controls(
    ctx: RunContext[CaptainDeps],
) -> list[VisaControlRule]:
    """Get currently active VISA spending controls.

    Returns list of VISA Transaction Controls currently enabled
    on the commander's cards.
    """
    return get_mock_visa_controls()


async def recommend_visa_control(
    ctx: RunContext[CaptainDeps],
    card_id: str,
    control_type: VisaControlType,
    threshold: float | None = None,
    merchant_categories: list[str] | None = None,
    reason: str = "",
) -> VisaControlRule:
    """Stage a VISA control for user approval. Does NOT activate yet.

    This recommends a spending control to the commander. They must
    explicitly approve before it takes effect.

    Args:
        card_id: The card to apply the control to
        control_type: Type of control (spending_limit, merchant_category_block,
            transaction_type_block, or location_block)
        threshold: Spending limit amount (for spending_limit type)
        merchant_categories: Categories to block (for merchant_category_block type)
        reason: Explanation for why this control is recommended

    Returns:
        The staged VisaControlRule (not yet active)

    Raises:
        ValueError: If control_type is not a valid VISA control type
    """
    # Runtime validation for control_type
    if control_type not in VALID_CONTROL_TYPES:
        raise ValueError(
            f"Invalid control_type '{control_type}'. "
            f"Must be one of: {', '.join(sorted(VALID_CONTROL_TYPES))}"
        )

    rule = VisaControlRule(
        rule_id=f"staged_{uuid.uuid4().hex[:8]}",
        card_id=card_id,
        control_type=control_type,
        threshold=threshold,
        merchant_categories=merchant_categories,
        is_active=False,  # Not active until commander approves
        created_by="captain_nova",
    )

    # In production, this would save to DynamoDB for later activation
    print(f"[VISA STUB] Recommended control: {rule.model_dump()}")
    print(f"[VISA STUB] Reason: {reason}")

    return rule


async def activate_visa_control(
    ctx: RunContext[CaptainDeps], rule_id: str
) -> dict:
    """Activate a previously recommended VISA control.

    This should only be called after the commander has approved
    the control recommendation.

    Args:
        rule_id: The ID of the staged rule to activate

    Returns:
        Confirmation of activation
    """
    # In production, this would:
    # 1. Look up the staged rule from DynamoDB
    # 2. Call VISA Transaction Controls API
    # 3. Update the rule status to active

    print(f"[VISA STUB] Activating control: {rule_id}")

    return {
        "status": "activated",
        "rule_id": rule_id,
        "message": "Shield activated. VISA spending control is now in effect.",
    }
