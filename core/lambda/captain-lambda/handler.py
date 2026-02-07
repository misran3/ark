"""
Lambda handler for Captain Nova AI agent.

Exposes POST /captain/query endpoint for frontend to interact with Captain Nova.
"""

import asyncio
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from agent import QueryRequest, run_captain_nova

# Initialize Logger and Tracer
logger = Logger(service="CaptainNovaHandler")
tracer = Tracer()

# Initialize REST API resolver
app = APIGatewayRestResolver()


@app.get("/captain/health")
@tracer.capture_method
def health_check() -> dict[str, str]:
    """Health check endpoint to verify Lambda is working."""
    logger.info("Health check endpoint called")
    return {"status": "ok", "service": "captain-nova"}


@app.post("/captain/query")
@tracer.capture_method
def captain_query() -> dict[str, Any]:
    """Process a query to Captain Nova.

    Request body:
    {
        "type": "bridge_briefing" | "budget_scan" | "threat_report" |
                "savings_eta" | "activate_shield" | "custom",
        "message": "optional additional context"
    }

    Response:
    {
        "message": "Captain Nova's response",
        "tools_used": ["tool1", "tool2"],
        "confidence": 1.0,
        "suggested_visa_controls": [...]  // optional
    }
    """
    logger.info("Captain query endpoint called")

    try:
        # Parse request
        body = app.current_event.json_body
        request = QueryRequest(**body)

        msg_len = len(request.message) if request.message else 0
        logger.info(f"Query type: {request.type}, message_len: {msg_len}")

        # Run Captain Nova (async)
        response = asyncio.run(run_captain_nova(request))

        logger.info(f"Response tools used: {response.tools_used}")

        return response.model_dump()

    except Exception as e:
        logger.exception(f"Error processing captain query: {e}")
        return {
            "message": "Captain Nova encountered an error. Please try again, Commander.",
            "tools_used": [],
            "confidence": 0.0,
            "suggested_visa_controls": None,
        }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict[str, Any]:
    """Main Lambda handler function."""
    return app.resolve(event, context)
