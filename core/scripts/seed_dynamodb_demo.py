"""
Seed DynamoDB with demo user profiles, snapshots, and budgets.

Usage:
    cd core && python scripts/seed_dynamodb_demo.py [--user USER_ID]

Seeds SnatchedUsersTable with:
- PROFILE#settings: User preferences and budget thresholds
- SNAPSHOT#latest: Financial snapshot for each user
- BUDGET#latest: Budget report for each user
- ASTEROID#{id}: Demo action states

Requires AWS credentials configured.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import boto3

TABLE_NAME = "SnatchedUsersTable"
FIXTURES_DIR = Path(__file__).parent.parent / "shared" / "src" / "shared" / "mocks" / "demo"

# Cache TTL: 24 hours for demo data
CACHE_TTL = 86400


def load_fixture(filename: str) -> dict:
    """Load a JSON fixture file."""
    filepath = FIXTURES_DIR / filename
    if not filepath.exists():
        print(f"ERROR: Fixture not found: {filepath}")
        return {}
    return json.loads(filepath.read_text())


def build_snapshot(fixture: dict) -> dict:
    """Build a FinancialSnapshot from fixture data."""
    accounts = []
    for acc in fixture["accounts"]:
        # Convert to API model format
        acc_type = acc["type"].lower().replace(" ", "_")
        balance = acc["balance"]
        # Credit cards: negative balance means debt
        if acc_type == "credit_card":
            balance = -abs(balance) if balance > 0 else balance

        accounts.append({
            "account_id": acc["id"],
            "type": acc_type,
            "balance": balance,
            "nickname": acc["nickname"],
            "source": "nessie",
        })

    # Calculate totals
    total_balance = sum(a["balance"] for a in accounts)
    monthly_income = fixture.get("monthly_income", 0)

    # Calculate monthly spending from spending patterns
    spending = fixture.get("spending_patterns", {})
    monthly_spending = sum(v for k, v in spending.items() if not k.endswith("_weekly"))
    monthly_spending += sum(v * 4 for k, v in spending.items() if k.endswith("_weekly"))

    # Add recurring charges
    for charge in fixture.get("recurring_charges", []):
        if charge["merchant"] not in ["Employer Inc", "TechCorp", "Family Services LLC"]:
            monthly_spending += charge["amount"]

    # Build transactions from recurring charges and spending patterns
    transactions = []
    now = datetime.now(timezone.utc)
    tx_id = 1

    for charge in fixture.get("recurring_charges", []):
        is_income = charge["merchant"] in ["Employer Inc", "TechCorp", "Family Services LLC"]
        bucket = "income" if is_income else ("needs" if charge["amount"] > 100 else "wants")

        # Determine category
        category = "salary" if is_income else "subscriptions"
        if "Apartment" in charge["merchant"] or "Mortgage" in charge["merchant"]:
            category = "rent" if "Apartment" in charge["merchant"] else "mortgage"
            bucket = "needs"
        elif "Electric" in charge["merchant"] or "Water" in charge["merchant"] or "Comcast" in charge["merchant"] or "Verizon" in charge["merchant"] or "AT&T" in charge["merchant"]:
            category = "utilities"
            bucket = "needs"
        elif "Insurance" in charge["merchant"] or "State Farm" in charge["merchant"] or "GEICO" in charge["merchant"]:
            category = "insurance"
            bucket = "needs"
        elif "Loan" in charge["merchant"]:
            category = "loan_payment"
            bucket = "needs"
        elif "Fitness" in charge["merchant"] or "ClassPass" in charge["merchant"]:
            category = "gym"
            bucket = "wants"

        transactions.append({
            "id": f"tx_{fixture['user_id']}_{tx_id:03d}",
            "account_id": charge["account"],
            "date": now.isoformat(),
            "merchant": charge["merchant"],
            "category": category,
            "amount": charge["amount"] if is_income else -charge["amount"],
            "is_recurring": True,
            "next_expected_date": now.replace(day=charge["day_of_month"]).isoformat(),
            "bucket": bucket,
        })
        tx_id += 1

    return {
        "accounts": accounts,
        "recent_transactions": transactions,
        "total_net_worth": total_balance,
        "monthly_income": monthly_income,
        "monthly_spending": round(monthly_spending, 2),
        "snapshot_timestamp": now.isoformat(),
    }


def build_budget(fixture: dict, snapshot: dict) -> dict:
    """Build a BudgetReport from fixture and snapshot data."""
    income = fixture.get("monthly_income", 0)
    plan = fixture.get("profile", {}).get("budget_plan", {})

    needs_pct = plan.get("needs_pct", 0.50)
    wants_pct = plan.get("wants_pct", 0.30)
    savings_pct = plan.get("savings_pct", 0.20)

    needs_target = income * needs_pct
    wants_target = income * wants_pct
    savings_target = income * savings_pct

    # Calculate actuals from spending patterns and recurring
    spending = fixture.get("spending_patterns", {})
    recurring = fixture.get("recurring_charges", [])

    # Needs categories
    needs_breakdown = {
        "rent": next((c["amount"] for c in recurring if "Apartment" in c["merchant"] or "Mortgage" in c["merchant"]), 0),
        "utilities": sum(c["amount"] for c in recurring if any(u in c["merchant"] for u in ["Electric", "Water", "Comcast", "Verizon", "AT&T"])),
        "insurance": sum(c["amount"] for c in recurring if any(i in c["merchant"] for i in ["Insurance", "State Farm", "GEICO"])),
        "groceries": spending.get("groceries_monthly", 0),
        "transportation": spending.get("transportation_monthly", 0),
        "medical": 0,
    }
    if "childcare_monthly" in spending:
        needs_breakdown["childcare"] = spending["childcare_monthly"]

    needs_actual = sum(needs_breakdown.values())

    # Wants categories
    wants_breakdown = {
        "dining": spending.get("dining_monthly", 0),
        "entertainment": spending.get("entertainment_monthly", 0),
        "shopping": spending.get("shopping_monthly", 0),
        "subscriptions": sum(c["amount"] for c in recurring if c["merchant"] in ["Netflix", "Spotify", "Hulu", "HBO Max", "Disney Plus", "Amazon Prime", "Audible", "YouTube Premium", "Adobe Creative Cloud"]),
        "gym": sum(c["amount"] for c in recurring if any(g in c["merchant"] for g in ["Fitness", "ClassPass"])),
        "coffee": spending.get("coffee_weekly", 0) * 4,
        "travel": spending.get("travel_monthly", 0),
    }
    wants_actual = sum(wants_breakdown.values())

    # Savings (what's left or explicit)
    savings_actual = max(0, income - needs_actual - wants_actual)

    # Determine statuses
    def get_status(actual: float, target: float) -> str:
        if target == 0:
            return "on_track"
        ratio = actual / target
        if ratio > 1.2:
            return "critical"
        elif ratio > 1.0:
            return "warning"
        return "on_track"

    needs_status = get_status(needs_actual, needs_target)
    wants_status = get_status(wants_actual, wants_target)
    savings_status = "critical" if savings_actual < savings_target * 0.5 else ("warning" if savings_actual < savings_target else "on_track")

    # Calculate health score
    health_score = 100
    if needs_status == "warning":
        health_score -= 15
    elif needs_status == "critical":
        health_score -= 30
    if wants_status == "warning":
        health_score -= 20
    elif wants_status == "critical":
        health_score -= 35
    if savings_status == "warning":
        health_score -= 10
    elif savings_status == "critical":
        health_score -= 25

    # Credit card impact
    cc_balance = sum(abs(a["balance"]) for a in snapshot["accounts"] if a["type"] == "credit_card")

    # Overspend categories
    overspend = []
    category_budgets = {
        "dining": wants_target * 0.18,
        "shopping": wants_target * 0.15,
        "entertainment": wants_target * 0.12,
    }
    for cat, budget in category_budgets.items():
        actual = wants_breakdown.get(cat, 0)
        if actual > budget:
            overspend.append({
                "category": cat,
                "amount": actual,
                "budget": budget,
                "pct_over": round((actual - budget) / budget * 100, 1),
            })

    return {
        "monthly_income": income,
        "needs": {
            "target_pct": needs_pct,
            "target_amount": needs_target,
            "actual_amount": round(needs_actual, 2),
            "actual_pct": round(needs_actual / income, 3) if income > 0 else 0,
            "status": needs_status,
            "breakdown": {k: round(v, 2) for k, v in needs_breakdown.items()},
        },
        "wants": {
            "target_pct": wants_pct,
            "target_amount": wants_target,
            "actual_amount": round(wants_actual, 2),
            "actual_pct": round(wants_actual / income, 3) if income > 0 else 0,
            "status": wants_status,
            "breakdown": {k: round(v, 2) for k, v in wants_breakdown.items()},
        },
        "savings": {
            "target_pct": savings_pct,
            "target_amount": savings_target,
            "actual_amount": round(savings_actual, 2),
            "actual_pct": round(savings_actual / income, 3) if income > 0 else 0,
            "status": savings_status,
            "breakdown": {"savings_transfer": round(savings_actual, 2)},
        },
        "overall_health": max(0, health_score),
        "overspend_categories": overspend,
        "credit_card_impact": round(cc_balance, 2),
    }


def seed_user(table, fixture: dict, now: int):
    """Seed a single user's data to DynamoDB."""
    user_id = fixture["user_id"]

    print(f"\n{'='*50}")
    print(f"Seeding {fixture['display_name']} ({fixture['persona'].upper()})")
    print(f"{'='*50}")

    # 1. Seed user profile
    profile_item = {
        "PK": f"USER#{user_id}",
        "SK": "PROFILE#settings",
        "user_id": user_id,
        "display_name": fixture["display_name"],
        "email": fixture["email"],
        "monthly_income": str(fixture["monthly_income"]),
        "budget_plan": json.dumps(fixture["profile"]["budget_plan"]),
        "alert_preferences": json.dumps(fixture["profile"]["alert_preferences"]),
        "linked_accounts": json.dumps([a["id"] for a in fixture["accounts"]]),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    table.put_item(Item=profile_item)
    print(f"  [+] PROFILE#settings")

    # 2. Build and seed snapshot
    snapshot = build_snapshot(fixture)
    table.put_item(Item={
        "PK": f"USER#{user_id}",
        "SK": "SNAPSHOT#latest",
        "data": json.dumps(snapshot),
        "ttl": now + CACHE_TTL,
    })
    print(f"  [+] SNAPSHOT#latest (health: {fixture['persona']})")

    # 3. Build and seed budget
    budget = build_budget(fixture, snapshot)
    table.put_item(Item={
        "PK": f"USER#{user_id}",
        "SK": "BUDGET#latest",
        "data": json.dumps(budget),
        "ttl": now + CACHE_TTL,
    })
    print(f"  [+] BUDGET#latest (score: {budget['overall_health']})")

    # 4. Seed demo asteroid actions
    demo_asteroids = [
        {"asteroid_id": f"ast_{user_id}_001", "action": "absorb"},
        {"asteroid_id": f"ast_{user_id}_002", "action": "deflect"},
    ]
    for asteroid in demo_asteroids:
        table.put_item(Item={
            "PK": f"USER#{user_id}",
            "SK": f"ASTEROID#{asteroid['asteroid_id']}",
            "data": json.dumps({
                "asteroid_id": asteroid["asteroid_id"],
                "action": asteroid["action"],
                "actioned_at": now,
            }),
        })
        print(f"  [+] ASTEROID#{asteroid['asteroid_id']} -> {asteroid['action']}")

    print(f"\n  Budget breakdown:")
    print(f"    Needs:   ${budget['needs']['actual_amount']:,.2f} / ${budget['needs']['target_amount']:,.2f} ({budget['needs']['status']})")
    print(f"    Wants:   ${budget['wants']['actual_amount']:,.2f} / ${budget['wants']['target_amount']:,.2f} ({budget['wants']['status']})")
    print(f"    Savings: ${budget['savings']['actual_amount']:,.2f} / ${budget['savings']['target_amount']:,.2f} ({budget['savings']['status']})")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Seed DynamoDB with demo user data")
    parser.add_argument("--user", choices=["maya", "james", "sofia", "all"], default="all",
                        help="Which user to seed (default: all)")
    parser.add_argument("--region", default="us-east-1",
                        help="AWS region (default: us-east-1)")
    args = parser.parse_args()

    print("=" * 50)
    print("DynamoDB Demo Data Seeder")
    print("=" * 50)

    dynamodb = boto3.resource("dynamodb", region_name=args.region)
    table = dynamodb.Table(TABLE_NAME)
    now = int(time.time())

    users = {
        "maya": "maya_torres.json",
        "james": "james_chen.json",
        "sofia": "sofia_ramirez.json",
    }

    if args.user == "all":
        for name, filename in users.items():
            fixture = load_fixture(filename)
            if fixture:
                seed_user(table, fixture, now)
    else:
        fixture = load_fixture(users[args.user])
        if fixture:
            seed_user(table, fixture, now)

    print("\n" + "=" * 50)
    print("Seeding Complete!")
    print("=" * 50)
    print(f"Table: {TABLE_NAME}")
    print(f"TTL expires: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now + CACHE_TTL))}")

    print("\nUser IDs for testing:")
    for name in (users.keys() if args.user == "all" else [args.user]):
        fixture = load_fixture(users[name])
        if fixture:
            print(f"  {fixture['persona'].upper():8} -> {fixture['user_id']}")


if __name__ == "__main__":
    main()
