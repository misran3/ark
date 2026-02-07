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
from .orchestrator import analyze_finances
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
    "CaptainAnalysis",
    "SpecialistDeps",
    # Specialist outputs
    "FinancialMeaningOutput",
    "AsteroidAnalysis",
    "IonStormAnalysis",
    "SolarFlareAnalysis",
    "BlackHoleAnalysis",
    "WormholeAnalysis",
    "EnemyCruiserAnalysis",
]
