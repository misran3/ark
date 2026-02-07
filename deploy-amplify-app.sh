#!/usr/bin/env bash

# This script deploys the web app to AWS Amplify.

set -e

# Config
APP_NAME="Snatched"
AMPLIFY_STACK_NAME="${APP_NAME}AmplifyStack"
AUTH_STACK_NAME="${APP_NAME}AuthStack"
API_STACK_NAME="${APP_NAME}ApiStack"
FRONTEND_DIR="./web"
ENV_FILE="$FRONTEND_DIR/.env"

echo "Running environment checks..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI and configure it."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found. Please install Bun and configure it."
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found. Please run this script from the project root."
    exit 1
fi
echo "✅ Environment checks passed."

# Function to get stack output value
get_stack_output() {
    local stack_name=$1
    local output_key=$2
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
        --output text 2>/dev/null || echo ""
}

echo -e "\n📋 Fetching CloudFormation stack outputs..."

# Get all required outputs from CloudFormation
USER_POOL_ID=$(get_stack_output "$AUTH_STACK_NAME" "UserPoolId")
USER_POOL_CLIENT_ID=$(get_stack_output "$AUTH_STACK_NAME" "UserPoolClientId")
API_GW_BASE_URL=$(get_stack_output "$API_STACK_NAME" "ApiUrl")
AMPLIFY_APP_ID=$(get_stack_output "$AMPLIFY_STACK_NAME" "AmplifyAppId")
AMPLIFY_DOMAIN_URL=$(get_stack_output "$AMPLIFY_STACK_NAME" "AmplifyDomainUrl")

# Function to validate outputs
validate_cfn_output() {
    local output_value=$1
    local output_name=$2
    local stack_name=$3

    if [ -z "$output_value" ]; then
        echo "❌ Could not retrieve $output_name from CloudFormation stack: $stack_name"
        echo "   Make sure the stack has been deployed successfully."
        exit 1
    fi
}

# Validate required outputs
validate_cfn_output "$USER_POOL_ID" "UserPoolId" "$AUTH_STACK_NAME"
validate_cfn_output "$USER_POOL_CLIENT_ID" "UserPoolClientId" "$AUTH_STACK_NAME"
validate_cfn_output "$API_GW_BASE_URL" "ApiUrl" "$API_STACK_NAME"
validate_cfn_output "$AMPLIFY_APP_ID" "AmplifyAppId" "$AMPLIFY_STACK_NAME"
validate_cfn_output "$AMPLIFY_DOMAIN_URL" "AmplifyDomainUrl" "$AMPLIFY_STACK_NAME"

echo "✅ Retrieved stack outputs:"
echo "   Cognito User Pool ID: $USER_POOL_ID"
echo "   Cognito User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "   API Gateway Base URL: $API_GW_BASE_URL"
echo "   Amplify App ID: $AMPLIFY_APP_ID"
echo "   Amplify Domain URL: $AMPLIFY_DOMAIN_URL"

# Create .env.production file for the build
echo -e "\nUpdating environment variables in $ENV_FILE"
cat > "$ENV_FILE" << EOF
# Auto-generated production environment variables
# Generated on $(date)

NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_API_BASE_URL=$API_GW_BASE_URL
EOF

# Build the frontend
echo "🔨 Building frontend application..."
cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Build the application
echo "🏗️  Running build command..."
bun run build

# Check if build was successful
if [ ! -d "out" ]; then
    echo "❌ Build failed - out directory not found"
    exit 1
fi

# Deploy to Amplify using AWS CLI
echo "🚀 Deploying to AWS Amplify..."

# Create _redirects file for SPA support (client-side routing)
echo "📝 Creating _redirects file for SPA support..."
cat > "out/_redirects" << 'EOF'
/* /index.html 200
EOF

# Navigate into out directory and zip its contents (not the out folder itself)
cd out

# Create a deployment package
DEPLOY_PACKAGE="amplify-deploy-$(date +%Y%m%d-%H%M%S).zip"
echo "📦 Creating deployment package: $DEPLOY_PACKAGE"
zip -r "../../$DEPLOY_PACKAGE" . -x "*.DS_Store"


# Go back to project root
cd ../..

# Start the deployment
echo "📤 Uploading to Amplify App: $AMPLIFY_APP_ID"

# Create deployment and get upload URL
echo "📤 Creating deployment..."
DEPLOYMENT_RESPONSE=$(aws amplify create-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "main" \
    --output json)

JOB_ID=$(echo "$DEPLOYMENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['jobId'])")
UPLOAD_URL=$(echo "$DEPLOYMENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['zipUploadUrl'])")

if [ -z "$JOB_ID" ] || [ -z "$UPLOAD_URL" ]; then
    echo "❌ Failed to create Amplify deployment"
    echo "Response: $DEPLOYMENT_RESPONSE"
    rm -f "$DEPLOY_PACKAGE"
    exit 1
fi

echo "✅ Deployment created with Job ID: $JOB_ID"

# Upload the zip file to the presigned URL
echo "📤 Uploading deployment package..."
curl -X PUT -T "$DEPLOY_PACKAGE" "$UPLOAD_URL"

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload deployment package"
    rm -f "$DEPLOY_PACKAGE"
    exit 1
fi

echo "✅ Deployment package uploaded successfully"

# Start the deployment
echo "🚀 Starting deployment..."
aws amplify start-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "main" \
    --job-id "$JOB_ID"

if [ $? -ne 0 ]; then
    echo "❌ Failed to start deployment"
    rm -f "$DEPLOY_PACKAGE"
    exit 1
fi

echo "✅ Deployment started successfully"

# Monitor deployment status
echo "⏳ Monitoring deployment status..."
while true; do
    JOB_STATUS=$(aws amplify get-job \
        --app-id "$AMPLIFY_APP_ID" \
        --branch-name "main" \
        --job-id "$JOB_ID" \
        --query 'job.summary.status' \
        --output text)

    case $JOB_STATUS in
        "SUCCEED")
            echo "✅ Deployment completed successfully!"
            break
            ;;
        "FAILED"|"CANCELLED")
            echo "❌ Deployment failed with status: $JOB_STATUS"
            rm -f "$DEPLOY_PACKAGE"
            exit 1
            ;;
        "RUNNING"|"PENDING")
            echo "⏳ Deployment in progress... (Status: $JOB_STATUS)"
            sleep 5
            ;;
        *)
            echo "⚠️  Unknown deployment status: $JOB_STATUS"
            sleep 5
            ;;
    esac
done

# Clean up
rm -f "$DEPLOY_PACKAGE"

echo ""
echo "🎉 Frontend deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: $AMPLIFY_DOMAIN_URL"
echo "   API Gateway: $API_GW_BASE_URL"
echo ""
echo "✨ Your ${APP_NAME} is now live!"
