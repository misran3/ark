"""
Seed Capital One Nessie sandbox with demo data for 3 users.

Usage:
    export NESSIE_API_KEY="your_key_here"
    cd core && python scripts/seed_nessie_demo.py [--user USER_ID]

Creates customers, accounts, merchants, and purchases for:
- user_maya_torres (critical)
- user_james_chen (warning)
- user_sofia_ramirez (good)

Get your API key at: http://api.nessieisreal.com/
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import httpx

BASE_URL = "http://api.nessieisreal.com"
API_KEY = os.getenv("NESSIE_API_KEY", "")

if not API_KEY:
    print("ERROR: Set NESSIE_API_KEY environment variable first")
    print("  Get one at: http://api.nessieisreal.com/")
    sys.exit(1)

client = httpx.Client(base_url=BASE_URL, timeout=30.0)

FIXTURES_DIR = Path(__file__).parent.parent / "shared" / "src" / "shared" / "mocks" / "demo"

# Maps fixture user_id to Nessie customer_id (populated during seeding)
CUSTOMER_IDS: dict[str, str] = {}
# Maps fixture account_id to Nessie account_id
ACCOUNT_IDS: dict[str, str] = {}
# Maps merchant name to Nessie merchant_id
MERCHANT_IDS: dict[str, str] = {}


def api(method: str, path: str, body: dict | None = None) -> dict | list:
    """Make a Nessie API call."""
    url = f"{path}?key={API_KEY}"
    if method == "POST":
        r = client.post(url, json=body)
    elif method == "GET":
        r = client.get(url)
    elif method == "DELETE":
        r = client.delete(url)
    else:
        raise ValueError(f"Unknown method: {method}")

    if r.status_code >= 400:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
        return {}
    try:
        return r.json()
    except Exception:
        return {}


def load_fixture(filename: str) -> dict:
    """Load a JSON fixture file."""
    filepath = FIXTURES_DIR / filename
    if not filepath.exists():
        print(f"ERROR: Fixture not found: {filepath}")
        sys.exit(1)
    return json.loads(filepath.read_text())


def clean_existing():
    """Remove all existing customers and merchants."""
    print("Cleaning existing data...")

    # Delete all customers (cascades to accounts and purchases)
    customers = api("GET", "/customers")
    if isinstance(customers, list):
        for c in customers:
            api("DELETE", f"/customers/{c['_id']}")
            print(f"  [-] Deleted customer {c['_id']}")

    # Delete all merchants
    merchants = api("GET", "/merchants")
    if isinstance(merchants, list):
        for m in merchants:
            api("DELETE", f"/merchants/{m['_id']}")
            print(f"  [-] Deleted merchant {m['_id']}")
    print()


# Map our fixture categories to Nessie API valid categories
NESSIE_CATEGORY_MAP = {
    "groceries": "groceries",
    "dining": "food",
    "coffee": "coffee",
    "gas": "gas",
    "shopping": "shopping",
    "electronics": "electronics",
    "utilities": "utilities",
    "transportation": "transportation",
    "travel": "travel",
    "subscriptions": "entertainment",
    "gym": "fitness",
    "rent": "housing",
    "mortgage": "housing",
    "insurance": "insurance",
    "medical": "health",
    "loan_payment": "finance",
    "salary": "income",
}


def create_merchants():
    """Create all merchants from the shared definition."""
    print("Creating merchants...")
    merchants_data = load_fixture("merchants.json")

    for m in merchants_data["merchants"]:
        # Map our category to Nessie's valid category
        nessie_category = NESSIE_CATEGORY_MAP.get(m["category"], "other")

        result = api("POST", "/merchants", {
            "name": m["name"],
            "category": nessie_category,  # String, not list
            "address": {
                "street_number": "100",
                "street_name": "Main St",
                "city": "Houston",
                "state": "TX",
                "zip": "77001",
            },
            "geocode": {"lat": 29.76, "lng": -95.36},
        })
        merchant_id = result.get("objectCreated", {}).get("_id", "")
        if merchant_id:
            MERCHANT_IDS[m["name"]] = merchant_id
            print(f"  [+] {m['name']} -> {merchant_id}")
        else:
            print(f"  [!] Failed to create merchant: {m['name']}")
    print(f"  Total merchants created: {len(MERCHANT_IDS)}\n")


def create_customer(fixture: dict) -> str:
    """Create a Nessie customer from fixture data."""
    names = fixture["display_name"].split(" ", 1)
    first_name = names[0]
    last_name = names[1] if len(names) > 1 else ""

    result = api("POST", "/customers", {
        "first_name": first_name,
        "last_name": last_name,
        "address": {
            "street_number": "1",
            "street_name": "Demo Ave",
            "city": "Houston",
            "state": "TX",
            "zip": "77001",
        },
    })
    customer_id = result.get("objectCreated", {}).get("_id", "")
    if customer_id:
        CUSTOMER_IDS[fixture["user_id"]] = customer_id
        print(f"[+] Created customer: {fixture['display_name']} -> {customer_id}")
    return customer_id


def create_accounts(customer_id: str, fixture: dict):
    """Create accounts for a customer."""
    for acc in fixture["accounts"]:
        # Nessie balance is positive for credit cards (represents debt)
        balance = abs(acc["balance"])

        result = api("POST", f"/customers/{customer_id}/accounts", {
            "type": acc["type"],
            "nickname": acc["nickname"],
            "balance": balance,
            "rewards": acc.get("rewards", 0),
        })
        account_id = result.get("objectCreated", {}).get("_id", "")
        if account_id:
            ACCOUNT_IDS[acc["id"]] = account_id
            print(f"  [+] {acc['type']}: {acc['nickname']} -> {account_id} (${balance:,.2f})")


def create_transactions(fixture: dict):
    """Create purchase transactions for a user."""
    today = datetime.now()
    user_id = fixture["user_id"]

    # 1. Create recurring charges (past 3 months)
    print(f"  Creating recurring charges...")
    for charge in fixture.get("recurring_charges", []):
        merchant_name = charge["merchant"]
        merchant_id = MERCHANT_IDS.get(merchant_name)
        account_id = ACCOUNT_IDS.get(charge["account"])

        if not merchant_id or not account_id:
            print(f"    [!] Skipping {merchant_name}: missing merchant or account")
            continue

        # Create charges for past 3 months
        for months_ago in range(3):
            charge_date = today.replace(day=charge["day_of_month"]) - timedelta(days=30 * months_ago)
            if charge_date > today:
                charge_date -= timedelta(days=30)

            api("POST", f"/accounts/{account_id}/purchases", {
                "merchant_id": merchant_id,
                "medium": "balance",
                "purchase_date": charge_date.strftime("%Y-%m-%d"),
                "amount": charge["amount"],
                "description": merchant_name,
            })

    # 2. Create spending pattern transactions
    print(f"  Creating spending transactions...")
    spending = fixture.get("spending_patterns", {})

    # Dining transactions (spread across month)
    if dining := spending.get("dining_monthly", 0):
        dining_merchants = ["DoorDash", "Uber Eats", "Grubhub", "Chipotle", "Chick-fil-A", "Panera", "Thai Kitchen"]
        # Determine which account to use based on card_misuse
        misuse = next((m for m in fixture.get("card_misuse", []) if m["category"] == "dining"), None)
        account_key = misuse["uses_account"] if misuse else fixture["accounts"][0]["id"]
        account_id = ACCOUNT_IDS.get(account_key)

        if account_id:
            num_transactions = 12
            avg_amount = dining / num_transactions
            for i in range(num_transactions):
                merchant_name = dining_merchants[i % len(dining_merchants)]
                merchant_id = MERCHANT_IDS.get(merchant_name)
                if merchant_id:
                    amount = round(avg_amount * (0.7 + 0.6 * (i % 3) / 2), 2)
                    date = (today - timedelta(days=i * 2 + 1)).strftime("%Y-%m-%d")
                    api("POST", f"/accounts/{account_id}/purchases", {
                        "merchant_id": merchant_id,
                        "medium": "balance",
                        "purchase_date": date,
                        "amount": amount,
                        "description": merchant_name,
                    })

    # Groceries transactions
    if groceries := spending.get("groceries_monthly", 0):
        grocery_merchants = ["Whole Foods", "Trader Joes", "Costco", "Kroger", "Safeway"]
        misuse = next((m for m in fixture.get("card_misuse", []) if m["category"] == "groceries"), None)
        account_key = misuse["uses_account"] if misuse else fixture["accounts"][0]["id"]
        account_id = ACCOUNT_IDS.get(account_key)

        if account_id:
            num_transactions = 6
            avg_amount = groceries / num_transactions
            for i in range(num_transactions):
                merchant_name = grocery_merchants[i % len(grocery_merchants)]
                merchant_id = MERCHANT_IDS.get(merchant_name)
                if merchant_id:
                    amount = round(avg_amount * (0.8 + 0.4 * (i % 2)), 2)
                    date = (today - timedelta(days=i * 5 + 2)).strftime("%Y-%m-%d")
                    api("POST", f"/accounts/{account_id}/purchases", {
                        "merchant_id": merchant_id,
                        "medium": "balance",
                        "purchase_date": date,
                        "amount": amount,
                        "description": merchant_name,
                    })

    # Shopping transactions
    if shopping := spending.get("shopping_monthly", 0):
        shopping_merchants = ["Amazon", "Target", "Walmart", "Best Buy"]
        misuse = next((m for m in fixture.get("card_misuse", []) if m["category"] == "amazon"), None)
        account_key = misuse["uses_account"] if misuse else fixture["accounts"][0]["id"]
        account_id = ACCOUNT_IDS.get(account_key)

        if account_id:
            num_transactions = 5
            avg_amount = shopping / num_transactions
            for i in range(num_transactions):
                merchant_name = shopping_merchants[i % len(shopping_merchants)]
                merchant_id = MERCHANT_IDS.get(merchant_name)
                if merchant_id:
                    amount = round(avg_amount * (0.6 + 0.8 * (i % 3) / 2), 2)
                    date = (today - timedelta(days=i * 6 + 3)).strftime("%Y-%m-%d")
                    api("POST", f"/accounts/{account_id}/purchases", {
                        "merchant_id": merchant_id,
                        "medium": "balance",
                        "purchase_date": date,
                        "amount": amount,
                        "description": merchant_name,
                    })

    # Gas/transportation transactions
    if transport := spending.get("transportation_monthly", 0):
        gas_merchants = ["Shell", "Chevron", "BP", "ExxonMobil"]
        misuse = next((m for m in fixture.get("card_misuse", []) if m["category"] == "gas"), None)
        account_key = misuse["uses_account"] if misuse else fixture["accounts"][0]["id"]
        account_id = ACCOUNT_IDS.get(account_key)

        if account_id:
            num_transactions = 4
            avg_amount = transport / num_transactions
            for i in range(num_transactions):
                merchant_name = gas_merchants[i % len(gas_merchants)]
                merchant_id = MERCHANT_IDS.get(merchant_name)
                if merchant_id:
                    amount = round(avg_amount * (0.9 + 0.2 * (i % 2)), 2)
                    date = (today - timedelta(days=i * 7 + 4)).strftime("%Y-%m-%d")
                    api("POST", f"/accounts/{account_id}/purchases", {
                        "merchant_id": merchant_id,
                        "medium": "balance",
                        "purchase_date": date,
                        "amount": amount,
                        "description": merchant_name,
                    })

    # Coffee transactions
    if coffee := spending.get("coffee_weekly", 0):
        merchant_id = MERCHANT_IDS.get("Starbucks")
        account_id = ACCOUNT_IDS.get(fixture["accounts"][0]["id"])

        if merchant_id and account_id:
            for i in range(8):  # 2 months of weekly coffee
                amount = round(coffee / 2 * (0.8 + 0.4 * (i % 2)), 2)
                date = (today - timedelta(days=i * 3 + 1)).strftime("%Y-%m-%d")
                api("POST", f"/accounts/{account_id}/purchases", {
                    "merchant_id": merchant_id,
                    "medium": "balance",
                    "purchase_date": date,
                    "amount": amount,
                    "description": "Starbucks",
                })

    # 3. Create fraud transactions
    print(f"  Creating fraud transactions...")
    for fraud in fixture.get("fraud_transactions", []):
        merchant_id = MERCHANT_IDS.get(fraud["merchant"])
        account_id = ACCOUNT_IDS.get(fraud["account"])

        if merchant_id and account_id:
            date = (today - timedelta(days=fraud["days_ago"])).strftime("%Y-%m-%d")
            api("POST", f"/accounts/{account_id}/purchases", {
                "merchant_id": merchant_id,
                "medium": "balance",
                "purchase_date": date,
                "amount": fraud["amount"],
                "description": fraud["merchant"],
            })
            print(f"    [+] Fraud: {fraud['merchant']} ${fraud['amount']}")

    # 4. Create income deposits
    print(f"  Creating income deposits...")
    # Find salary info from recurring charges
    salary_charge = next(
        (c for c in fixture.get("recurring_charges", []) if c["merchant"] in ["Employer Inc", "TechCorp", "Family Services LLC"]),
        None
    )
    if not salary_charge:
        # Use monthly income
        income = fixture.get("monthly_income", 0)
        checking_id = ACCOUNT_IDS.get(fixture["accounts"][0]["id"])
        if income and checking_id:
            for i in range(3):
                date = (today - timedelta(days=i * 15)).strftime("%Y-%m-%d")
                api("POST", f"/accounts/{checking_id}/deposits", {
                    "medium": "balance",
                    "transaction_date": date,
                    "amount": income / 2,
                    "description": "Direct Deposit",
                })


def seed_user(fixture_filename: str):
    """Seed a single user from their fixture file."""
    fixture = load_fixture(fixture_filename)
    user_id = fixture["user_id"]

    print(f"\n{'='*60}")
    print(f"Seeding {fixture['display_name']} ({fixture['persona'].upper()})")
    print(f"{'='*60}")

    # Create customer
    customer_id = create_customer(fixture)
    if not customer_id:
        print(f"ERROR: Failed to create customer for {user_id}")
        return

    # Create accounts
    print(f"\nCreating accounts...")
    create_accounts(customer_id, fixture)

    # Create transactions
    print(f"\nCreating transactions...")
    create_transactions(fixture)

    print(f"\n[OK] {fixture['display_name']} seeding complete")
    print(f"  Customer ID: {customer_id}")
    user_prefix = f"acc_{user_id.split('_')[1]}"
    print(f"  Accounts: {len([a for a in ACCOUNT_IDS if a.startswith(user_prefix)])}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Seed Nessie with demo data")
    parser.add_argument("--user", choices=["maya", "james", "sofia", "all"], default="all",
                        help="Which user to seed (default: all)")
    parser.add_argument("--skip-clean", action="store_true",
                        help="Skip cleaning existing data")
    args = parser.parse_args()

    print("=" * 60)
    print("Nessie Demo Data Seeder")
    print("=" * 60)

    if not args.skip_clean:
        clean_existing()

    # Create shared merchants first
    create_merchants()

    # Seed requested users
    users = {
        "maya": "maya_torres.json",
        "james": "james_chen.json",
        "sofia": "sofia_ramirez.json",
    }

    if args.user == "all":
        for name, filename in users.items():
            seed_user(filename)
    else:
        seed_user(users[args.user])

    print("\n" + "=" * 60)
    print("Seeding Complete!")
    print("=" * 60)
    print(f"Customers: {len(CUSTOMER_IDS)}")
    print(f"Accounts: {len(ACCOUNT_IDS)}")
    print(f"Merchants: {len(MERCHANT_IDS)}")

    print("\nCustomer IDs for reference:")
    for user_id, customer_id in CUSTOMER_IDS.items():
        print(f"  {user_id}: {customer_id}")


if __name__ == "__main__":
    main()
