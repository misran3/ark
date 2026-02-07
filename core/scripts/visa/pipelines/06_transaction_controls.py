"""
Pipeline 06 — Transaction Type Controls.

Sets controls on specific transaction types:
  - TCT_E_COMMERCE: alert + decline threshold (online spending guard)
  - TCT_ATM_WITHDRAW: alert-only (cash withdrawal monitoring)
  - TCT_AUTO_PAY: alert on all recurring charges (subscription awareness)
  - TCT_CROSS_BORDER: hard block (international transaction freeze)
  - TCT_CONTACTLESS: alert-only (tap-to-pay awareness)

Maps to: Upcoming Bills (Solar Flare) + Wasteful Subs (Asteroid).

Usage:
    cd core/scripts/visa
    python -m pipelines.06_transaction_controls [--doc-id ID]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_USER_ID

log = setup_logging("06_transaction_controls")

STEPS_TOTAL = 4


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


# ── Step 1: GET baseline ────────────────────────────────────────────────────

def step_get_baseline(doc_id: str) -> dict:
    log.info(f"[STEP 1/{STEPS_TOTAL}] GET current rules (baseline)")
    resp = vtc_request("GET", _rules_path(doc_id), label="GetBaseline")
    if resp.ok:
        tc = resp.resource.get("transactionControls", [])
        log.info(f"  Current transaction controls: {len(tc)}")
        return resp.resource
    return {}


# ── Step 2: E-commerce + ATM controls ───────────────────────────────────────

def step_ecommerce_and_atm(doc_id: str) -> bool:
    log.info(f"[STEP 2/{STEPS_TOTAL}] Set e-commerce (alert $100, decline $500) + ATM (alert-only $0.01)")

    payload = {
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
    }
    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="EcomATM")
    if resp.ok:
        log.info(f"  E-commerce + ATM controls applied")
        return True
    log.error(f"  Failed to set e-commerce + ATM controls")
    return False


# ── Step 3: Auto-pay monitoring ──────────────────────────────────────────────

def step_auto_pay_monitor(doc_id: str) -> bool:
    log.info(f"[STEP 3/{STEPS_TOTAL}] Add auto-pay alert (subscription monitoring)")

    # Merge with existing
    current = vtc_request("GET", _rules_path(doc_id), label="GetBeforeAutoPay")
    existing_tc = current.resource.get("transactionControls", []) if current.ok else []

    new_tc = [tc for tc in existing_tc if tc.get("controlType") != "TCT_AUTO_PAY"]
    new_tc.append({
        "controlType": "TCT_AUTO_PAY",
        "isControlEnabled": True,
        "shouldDeclineAll": False,
        "alertThreshold": 0.01,  # Alert on ALL auto-pay charges
        "shouldAlertOnDecline": False,
        "userIdentifier": DEMO_USER_ID,
    })

    payload = {"transactionControls": new_tc}
    for key in ("globalControls", "merchantControls"):
        if current.ok and current.resource.get(key):
            payload[key] = current.resource[key]

    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="AutoPayMonitor")
    if resp.ok:
        log.info(f"  Auto-pay monitoring applied")
        return True
    log.error(f"  Failed to set auto-pay monitoring")
    return False


# ── Step 4: Cross-border block + contactless alert ──────────────────────────

def step_cross_border_and_contactless(doc_id: str) -> bool:
    log.info(f"[STEP 4/{STEPS_TOTAL}] Add cross-border BLOCK + contactless alert")

    current = vtc_request("GET", _rules_path(doc_id), label="GetBeforeCrossBorder")
    existing_tc = current.resource.get("transactionControls", []) if current.ok else []

    # Remove old cross-border/contactless if present
    new_tc = [tc for tc in existing_tc if tc.get("controlType") not in ("TCT_CROSS_BORDER", "TCT_CONTACTLESS")]

    new_tc.append({
        "controlType": "TCT_CROSS_BORDER",
        "isControlEnabled": True,
        "shouldDeclineAll": True,  # Hard block international
        "shouldAlertOnDecline": True,
        "userIdentifier": DEMO_USER_ID,
    })
    new_tc.append({
        "controlType": "TCT_CONTACTLESS",
        "isControlEnabled": True,
        "shouldDeclineAll": False,
        "alertThreshold": 0.01,
        "shouldAlertOnDecline": False,
        "userIdentifier": DEMO_USER_ID,
    })

    payload = {"transactionControls": new_tc}
    for key in ("globalControls", "merchantControls"):
        if current.ok and current.resource.get(key):
            payload[key] = current.resource[key]

    resp = vtc_request("PUT", _rules_path(doc_id), payload, label="CrossBorderContactless")
    if resp.ok:
        log.info(f"  Cross-border block + contactless alert applied")
        return True
    log.error(f"  Failed to set cross-border/contactless controls")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str = DEMO_DOC_ID) -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Transaction Type Controls")
    log.info(f"  documentID: {doc_id}")
    log.info("=" * 60)

    step_get_baseline(doc_id)

    results = [
        step_ecommerce_and_atm(doc_id),
        step_auto_pay_monitor(doc_id),
        step_cross_border_and_contactless(doc_id),
    ]

    passed = sum(results)
    failed = len(results) - passed

    log.info("")
    log.info(f"RESULTS: {passed}/{len(results)} passed, {failed} failed")

    # Show final state
    log.info("")
    log.info("Final transaction controls:")
    final = vtc_request("GET", _rules_path(doc_id), label="FinalState")
    if final.ok:
        for tc in final.resource.get("transactionControls", []):
            blocked = "BLOCKED" if tc.get("shouldDeclineAll") else "active"
            ctype = tc.get("controlType", "?")
            log.info(f"  {ctype:30s}  [{blocked}]")

    log.info("=" * 60)
    return all(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Set transaction type controls")
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID")
    args = parser.parse_args()

    success = run(doc_id=args.doc_id)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
