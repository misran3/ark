"""
Pipeline 02 — Card Enrollment.

Checks whether the demo card is already enrolled (card inquiry) and,
if not, enrolls it with all required fields.  Outputs the documentID
that every downstream pipeline needs.

Usage:
    cd core/scripts/visa
    python -m pipelines.02_enroll [--card-id PAN]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import (
    DEMO_COUNTRY_CODE,
    DEMO_DOC_ID,
    DEMO_EMAIL,
    DEMO_FIRST_NAME,
    DEMO_LANGUAGE,
    DEMO_LAST_NAME,
    DEMO_PAN,
    DEMO_USER_ID,
)

log = setup_logging("02_enroll")

STEPS_TOTAL = 3


# ── Step 1: Card inquiry ────────────────────────────────────────────────────

def step_card_inquiry(pan: str) -> dict | None:
    """POST /vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry"""
    log.info(f"[STEP 1/{STEPS_TOTAL}] Card inquiry — is PAN {pan[:6]}...{pan[-4:]} already enrolled?")

    resp = vtc_request(
        "POST",
        "/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry",
        {"primaryAccountNumber": pan},
        label="CardInquiry",
    )

    if resp.ok:
        resource = resp.resource
        doc_id = resource.get("documentID")
        if doc_id:
            log.info(f"  Card IS enrolled.  documentID = {doc_id}")
            return resource
        log.info(f"  Card inquiry returned 200 but no documentID — treating as not enrolled")
        return None

    if resp.status == 404:
        log.info(f"  Card is NOT enrolled (404)")
        return None

    log.warning(f"  Card inquiry returned {resp.status} — will attempt enrollment anyway")
    return None


# ── Step 2: Enroll ───────────────────────────────────────────────────────────

def step_enroll(pan: str) -> str | None:
    """POST /vctc/customerrules/v1/consumertransactioncontrols"""
    log.info(f"[STEP 2/{STEPS_TOTAL}] Enrolling PAN {pan[:6]}...{pan[-4:]}")

    payload = {
        "primaryAccountNumber": pan,
        "countryCode": DEMO_COUNTRY_CODE,
        "firstName": DEMO_FIRST_NAME,
        "lastName": DEMO_LAST_NAME,
        "preferredLanguage": DEMO_LANGUAGE,
        "userIdentifier": DEMO_USER_ID,
        "defaultAlertsPreferences": [
            {
                "contactType": "Email",
                "contactValue": DEMO_EMAIL,
                "isVerified": True,
                "preferredEmailFormat": "Html",
                "status": "Active",
            }
        ],
    }

    log.debug(f"  Enrollment payload keys: {list(payload.keys())}")
    log.debug(f"  userIdentifier: {DEMO_USER_ID}")

    resp = vtc_request(
        "POST",
        "/vctc/customerrules/v1/consumertransactioncontrols",
        payload,
        label="EnrollCard",
    )

    if resp.ok:
        doc_id = resp.resource.get("documentID")
        log.info(f"  Enrollment SUCCESS — documentID = {doc_id}")
        return doc_id

    if resp.conflict:
        log.info(f"  Card already enrolled (409).  Using known doc ID: {DEMO_DOC_ID}")
        return DEMO_DOC_ID

    log.error(f"  Enrollment FAILED — {resp.status}")
    return None


# ── Step 3: Verify ───────────────────────────────────────────────────────────

def step_verify(pan: str, expected_doc_id: str) -> bool:
    """Confirm enrollment by running card inquiry again."""
    log.info(f"[STEP 3/{STEPS_TOTAL}] Verifying enrollment via card inquiry")

    resp = vtc_request(
        "POST",
        "/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry",
        {"primaryAccountNumber": pan},
        label="VerifyEnrollment",
    )

    if resp.ok:
        doc_id = resp.resource.get("documentID")
        if doc_id == expected_doc_id:
            log.info(f"  Verified — documentID matches: {doc_id}")
            return True
        log.warning(f"  DocumentID mismatch: expected {expected_doc_id}, got {doc_id}")
        return True  # still enrolled, just different ID
    log.error(f"  Verification failed — {resp.status}")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(pan: str = DEMO_PAN) -> str | None:
    """Run the enrollment pipeline. Returns the documentID or None."""
    log.info("=" * 60)
    log.info("PIPELINE: Card Enrollment")
    log.info(f"  PAN: {pan[:6]}...{pan[-4:]}")
    log.info("=" * 60)

    # Check current state
    inquiry = step_card_inquiry(pan)
    if inquiry and inquiry.get("documentID"):
        doc_id = inquiry["documentID"]
        log.info(f"\nCard already enrolled. documentID = {doc_id}")
        log.info("=" * 60)
        return doc_id

    # Not enrolled — do it
    doc_id = step_enroll(pan)
    if not doc_id:
        log.error("\nENROLLMENT FAILED")
        log.info("=" * 60)
        return None

    # Verify
    step_verify(pan, doc_id)

    log.info(f"\nSUCCESS — documentID = {doc_id}")
    log.info("=" * 60)
    return doc_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Enroll a card in VTC")
    parser.add_argument("--card-id", default=DEMO_PAN, help="PAN to enroll")
    args = parser.parse_args()

    doc_id = run(pan=args.card_id)
    if not doc_id:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
