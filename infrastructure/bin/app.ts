#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AmplifyStack } from '../lib/amplify-stack';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { StorageStack } from '../lib/storage-stack';
import { APP_NAME } from '../lib/constants';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1', // Default to us-east-1 if not set
}

const amplifyStack = new AmplifyStack(app, `${APP_NAME}AmplifyStack`, {
  env,
  description: `${APP_NAME} Amplify Stack - Hosts the frontend application`,
});

const storageStack = new StorageStack(app, `${APP_NAME}StorageStack`, {
  env,
  description: `${APP_NAME} Storage Stack - Manages DynamoDB tables and secrets for the application`,
});

const authStack = new AuthStack(app, `${APP_NAME}AuthStack`, {
  env,
  description: `${APP_NAME} Auth Stack - Manages user authentication with Cognito`,
  amplifyApp: amplifyStack.amplifyApp,
  amplifyBranch: amplifyStack.amplifyBranch,
});

authStack.addDependency(amplifyStack);

const apiStack = new ApiStack(app, `${APP_NAME}ApiStack`, {
  env,
  description: `${APP_NAME} API Stack - Manages API Gateway, Lambda functions, and integrates with Cognito and DynamoDB`,
  userPool: authStack.userPool,
  usersTable: storageStack.usersTable,
  usersTableEmailIndexName: storageStack.usersTableEmailIndexName,
});

apiStack.addDependency(amplifyStack);
apiStack.addDependency(authStack);
apiStack.addDependency(storageStack);


cdk.Tags.of(app).add('Project', APP_NAME);
cdk.Tags.of(app).add('Environment', process.env.ENVIRONMENT || 'dev');
cdk.Tags.of(app).add('Purpose', process.env.PROJECT_PURPOSE || 'Built for TartanHacks 2026');
cdk.Tags.of(app).add('Owner', process.env.PROJECT_OWNER || 'Snatched Team');
