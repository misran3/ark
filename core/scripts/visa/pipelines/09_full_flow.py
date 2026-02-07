"""
Pipeline 09 — Full End-to-End Flow.

Runs the complete VTC lifecycle in sequence:
  1. Bootstrap (program admin config)
  2. Card enrollment
  3. Set global controls
  4. Set merchant controls
  5. Set transaction controls
  6. Verify rules via GET
  7. Fraud freeze + unfreeze
  8. Cleanup (delete all rules)

A "demo day" script that proves the whole integration works.

Usage:
    cd core/scripts/visa
    python -m pipelines.09_full_flow [--skip-bootstrap] [--skip-cleanup]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_PAN, DEMO_USER_ID

log = setup_logging("09_full_flow")


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


def run(skip_bootstrap: bool = False, skip_cleanup: bool = False) -> bool:
    log.info("=" * 70)
    log.info("  FULL END-TO-END VTC FLOW")
    log.info("=" * 70)

    step_results: list[tuple[str, bool]] = []

    def record(name: str, ok: bool) -> bool:
        icon = "PASS" if ok else "FAIL"
        log.info(f"  [{icon}] {name}")
        step_results.append((name, ok))
        return ok

    # ── Phase 0: Bootstrap ───────────────────────────────────────────────
    if not skip_bootstrap:
        log.info("")
        log.info("--- Phase 0: Bootstrap ---")
        ok = _do_bootstrap()
        record("Bootstrap program admin", ok)
    else:
        log.info("\n--- Phase 0: Bootstrap (SKIPPED) ---")

    # ── Phase 1: Enrollment ──────────────────────────────────────────────
    log.info("")
    log.info("--- Phase 1: Card Enrollment ---")
    doc_id = _do_enroll(DEMO_PAN)
    record("Card enrollment", doc_id is not None)
    doc_id = doc_id or DEMO_DOC_ID

    # ── Phase 2: Global Controls ─────────────────────────────────────────
    log.info("")
    log.info("--- Phase 2: Global Controls ---")

    payload_global = {
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
    resp = vtc_request("PUT", _rules_path(doc_id), payload_global, label="SetGlobal")
    record("Global controls", resp.ok)

    # ── Phase 3: Merchant Controls ───────────────────────────────────────
    log.info("")
    log.info("--- Phase 3: Merchant Controls ---")

    # GET current, merge
    current = vtc_request("GET", _rules_path(doc_id), label="GetBeforeMerchant")
    payload_merchant = current.resource if current.ok else {}
    payload_merchant["merchantControls"] = [
        {
            "controlType": "MCT_DINING",
            "isControlEnabled": True,
            "shouldDeclineAll": False,
            "declineThreshold": 180.0,
            "alertThreshold": 150.0,
            "shouldAlertOnDecline": True,
            "userIdentifier": DEMO_USER_ID,
        },
        {
            "controlType": "MCT_GROCERY",
            "isControlEnabled": True,
            "shouldDeclineAll": False,
            "declineThreshold": 400.0,
            "alertThreshold": 350.0,
            "shouldAlertOnDecline": True,
            "userIdentifier": DEMO_USER_ID,
        },
    ]
    resp = vtc_request("PUT", _rules_path(doc_id), payload_merchant, label="SetMerchant")
    record("Merchant controls", resp.ok)

    # ── Phase 4: Transaction Controls ────────────────────────────────────
    log.info("")
    log.info("--- Phase 4: Transaction Controls ---")

    current = vtc_request("GET", _rules_path(doc_id), label="GetBeforeTxnType")
    payload_txn = current.resource if current.ok else {}
    payload_txn["transactionControls"] = [
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
            "controlType": "TCT_AUTO_PAY",
            "isControlEnabled": True,
            "shouldDeclineAll": False,
            "alertThreshold": 0.01,
            "shouldAlertOnDecline": False,
            "userIdentifier": DEMO_USER_ID,
        },
    ]
    resp = vtc_request("PUT", _rules_path(doc_id), payload_txn, label="SetTxnType")
    record("Transaction controls", resp.ok)

    # ── Phase 5: Verify ──────────────────────────────────────────────────
    log.info("")
    log.info("--- Phase 5: Verify All Rules ---")

    resp = vtc_request("GET", _rules_path(doc_id), label="VerifyAll")
    if resp.ok:
        r = resp.resource
        gc = len(r.get("globalControls", []))
        mc = len(r.get("merchantControls", []))
        tc = len(r.get("transactionControls", []))
        log.info(f"  Rules on card: {gc} global, {mc} merchant, {tc} transaction")
        record("Verify rules", gc > 0 and mc > 0 and tc > 0)
    else:
        record("Verify rules", False)

    # ── Phase 6: Fraud Freeze / Unfreeze ─────────────────────────────────
    log.info("")
    log.info("--- Phase 6: Fraud Freeze / Unfreeze ---")

    backup = vtc_request("GET", _rules_path(doc_id), label="BackupBeforeFreeze")
    backup_data = backup.resource if backup.ok else {}

    freeze_payload = {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": True,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        ],
    }
    resp = vtc_request("PUT", _rules_path(doc_id), freeze_payload, label="Freeze")
    record("Fraud freeze", resp.ok)

    # Verify frozen
    verify = vtc_request("GET", _rules_path(doc_id), label="VerifyFreeze")
    frozen = False
    if verify.ok:
        gc = verify.resource.get("globalControls", [])
        frozen = bool(gc and gc[0].get("shouldDeclineAll"))
    record("Verify freeze", frozen)

    # Unfreeze
    if backup_data:
        resp = vtc_request("PUT", _rules_path(doc_id), backup_data, label="Unfreeze")
        record("Unfreeze", resp.ok)
    else:
        record("Unfreeze", False)

    # ── Phase 7: Cleanup ─────────────────────────────────────────────────
    if not skip_cleanup:
        log.info("")
        log.info("--- Phase 7: Cleanup ---")
        resp = vtc_request("DELETE", _rules_path(doc_id), label="CleanupRules")
        record("Delete all rules", resp.ok)
    else:
        log.info("\n--- Phase 7: Cleanup (SKIPPED) ---")

    # ── Summary ──────────────────────────────────────────────────────────
    log.info("")
    log.info("=" * 70)
    log.info("  FULL FLOW SUMMARY")
    log.info("-" * 70)
    for name, ok in step_results:
        icon = "PASS" if ok else "FAIL"
        log.info(f"  [{icon}] {name}")

    passed = sum(ok for _, ok in step_results)
    total = len(step_results)
    log.info("-" * 70)
    log.info(f"  {passed}/{total} passed")
    log.info("=" * 70)

    return all(ok for _, ok in step_results)


def _do_bootstrap() -> bool:
    """Inline bootstrap — enable rule categories, TCTs, callback."""
    from _constants import ALL_TCT_TYPES

    r1 = vtc_request("POST", "/vctc/programadmin/v1/sponsors/configuration",
                     {"ruleCategories": ["PCT_GLOBAL", "PCT_TRANSACTION", "PCT_MERCHANT"]},
                     label="Bootstrap-RuleCategories")
    r2 = vtc_request("POST", "/vctc/programadmin/v1/configuration/transactiontypecontrols",
                     {"transactionTypeRules": ALL_TCT_TYPES},
                     label="Bootstrap-TCTs")
    r3 = vtc_request("PUT", "/vctc/customerrules/v1/applications/configuration",
                     {"callBackSettings": {"callBackEndpoint": "https://your-api.example.com/vtc/notifications",
                                           "isCallBackDisabled": False, "isCallBackEndpointLocal": False}},
                     label="Bootstrap-Callback")
    return all(r.ok or r.conflict for r in [r1, r2, r3])


def _do_enroll(pan: str) -> str | None:
    """Inline enrollment — check inquiry, enroll if needed."""
    from _constants import (DEMO_COUNTRY_CODE, DEMO_DOC_ID, DEMO_EMAIL,
                            DEMO_FIRST_NAME, DEMO_LANGUAGE, DEMO_LAST_NAME, DEMO_USER_ID)

    inq = vtc_request("POST",
                      "/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry",
                      {"primaryAccountNumber": pan}, label="FullFlow-CardInquiry")
    if inq.ok and inq.resource.get("documentID"):
        return inq.resource["documentID"]

    payload = {
        "primaryAccountNumber": pan,
        "countryCode": DEMO_COUNTRY_CODE,
        "firstName": DEMO_FIRST_NAME,
        "lastName": DEMO_LAST_NAME,
        "preferredLanguage": DEMO_LANGUAGE,
        "userIdentifier": DEMO_USER_ID,
        "defaultAlertsPreferences": [
            {"contactType": "Email", "contactValue": DEMO_EMAIL,
             "isVerified": True, "preferredEmailFormat": "Html", "status": "Active"}
        ],
    }
    resp = vtc_request("POST", "/vctc/customerrules/v1/consumertransactioncontrols",
                       payload, label="FullFlow-Enroll")
    if resp.ok:
        return resp.resource.get("documentID")
    if resp.conflict:
        return DEMO_DOC_ID
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Full end-to-end VTC flow")
    parser.add_argument("--skip-bootstrap", action="store_true", help="Skip program admin setup")
    parser.add_argument("--skip-cleanup", action="store_true", help="Don't delete rules at the end")
    args = parser.parse_args()

    success = run(skip_bootstrap=args.skip_bootstrap, skip_cleanup=args.skip_cleanup)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
