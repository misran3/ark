"""
Financial summary report service.

Aggregates transactions into monthly summaries with income vs spending
ratios and category breakdowns. Nessie API first, DynamoDB cache fallback.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from aws_lambda_powertools.logging import Logger

from shared.models import (
    AccountsSummary,
    CreditCardSummary,
    FinancialSnapshot,
    FinancialSummaryReport,
    MonthlySummary,
)

logger = Logger(service="ReportService")


def build_accounts_summary(snapshot: FinancialSnapshot) -> AccountsSummary:
    """Build accounts summary from snapshot."""
    checking_accounts = [a for a in snapshot.accounts if a.type == "checking"]
    savings_accounts = [a for a in snapshot.accounts if a.type == "savings"]
    credit_cards = [a for a in snapshot.accounts if a.type == "credit_card"]

    # For credit cards, we need limit info from fixture data
    # Balance is negative (debt), limit is positive
    cc_summaries = []
    total_cc_balance = 0.0
    total_cc_limit = 0.0

    for cc in credit_cards:
        balance = abs(cc.balance)  # Convert to positive for display
        # Estimate limit as balance * 1.2 if not available (conservative)
        # In real implementation, this would come from Nessie account details
        limit = max(balance * 1.5, 1000)  # Rough estimate
        utilization = balance / limit if limit > 0 else 0

        cc_summaries.append(CreditCardSummary(
            nickname=cc.nickname,
            balance=-balance,  # Show as negative (debt)
            limit=limit,
            utilization=round(utilization, 2),
        ))
        total_cc_balance += balance
        total_cc_limit += limit

    return AccountsSummary(
        checking_count=len(checking_accounts),
        checking_balance=sum(a.balance for a in checking_accounts),
        savings_count=len(savings_accounts),
        savings_balance=sum(a.balance for a in savings_accounts),
        credit_card_count=len(credit_cards),
        credit_card_balance=-total_cc_balance,
        credit_card_limit=total_cc_limit,
        credit_card_utilization=round(total_cc_balance / total_cc_limit, 2) if total_cc_limit > 0 else 0,
        credit_cards=cc_summaries,
        net_worth=snapshot.total_net_worth,
    )


def build_monthly_summaries(snapshot: FinancialSnapshot, months: int = 6) -> list[MonthlySummary]:
    """Aggregate transactions into monthly summaries."""
    # Group transactions by month
    by_month: dict[str, list] = defaultdict(list)

    for txn in snapshot.recent_transactions:
        month_key = txn.date.strftime("%Y-%m")
        by_month[month_key].append(txn)

    # Build summary for each month
    summaries = []
    for month_key in sorted(by_month.keys(), reverse=True)[:months]:
        txns = by_month[month_key]

        income = sum(t.amount for t in txns if t.bucket == "income")
        spending = sum(abs(t.amount) for t in txns if t.bucket in ("needs", "wants"))

        # Category breakdown
        categories: dict[str, float] = defaultdict(float)
        for txn in txns:
            if txn.bucket in ("needs", "wants"):
                categories[txn.category] += abs(txn.amount)

        spending_ratio = spending / income if income > 0 else 0

        summaries.append(MonthlySummary(
            month=month_key,
            income=round(income, 2),
            spending=round(spending, 2),
            net=round(income - spending, 2),
            spending_ratio=round(spending_ratio, 2),
            categories={k: round(v, 2) for k, v in sorted(categories.items())},
        ))

    return summaries


def build_aggregate_summary(monthly: list[MonthlySummary]) -> MonthlySummary:
    """Build aggregate summary across all months."""
    if not monthly:
        return MonthlySummary(
            month="aggregate",
            income=0,
            spending=0,
            net=0,
            spending_ratio=0,
            categories={},
        )

    total_income = sum(m.income for m in monthly)
    total_spending = sum(m.spending for m in monthly)

    # Aggregate categories
    categories: dict[str, float] = defaultdict(float)
    for m in monthly:
        for cat, amount in m.categories.items():
            categories[cat] += amount

    spending_ratio = total_spending / total_income if total_income > 0 else 0

    return MonthlySummary(
        month="aggregate",
        income=round(total_income, 2),
        spending=round(total_spending, 2),
        net=round(total_income - total_spending, 2),
        spending_ratio=round(spending_ratio, 2),
        categories={k: round(v, 2) for k, v in sorted(categories.items())},
    )


def build_report(snapshot: FinancialSnapshot, user_id: str) -> FinancialSummaryReport:
    """Build complete financial summary report from snapshot."""
    now = datetime.now(timezone.utc)

    accounts = build_accounts_summary(snapshot)
    monthly = build_monthly_summaries(snapshot, months=6)
    aggregate = build_aggregate_summary(monthly)

    # Determine period from available data
    if monthly:
        period_start = f"{monthly[-1].month}-01"
        period_end = now.strftime("%Y-%m-%d")
    else:
        period_start = (now - timedelta(days=180)).strftime("%Y-%m-%d")
        period_end = now.strftime("%Y-%m-%d")

    return FinancialSummaryReport(
        user_id=user_id,
        generated_at=now,
        period_start=period_start,
        period_end=period_end,
        accounts=accounts,
        monthly=monthly,
        aggregate=aggregate,
    )
