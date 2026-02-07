"""
50/30/20 Budget Engine for SynesthesiaPay.

Stateless calculator that takes a FinancialSnapshot and produces
a BudgetReport with bucket breakdowns, health score, and overspend analysis.
"""

from collections import defaultdict

from aws_lambda_powertools.logging import Logger

from shared.categories import BUDGET_TARGETS
from shared.models import BucketBreakdown, BudgetReport, FinancialSnapshot

logger = Logger(service="BudgetEngine")


def calculate(snapshot: FinancialSnapshot) -> BudgetReport:
    """
    Calculate 50/30/20 budget report from a financial snapshot.

    Separates transactions by bucket, computes actual vs target for each,
    derives overall health score and identifies overspend categories.
    """
    monthly_income = snapshot.monthly_income
    if monthly_income <= 0:
        logger.warning("Monthly income is zero or negative, using 1.0 to avoid division by zero")
        monthly_income = 1.0

    # Separate spending transactions by bucket (skip income)
    bucket_transactions: dict[str, list] = {
        "needs": [],
        "wants": [],
        "savings": [],
    }
    for txn in snapshot.recent_transactions:
        if txn.bucket in bucket_transactions:
            bucket_transactions[txn.bucket].append(txn)

    # Build breakdown for each bucket
    buckets: dict[str, BucketBreakdown] = {}
    for bucket_name in ("needs", "wants", "savings"):
        target_pct = BUDGET_TARGETS[bucket_name]
        target_amount = monthly_income * target_pct
        txns = bucket_transactions[bucket_name]

        # Compute actual spending (absolute values)
        actual_amount = sum(abs(t.amount) for t in txns)
        actual_pct = actual_amount / monthly_income

        # Category breakdown
        breakdown: dict[str, float] = defaultdict(float)
        for txn in txns:
            breakdown[txn.category] += abs(txn.amount)

        # Determine status
        if actual_pct <= target_pct:
            status = "on_track"
        elif actual_pct <= target_pct * 1.2:
            status = "warning"
        else:
            status = "critical"

        buckets[bucket_name] = BucketBreakdown(
            target_pct=target_pct,
            target_amount=round(target_amount, 2),
            actual_amount=round(actual_amount, 2),
            actual_pct=round(actual_pct, 3),
            status=status,
            breakdown=dict(breakdown),
        )

    # Overall health: start at 100, deduct proportionally for deviation
    health = 100.0
    for bucket_name, bucket in buckets.items():
        if bucket.target_amount > 0:
            deviation = max(0, bucket.actual_amount - bucket.target_amount)
            # Deduct up to ~33 points per bucket (proportional to deviation)
            deduction = (deviation / bucket.target_amount) * 33.3
            health -= deduction
    health = round(max(0.0, min(100.0, health)), 1)

    # Identify overspend categories
    overspend_categories = []
    for bucket_name, bucket in buckets.items():
        if not bucket.breakdown:
            continue
        # Each category's proportional share of the bucket target
        num_categories = len(bucket.breakdown)
        if num_categories == 0:
            continue
        proportional_share = bucket.target_amount / num_categories
        for category, amount in bucket.breakdown.items():
            if amount > proportional_share:
                pct_over = round(
                    ((amount - proportional_share) / proportional_share) * 100, 1
                )
                overspend_categories.append({
                    "category": category,
                    "amount": round(amount, 2),
                    "budget": round(proportional_share, 2),
                    "pct_over": pct_over,
                })

    # Credit card impact: sum of absolute credit card balances
    credit_card_impact = sum(
        abs(a.balance) for a in snapshot.accounts if a.type == "credit_card"
    )

    return BudgetReport(
        monthly_income=monthly_income,
        needs=buckets["needs"],
        wants=buckets["wants"],
        savings=buckets["savings"],
        overall_health=health,
        overspend_categories=overspend_categories,
        credit_card_impact=round(credit_card_impact, 2),
    )
