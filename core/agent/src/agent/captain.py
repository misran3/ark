"""
Captain Nova - AI Financial Advisor Agent

This module defines the Captain Nova agent using Pydantic AI with AWS Bedrock.
Captain Nova analyzes financial data and provides personalized recommendations
using space-themed metaphors.
"""

import os

import boto3
import logfire
from pydantic_ai import Agent, RunContext, Tool, ToolOutput, capture_run_messages
from pydantic_ai.models.bedrock import BedrockConverseModel
from pydantic_ai.providers.bedrock import BedrockProvider
from pydantic_ai.exceptions import ModelHTTPError

# Maximum retries for Bedrock parallel tool call errors
MAX_BEDROCK_RETRIES = 2

from shared.models import CaptainResponse, VisaControlRule
from shared.utils import validate_aws_credentials

from .models import CaptainDeps, CaptainOutput, QueryRequest
from .prompts import QUERY_PROMPTS, SYSTEM_PROMPT
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

if os.getenv('ENVIRONMENT') == 'local':
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
        Tool(get_financial_snapshot, name="get_financial_snapshot"),
        Tool(get_budget_report, name="get_budget_report"),
        Tool(get_active_threats, name="get_active_threats"),
        Tool(get_spending_by_category, name="get_spending_by_category"),
        Tool(get_savings_projection, name="get_savings_projection"),
        Tool(get_active_visa_controls, name="get_active_visa_controls"),
        Tool(recommend_visa_control, name="recommend_visa_control"),
        Tool(activate_visa_control, name="activate_visa_control"),
    ],
)


@captain_nova.instructions
def build_query_instructions(ctx: RunContext[CaptainDeps]) -> str:
    """Build query-specific instructions from RunContext dependencies.

    This instruction callback constructs the user prompt dynamically
    based on the query type and message stored in ctx.deps, allowing
    full access to RunContext during prompt construction.
    """
    query_type = ctx.deps.query_type
    message = ctx.deps.query_message

    base_prompt = QUERY_PROMPTS.get(query_type, "")

    if query_type == "custom" and message:
        return message

    if message:
        return f"{base_prompt}\n\nAdditional context from commander: {message}"

    return base_prompt

@captain_nova.instructions
def check_parallel_tool_call_error(ctx: RunContext[CaptainDeps]) -> str | None:
    if ctx.deps.parallel_tool_call_error:
        return f"Note: Previous attempt failed with error: {ctx.deps.parallel_tool_call_error}\nPlease retry the request with correct invocation of tools."


async def run_captain_nova(request: QueryRequest, user_id: str = "demo_user") -> CaptainResponse:
    """Run Captain Nova with a query request.

    Args:
        request: The query request with type and optional message
        user_id: The user ID for context

    Returns:
        CaptainResponse with message, tools used, and optional VISA suggestions
    """
    deps = CaptainDeps(
        user_id=user_id,
        query_type=request.type,
        query_message=request.message,
    )

    # Manual retry loop for Bedrock parallel tool call errors
    # ModelRetry only works inside tools/validators, not outside agent.run()
    result = None

    for attempt in range(MAX_BEDROCK_RETRIES + 1):
        try:
            with capture_run_messages() as all_messages:
                result = await captain_nova.run("Process the commander's request.", deps=deps)
                break  # Success - exit retry loop
        except ModelHTTPError:
            last_message = all_messages[-1] if all_messages else None

            # Check if this is the Bedrock parallel tool call bug
            is_parallel_tool_bug = (
                hasattr(last_message, "parts")
                and len(last_message.parts) > 0
                and hasattr(last_message.parts[-1], "content")
                and last_message.parts[-1].content.startswith("Unknown tool name")
            )

            if is_parallel_tool_bug and attempt < MAX_BEDROCK_RETRIES:
                print("=" * 60)
                print(f"Bedrock parallel tool call error, retrying (attempt {attempt + 1}/{MAX_BEDROCK_RETRIES})...")
                print("=" * 60)
                deps.parallel_tool_call_error = f"Attempt {attempt + 1} of {MAX_BEDROCK_RETRIES} due to Bedrock parallel tool call error."
                continue  # Retry the agent.run() call
            else:
                # Either not the parallel tool bug or max retries exceeded
                raise

    if result is None or result.output is None:
        return CaptainResponse(
            message="Captain Nova was unable to process the request.",
            tools_used=[],
            confidence=0.0,
            suggested_visa_controls=None,
        )

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
