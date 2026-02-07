from typing import Any
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig

# Initialize Logger and Tracer
logger = Logger(service="UserLambdaHandler")
tracer = Tracer()

# Intialize REST API resolver
cors_config = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors_config)

@app.get("/users/health")
@tracer.capture_method
def health_check():
    """Health check endpoint to verify that the Lambda function is working."""
    logger.info("Health check endpoint called")
    return {"status": "ok"}

@app.post("/users")
@tracer.capture_method
def create_user() -> dict[str, Any]:
    """Endpoint to create a new user."""
    logger.info("Create user endpoint called")
    # Here you would add logic to create a user, e.g., validate input, save to database, etc.
    return {"message": "User created successfully"}

@app.get("/users")
@tracer.capture_method
def list_users() -> dict[str, Any]:
    """Endpoint to list all users."""
    logger.info("List users endpoint called")
    # Here you would add logic to retrieve a list of users from a database or other source.
    return {"users": [{"user_id": "1", "name": "John Doe", "email": "john.doe@example.com"}]}

@app.get("/users/<user_id>")
@tracer.capture_method
def get_user(user_id: str) -> dict[str, Any]:
    """Endpoint to retrieve user information by user ID."""
    logger.info(f"Get user endpoint called with user_id: {user_id}")
    # Here you would add logic to retrieve user information from a database or other source.
    return {"user_id": user_id, "name": "John Doe", "email": "john.doe@example.com"}

@app.delete("/users/<user_id>")
@tracer.capture_method
def delete_user(user_id: str) -> dict[str, Any]:
    """Endpoint to delete a user by user ID."""
    logger.info(f"Delete user endpoint called with user_id: {user_id}")
    # Here you would add logic to delete the user from a database or other source.
    return {"message": f"User with ID {user_id} deleted successfully"}

@app.put("/users/<user_id>")
@tracer.capture_method
def update_user(user_id: str) -> dict[str, Any]:
    """Endpoint to update user information by user ID."""
    logger.info(f"Update user endpoint called with user_id: {user_id}")
    # Here you would add logic to update the user's information in a database or other source.
    return {"message": f"User with ID {user_id} updated successfully"}

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict[str, Any]:
    """Main Lambda handler function."""
    return app.resolve(event, context)
