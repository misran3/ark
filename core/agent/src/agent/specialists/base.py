"""
Specialist agent factory and runner.

Every specialist agent is created via create_specialist() and executed
via run_specialist(). The factory handles model config, data injection,
and output typing. The runner handles execution and error fallback.
"""

import os
from typing import TypeVar

import boto3
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext, Tool, ToolOutput
from pydantic_ai.models.bedrock import BedrockConverseModel
from pydantic_ai.providers.bedrock import BedrockProvider

from ..models import SpecialistDeps

# Shared Bedrock client and Haiku model for all specialists
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
HAIKU_MODEL_ID = os.environ.get(
    "HAIKU_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0"
)

_bedrock_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)
haiku_model = BedrockConverseModel(
    HAIKU_MODEL_ID,
    provider=BedrockProvider(bedrock_client=_bedrock_client),
)

TOutput = TypeVar("TOutput", bound=BaseModel)


def create_specialist(
    name: str,
    system_prompt: str,
    output_type: type[TOutput],
    tools: list[Tool] | None = None,
) -> Agent[SpecialistDeps, TOutput]:
    """Factory for creating specialist agents.

    Args:
        name: Specialist name (for logging).
        system_prompt: Focused analysis instructions.
        output_type: Pydantic model for structured output.
        tools: Optional list of calculation tools.
    """
    agent = Agent[SpecialistDeps, TOutput](
        model=haiku_model,
        system_prompt=system_prompt,
        output_type=ToolOutput(output_type),
        deps_type=SpecialistDeps,
        tools=tools or [],
    )

    @agent.instructions
    def inject_data(ctx: RunContext[SpecialistDeps]) -> str:
        return f"Financial data for analysis:\n{ctx.deps.financial_data}"

    return agent


async def run_specialist(
    agent: Agent[SpecialistDeps, TOutput],
    deps: SpecialistDeps,
) -> TOutput:
    """Run a specialist and extract its typed output."""
    result = await agent.run("Analyze the provided financial data.", deps=deps)
    return result.output


async def safe_run_specialist(
    agent: Agent[SpecialistDeps, TOutput],
    deps: SpecialistDeps,
    fallback: TOutput,
) -> TOutput:
    """Run specialist with fallback on failure."""
    try:
        return await run_specialist(agent, deps)
    except Exception:
        return fallback
