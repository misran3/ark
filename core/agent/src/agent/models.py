"""
Models for Captain Nova agent.
"""

from typing import Literal

from pydantic import BaseModel

from shared.models import VisaControlRule


class QueryRequest(BaseModel):
    """Request to Captain Nova."""

    type: Literal[
        "bridge_briefing",
        "budget_scan",
        "threat_report",
        "savings_eta",
        "activate_shield",
        "custom",
    ]
    message: str = ""


class CaptainDeps(BaseModel):
    """Dependencies injected into Captain Nova agent via RunContext."""

    user_id: str = "demo_user"
    query_type: str = "custom"
    query_message: str = ""

    # This field is set dynamically if a Bedrock parallel tool call error occurs, to trigger the instruction callback to include an error message in the prompt for the next retry.
    parallel_tool_call_error: str = ""


class CaptainOutput(BaseModel):
    """Raw output from Captain Nova agent."""

    message: str
    suggested_visa_controls: list[VisaControlRule] | None = None
