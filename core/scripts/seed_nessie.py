"""
Seed Capital One Nessie sandbox with demo financial data.

Usage:
    export NESSIE_API_KEY="your_key_here"
    cd core && python scripts/seed_nessie.py

Creates a customer, 3 accounts (checking, savings, credit card),
and 25 purchase transactions matching our mock data.

Get your API key at: http://api.nessieisreal.com/
1. Sign up / log in
2. Copy your API key from the dashboard
"""

import os
import sys
from datetime import datetime, timedelta

import httpx

BASE_URL = "http://api.nessieisreal.com"
API_KEY = os.getenv("NESSIE_API_KEY", "")

if not API_KEY:
    print("ERROR: Set NESSIE_API_KEY environment variable first")
    print("  Get one at: http://api.nessieisreal.com/")
    sys.exit(1)

client = httpx.Client(base_url=BASE_URL, timeout=15.0)


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
        print(f"  ERROR {r.status_code}: {r.text}")
        return {}
    try:
        return r.json()
    except Exception:
        return {}


def clean_existing():
    """Remove existing customers to start fresh."""
    customers = api("GET", "/customers")
    if isinstance(customers, list):
        for c in customers:
            api("DELETE", f"/customers/{c['_id']}")
            print(f"  [-] Deleted customer {c['_id']}")


def create_customer() -> str:
    """Create a demo customer."""
    result = api("POST", "/customers", {
        "first_name": "Nova",
        "last_name": "Commander",
        "address": {
            "street_number": "1",
            "street_name": "Starship Ave",
            "city": "Houston",
            "state": "TX",
            "zip": "77001",
        },
    })
    customer_id = result.get("objectCreated", {}).get("_id", "")
    print(f"[+] Created customer: {customer_id}")
    return customer_id


def create_accounts(customer_id: str) -> dict[str, str]:
    """Create checking, savings, and credit card accounts."""
    accounts = {}

    configs = [
        {"type": "Checking", "nickname": "Main Checking", "balance": 4250, "rewards": 0},
        {"type": "Savings", "nickname": "Emergency Fund", "balance": 12500, "rewards": 0},
        {"type": "Credit Card", "nickname": "Rewards Card", "balance": 1847, "rewards": 450},
    ]

    for cfg in configs:
        result = api("POST", f"/customers/{customer_id}/accounts", cfg)
        account_id = result.get("objectCreated", {}).get("_id", "")
        key = cfg["type"].lower().replace(" ", "_")
        accounts[key] = account_id
        print(f"[+] Created {cfg['type']} account: {account_id} ({cfg['nickname']})")

    return accounts


def create_merchant(name: str, category: str, lat: float = 29.76, lng: float = -95.36) -> str:
    """Create a merchant. Returns merchant ID."""
    result = api("POST", "/merchants", {
        "name": name,
        "category": category,
        "address": {
            "street_number": "100",
            "street_name": "Main St",
            "city": "Houston",
            "state": "TX",
            "zip": "77001",
        },
        "geocode": {"lat": lat, "lng": lng},
    })
    merchant_id = result.get("objectCreated", {}).get("_id", "")
    if not merchant_id:
        print(f"  FAILED to create merchant: {name}")
        return ""
    print(f"[+] Created merchant: {name} -> {merchant_id}")
    return merchant_id


def create_purchases(account_id: str, merchant_id: str, purchases: list[dict]):
    """Create purchase transactions for an account."""
    for p in purchases:
        result = api("POST", f"/accounts/{account_id}/purchases", {
            "merchant_id": merchant_id,
            "medium": "balance",
            "purchase_date": p["date"],
            "amount": p["amount"],
            "description": p.get("description", ""),
        })
        status = "OK" if result.get("objectCreated") else "FAILED"
        print(f"  [{status}] ${p['amount']:.2f} on {p['date']} ({p.get('description', '')})")


def main():
    print("=== Nessie Sandbox Seeder ===\n")

    # Clean slate
    print("Cleaning existing data...")
    clean_existing()
    print()

    # Create customer
    customer_id = create_customer()
    if not customer_id:
        print("Failed to create customer. Check your API key.")
        sys.exit(1)
    print()

    # Create accounts
    accounts = create_accounts(customer_id)
    print()

    # Create merchants
    print("Creating merchants...")
    merchants = {}
    merchant_defs = [
        ("Whole Foods", "groceries"),
        ("DoorDash", "food"),
        ("Starbucks", "coffee"),
        ("Uber Eats", "food"),
        ("Netflix", "entertainment"),
        ("Spotify", "entertainment"),
        ("Planet Fitness", "fitness"),
        ("Shell Gas", "gas"),
        ("Chipotle", "food"),
        ("Amazon", "shopping"),
        ("CVS Pharmacy", "health"),
        ("Grubhub", "food"),
        ("Apartment Complex", "housing"),
        ("Target", "shopping"),
        ("Thai Kitchen", "food"),
        ("Electric Company", "utilities"),
        ("Sushi Palace", "food"),
        ("Trader Joes", "groceries"),
        ("Best Buy", "electronics"),
        ("Pizza Hut", "food"),
        ("Costco", "groceries"),
        ("State Farm", "insurance"),
    ]
    for name, category in merchant_defs:
        mid = create_merchant(name, category)
        if not mid:
            print(f"  ERROR: Merchant creation failed for {name}, aborting.")
            sys.exit(1)
        merchants[name] = mid
    print()

    # Create purchases on checking account
    today = datetime.now()
    print("Creating purchases on checking account...")
    checking_purchases = [
        {"merchant": "Whole Foods", "amount": 87.43, "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"), "description": "Whole Foods"},
        {"merchant": "DoorDash", "amount": 34.99, "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"), "description": "DoorDash"},
        {"merchant": "Starbucks", "amount": 6.75, "date": (today - timedelta(days=3)).strftime("%Y-%m-%d"), "description": "Starbucks"},
        {"merchant": "Netflix", "amount": 15.99, "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"), "description": "Netflix"},
        {"merchant": "Spotify", "amount": 10.99, "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"), "description": "Spotify"},
        {"merchant": "Planet Fitness", "amount": 24.99, "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"), "description": "Planet Fitness"},
        {"merchant": "Shell Gas", "amount": 52.30, "date": (today - timedelta(days=7)).strftime("%Y-%m-%d"), "description": "Shell Gas"},
        {"merchant": "Chipotle", "amount": 14.25, "date": (today - timedelta(days=8)).strftime("%Y-%m-%d"), "description": "Chipotle"},
        {"merchant": "CVS Pharmacy", "amount": 23.45, "date": (today - timedelta(days=10)).strftime("%Y-%m-%d"), "description": "CVS Pharmacy"},
        {"merchant": "Grubhub", "amount": 38.99, "date": (today - timedelta(days=11)).strftime("%Y-%m-%d"), "description": "Grubhub"},
        {"merchant": "Apartment Complex", "amount": 1650.00, "date": (today - timedelta(days=13)).strftime("%Y-%m-%d"), "description": "Apartment Complex"},
        {"merchant": "Target", "amount": 89.23, "date": (today - timedelta(days=14)).strftime("%Y-%m-%d"), "description": "Target"},
        {"merchant": "Thai Kitchen", "amount": 28.50, "date": (today - timedelta(days=16)).strftime("%Y-%m-%d"), "description": "Thai Kitchen"},
        {"merchant": "Electric Company", "amount": 95.00, "date": (today - timedelta(days=18)).strftime("%Y-%m-%d"), "description": "Electric Company"},
        {"merchant": "Trader Joes", "amount": 112.34, "date": (today - timedelta(days=26)).strftime("%Y-%m-%d"), "description": "Trader Joes"},
        {"merchant": "Pizza Hut", "amount": 24.99, "date": (today - timedelta(days=30)).strftime("%Y-%m-%d"), "description": "Pizza Hut"},
        {"merchant": "Costco", "amount": 234.56, "date": (today - timedelta(days=33)).strftime("%Y-%m-%d"), "description": "Costco"},
        {"merchant": "State Farm", "amount": 145.00, "date": (today - timedelta(days=35)).strftime("%Y-%m-%d"), "description": "State Farm"},
    ]
    for p in checking_purchases:
        create_purchases(accounts["checking"], merchants[p["merchant"]], [p])

    # Create purchases on credit card
    print("\nCreating purchases on credit card account...")
    credit_purchases = [
        {"merchant": "Uber Eats", "amount": 42.50, "date": (today - timedelta(days=4)).strftime("%Y-%m-%d"), "description": "Uber Eats"},
        {"merchant": "Amazon", "amount": 67.89, "date": (today - timedelta(days=9)).strftime("%Y-%m-%d"), "description": "Amazon"},
        {"merchant": "Sushi Palace", "amount": 72.00, "date": (today - timedelta(days=24)).strftime("%Y-%m-%d"), "description": "Sushi Palace"},
        {"merchant": "Best Buy", "amount": 199.99, "date": (today - timedelta(days=28)).strftime("%Y-%m-%d"), "description": "Best Buy"},
    ]
    for p in credit_purchases:
        create_purchases(accounts["credit_card"], merchants[p["merchant"]], [p])

    print("\n=== Seeding Complete ===")
    print(f"Customer ID:      {customer_id}")
    print(f"Checking Account: {accounts.get('checking')}")
    print(f"Savings Account:  {accounts.get('savings')}")
    print(f"Credit Card:      {accounts.get('credit_card')}")
    print(f"Merchants:        {len(merchants)} created")
    print(f"Purchases:        {len(checking_purchases) + len(credit_purchases)} created")
    print(f"\nTo use live data, deploy with:")
    print(f"  DATA_SOURCE=nessie NESSIE_API_KEY={API_KEY} npx cdk deploy --all")


if __name__ == "__main__":
    main()
