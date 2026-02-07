"""
Captain Nova Agent Package

This package provides the Captain Nova AI financial advisor agent.
"""

from .captain import captain_nova, run_captain_nova
from .models import CaptainDeps, CaptainOutput, QueryRequest
from .prompts import SYSTEM_PROMPT, build_user_prompt

__all__ = [
    "captain_nova",
    "run_captain_nova",
    "CaptainDeps",
    "CaptainOutput",
    "QueryRequest",
    "SYSTEM_PROMPT",
    "build_user_prompt",
]
