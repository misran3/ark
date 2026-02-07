"""
Nessie API client for Capital One sandbox data.

Fetches accounts and transactions from the Nessie API, normalizes
into shared Pydantic models, and detects recurring transactions.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

import httpx
from aws_lambda_powertools.logging import Logger

from shared.categories import categorize_transaction
from shared.models import AccountSummary, FinancialSnapshot, Transaction

logger = Logger(service="NessieService")

NESSIE_BASE_URL = "http://api.nessieisreal.com"
HTTP_TIMEOUT = 10.0

# Nessie account type mapping
ACCOUNT_TYPE_MAP = {
    "Checking": "checking",
    "Savings": "savings",
    "Credit Card": "credit_card",
}

# Merchant-to-category overrides for Nessie merchants with unclear categories
MERCHANT_CATEGORY_MAP = {
    "Whole Foods": "groceries",
    "Trader Joes": "groceries",
    "Costco": "groceries",
    "Shell Gas": "transportation",
    "Electric Company": "utilities",
    "State Farm": "insurance",
    "CVS Pharmacy": "medical",
    "Planet Fitness": "gym",
    "Apartment Complex": "rent",
}


class NessieApiError(Exception):
    """Raised when Nessie API returns an error or is unreachable."""


class NessieService:
    """Client for Capital One Nessie sandbox API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.Client(
            base_url=NESSIE_BASE_URL,
            timeout=HTTP_TIMEOUT,
        )

    def build_snapshot(self, days: int = 90) -> FinancialSnapshot:
        """Build a complete financial snapshot from Nessie data."""
        accounts = self.get_accounts()
        all_transactions: list[Transaction] = []

        for account in accounts:
            txns = self.get_transactions(account.account_id, days=days)
            all_transactions.extend(txns)

        # Detect recurring patterns
        all_transactions = self._detect_recurring(all_transactions)

        # Sort by date descending
        all_transactions.sort(key=lambda t: t.date, reverse=True)

        # Calculate aggregates
        total_balance = sum(a.balance for a in accounts)
        income_txns = [t for t in all_transactions if t.bucket == "income"]
        spending_txns = [
            t for t in all_transactions if t.bucket in ("needs", "wants", "savings")
        ]

        # Estimate monthly income from recent transactions
        monthly_income = sum(t.amount for t in income_txns)
        monthly_spending = sum(abs(t.amount) for t in spending_txns)

        return FinancialSnapshot(
            accounts=accounts,
            recent_transactions=all_transactions,
            total_net_worth=total_balance,
            monthly_income=monthly_income,
            monthly_spending=monthly_spending,
            snapshot_timestamp=datetime.now(timezone.utc),
        )

    def get_accounts(self) -> list[AccountSummary]:
        """Fetch all accounts from Nessie API."""
        try:
            response = self.client.get(
                "/accounts", params={"key": self.api_key}
            )
            response.raise_for_status()
            raw_accounts = response.json()
            return [
                self._normalize_account(raw)
                for raw in raw_accounts
                if raw.get("type") in ACCOUNT_TYPE_MAP
            ]
        except httpx.HTTPError as e:
            logger.error("Failed to fetch accounts from Nessie", error=str(e))
            raise NessieApiError(f"Failed to fetch accounts: {e}") from e

    def get_transactions(
        self, account_id: str, days: int = 90
    ) -> list[Transaction]:
        """Fetch purchases for an account from Nessie API."""
        try:
            response = self.client.get(
                f"/accounts/{account_id}/purchases",
                params={"key": self.api_key},
            )
            response.raise_for_status()
            raw_transactions = response.json()

            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            transactions = []
            for raw in raw_transactions:
                txn = self._normalize_transaction(raw, account_id)
                if txn.date >= cutoff:
                    transactions.append(txn)
            return transactions
        except httpx.HTTPError as e:
            logger.error(
                "Failed to fetch transactions from Nessie",
                account_id=account_id,
                error=str(e),
            )
            raise NessieApiError(f"Failed to fetch transactions: {e}") from e

    def _normalize_account(self, raw: dict) -> AccountSummary:
        """Map Nessie account format to AccountSummary model."""
        account_type = ACCOUNT_TYPE_MAP.get(raw.get("type", ""), "checking")
        balance = raw.get("balance", 0)
        # Credit cards show as negative balance
        if account_type == "credit_card":
            balance = -abs(balance)

        return AccountSummary(
            account_id=raw["_id"],
            type=account_type,
            balance=balance,
            nickname=raw.get("nickname", raw.get("type", "Account")),
            source="nessie",
        )

    def _normalize_transaction(self, raw: dict, account_id: str) -> Transaction:
        """Map Nessie purchase format to Transaction model."""
        merchant_name = raw.get("merchant_id", "Unknown")
        # Use Nessie description if available
        if "description" in raw:
            merchant_name = raw["description"]

        # Determine category from merchant or Nessie data
        category = MERCHANT_CATEGORY_MAP.get(
            merchant_name, raw.get("category", "shopping")
        )
        bucket = categorize_transaction(category)

        # Parse date - Nessie uses purchase_date field
        date_str = raw.get("purchase_date", raw.get("transaction_date", ""))
        try:
            txn_date = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            txn_date = datetime.now(timezone.utc)

        amount = raw.get("amount", 0)
        # Purchases are expenses (negative)
        if amount > 0:
            amount = -amount

        return Transaction(
            id=raw.get("_id", ""),
            account_id=account_id,
            date=txn_date,
            merchant=merchant_name,
            category=category,
            amount=amount,
            is_recurring=False,  # Will be set by _detect_recurring
            bucket=bucket,
        )

    def _detect_recurring(
        self, transactions: list[Transaction]
    ) -> list[Transaction]:
        """
        Detect recurring transactions by grouping by merchant.

        Flags as recurring if 2+ transactions from the same merchant within
        30 days with +/-10% amount variance. Estimates next_expected_date.
        """
        # Group by merchant
        by_merchant: dict[str, list[Transaction]] = defaultdict(list)
        for txn in transactions:
            by_merchant[txn.merchant].append(txn)

        updated: list[Transaction] = []
        for merchant, txns in by_merchant.items():
            if len(txns) < 2:
                updated.extend(txns)
                continue

            # Sort by date
            txns.sort(key=lambda t: t.date)

            # Check if amounts are consistent (within 10% variance)
            amounts = [abs(t.amount) for t in txns]
            avg_amount = sum(amounts) / len(amounts)
            if avg_amount == 0:
                updated.extend(txns)
                continue

            consistent = all(
                abs(a - avg_amount) / avg_amount <= 0.10 for a in amounts
            )

            if not consistent:
                updated.extend(txns)
                continue

            # Check if they occur within roughly monthly intervals
            intervals = []
            for i in range(1, len(txns)):
                delta = (txns[i].date - txns[i - 1].date).days
                intervals.append(delta)

            avg_interval = sum(intervals) / len(intervals) if intervals else 30

            # Flag as recurring if average interval is roughly monthly (7-45 days)
            if 7 <= avg_interval <= 45:
                last_date = txns[-1].date
                next_date = last_date + timedelta(days=int(avg_interval))
                for txn in txns:
                    updated.append(
                        txn.model_copy(
                            update={
                                "is_recurring": True,
                                "next_expected_date": next_date,
                            }
                        )
                    )
            else:
                updated.extend(txns)

        return updated
