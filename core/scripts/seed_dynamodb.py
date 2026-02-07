"""
Seed DynamoDB with mock financial data for the demo_user.

Usage:
    cd core && python scripts/seed_dynamodb.py

Inserts snapshot, budget, and asteroid action state data into
SnatchedUsersTable for the demo_user, with a 1-hour TTL on cached items.
"""

import json
import time
from pathlib import Path

import boto3

TABLE_NAME = "SnatchedUsersTable"
USER_ID = "demo_user"
CACHE_TTL = 3600  # 1 hour for seeded data

MOCKS_DIR = Path(__file__).parent.parent / "shared" / "src" / "shared" / "mocks"


def main():
    dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
    table = dynamodb.Table(TABLE_NAME)
    now = int(time.time())

    # Load mock files
    snapshot = json.loads((MOCKS_DIR / "snapshot.json").read_text())
    budget = json.loads((MOCKS_DIR / "budget.json").read_text())
    asteroids = json.loads((MOCKS_DIR / "asteroids.json").read_text())

    # 1. Seed snapshot cache
    table.put_item(Item={
        "PK": f"USER#{USER_ID}",
        "SK": "SNAPSHOT#latest",
        "data": json.dumps(snapshot),
        "ttl": now + CACHE_TTL,
    })
    print(f"[+] Seeded SNAPSHOT#latest for {USER_ID}")

    # 2. Seed budget cache
    table.put_item(Item={
        "PK": f"USER#{USER_ID}",
        "SK": "BUDGET#latest",
        "data": json.dumps(budget),
        "ttl": now + CACHE_TTL,
    })
    print(f"[+] Seeded BUDGET#latest for {USER_ID}")

    # 3. Seed asteroid action states (mark a couple as actioned for demo)
    demo_actions = [
        {"asteroid_id": "ast_003", "action": "absorb"},
        {"asteroid_id": "ast_005", "action": "absorb"},
    ]
    for action in demo_actions:
        table.put_item(Item={
            "PK": f"USER#{USER_ID}",
            "SK": f"ASTEROID#{action['asteroid_id']}",
            "data": json.dumps({
                "asteroid_id": action["asteroid_id"],
                "action": action["action"],
                "actioned_at": now,
            }),
        })
        print(f"[+] Seeded ASTEROID#{action['asteroid_id']} -> {action['action']}")

    print(f"\nDone. All items seeded in {TABLE_NAME} for USER#{USER_ID}")
    print(f"Cache TTL expires at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now + CACHE_TTL))}")


if __name__ == "__main__":
    main()
