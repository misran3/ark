"""
Integration test for multi-agent orchestrator.

Runs the full pipeline with mock data and prints structured results.
Requires AWS credentials configured for Bedrock access.

Usage:
    cd core && uv run python -m agent.dev_multi
    # OR
    cd core/agent && uv run python dev_multi.py
"""

import asyncio
import json
import os
import sys

# Force mock mode
os.environ.setdefault("DATA_SOURCE", "mock")
os.environ.setdefault("AWS_REGION", "us-east-1")


async def main():
    from agent.orchestrator import analyze_finances

    print("=" * 70)
    print("CAPTAIN NOVA MULTI-AGENT ANALYSIS — Integration Test")
    print("=" * 70)
    print()

    result = await analyze_finances(user_id="demo_user")

    # Pretty print each section
    sections = [
        ("1. FINANCIAL MEANING (Cold Boot)", result.financial_meaning),
        ("2. WASTEFUL SUBSCRIPTIONS (Asteroid)", result.wasteful_subscriptions),
        ("3. BUDGET OVERRUNS (Ion Storm)", result.budget_overruns),
        ("4. UPCOMING BILLS (Solar Flare)", result.upcoming_bills),
        ("5. DEBT SPIRALS (Black Hole)", result.debt_spirals),
        ("6. MISSED REWARDS (Wormhole)", result.missed_rewards),
        ("7. FRAUD DETECTION (Enemy Cruiser)", result.fraud_alerts),
    ]

    for title, section in sections:
        print(f"\n{'─' * 70}")
        print(f"  {title}")
        print(f"{'─' * 70}")
        print(json.dumps(section.model_dump(), indent=2, default=str))

    print(f"\n{'=' * 70}")
    print("ANALYSIS COMPLETE")
    print(f"{'=' * 70}")

    # Validate all sections are populated
    checks = [
        ("Financial Meaning greeting", bool(result.financial_meaning.greeting)),
        ("Financial Meaning verdict", bool(result.financial_meaning.verdict)),
        ("Financial Meaning status", result.financial_meaning.status in ("stable", "warning", "critical")),
        ("Wasteful Subscriptions type", isinstance(result.wasteful_subscriptions.subscriptions, list)),
        ("Budget Overruns type", isinstance(result.budget_overruns.overruns, list)),
        ("Upcoming Bills type", isinstance(result.upcoming_bills.bills, list)),
        ("Debt Spirals type", isinstance(result.debt_spirals.debts, list)),
        ("Missed Rewards type", isinstance(result.missed_rewards.missed_rewards, list)),
        ("Fraud Alerts type", isinstance(result.fraud_alerts.alerts, list)),
    ]

    print("\nValidation:")
    all_pass = True
    for name, passed in checks:
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {name}")
        if not passed:
            all_pass = False

    if all_pass:
        print("\nAll checks passed!")
    else:
        print("\nSome checks failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
