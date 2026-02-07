"""
Pipeline 04 — Global Controls.

Sets global spending ceilings, monthly/weekly/daily spend limits,
and transaction count caps on the enrolled card.

Maps to: Debt Spirals (Black Hole) specialist output.

Usage:
    cd core/scripts/visa
    python -m pipelines.04_global_controls [--doc-id ID]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_USER_ID

log = setup_logging("04_global_controls")

STEPS_TOTAL = 4


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


# ── Step 1: GET current state ────────────────────────────────────────────────

def step_get_current(doc_id: str) -> dict:
    log.info(f"[STEP 1/{STEPS_TOTAL}] GET current rules (baseline)")
    resp = vtc_request("GET", _rules_path(doc_id), label="GetBaseline")
    if resp.ok:
        gc = resp.resource.get("globalControls", [])
        log.info(f"  Current global controls: {len(gc)}")
        return resp.resource
    log.warning(f"  Could not fetch current rules ({resp.status})")
    return {}


# ── Step 2: Per-transaction ceiling (alertThreshold + declineThreshold) ──────

def step_set_transaction_ceiling(doc_id: str) -> bool:
    log.info(f"[STEP 2/{STEPS_TOTAL}] Set per-transaction ceiling: alert=$50, decline=$500")
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
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="TxnCeiling")
    if resp.ok:
        log.info(f"  Per-transaction ceiling applied")
        return True
    log.error(f"  Failed to set transaction ceiling")
    return False


# ── Step 3: Monthly spend limit ──────────────────────────────────────────────

def step_set_monthly_limit(doc_id: str) -> bool:
    log.info(f"[STEP 3/{STEPS_TOTAL}] Set monthly spend limit: alert=$1600, decline=$2000")
    payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 50.0,
                "declineThreshold": 500.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
                "spendLimit": {
                    "type": "LMT_MONTH",
                    "declineThreshold": 2000.0,
                    "alertThreshold": 1600.0,
                    "currentPeriodSpend": 0,
                    "timeZoneID": "America/New_York",
                },
            }
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="MonthlyLimit")
    if resp.ok:
        log.info(f"  Monthly spend limit applied")
        return True
    log.error(f"  Failed to set monthly spend limit")
    return False


# ── Step 4: Transaction count cap ────────────────────────────────────────────

def step_set_txn_count_cap(doc_id: str) -> bool:
    log.info(f"[STEP 4/{STEPS_TOTAL}] Set transaction count cap: max 30/period + monthly $2000")
    payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 50.0,
                "declineThreshold": 500.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
                "transactionLimit": {
                    "maxTransactionCount": 30,
                },
                "spendLimit": {
                    "type": "LMT_MONTH",
                    "declineThreshold": 2000.0,
                    "alertThreshold": 1600.0,
                    "currentPeriodSpend": 0,
                    "timeZoneID": "America/New_York",
                },
            }
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="TxnCountCap")
    if resp.ok:
        log.info(f"  Transaction count cap applied")
        return True
    log.error(f"  Failed to set transaction count cap")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str = DEMO_DOC_ID) -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Global Controls")
    log.info(f"  documentID: {doc_id}")
    log.info("=" * 60)

    step_get_current(doc_id)

    results = [
        step_set_transaction_ceiling(doc_id),
        step_set_monthly_limit(doc_id),
        step_set_txn_count_cap(doc_id),
    ]

    passed = sum(results)
    failed = len(results) - passed

    log.info("")
    log.info(f"RESULTS: {passed}/{len(results)} passed, {failed} failed")

    # Show final state
    log.info("")
    log.info("Final state:")
    final = vtc_request("GET", _rules_path(doc_id), label="FinalState")
    if final.ok:
        log.info(pretty(final.resource))

    log.info("=" * 60)
    return all(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Set global controls on enrolled card")
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID")
    args = parser.parse_args()

    success = run(doc_id=args.doc_id)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
