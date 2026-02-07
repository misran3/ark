"""
VTC rule assembly and enforcement logic.

Combines specialist outputs into a single VTC rules payload, resolves conflicts,
and applies rules to the Visa card via the VTC API.
"""

from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger

from ..models import CaptainAnalysis
from .client import VTCClient
from .constants import DEMO_DOC_ID
from .mapping import (
    map_bills_to_vtc,
    map_budget_to_vtc,
    map_debt_to_vtc,
    map_fraud_to_vtc,
    map_rewards_to_vtc,
    map_subscriptions_to_vtc,
)

logger = Logger(service="VTCEnforcement")

UserPrefs = dict[str, Any]

DEFAULT_PREFS: UserPrefs = {
    "fraud_freeze_enabled": True,
    "gambling_block": True,
    "cross_border_block": False,
    "monthly_income": 5500.0,
}


def _is_freeze(rules: dict) -> bool:
    """Check if rules represent total card freeze."""
    gc = rules.get("globalControls", [])
    return bool(gc and gc[0].get("shouldDeclineAll", False))


def _merge_rules(rule_sets: list[dict]) -> dict:
    """
    Merge multiple rule dicts with priority resolution.

    Rules follow first-writer-wins for conflicts:
    - Global controls: first writer wins
    - Merchant controls: dedupe by controlType, first wins
    - Transaction controls: dedupe by controlType, first wins
    """
    merged_global = []
    merged_merchant = {}  # keyed by controlType
    merged_transaction = {}  # keyed by controlType

    for rule_set in rule_sets:
        # Global: first writer wins
        if not merged_global and rule_set.get("globalControls"):
            merged_global = rule_set["globalControls"]

        # Merchant: dedupe by controlType, first wins
        for mc in rule_set.get("merchantControls", []):
            ct = mc["controlType"]
            if ct not in merged_merchant:
                merged_merchant[ct] = mc

        # Transaction: dedupe by controlType, first wins
        for tc in rule_set.get("transactionControls", []):
            ct = tc["controlType"]
            if ct not in merged_transaction:
                merged_transaction[ct] = tc

    result = {}
    if merged_global:
        result["globalControls"] = merged_global
    if merged_merchant:
        result["merchantControls"] = list(merged_merchant.values())
    if merged_transaction:
        result["transactionControls"] = list(merged_transaction.values())

    return result


def assemble_vtc_rules(analysis: CaptainAnalysis, user_prefs: UserPrefs | None = None) -> dict:
    """
    Convert CaptainAnalysis into single VTC rules payload.

    Priority order (highest first):
    1. Fraud freeze (short-circuits if critical)
    2. Debt ceiling
    3. Budget overruns
    4. Subscription monitoring
    5. Reward optimization
    6. Bill awareness
    """
    prefs = user_prefs or DEFAULT_PREFS

    # Priority order (highest first)
    fraud_rules = map_fraud_to_vtc(analysis.fraud_alerts, prefs)

    # Short-circuit if fraud freeze
    if _is_freeze(fraud_rules):
        logger.info("Fraud freeze activated - blocking all transactions")
        return fraud_rules

    debt_rules = map_debt_to_vtc(analysis.debt_spirals, prefs)
    budget_rules = map_budget_to_vtc(analysis.budget_overruns, prefs)
    sub_rules = map_subscriptions_to_vtc(analysis.wasteful_subscriptions, prefs)
    reward_rules = map_rewards_to_vtc(analysis.missed_rewards, prefs)
    bill_rules = map_bills_to_vtc(analysis.upcoming_bills, prefs)

    return _merge_rules([fraud_rules, debt_rules, budget_rules, sub_rules, reward_rules, bill_rules])


async def enforce_on_cold_boot(
    analysis: CaptainAnalysis,
    doc_id: str = DEMO_DOC_ID,
    user_prefs: UserPrefs | None = None,
    dry_run: bool = False,
) -> dict:
    """
    Assemble rules and PUT to VTC API.

    Returns enforcement result with:
    - rules: assembled VTC payload
    - response: API response (status, ok)
    - action: "freeze", "enforce", or "no_rules"
    """
    rules = assemble_vtc_rules(analysis, user_prefs)

    if not rules:
        logger.info("No VTC rules to enforce")
        return {"rules": {}, "response": None, "action": "no_rules"}

    action = "freeze" if _is_freeze(rules) else "enforce"

    if dry_run:
        logger.info(f"Dry-run VTC enforcement: {action}", rules=rules)
        return {"rules": rules, "response": None, "action": action}

    client = VTCClient()
    try:
        response = await client.put_rules(doc_id, rules)
        logger.info(f"VTC enforcement completed: {action}", status=response.status, ok=response.ok)
        return {
            "rules": rules,
            "response": {"status": response.status, "ok": response.ok},
            "action": action,
        }
    finally:
        await client.close()
