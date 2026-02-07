"""
Asteroid Detector for SynesthesiaPay.

Stateless detector that analyzes a FinancialSnapshot and BudgetReport
to identify financial threats (asteroids) requiring user attention.

Detection rules:
1. Subscription Renewal - upcoming recurring charges
2. Budget Overrun - buckets exceeding targets
3. Unused Service - recurring charges with low activity
4. Spending Spike - single transactions far above category average
"""

import hashlib
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from aws_lambda_powertools.logging import Logger

from shared.categories import BUDGET_TARGETS
from shared.models import Asteroid, BudgetReport, FinancialSnapshot

logger = Logger(service="AsteroidDetector")


def _make_id(threat_type: str, key: str) -> str:
    """Generate a deterministic asteroid ID from type and source data."""
    h = hashlib.md5(f"{threat_type}:{key}".encode()).hexdigest()[:8]
    return f"ast_{threat_type}_{h}"


def detect(
    snapshot: FinancialSnapshot, budget: BudgetReport
) -> list[Asteroid]:
    """Run all detection rules and return discovered asteroids."""
    asteroids: list[Asteroid] = []
    now = datetime.now(timezone.utc)

    asteroids.extend(_detect_subscription_renewals(snapshot, now))
    asteroids.extend(_detect_budget_overruns(budget))
    asteroids.extend(_detect_unused_services(snapshot, now))
    asteroids.extend(_detect_spending_spikes(snapshot))

    return asteroids


def _detect_subscription_renewals(
    snapshot: FinancialSnapshot, now: datetime
) -> list[Asteroid]:
    """Rule 1: Flag upcoming recurring subscription renewals."""
    asteroids = []
    seen_merchants: set[str] = set()

    for txn in snapshot.recent_transactions:
        if not txn.is_recurring or not txn.next_expected_date:
            continue
        if txn.merchant in seen_merchants:
            continue
        seen_merchants.add(txn.merchant)

        days_until = (txn.next_expected_date - now).days
        if days_until > 14:
            continue

        if days_until <= 3:
            severity = "danger"
        else:
            severity = "warning"

        asteroids.append(
            Asteroid(
                id=_make_id("subscription_renewal", txn.merchant),
                threat_type="subscription_renewal",
                severity=severity,
                title=f"{txn.merchant} Renewal",
                detail=f"{txn.merchant} subscription renews in {max(0, days_until)} days - ${abs(txn.amount):.2f}",
                amount=abs(txn.amount),
                days_until=max(0, days_until),
                recommended_action="absorb",
                reasoning=f"Recurring {txn.merchant} charge of ${abs(txn.amount):.2f}. Review whether this subscription is still providing value.",
            )
        )

    return asteroids


def _detect_budget_overruns(budget: BudgetReport) -> list[Asteroid]:
    """Rule 2: Flag buckets exceeding their budget targets."""
    asteroids = []

    for bucket_name in ("needs", "wants", "savings"):
        bucket = getattr(budget, bucket_name)
        target_pct = BUDGET_TARGETS[bucket_name]

        if target_pct == 0:
            continue

        ratio = bucket.actual_pct / target_pct

        if ratio > 1.0:
            severity = "danger"
            overspend = bucket.actual_amount - bucket.target_amount
            asteroids.append(
                Asteroid(
                    id=_make_id("budget_overrun", bucket_name),
                    threat_type="budget_overrun",
                    severity=severity,
                    title=f"{bucket_name.title()} Budget Overrun",
                    detail=f"{bucket_name.title()} spending at {ratio * 100:.0f}% of target ({bucket.actual_pct * 100:.1f}% vs {target_pct * 100:.0f}% target)",
                    amount=round(overspend, 2),
                    days_until=0,
                    recommended_action="redirect",
                    reasoning=f"{bucket_name.title()} spending (${bucket.actual_amount:.2f}) exceeds ${bucket.target_amount:.2f} target by ${overspend:.2f}. Consider reducing discretionary spending or reallocating budget.",
                )
            )
        elif ratio > 0.9:
            asteroids.append(
                Asteroid(
                    id=_make_id("budget_overrun", bucket_name),
                    threat_type="budget_overrun",
                    severity="warning",
                    title=f"{bucket_name.title()} Budget Warning",
                    detail=f"{bucket_name.title()} spending at {ratio * 100:.0f}% of target - approaching limit",
                    amount=round(bucket.target_amount - bucket.actual_amount, 2),
                    days_until=0,
                    recommended_action="redirect",
                    reasoning=f"{bucket_name.title()} spending (${bucket.actual_amount:.2f}) is approaching the ${bucket.target_amount:.2f} target. Monitor closely to avoid overrun.",
                )
            )

    return asteroids


def _detect_unused_services(
    snapshot: FinancialSnapshot, now: datetime
) -> list[Asteroid]:
    """Rule 3: Flag recurring subscriptions with low usage (single charge in last 30 days)."""
    asteroids = []
    cutoff = now - timedelta(days=30)

    # Count occurrences of each recurring merchant in last 30 days
    merchant_counts: dict[str, int] = defaultdict(int)
    merchant_amount: dict[str, float] = {}

    for txn in snapshot.recent_transactions:
        if not txn.is_recurring or txn.bucket == "income":
            continue
        if txn.date >= cutoff:
            merchant_counts[txn.merchant] += 1
            merchant_amount[txn.merchant] = abs(txn.amount)

    for merchant, count in merchant_counts.items():
        if count == 1:
            amount = merchant_amount[merchant]
            asteroids.append(
                Asteroid(
                    id=_make_id("unused_service", merchant),
                    threat_type="unused_service",
                    severity="warning",
                    title=f"{merchant} Possibly Unused",
                    detail=f"{merchant} (${amount:.2f}/mo) - only 1 charge detected in 30 days, no correlated usage",
                    amount=amount,
                    days_until=30,
                    recommended_action="deflect",
                    reasoning=f"Only one charge from {merchant} in the last 30 days with no correlated activity. Consider canceling to save ${amount * 12:.2f}/year.",
                )
            )

    return asteroids


def _detect_spending_spikes(snapshot: FinancialSnapshot) -> list[Asteroid]:
    """Rule 4: Flag single transactions that are >2x the category average."""
    asteroids = []

    # Calculate average per category (excluding income)
    category_amounts: dict[str, list[float]] = defaultdict(list)
    for txn in snapshot.recent_transactions:
        if txn.bucket == "income":
            continue
        category_amounts[txn.category].append(abs(txn.amount))

    category_avg: dict[str, float] = {}
    for cat, amounts in category_amounts.items():
        if len(amounts) >= 2:
            category_avg[cat] = sum(amounts) / len(amounts)

    # Find spikes
    for txn in snapshot.recent_transactions:
        if txn.bucket == "income":
            continue
        avg = category_avg.get(txn.category)
        if avg is None or avg == 0:
            continue

        ratio = abs(txn.amount) / avg
        if ratio > 2.0:
            asteroids.append(
                Asteroid(
                    id=_make_id("spending_spike", f"{txn.merchant}_{txn.id}"),
                    threat_type="spending_spike",
                    severity="warning" if ratio > 3.0 else "info",
                    title=f"{txn.merchant} Spending Spike",
                    detail=f"{txn.merchant} purchase (${abs(txn.amount):.2f}) is {ratio:.1f}x your typical {txn.category} transaction",
                    amount=abs(txn.amount),
                    days_until=0,
                    recommended_action="absorb",
                    reasoning=f"Single purchase of ${abs(txn.amount):.2f} at {txn.merchant} is significantly above the ${avg:.2f} average for {txn.category}. Consider whether this was planned or impulse spending.",
                )
            )

    return asteroids
