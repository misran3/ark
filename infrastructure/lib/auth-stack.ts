import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { APP_NAME, APP_NAME_LOWERCASE } from './constants';

export interface AuthStackProps extends cdk.StackProps {
  amplifyApp: amplify.CfnApp;
  amplifyBranch: amplify.CfnBranch;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // Create Cognito User Pool with built-in Passwordless authentication
    this.userPool = new cognito.UserPool(this, `${APP_NAME}UserPool`, {
      userPoolName: `${APP_NAME_LOWERCASE}-users`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      // Built-in Passwordless authentication configuration
      signInPolicy: {
        allowedFirstAuthFactors: {
          password: true,  // Must be true according to CDK docs
          emailOtp: true,  // Enable email OTP passwordless authentication
        },
      },
      signInCaseSensitive: false,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Email configuration (Cognito's built-in email for dev/testing)
      email: cognito.UserPoolEmail.withCognito(),

      // Standard security
      standardThreatProtectionMode: cognito.StandardThreatProtectionMode.FULL_FUNCTION,

      // Removal policy (be careful in production!)
      removalPolicy: process.env.ENVIRONMENT === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client for frontend
    this.userPoolClient = this.userPool.addClient(`${APP_NAME}WebClient`, {
      userPoolClientName: `${APP_NAME_LOWERCASE}-web-client`,
      authFlows: {
        user: true,  // Enable USER_AUTH flow for choice-based authentication (passwordless)
      },
      // OAuth configuration for Google
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/oauth/callback',  // Local dev
          'https://localhost:3000/oauth/callback', // Local dev HTTPS
          `https://main.${props.amplifyApp.attrAppId}.amplifyapp.com/auth/callback`, // Amplify production
        ],
        logoutUrls: [
          'http://localhost:3000',  // Local dev
          'https://localhost:3000', // Local dev HTTPS
          `https://main.${props.amplifyApp.attrAppId}.amplifyapp.com/auth/logout`, // Amplify production
        ],
      },
      // Token validity
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),

      // Enable token revocation
      enableTokenRevocation: true,

      // Prevent user existence errors
      preventUserExistenceErrors: true,
    });

    // Add Cognito Domain for hosted UI (optional, but useful for OAuth)
    const userPoolDomain = this.userPool.addDomain(`${APP_NAME}Domain`, {
      cognitoDomain: {
        domainPrefix: `${APP_NAME_LOWERCASE}-${cdk.Stack.of(this).account}`, // Must be globally unique
      },
    });

    // CloudFormation Outputs (exportName removed to avoid cross-stack dependencies)
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      // exportName: `${APP_NAME}UserPoolId`,  // Removed for prototype (no cross-stack refs)
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      // exportName: `${APP_NAME}UserPoolClientId`,  // Removed for prototype
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
      // exportName: `${APP_NAME}UserPoolDomain`,  // Removed for prototype
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      // exportName: `${APP_NAME}UserPoolArn`,  // Removed for prototype
    });

    // SSM Parameters for Amplify build
    new ssm.StringParameter(this, 'UserPoolIdParam', {
      parameterName: `/${APP_NAME_LOWERCASE}/user-pool-id`,
      stringValue: this.userPool.userPoolId,
      description: 'Cognito User Pool ID for frontend',
    });

    new ssm.StringParameter(this, 'UserPoolClientIdParam', {
      parameterName: `/${APP_NAME_LOWERCASE}/user-pool-client-id`,
      stringValue: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for frontend',
    });
  }
}