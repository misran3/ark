"""
Pipeline 07 — Emergency Fraud Freeze.

Demonstrates the freeze / unfreeze lifecycle:
  1. GET current rules (save as backup)
  2. FREEZE — PUT shouldDeclineAll: true on globalControls
  3. Verify freeze is in effect
  4. UNFREEZE — PUT the backed-up rules to restore normal operation

Maps to: Fraud Detection (Enemy Cruiser) specialist.

Usage:
    cd core/scripts/visa
    python -m pipelines.07_fraud_freeze [--doc-id ID]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_USER_ID

log = setup_logging("07_fraud_freeze")

STEPS_TOTAL = 5


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


# ── Step 1: Seed some rules to freeze ────────────────────────────────────────

def step_seed_rules(doc_id: str) -> bool:
    log.info(f"[STEP 1/{STEPS_TOTAL}] Seed baseline rules (so freeze has something to override)")
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
        "transactionControls": [
            {
                "controlType": "TCT_E_COMMERCE",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 100.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
        "merchantControls": [
            {
                "controlType": "MCT_DINING",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "declineThreshold": 180.0,
                "alertThreshold": 150.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="SeedRules")
    if resp.ok:
        log.info(f"  Baseline rules seeded (global + e-commerce + dining)")
        return True
    log.error(f"  Failed to seed baseline rules")
    return False


# ── Step 2: Backup current rules ─────────────────────────────────────────────

def step_backup(doc_id: str) -> dict:
    log.info(f"[STEP 2/{STEPS_TOTAL}] Backup current rules (pre-freeze)")
    resp = vtc_request("GET", _rules_path(doc_id), label="BackupRules")
    if resp.ok:
        backup = resp.resource
        gc = len(backup.get("globalControls", []))
        mc = len(backup.get("merchantControls", []))
        tc = len(backup.get("transactionControls", []))
        log.info(f"  Backed up: {gc} global, {mc} merchant, {tc} transaction controls")
        return backup
    log.error(f"  Could not backup rules")
    return {}


# ── Step 3: FREEZE ───────────────────────────────────────────────────────────

def step_freeze(doc_id: str) -> bool:
    log.info(f"[STEP 3/{STEPS_TOTAL}] FREEZE — shouldDeclineAll: true (block ALL transactions)")
    payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": True,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="FREEZE")
    if resp.ok:
        log.info(f"  CARD FROZEN — all transactions will be declined")
        return True
    log.error(f"  FREEZE FAILED")
    return False


# ── Step 4: Verify freeze ───────────────────────────────────────────────────

def step_verify_freeze(doc_id: str) -> bool:
    log.info(f"[STEP 4/{STEPS_TOTAL}] Verify freeze is in effect")
    resp = vtc_request("GET", _rules_path(doc_id), label="VerifyFreeze")
    if resp.ok:
        gc = resp.resource.get("globalControls", [])
        if gc and gc[0].get("shouldDeclineAll"):
            log.info(f"  Confirmed: shouldDeclineAll = true")
            return True
        log.warning(f"  Freeze not confirmed — shouldDeclineAll not set")
        log.debug(f"  globalControls: {pretty(gc)}")
    return False


# ── Step 5: UNFREEZE ────────────────────────────────────────────────────────

def step_unfreeze(doc_id: str, backup: dict) -> bool:
    log.info(f"[STEP 5/{STEPS_TOTAL}] UNFREEZE — restore backed-up rules")

    if not backup:
        log.warning(f"  No backup available — setting minimal non-frozen state")
        backup = {
            "globalControls": [
                {
                    "isControlEnabled": True,
                    "shouldDeclineAll": False,
                    "alertThreshold": 50.0,
                    "shouldAlertOnDecline": True,
                    "userIdentifier": DEMO_USER_ID,
                }
            ],
        }

    resp = vtc_request("PUT", _rules_path(doc_id), backup, label="UNFREEZE")
    if resp.ok:
        log.info(f"  CARD UNFROZEN — previous rules restored")
        return True
    log.error(f"  UNFREEZE FAILED — card may still be frozen!")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str = DEMO_DOC_ID) -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Emergency Fraud Freeze")
    log.info(f"  documentID: {doc_id}")
    log.info("=" * 60)

    ok_seed = step_seed_rules(doc_id)
    backup = step_backup(doc_id)
    ok_freeze = step_freeze(doc_id)
    ok_verify = step_verify_freeze(doc_id)
    ok_unfreeze = step_unfreeze(doc_id, backup)

    results = [ok_seed, ok_freeze, ok_verify, ok_unfreeze]
    passed = sum(results)
    failed = len(results) - passed

    log.info("")
    log.info(f"RESULTS: {passed}/{len(results)} passed, {failed} failed")

    # Show final state
    log.info("")
    log.info("Final state (should be unfrozen):")
    final = vtc_request("GET", _rules_path(doc_id), label="FinalState")
    if final.ok:
        gc = final.resource.get("globalControls", [])
        if gc:
            frozen = gc[0].get("shouldDeclineAll", False)
            log.info(f"  shouldDeclineAll = {frozen}  {'(STILL FROZEN!)' if frozen else '(unfrozen)'}")

    log.info("=" * 60)
    return all(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Emergency freeze and unfreeze")
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID")
    args = parser.parse_args()

    success = run(doc_id=args.doc_id)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
