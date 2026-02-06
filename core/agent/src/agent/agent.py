from pydantic_ai import Agent, RunContext, ToolOutput
from pydantic_ai.models.bedrock import BedrockConverseModel

import os
import boto3
from shared.utils import validate_aws_credentials

from .models import AgentContext, AgentResponse

validate_aws_credentials()

session = boto3.Session(region_name=os.environ['AWS_REGION'])
bedrock_runtime_client = session.client('bedrock-runtime')

bedrock_model = BedrockConverseModel(model_name='us.anthropic.claude-sonnet-4-5-20250929-v1:0')

my_agent = Agent[AgentContext, AgentResponse](
    model=bedrock_model,
    instructions="You are a comedian. You will be a given a topic and you will respond with a joke about that topic",
    output_type=ToolOutput(AgentResponse),
)

@my_agent.instructions
def add_additional_context(ctx: RunContext[AgentContext]) -> str:
    return f"Here is some additional context about the topic: {ctx.deps.context}"

