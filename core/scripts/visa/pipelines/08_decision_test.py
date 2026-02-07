"""
Pipeline 08 — Decision Test (Dry-Run).

Simulates transactions against the Visa validation endpoint to check
whether current rules would approve or decline them — without affecting
any real authorization.

Usage:
    cd core/scripts/visa
    python -m pipelines.08_decision_test [--doc-id ID]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_PAN, DEMO_USER_ID

log = setup_logging("08_decision_test")


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


# ── Test scenarios ───────────────────────────────────────────────────────────

SCENARIOS = [
    {
        "name": "Small grocery purchase ($30)",
        "pan": DEMO_PAN,
        "amount": 30.0,
        "mcc": "5411",  # Grocery
        "expected": "APPROVED",
    },
    {
        "name": "Large online purchase ($600)",
        "pan": DEMO_PAN,
        "amount": 600.0,
        "mcc": "5999",  # Online retail
        "expected": "DECLINED (over $500 e-commerce threshold)",
    },
    {
        "name": "Gambling transaction ($50)",
        "pan": DEMO_PAN,
        "amount": 50.0,
        "mcc": "7995",  # Gambling
        "expected": "DECLINED (gambling blocked)",
    },
    {
        "name": "Restaurant dinner ($120)",
        "pan": DEMO_PAN,
        "amount": 120.0,
        "mcc": "5812",  # Restaurants
        "expected": "APPROVED (under $180 dining threshold)",
    },
    {
        "name": "ATM withdrawal ($200)",
        "pan": DEMO_PAN,
        "amount": 200.0,
        "mcc": "6011",  # ATM
        "expected": "APPROVED (ATM is alert-only)",
    },
]


# ── Seed rules to test against ──────────────────────────────────────────────

def step_seed_test_rules(doc_id: str) -> bool:
    """PUT a known set of rules so decision tests are deterministic."""
    log.info("[SETUP] Seeding rules for decision testing")
    payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 50.0,
                "declineThreshold": 500.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
        "transactionControls": [
            {
                "controlType": "TCT_E_COMMERCE",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 100.0,
                "declineThreshold": 500.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            },
            {
                "controlType": "TCT_ATM_WITHDRAW",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 0.01,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            },
        ],
        "merchantControls": [
            {
                "controlType": "MCT_GAMBLING",
                "isControlEnabled": True,
                "shouldDeclineAll": True,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            },
            {
                "controlType": "MCT_DINING",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "declineThreshold": 180.0,
                "alertThreshold": 150.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            },
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="SeedTestRules")
    if resp.ok:
        log.info("  Test rules seeded")
        return True
    log.error("  Failed to seed test rules")
    return False


# ── Run a decision ──────────────────────────────────────────────────────────

def run_decision(scenario: dict, idx: int, total: int) -> dict:
    """POST /vctc/validation/v1/decisions to dry-run a transaction."""
    log.info(f"[SCENARIO {idx}/{total}] {scenario['name']}")
    log.info(f"  Amount: ${scenario['amount']:.2f}  MCC: {scenario['mcc']}  Expected: {scenario['expected']}")

    resp = vtc_request(
        "POST",
        "/vctc/validation/v1/decisions",
        {
            "primaryAccountNumber": scenario["pan"],
            "cardholderBillAmount": scenario["amount"],
            "merchantInfo": {
                "merchantCategoryCode": scenario["mcc"],
            },
        },
        label=f"Decision-{idx}",
    )

    result = {
        "name": scenario["name"],
        "expected": scenario["expected"],
        "status": resp.status,
    }

    if resp.ok:
        decision = resp.resource
        approved = decision.get("transactionApproved", "UNKNOWN")
        reason = decision.get("decisionReason", "")
        triggered = decision.get("triggeredRules", [])
        result["approved"] = approved
        result["reason"] = reason
        result["triggered_rules"] = triggered
        log.info(f"  Result: {approved}  Reason: {reason}")
        if triggered:
            log.info(f"  Triggered rules: {triggered}")
    else:
        result["approved"] = f"ERROR ({resp.status})"
        log.warning(f"  Decision endpoint returned {resp.status}")
        log.warning(f"  (Validation/decision endpoint may not be available in all sandbox configs)")

    return result


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str = DEMO_DOC_ID) -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Decision Test (Dry-Run)")
    log.info(f"  documentID: {doc_id}")
    log.info(f"  Scenarios: {len(SCENARIOS)}")
    log.info("=" * 60)

    step_seed_test_rules(doc_id)

    log.info("")
    log.info("Running decision scenarios...")
    log.info("-" * 60)

    results = []
    for i, scenario in enumerate(SCENARIOS, 1):
        result = run_decision(scenario, i, len(SCENARIOS))
        results.append(result)
        log.info("")

    # Summary
    log.info("=" * 60)
    log.info("DECISION TEST SUMMARY")
    log.info("-" * 60)
    for r in results:
        log.info(f"  {r['name']:40s}  -> {r.get('approved', 'N/A')}")
    log.info("=" * 60)

    return True  # Decision tests are informational, not pass/fail


def main() -> None:
    parser = argparse.ArgumentParser(description="Dry-run transaction decisions")
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID")
    args = parser.parse_args()

    run(doc_id=args.doc_id)


if __name__ == "__main__":
    main()
