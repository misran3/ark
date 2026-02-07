"""
Captain Nova - AI Financial Advisor Agent

This module defines the Captain Nova agent using Pydantic AI with AWS Bedrock.
Captain Nova analyzes financial data and provides personalized recommendations
using space-themed metaphors.
"""

import os

import boto3
import logfire
from pydantic_ai import Agent, Tool, ToolOutput
from pydantic_ai.models.bedrock import BedrockConverseModel
from pydantic_ai.providers.bedrock import BedrockProvider

from shared.models import CaptainResponse, VisaControlRule
from shared.utils import validate_aws_credentials

from .models import CaptainDeps, CaptainOutput, QueryRequest
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .tools import (
    activate_visa_control,
    get_active_threats,
    get_active_visa_controls,
    get_budget_report,
    get_financial_snapshot,
    get_savings_projection,
    get_spending_by_category,
    recommend_visa_control,
)

validate_aws_credentials()

logfire.configure()
logfire.instrument_pydantic_ai()

# Initialize Bedrock client
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
)

# Create boto3 client for Bedrock
bedrock_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)

# Initialize the Bedrock model with provider
bedrock_model = BedrockConverseModel(
    BEDROCK_MODEL_ID,
    provider=BedrockProvider(bedrock_client=bedrock_client),
)

# Create the Captain Nova agent with tools wrapped in Tool instances
captain_nova = Agent[CaptainDeps, CaptainOutput](
    model=bedrock_model,
    system_prompt=SYSTEM_PROMPT,
    output_type=ToolOutput(CaptainOutput),
    deps_type=CaptainDeps,
    tools=[
        Tool(get_financial_snapshot),
        Tool(get_budget_report),
        Tool(get_active_threats),
        Tool(get_spending_by_category),
        Tool(get_savings_projection),
        Tool(get_active_visa_controls),
        Tool(recommend_visa_control),
        Tool(activate_visa_control),
    ],
)


async def run_captain_nova(request: QueryRequest, user_id: str = "demo_user") -> CaptainResponse:
    """Run Captain Nova with a query request.

    Args:
        request: The query request with type and optional message
        user_id: The user ID for context

    Returns:
        CaptainResponse with message, tools used, and optional VISA suggestions
    """
    user_prompt = build_user_prompt(request.type, request.message)
    deps = CaptainDeps(user_id=user_id)

    result = await captain_nova.run(user_prompt, deps=deps)

    # Extract tools used from the result
    tools_used: list[str] = []
    for message in result.all_messages():
        if hasattr(message, "parts"):
            for part in message.parts:
                if hasattr(part, "tool_name"):
                    if part.tool_name not in tools_used:
                        tools_used.append(part.tool_name)

    # Extract VISA suggestions from output
    suggested_controls: list[VisaControlRule] | None = None
    if result.output and result.output.suggested_visa_controls:
        suggested_controls = result.output.suggested_visa_controls

    return CaptainResponse(
        message=result.output.message if result.output else "Unable to process request.",
        tools_used=tools_used,
        confidence=1.0,
        suggested_visa_controls=suggested_controls,
    )
