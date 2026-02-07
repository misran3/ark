"""
50/30/20 budget category mappings for SynesthesiaPay.

NEEDS (50%): Essential expenses required for survival
WANTS (30%): Lifestyle/discretionary spending
SAVINGS (20%): Future financial security
"""

from typing import Literal

# 50% - Life Support (essential expenses)
NEEDS: list[str] = [
    "rent",
    "mortgage",
    "utilities",
    "insurance",
    "loan_payment",
    "groceries",
    "transportation",
    "medical",
    "minimum_cc_payment",
    "childcare",
    "phone",
    "internet",
]

# 30% - Recreation Deck (discretionary spending)
WANTS: list[str] = [
    "dining",
    "restaurants",
    "entertainment",
    "shopping",
    "clothing",
    "subscriptions",
    "streaming",
    "travel",
    "hobbies",
    "gym",
    "personal_care",
    "coffee",
    "alcohol",
    "gaming",
]

# 20% - Warp Fuel Reserves (savings/investments)
SAVINGS: list[str] = [
    "savings_transfer",
    "investment",
    "emergency_fund",
    "retirement",
    "debt_payoff",
]

# Income categories (not part of 50/30/20 spending)
INCOME: list[str] = [
    "salary",
    "direct_deposit",
    "paycheck",
    "bonus",
    "refund",
    "transfer_in",
]

BucketType = Literal["needs", "wants", "savings", "income"]


def categorize_transaction(category: str) -> BucketType | None:
    """Map a transaction category to a 50/30/20 bucket."""
    category_lower = category.lower()

    if category_lower in [c.lower() for c in NEEDS]:
        return "needs"
    elif category_lower in [c.lower() for c in WANTS]:
        return "wants"
    elif category_lower in [c.lower() for c in SAVINGS]:
        return "savings"
    elif category_lower in [c.lower() for c in INCOME]:
        return "income"
    else:
        # Default unknown categories to wants (conservative)
        return "wants"


# Target percentages for 50/30/20 budget
BUDGET_TARGETS: dict[str, float] = {
    "needs": 0.50,
    "wants": 0.30,
    "savings": 0.20,
}
