"""
DynamoDB client for caching financial data: snapshots, budgets, and asteroid states.

Reuses the SnatchedUsersTable with new SK patterns:
- SNAPSHOT#latest: Cached FinancialSnapshot (TTL: 5 min)
- BUDGET#latest: Cached BudgetReport (TTL: 5 min)
- ASTEROID#{id}: Persisted asteroid action states
"""

import json
import os
import time

from aws_lambda_powertools.logging import Logger

from .base_client import DynamoDBClient

logger = Logger(service="DataTableClient")

CACHE_TTL_SECONDS = 300  # 5 minutes


class DataTableClient(DynamoDBClient):
    """Client for caching financial data in SnatchedUsersTable."""

    def __init__(self):
        super().__init__(table_name=os.environ["USERS_TABLE_NAME"])

    # =========================================================================
    # Snapshot caching
    # =========================================================================

    def get_cached_snapshot(self, user_id: str) -> dict | None:
        """Get cached snapshot if TTL hasn't expired."""
        pk = f"USER#{user_id}"
        sk = "SNAPSHOT#latest"
        item = self.get_item(pk, sk)
        if item and item.get("ttl", 0) > int(time.time()):
            return json.loads(item["data"])
        return None

    def cache_snapshot(self, user_id: str, snapshot_dict: dict) -> None:
        """Cache snapshot with 5-minute TTL."""
        self.put_item({
            "PK": f"USER#{user_id}",
            "SK": "SNAPSHOT#latest",
            "data": json.dumps(snapshot_dict, default=str),
            "ttl": int(time.time()) + CACHE_TTL_SECONDS,
        })

    # =========================================================================
    # Budget caching
    # =========================================================================

    def get_cached_budget(self, user_id: str) -> dict | None:
        """Get cached budget if TTL hasn't expired."""
        pk = f"USER#{user_id}"
        sk = "BUDGET#latest"
        item = self.get_item(pk, sk)
        if item and item.get("ttl", 0) > int(time.time()):
            return json.loads(item["data"])
        return None

    def cache_budget(self, user_id: str, budget_dict: dict) -> None:
        """Cache budget report with 5-minute TTL."""
        self.put_item({
            "PK": f"USER#{user_id}",
            "SK": "BUDGET#latest",
            "data": json.dumps(budget_dict, default=str),
            "ttl": int(time.time()) + CACHE_TTL_SECONDS,
        })

    # =========================================================================
    # Asteroid state persistence
    # =========================================================================

    def get_asteroid_state(self, user_id: str, asteroid_id: str) -> dict | None:
        """Get persisted action state for a specific asteroid."""
        pk = f"USER#{user_id}"
        sk = f"ASTEROID#{asteroid_id}"
        item = self.get_item(pk, sk)
        if item and "data" in item:
            return json.loads(item["data"])
        return None

    def get_all_asteroid_states(self, user_id: str) -> list[dict]:
        """Get all persisted asteroid action states for a user."""
        pk = f"USER#{user_id}"
        items = self.query(pk, sk_prefix="ASTEROID#")
        return [json.loads(item["data"]) for item in items if "data" in item]

    def save_asteroid_action(
        self, user_id: str, asteroid_id: str, action: str
    ) -> None:
        """Persist an asteroid action (deflect/absorb/redirect)."""
        self.put_item({
            "PK": f"USER#{user_id}",
            "SK": f"ASTEROID#{asteroid_id}",
            "data": json.dumps({
                "asteroid_id": asteroid_id,
                "action": action,
                "actioned_at": int(time.time()),
            }),
        })
