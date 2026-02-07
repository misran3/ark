"""
Mapping functions to convert specialist analysis outputs into VTC rule payloads.

Each specialist has its own converter that generates the appropriate VTC rules:
- Fraud (Enemy Cruiser) → global freeze or strict limits
- Debt (Black Hole) → monthly spend ceiling
- Budget (Ion Storm) → per-category merchant controls
- Subscriptions (Asteroid) → auto-pay monitoring + optional gambling block
- Rewards (Wormhole) → alert-only merchant controls
- Bills (Solar Flare) → auto-pay awareness
"""

from __future__ import annotations

from typing import Any

from ..models import (
    AsteroidAnalysis,
    BlackHoleAnalysis,
    EnemyCruiserAnalysis,
    IonStormAnalysis,
    SolarFlareAnalysis,
    WormholeAnalysis,
)
from .constants import CATEGORY_TO_MCT, DEMO_USER_ID

UserPrefs = dict[str, Any]


def map_fraud_to_vtc(analysis: EnemyCruiserAnalysis, prefs: UserPrefs) -> dict:
    """
    Enemy Cruiser → global freeze if critical.

    - Critical risk: total card freeze (shouldDeclineAll=true)
    - Elevated risk: strict per-transaction and alert thresholds
    - Normal risk: no rules
    """
    if not prefs.get("fraud_freeze_enabled", True):
        return {}

    if analysis.overall_risk == "critical":
        return {
            "globalControls": [
                {
                    "isControlEnabled": True,
                    "shouldDeclineAll": True,  # Total card freeze
                    "shouldAlertOnDecline": True,
                    "userIdentifier": DEMO_USER_ID,
                }
            ]
        }
    elif analysis.overall_risk == "elevated":
        return {
            "globalControls": [
                {
                    "isControlEnabled": True,
                    "shouldDeclineAll": False,
                    "declineThreshold": 200.0,
                    "alertThreshold": 50.0,
                    "shouldAlertOnDecline": True,
                    "userIdentifier": DEMO_USER_ID,
                }
            ]
        }
    return {}


def map_debt_to_vtc(analysis: BlackHoleAnalysis, prefs: UserPrefs) -> dict:
    """
    Black Hole → global monthly spend ceiling.

    Sets overall monthly spending limit based on income and urgency level.
    """
    if analysis.urgency not in ["critical", "warning"]:
        return {}

    monthly_income = prefs.get("monthly_income", 5500.0)
    ceiling_pct = 0.7 if analysis.urgency == "critical" else 0.85
    monthly_limit = monthly_income * ceiling_pct
    per_txn_limit = 250.0 if analysis.urgency == "critical" else 500.0

    return {
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "declineThreshold": per_txn_limit,
                "alertThreshold": per_txn_limit * 0.5,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
                "spendLimit": {
                    "type": "LMT_MONTH",
                    "declineThreshold": monthly_limit,
                    "alertThreshold": monthly_limit * 0.8,
                    "currentPeriodSpend": 0,
                    "timeZoneID": "America/New_York",
                },
            }
        ]
    }


def map_budget_to_vtc(analysis: IonStormAnalysis, prefs: UserPrefs) -> dict:
    """
    Ion Storm → per-category merchant controls.

    For each overrun category, create a merchant control with spending limits.
    """
    controls = []
    for overrun in analysis.overruns:
        mct = CATEGORY_TO_MCT.get(overrun.category.lower())
        if not mct:
            continue

        controls.append(
            {
                "controlType": mct,
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "declineThreshold": overrun.budget_amount,
                "alertThreshold": overrun.budget_amount * 0.8,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
                "spendLimit": {
                    "type": "LMT_MONTH",
                    "declineThreshold": overrun.budget_amount,
                    "alertThreshold": overrun.budget_amount * 0.8,
                    "currentPeriodSpend": 0,
                    "timeZoneID": "America/New_York",
                },
            }
        )

    return {"merchantControls": controls} if controls else {}


def map_subscriptions_to_vtc(analysis: AsteroidAnalysis, prefs: UserPrefs) -> dict:
    """
    Asteroid → TCT_AUTO_PAY alert monitoring + optional hard blocks.

    - Enable auto-pay monitoring if wasteful subs exist
    - Hard block gambling if enabled in prefs
    """
    result = {}

    # Enable auto-pay monitoring if wasteful subs exist
    if analysis.subscriptions:
        result["transactionControls"] = [
            {
                "controlType": "TCT_AUTO_PAY",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 0.01,  # Alert on every recurring charge
                "shouldAlertOnDecline": False,
                "userIdentifier": DEMO_USER_ID,
            }
        ]

    # Hard block gambling if enabled in prefs
    if prefs.get("gambling_block"):
        merchant_controls = result.get("merchantControls", [])
        merchant_controls.append(
            {
                "controlType": "MCT_GAMBLING",
                "isControlEnabled": True,
                "shouldDeclineAll": True,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        )
        result["merchantControls"] = merchant_controls

    # Cross-border block if enabled
    if prefs.get("cross_border_block"):
        transaction_controls = result.get("transactionControls", [])
        transaction_controls.append(
            {
                "controlType": "TCT_CROSS_BORDER",
                "isControlEnabled": True,
                "shouldDeclineAll": True,
                "shouldAlertOnDecline": True,
                "userIdentifier": DEMO_USER_ID,
            }
        )
        result["transactionControls"] = transaction_controls

    return result


def map_rewards_to_vtc(analysis: WormholeAnalysis, prefs: UserPrefs) -> dict:
    """
    Wormhole → alert-only merchant controls for reward optimization.

    Create merchant controls that alert on every transaction but don't decline,
    so users can be reminded to use their optimal card.
    """
    controls = []
    for reward in analysis.missed_rewards:
        mct = CATEGORY_TO_MCT.get(reward.category.lower())
        if not mct:
            continue

        controls.append(
            {
                "controlType": mct,
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 0.01,  # Alert on every transaction
                "shouldAlertOnDecline": False,
                "userIdentifier": DEMO_USER_ID,
            }
        )

    return {"merchantControls": controls} if controls else {}


def map_bills_to_vtc(analysis: SolarFlareAnalysis, prefs: UserPrefs) -> dict:
    """
    Solar Flare → TCT_AUTO_PAY awareness.

    Enable auto-pay monitoring if upcoming bills exist.
    """
    if not analysis.bills:
        return {}

    return {
        "transactionControls": [
            {
                "controlType": "TCT_AUTO_PAY",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "alertThreshold": 0.01,
                "shouldAlertOnDecline": False,
                "userIdentifier": DEMO_USER_ID,
            }
        ]
    }
