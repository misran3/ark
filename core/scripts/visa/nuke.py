"""
Nuke Script — Nuclear Reset for VTC.

Completely wipes all VTC state for the demo card:
  1. DELETE all rules from the document
  2. DELETE (unenroll) the card document
  3. DELETE the customer profile

Safety: requires --confirm flag.  Without it, does a dry-run showing
what WOULD be deleted.

Usage:
    cd core/scripts/visa

    # Dry run — see what would be nuked:
    python -m nuke

    # Delete rules only (keep card enrolled):
    python -m nuke --rules-only --confirm

    # Full nuclear reset:
    python -m nuke --confirm

    # Custom IDs:
    python -m nuke --doc-id <ID> --user-id <GUID> --confirm
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

from _client import vtc_request, setup_logging, pretty
from _constants import DEMO_DOC_ID, DEMO_PAN, DEMO_USER_ID

log = setup_logging("nuke")


def _rules_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"


def _card_path(doc_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}"


def _profile_path(user_id: str) -> str:
    return f"/vctc/customerrules/v1/consumertransactioncontrols/customer/{user_id}"


# ── Reconnaissance ──────────────────────────────────────────────────────────

def recon(doc_id: str, user_id: str) -> dict:
    """Survey what currently exists before nuking."""
    log.info("--- Reconnaissance ---")
    state: dict = {"rules": None, "card": None, "profile": None}

    # Check rules
    resp = vtc_request("GET", _rules_path(doc_id), label="Recon-Rules")
    if resp.ok:
        r = resp.resource
        gc = len(r.get("globalControls", []))
        mc = len(r.get("merchantControls", []))
        tc = len(r.get("transactionControls", []))
        state["rules"] = {"global": gc, "merchant": mc, "transaction": tc, "total": gc + mc + tc}
        log.info(f"  Rules: {gc} global, {mc} merchant, {tc} transaction")
    else:
        log.info(f"  Rules: none found (or doc not accessible)")

    # Check card enrollment
    resp = vtc_request(
        "POST",
        "/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry",
        {"primaryAccountNumber": DEMO_PAN},
        label="Recon-CardInquiry",
    )
    if resp.ok and resp.resource.get("documentID"):
        state["card"] = resp.resource.get("documentID")
        log.info(f"  Card enrolled: documentID = {state['card']}")
    else:
        log.info(f"  Card: not enrolled (or inquiry failed)")

    # Check profile
    resp = vtc_request("GET", _profile_path(user_id), label="Recon-Profile")
    if resp.ok:
        state["profile"] = user_id
        log.info(f"  Profile exists: {user_id}")
    else:
        log.info(f"  Profile: not found (or not accessible)")

    return state


# ── Delete operations ────────────────────────────────────────────────────────

def delete_rules(doc_id: str) -> bool:
    log.info(f"[NUKE] Deleting all rules from {doc_id}")
    resp = vtc_request("DELETE", _rules_path(doc_id), label="Nuke-Rules")
    if resp.ok:
        log.info(f"  Rules DELETED")
        return True
    if resp.status == 404:
        log.info(f"  No rules to delete (404)")
        return True
    log.error(f"  Failed to delete rules: {resp.status}")
    return False


def unenroll_card(doc_id: str) -> bool:
    log.info(f"[NUKE] Unenrolling card (deleting document {doc_id})")
    resp = vtc_request("DELETE", _card_path(doc_id), label="Nuke-Card")
    if resp.ok:
        log.info(f"  Card UNENROLLED")
        return True
    if resp.status == 404:
        log.info(f"  Card not found (already unenrolled)")
        return True
    log.error(f"  Failed to unenroll card: {resp.status}")
    return False


def delete_profile(user_id: str) -> bool:
    log.info(f"[NUKE] Deleting customer profile {user_id}")
    resp = vtc_request("DELETE", _profile_path(user_id), label="Nuke-Profile")
    if resp.ok:
        log.info(f"  Profile DELETED")
        return True
    if resp.status == 404:
        log.info(f"  Profile not found (already deleted)")
        return True
    log.error(f"  Failed to delete profile: {resp.status}")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(doc_id: str, user_id: str, rules_only: bool, confirm: bool) -> bool:
    log.info("=" * 60)
    if rules_only:
        log.info("  NUKE: Delete Rules Only (keep card enrolled)")
    else:
        log.info("  NUKE: Full Nuclear Reset")
    log.info(f"  documentID: {doc_id}")
    log.info(f"  userID:     {user_id}")
    log.info("=" * 60)

    # Survey
    state = recon(doc_id, user_id)

    if not confirm:
        log.info("")
        log.info("DRY RUN — nothing deleted.  Re-run with --confirm to execute.")
        log.info("=" * 60)
        return True

    log.info("")
    log.info("--- Executing Nuke ---")

    results: list[tuple[str, bool]] = []

    # Step 1: Always delete rules
    ok = delete_rules(doc_id)
    results.append(("Delete rules", ok))

    if not rules_only:
        # Step 2: Unenroll card
        ok = unenroll_card(doc_id)
        results.append(("Unenroll card", ok))

        # Step 3: Delete profile
        ok = delete_profile(user_id)
        results.append(("Delete profile", ok))

    # Verify clean slate
    log.info("")
    log.info("--- Post-Nuke Verification ---")

    resp = vtc_request("GET", _rules_path(doc_id), label="Verify-PostNuke")
    if resp.ok:
        r = resp.resource
        total = (len(r.get("globalControls", [])) + len(r.get("merchantControls", []))
                 + len(r.get("transactionControls", [])))
        if total == 0:
            log.info(f"  Rules: clean (0 remaining)")
        else:
            log.warning(f"  Rules: {total} still present!")
    else:
        log.info(f"  Rules endpoint returned {resp.status} (expected if card unenrolled)")

    if not rules_only:
        resp = vtc_request(
            "POST",
            "/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry",
            {"primaryAccountNumber": DEMO_PAN},
            label="Verify-CardGone",
        )
        if resp.ok and resp.resource.get("documentID"):
            log.warning(f"  Card still enrolled: {resp.resource.get('documentID')}")
        else:
            log.info(f"  Card: not enrolled (clean)")

    # Summary
    log.info("")
    log.info("=" * 60)
    log.info("  NUKE SUMMARY")
    log.info("-" * 60)
    for name, ok in results:
        icon = "DONE" if ok else "FAIL"
        log.info(f"  [{icon}] {name}")
    passed = sum(ok for _, ok in results)
    log.info(f"  {passed}/{len(results)} completed")
    log.info("=" * 60)

    return all(ok for _, ok in results)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Nuclear reset — wipe all VTC state for the demo card",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m nuke                        # Dry run
  python -m nuke --confirm              # Full nuke
  python -m nuke --rules-only --confirm # Rules only
""",
    )
    parser.add_argument("--doc-id", default=DEMO_DOC_ID, help="VTC document ID to nuke")
    parser.add_argument("--user-id", default=DEMO_USER_ID, help="Customer profile user ID")
    parser.add_argument("--rules-only", action="store_true", help="Only delete rules (keep card enrolled)")
    parser.add_argument("--confirm", action="store_true", help="Actually execute the nuke (without this, dry-run only)")
    args = parser.parse_args()

    success = run(
        doc_id=args.doc_id,
        user_id=args.user_id,
        rules_only=args.rules_only,
        confirm=args.confirm,
    )
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
