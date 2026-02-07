"""
Pipeline 05 — Merchant Controls.

Sets per-category spending limits, hard blocks, and alert-only thresholds.
Demonstrates:
  - Budget-based limits (MCT_DINING $180, MCT_GROCERY $400)
  - Hard block on a category (MCT_GAMBLING shouldDeclineAll: true)
  - Alert-only for reward optimization (MCT_GAS_AND_PETROLEUM alert at $0.01)

Maps to: Budget Overruns (Ion Storm) + Wasteful Subs (Asteroid) + Missed Rewards (Wormhole).

Usage:
    cd core/scripts/visa
    python -m pipelines.05_merchant_controls [--doc-id ID]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_USER_ID

log = setup_logging("05_merchant_controls")

STEPS_TOTAL = 4


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


# ── Step 1: GET baseline ────────────────────────────────────────────────────

def step_get_baseline(doc_id: str) -> dict:
    log.info(f"[STEP 1/{STEPS_TOTAL}] GET current rules (baseline)")
    resp = vtc_request("GET", _rules_path(doc_id), label="GetBaseline")
    if resp.ok:
        mc = resp.resource.get("merchantControls", [])
        log.info(f"  Current merchant controls: {len(mc)}")
        return resp.resource
    return {}


# ── Step 2: Budget-based merchant limits ─────────────────────────────────────

def step_budget_limits(doc_id: str) -> bool:
    log.info(f"[STEP 2/{STEPS_TOTAL}] Set budget-based merchant limits")
    log.info(f"  MCT_DINING: alert=$150, decline=$180, monthly budget=$800")
    log.info(f"  MCT_GROCERY: alert=$350, decline=$400, monthly budget=$1200")

    payload = {
        "merchantControls": [
            {
                "controlType": "MCT_DINING",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "declineThreshold": 180.0,
                "alertThreshold": 150.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
                "spendLimit": {
                    "type": "LMT_MONTH",
                    "declineThreshold": 800.0,
                    "alertThreshold": 640.0,
                    "currentPeriodSpend": 0,
                    "timeZoneID": "America/New_York",
                },
            },
            {
                "controlType": "MCT_GROCERY",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "declineThreshold": 400.0,
                "alertThreshold": 350.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
                "spendLimit": {
                    "type": "LMT_MONTH",
                    "declineThreshold": 1200.0,
                    "alertThreshold": 960.0,
                    "currentPeriodSpend": 0,
                    "timeZoneID": "America/New_York",
                },
            },
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="BudgetLimits")
    if resp.ok:
        log.info(f"  Budget-based merchant limits applied")
        return True
    log.error(f"  Failed to set budget limits")
    return False


# ── Step 3: Hard block a category ────────────────────────────────────────────

def step_hard_block(doc_id: str) -> bool:
    log.info(f"[STEP 3/{STEPS_TOTAL}] Hard block MCT_GAMBLING (shouldDeclineAll: true)")

    # GET current to preserve existing controls
    current = vtc_request("GET", _rules_path(doc_id), label="GetBeforeBlock")
    existing_mc = current.resource.get("merchantControls", []) if current.ok else []

    # Add gambling block
    new_mc = [mc for mc in existing_mc if mc.get("controlType") != "MCT_GAMBLING"]
    new_mc.append({
        "controlType": "MCT_GAMBLING",
        "isControlEnabled": True,
        "shouldDeclineAll": True,
        "shouldAlertOnDecline": True,
        "userIdentifier": DEMO_USER_ID,
    })

    payload = {"merchantControls": new_mc}
    # Preserve other control types
    for key in ("globalControls", "transactionControls"):
        if current.ok and current.resource.get(key):
            payload[key] = current.resource[key]

    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="HardBlock")
    if resp.ok:
        log.info(f"  MCT_GAMBLING hard block applied")
        return True
    log.error(f"  Failed to set hard block")
    return False


# ── Step 4: Alert-only for reward optimization ──────────────────────────────

def step_alert_only(doc_id: str) -> bool:
    log.info(f"[STEP 4/{STEPS_TOTAL}] Alert-only MCT_GAS_AND_PETROLEUM (reward optimization)")

    current = vtc_request("GET", _rules_path(doc_id), label="GetBeforeAlert")
    existing_mc = current.resource.get("merchantControls", []) if current.ok else []

    # Add gas alert (don't duplicate)
    new_mc = [mc for mc in existing_mc if mc.get("controlType") != "MCT_GAS_AND_PETROLEUM"]
    new_mc.append({
        "controlType": "MCT_GAS_AND_PETROLEUM",
        "isControlEnabled": True,
        "shouldDeclineAll": False,
        "alertThreshold": 0.01,  # Alert on every gas transaction
        "shouldAlertOnDecline": False,
        "userIdentifier": DEMO_USER_ID,
    })

    payload = {"merchantControls": new_mc}
    for key in ("globalControls", "transactionControls"):
        if current.ok and current.resource.get(key):
            payload[key] = current.resource[key]

    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="AlertOnly")
    if resp.ok:
        log.info(f"  Gas station alert-only applied")
        return True
    log.error(f"  Failed to set alert-only")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str = DEMO_DOC_ID) -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Merchant Controls")
    log.info(f"  documentID: {doc_id}")
    log.info("=" * 60)

    step_get_baseline(doc_id)

    results = [
        step_budget_limits(doc_id),
        step_hard_block(doc_id),
        step_alert_only(doc_id),
    ]

    passed = sum(results)
    failed = len(results) - passed

    log.info("")
    log.info(f"RESULTS: {passed}/{len(results)} passed, {failed} failed")

    # Show final state
    log.info("")
    log.info("Final merchant controls:")
    final = vtc_request("GET", _rules_path(doc_id), label="FinalState")
    if final.ok:
        for mc in final.resource.get("merchantControls", []):
            blocked = "BLOCKED" if mc.get("shouldDeclineAll") else "active"
            log.info(f"  {mc.get('controlType'):30s}  [{blocked}]  alert=${mc.get('alertThreshold', '-'):>8}  decline=${mc.get('declineThreshold', '-')}")

    log.info("=" * 60)
    return all(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Set merchant controls on enrolled card")
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID")
    args = parser.parse_args()

    success = run(doc_id=args.doc_id)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
