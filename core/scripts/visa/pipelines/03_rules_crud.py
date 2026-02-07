"""
Pipeline 03 — Rules CRUD.

Exercises GET / POST / PUT / DELETE on the rules sub-resource of an
enrolled card document.  Each operation is logged with before/after state.

Usage:
    cd core/scripts/visa
    python -m pipelines.03_rules_crud [--doc-id ID]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_USER_ID

log = setup_logging("03_rules_crud")

STEPS_TOTAL = 5


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


# ── Step 1: GET current rules ───────────────────────────────────────────────

def step_get_rules(doc_id: str) -> dict:
    log.info(f"[STEP 1/{STEPS_TOTAL}] GET current rules")
    resp = vtc_request("GET", _rules_path(doc_id), label="GetRules")
    if resp.ok:
        resource = resp.resource
        gc = len(resource.get("globalControls", []))
        mc = len(resource.get("merchantControls", []))
        tc = len(resource.get("transactionControls", []))
        log.info(f"  Current rules: {gc} global, {mc} merchant, {tc} transaction")
        return resource
    log.warning(f"  GET rules returned {resp.status}")
    return {}


# ── Step 2: POST new rules (additive) ───────────────────────────────────────

def step_post_rules(doc_id: str) -> bool:
    log.info(f"[STEP 2/{STEPS_TOTAL}] POST new rules (additive)")
    payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 75.0,
                "declineThreshold": 500.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
    }
    log.debug(f"  Payload:\n{pretty(payload)}")
    resp = vtc_request("POST", _rules_path(doc_id), payload, label="PostRules")
    if resp.ok:
        log.info(f"  POST rules SUCCESS")
        return True
    log.error(f"  POST rules FAILED — {resp.status}")
    return False


# ── Step 3: Verify POST took effect ─────────────────────────────────────────

def step_verify_post(doc_id: str) -> bool:
    log.info(f"[STEP 3/{STEPS_TOTAL}] Verify POST — GET rules again")
    resp = vtc_request("GET", _rules_path(doc_id), label="VerifyPost")
    if resp.ok:
        gc = resp.resource.get("globalControls", [])
        log.info(f"  globalControls count: {len(gc)}")
        if gc:
            log.info(f"  First global control:\n{pretty(gc[0])}")
        return True
    return False


# ── Step 4: PUT replace all rules ────────────────────────────────────────────

def step_put_rules(doc_id: str) -> bool:
    log.info(f"[STEP 4/{STEPS_TOTAL}] PUT — replace all rules")
    payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 100.0,
                "declineThreshold": 1000.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
        "transactionControls": [
            {
                "controlType": "TCT_E_COMMERCE",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 50.0,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
    }
    log.debug(f"  Payload:\n{pretty(payload)}")
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="PutRules")
    if resp.ok:
        log.info(f"  PUT rules SUCCESS — all rules replaced")
        return True
    log.error(f"  PUT rules FAILED — {resp.status}")
    return False


# ── Step 5: DELETE all rules ─────────────────────────────────────────────────

def step_delete_rules(doc_id: str) -> bool:
    log.info(f"[STEP 5/{STEPS_TOTAL}] DELETE all rules")
    resp = vtc_request("DELETE", _rules_path(doc_id), label="DeleteRules")
    if resp.ok:
        log.info(f"  DELETE rules SUCCESS — card is now rule-free")
        return True
    log.error(f"  DELETE rules FAILED — {resp.status}")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str = DEMO_DOC_ID) -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Rules CRUD")
    log.info(f"  documentID: {doc_id}")
    log.info("=" * 60)

    results = [
        step_get_rules(doc_id) is not None,
        step_post_rules(doc_id),
        step_verify_post(doc_id),
        step_put_rules(doc_id),
        step_delete_rules(doc_id),
    ]

    passed = sum(results)
    failed = len(results) - passed

    log.info("")
    log.info(f"RESULTS: {passed}/{len(results)} passed, {failed} failed")
    log.info("=" * 60)
    return all(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Test rules CRUD on an enrolled card")
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID")
    args = parser.parse_args()

    success = run(doc_id=args.doc_id)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
