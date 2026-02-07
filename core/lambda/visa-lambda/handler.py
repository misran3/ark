"""
VISA Transaction Controls Lambda Handler.
"""

import os
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger(service="VisaLambdaHandler")
tracer = Tracer()

cors_config = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors_config)

_visa_service = None


def _get_visa_service():
    global _visa_service
    if _visa_service is None:
        from services.visa_service import VisaService
        _visa_service = VisaService()
    return _visa_service


def _get_user_id() -> str:
    """Extract user ID from Cognito JWT claims."""
    try:
        claims = app.current_event.request_context.authorizer
        if claims and hasattr(claims, "claims"):
            return claims.claims.get("sub", "demo_user")
        if isinstance(claims, dict):
            return claims.get("claims", {}).get("sub", "demo_user")
    except (AttributeError, KeyError, TypeError):
        pass
    return "demo_user"


@app.get("/api/visa/health")
@tracer.capture_method
def health_check():
    """Health check endpoint - no auth required."""
    return {"status": "ok", "service": "visa-controls"}


@app.post("/api/visa/controls")
@tracer.capture_method
def create_visa_control() -> dict[str, Any]:
    """Create a new VISA transaction control."""
    user_id = _get_user_id()
    logger.info("Create VISA control endpoint called", user_id=user_id)

    from shared.models import VisaControlRule

    body = app.current_event.json_body or {}
    try:
        rule = VisaControlRule(**body)
        visa = _get_visa_service()
        result = visa.create_control(rule)
        return result
    except Exception as e:
        logger.error(f"Failed to create VISA control: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.get("/api/visa/controls/<document_id>")
@tracer.capture_method
def get_visa_control(document_id: str) -> dict[str, Any]:
    """Get a VISA transaction control by document ID."""
    user_id = _get_user_id()
    logger.info("Get VISA control endpoint called", user_id=user_id, document_id=document_id)

    try:
        visa = _get_visa_service()
        result = visa.get_controls(document_id)
        return result
    except Exception as e:
        logger.error(f"Failed to get VISA control: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.delete("/api/visa/controls/<document_id>")
@tracer.capture_method
def delete_visa_control(document_id: str) -> dict[str, Any]:
    """Delete a VISA transaction control."""
    user_id = _get_user_id()
    logger.info("Delete VISA control endpoint called", user_id=user_id, document_id=document_id)

    try:
        visa = _get_visa_service()
        result = visa.delete_control(document_id)
        return result
    except Exception as e:
        logger.error(f"Failed to delete VISA control: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.get("/api/visa/rules/<document_id>")
@tracer.capture_method
def get_visa_rules(document_id: str) -> dict[str, Any]:
    """Get all VTC rules for a document."""
    user_id = _get_user_id()
    logger.info("Get rules endpoint called", document_id=document_id)
    try:
        visa = _get_visa_service()
        result = visa.get_rules(document_id)
        return result
    except Exception as e:
        logger.error(f"Failed to get rules: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.put("/api/visa/rules/<document_id>")
@tracer.capture_method
def update_visa_rules(document_id: str) -> dict[str, Any]:
    """Update all VTC rules for a document."""
    user_id = _get_user_id()
    logger.info("Update rules endpoint called", document_id=document_id)
    try:
        body = app.current_event.json_body or {}
        visa = _get_visa_service()
        result = visa.put_rules(document_id, body)
        return result
    except Exception as e:
        logger.error(f"Failed to update rules: {e}")
        return {"status": "error", "error": str(e)}, 400


@app.post("/api/visa/notifications")
@tracer.capture_method
def vtc_notification_callback() -> dict[str, Any]:
    """Handle VTC notification callback from Visa."""
    logger.info("VTC notification received")
    try:
        payload = app.current_event.json_body or {}

        # Extract key info
        details = payload.get("transactionDetails", {})
        outcome = payload.get("transactionOutcome", {})

        notification = {
            "merchant": details.get("merchantInfo", {}).get("name", "Unknown"),
            "amount": details.get("cardholderBillAmount"),
            "approved": outcome.get("transactionApproved"),
            "reason": (outcome.get("alertDetails", [{}])[0]).get("alertReason"),
            "rule_type": (outcome.get("alertDetails", [{}])[0]).get("ruleType"),
            "timestamp": details.get("requestReceivedTimeStamp"),
        }

        logger.info("VTC notification processed", notification=notification)

        # TODO: Store to DynamoDB, push to WebSocket, send SMS, etc.

        return {"status": "received"}
    except Exception as e:
        logger.exception(f"Error processing VTC notification: {e}")
        return {"status": "error", "error": str(e)}, 500


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict[str, Any]:
    """Main Lambda handler function."""
    return app.resolve(event, context)
