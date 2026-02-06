import os

def validate_aws_credentials():
    """
    Validates if AWS credentials are set in the environment variables.
    """
    if not os.getenv('AWS_REGION'):
        raise ValueError("AWS_REGION environment variable is not set.")
    
    environment = os.getenv('ENVIRONMENT', 'local')
    if environment == 'dev' or environment == 'prod':
        # IAM roles should be used in dev and prod environments, so we skip the check for AWS credentials.
        pass

    if os.getenv('AWS_PROFILE'):
        return
    
    if all(var in os.environ for var in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN")):
        return
    
    if all(var in os.environ for var in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY")):
        return

    raise ValueError("AWS credentials are not set. Please set AWS_PROFILE or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (and optionally AWS_SESSION_TOKEN) environment variables.")
