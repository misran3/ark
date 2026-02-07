"""
Local testing script for Captain Nova agent.

Run: cd core/agent && uv run python dev.py
Or:  cd core && uv run python -m agent.dev

Each scenario tests a different query type with expected output patterns.
"""

import asyncio
import os
import sys

# Ensure AWS region is set for local testing
os.environ.setdefault("AWS_REGION", "us-east-1")

from agent import QueryRequest, run_captain_nova

# =============================================================================
# Test Scenarios
# =============================================================================

SCENARIOS = {
    "bridge_briefing": {
        "request": QueryRequest(type="bridge_briefing", message=""),
        "expected_patterns": [
            # Expected: ~100 words, mentions net worth ($14,902),
            # flags dining overrun (142%), mentions gym unused
            "net worth",
            "dining",
        ],
        "description": "Page load summary - should mention net worth and top threats",
    },
    "budget_scan": {
        "request": QueryRequest(type="budget_scan", message=""),
        "expected_patterns": [
            # Expected: Details all 3 buckets, Life Support 43.6% (on_track),
            # Recreation Deck 42.6% (critical), Warp Fuel 9.1% (warning)
            "Life Support",
            "Recreation",
        ],
        "description": "Detailed budget analysis - should cover all 3 buckets",
    },
    "threat_report": {
        "request": QueryRequest(type="threat_report", message=""),
        "expected_patterns": [
            # Expected: Lists 5 asteroids, prioritizes gym ($24.99/mo) and
            # dining overrun ($76.22 over), recommends VISA dining limit
            "gym",
            "asteroid",
        ],
        "description": "Full threat assessment - should list asteroids with recommendations",
    },
    "savings_eta": {
        "request": QueryRequest(type="savings_eta", message=""),
        "expected_patterns": [
            # Expected: Current $500/mo savings, ~22 months to 6-month emergency fund,
            # shows impact of +$250/mo (cuts to ~15 months)
            "month",
            "emergency",
        ],
        "description": "Savings projection - should show time to emergency fund goal",
    },
    "activate_shield": {
        "request": QueryRequest(type="activate_shield", message=""),
        "expected_patterns": [
            # Expected: Recommends dining category limit ($25/tx or $150/mo),
            # asks commander for confirmation
            "shield",
            "dining",
        ],
        "description": "VISA control recommendation - should suggest spending limits",
    },
    "custom_dining": {
        "request": QueryRequest(
            type="custom", message="Why am I spending so much on food?"
        ),
        "expected_patterns": [
            # Expected: Analyzes dining transactions, identifies DoorDash/UberEats
            # as 65% of dining, suggests cooking more or meal prep
            "dining",
            "DoorDash",
        ],
        "description": "Custom query about food spending",
    },
    "custom_cancel_gym": {
        "request": QueryRequest(
            type="custom", message="Should I cancel my gym membership?"
        ),
        "expected_patterns": [
            # Expected: References 47 days unused, $299.88/year savings,
            # suggests cancel or pause, maybe redirect to home workout
            "gym",
            "day",
        ],
        "description": "Custom query about gym membership",
    },
}


async def run_scenario(name: str, scenario: dict) -> bool:
    """Run a single test scenario and check for expected patterns."""
    print(f"\n{'='*60}")
    print(f"SCENARIO: {name}")
    print(f"Description: {scenario['description']}")
    print(f"Query Type: {scenario['request'].type}")
    if scenario["request"].message:
        print(f"Message: {scenario['request'].message}")
    print("=" * 60)

    try:
        response = await run_captain_nova(scenario["request"])

        print(f"\n📡 Captain Nova Response:")
        print(f"{response.message}")
        print(f"\n🔧 Tools Used: {response.tools_used}")

        if response.suggested_visa_controls:
            print(f"🛡️ Suggested VISA Controls: {len(response.suggested_visa_controls)}")

        # Check for expected patterns
        message_lower = response.message.lower()
        found_patterns = []
        missing_patterns = []

        for pattern in scenario["expected_patterns"]:
            if pattern.lower() in message_lower:
                found_patterns.append(pattern)
            else:
                missing_patterns.append(pattern)

        if found_patterns:
            print(f"\n✅ Found expected patterns: {found_patterns}")
        if missing_patterns:
            print(f"\n⚠️ Missing expected patterns: {missing_patterns}")

        return len(missing_patterns) == 0

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return False


async def run_all_scenarios():
    """Run all test scenarios."""
    print("\n" + "=" * 60)
    print("CAPTAIN NOVA LOCAL TESTING")
    print("=" * 60)

    results = {}
    for name, scenario in SCENARIOS.items():
        results[name] = await run_scenario(name, scenario)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    passed = sum(1 for r in results.values() if r)
    total = len(results)

    for name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status}: {name}")

    print(f"\nTotal: {passed}/{total} scenarios passed")
    return passed == total


async def run_single_scenario(name: str):
    """Run a single scenario by name."""
    if name not in SCENARIOS:
        print(f"Unknown scenario: {name}")
        print(f"Available: {list(SCENARIOS.keys())}")
        return False

    return await run_scenario(name, SCENARIOS[name])


def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        scenario_name = sys.argv[1]
        success = asyncio.run(run_single_scenario(scenario_name))
    else:
        print("Usage: python dev.py [scenario_name]")
        print("       python dev.py              # Run all scenarios")
        print(f"\nAvailable scenarios: {list(SCENARIOS.keys())}")
        print("\nRunning all scenarios...")
        success = asyncio.run(run_all_scenarios())

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
