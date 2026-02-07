"""
Captain Nova Agent Package

This package provides the Captain Nova AI financial advisor agent.
"""

from .captain import captain_nova, run_captain_nova
from .models import (
    CaptainAnalysis,
    CaptainDeps,
    CaptainOutput,
    FinancialMeaningOutput,
    AsteroidAnalysis,
    IonStormAnalysis,
    SolarFlareAnalysis,
    BlackHoleAnalysis,
    WormholeAnalysis,
    EnemyCruiserAnalysis,
    QueryRequest,
    SpecialistDeps,
)
from .orchestrator import (
    analyze_finances,
    fetch_all_financial_data,
    slice_financial_meaning,
    slice_wasteful_subscriptions,
    slice_budget_overruns,
    slice_upcoming_bills,
    slice_debt_spirals,
    slice_missed_rewards,
    slice_fraud_detection,
    FM_FALLBACK,
    WS_FALLBACK,
    BO_FALLBACK,
    UB_FALLBACK,
    DS_FALLBACK,
    MR_FALLBACK,
    FD_FALLBACK,
)
from .prompts import SYSTEM_PROMPT, build_user_prompt

__all__ = [
    # Legacy conversational agent
    "captain_nova",
    "run_captain_nova",
    "CaptainDeps",
    "CaptainOutput",
    "QueryRequest",
    "SYSTEM_PROMPT",
    "build_user_prompt",
    # Multi-agent orchestrator
    "analyze_finances",
    "fetch_all_financial_data",
    "CaptainAnalysis",
    "SpecialistDeps",
    # Slice functions
    "slice_financial_meaning",
    "slice_wasteful_subscriptions",
    "slice_budget_overruns",
    "slice_upcoming_bills",
    "slice_debt_spirals",
    "slice_missed_rewards",
    "slice_fraud_detection",
    # Fallback constants
    "FM_FALLBACK",
    "WS_FALLBACK",
    "BO_FALLBACK",
    "UB_FALLBACK",
    "DS_FALLBACK",
    "MR_FALLBACK",
    "FD_FALLBACK",
    # Specialist outputs
    "FinancialMeaningOutput",
    "AsteroidAnalysis",
    "IonStormAnalysis",
    "SolarFlareAnalysis",
    "BlackHoleAnalysis",
    "WormholeAnalysis",
    "EnemyCruiserAnalysis",
]
