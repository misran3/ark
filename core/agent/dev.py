from src.agent.agent import my_agent
from src.agent.models import AgentContext, AgentResponse
import asyncio

async def run_agent():
    return await my_agent.run(
        user_prompt="Tell me a joke about chickens",
        deps=AgentContext(context="Chickens are often found on farms and are known for laying eggs"),
    )

def main():
    agent_run_result = asyncio.run(run_agent())
    agent_response = agent_run_result.output
    if isinstance(agent_response, AgentResponse):
        print(agent_response.response)
    else:
        print("Unexpected response type:", type(agent_response))

if __name__ == "__main__":
    main()
