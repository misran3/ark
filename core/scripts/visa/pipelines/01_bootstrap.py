"""
Pipeline 01 — Bootstrap Program Admin Configuration.

One-time setup that enables rule categories, transaction type controls,
and configures the notification callback URL.

Idempotent: safe to run multiple times.

Usage:
    cd core/scripts/visa
    python -m pipelines.01_bootstrap [--callback-url URL]
"""

from __future__ import annotations

import argparse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty
from _constants import ALL_TCT_TYPES

log = setup_logging("01_bootstrap")

STEPS_TOTAL = 3


# ── Step 1: Enable rule categories ──────────────────────────────────────────

def step_enable_rule_categories() -> bool:
    """POST /vctc/programadmin/v1/sponsors/configuration"""
    log.info(f"[STEP 1/{STEPS_TOTAL}] Enable rule categories (PCT_GLOBAL, PCT_TRANSACTION, PCT_MERCHANT)")

    resp = vtc_request(
        "POST",
        "/vctc/programadmin/v1/sponsors/configuration",
        {"ruleCategories": ["PCT_GLOBAL", "PCT_TRANSACTION", "PCT_MERCHANT"]},
        label="EnableRuleCategories",
    )

    if resp.ok or resp.conflict:
        log.info(f"  Rule categories configured (or already set)")
        return True
    log.error(f"  Failed to configure rule categories")
    return False


# ── Step 2: Enable transaction type controls ─────────────────────────────────

def step_enable_transaction_types() -> bool:
    """POST /vctc/programadmin/v1/configuration/transactiontypecontrols"""
    log.info(f"[STEP 2/{STEPS_TOTAL}] Enable transaction type controls")
    log.info(f"  Types: {ALL_TCT_TYPES}")

    resp = vtc_request(
        "POST",
        "/vctc/programadmin/v1/configuration/transactiontypecontrols",
        {"transactionTypeRules": ALL_TCT_TYPES},
        label="EnableTCTs",
    )

    if resp.ok or resp.conflict:
        log.info(f"  Transaction type controls enabled (or already set)")
        return True
    log.error(f"  Failed to enable transaction type controls")
    return False


# ── Step 3: Configure notification callback ──────────────────────────────────

def step_configure_callback(callback_url: str) -> bool:
    """PUT /vctc/customerrules/v1/applications/configuration"""
    log.info(f"[STEP 3/{STEPS_TOTAL}] Configure notification callback")
    log.info(f"  Callback URL: {callback_url}")

    resp = vtc_request(
        "PUT",
        "/vctc/customerrules/v1/applications/configuration",
        {
            "callBackSettings": {
                "callBackEndpoint": callback_url,
                "isCallBackDisabled": False,
                "isCallBackEndpointLocal": False,
            }
        },
        label="ConfigureCallback",
    )

    if resp.ok or resp.conflict:
        log.info(f"  Notification callback configured")
        return True
    log.error(f"  Failed to configure notification callback")
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def run(callback_url: str = "https://your-api.example.com/vtc/notifications") -> bool:
    log.info("=" * 60)
    log.info("PIPELINE: Bootstrap Program Admin Configuration")
    log.info("=" * 60)

    results = [
        step_enable_rule_categories(),
        step_enable_transaction_types(),
        step_configure_callback(callback_url),
    ]

    passed = sum(results)
    failed = len(results) - passed

    log.info("")
    log.info(f"RESULTS: {passed}/{len(results)} passed, {failed} failed")
    log.info("=" * 60)
    return all(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap VTC program admin config")
    parser.add_argument(
        "--callback-url",
        default="https://your-api.example.com/vtc/notifications",
        help="Notification callback URL for VTC alerts",
    )
    args = parser.parse_args()

    success = run(callback_url=args.callback_url)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
