import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';
import { APP_NAME, APP_NAME_LOWERCASE } from './constants';

export interface ApiStackProps extends cdk.StackProps {
    userPool: cognito.UserPool;
    usersTable: dynamodb.Table;
    usersTableEmailIndexName: string;
}

interface LambdaFunctionConfig {
    name: string;
    handler: string;
    description: string;
    additionalDeps?: string[];
    additionalEnv?: Record<string, string>;
    tableGrants?: dynamodb.Table[];
    timeout?: cdk.Duration;
    copySourceFiles?: boolean; // If true, copy Lambda source files
}

export class ApiStack extends cdk.Stack {
    public readonly api: apigateway.RestApi;
    private readonly coreRoot: string = path.join(__dirname, '../../core');
    private readonly commonEnv: Record<string, string>;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        // Common environment variables for all Lambda functions
        this.commonEnv = {
            ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
            LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
            USERS_TABLE_NAME: props.usersTable.tableName,
        };

        // Create Cognito Authorizer for API Gateway
        const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [props.userPool],
            identitySource: 'method.request.header.Authorization',
            authorizerName: `${APP_NAME}CognitoAuthorizer`,
        });

        // Create REST API
        this.api = new apigateway.RestApi(this, `${APP_NAME}Api`, {
            restApiName: `${APP_NAME} API`,
            description: `API for ${APP_NAME} application`,
            deployOptions: {
                stageName: process.env.STAGE_NAME || 'dev',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                tracingEnabled: true,
                metricsEnabled: true,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
                allowCredentials: true,
            },
            cloudWatchRole: true,
        });

        // =============================================================
        // User Lambda Function
        // =============================================================
        const userLambdaFn = this.createLambdaFunction({
            name: 'user-lambda',
            handler: 'handler.lambda_handler',
            description: 'Get and update user profile information',
            additionalDeps: ['./shared', './database'],
            additionalEnv: {
                USERS_TABLE_NAME: props.usersTable.tableName,
                USERS_TABLE_EMAIL_INDEX: props.usersTableEmailIndexName,
            },
            tableGrants: [props.usersTable],
        });

        // =============================================================
        // User API Resources and Methods
        // =============================================================
        this.createUserAPIResources(userLambdaFn, cognitoAuthorizer);

        // =============================================================
        // Data Lambda Function
        // =============================================================
        const dataLambdaFn = this.createLambdaFunction({
            name: 'data-lambda',
            handler: 'handler.lambda_handler',
            description: 'Financial data: Nessie integration, budget engine, asteroid detection, VISA controls',
            additionalDeps: ['./shared', './database'],
            copySourceFiles: true,
            additionalEnv: {
                USERS_TABLE_NAME: props.usersTable.tableName,
                NESSIE_API_KEY: process.env.NESSIE_API_KEY || '',
                DATA_SOURCE: process.env.DATA_SOURCE || 'mock',
                VISA_USER_ID: process.env.VISA_USER_ID || '',
                VISA_PASSWORD: process.env.VISA_PASSWORD || '',
            },
            tableGrants: [props.usersTable],
            timeout: cdk.Duration.seconds(30),
        });

        // Grant S3 read access for VISA certificates
        const visaCertsBucket = s3.Bucket.fromBucketName(
            this,
            'VisaCertsBucket',
            'synesthesia-pay-artifacts'
        );
        visaCertsBucket.grantRead(dataLambdaFn, 'visa/*');

        // =============================================================
        // VISA Lambda Function
        // =============================================================
        const visaLambdaFn = this.createLambdaFunction({
            name: 'visa-lambda',
            handler: 'handler.lambda_handler',
            description: 'VISA Transaction Controls service',
            additionalDeps: ['./shared', './database'],
            copySourceFiles: true,
            additionalEnv: {
                USERS_TABLE_NAME: props.usersTable.tableName,
                // NOTE: For X-Pay-Token auth:
                // - VISA_USER_ID is the Visa API Key (apiKey)
                // - VISA_PASSWORD is the Visa Shared Secret
                VISA_USER_ID: process.env.VISA_USER_ID || '',
                VISA_PASSWORD: process.env.VISA_PASSWORD || '',
            },
            tableGrants: [props.usersTable],
            timeout: cdk.Duration.seconds(30),
        });

        // =============================================================
        // Data API Resources and Methods
        // =============================================================
        this.createDataAPIResources(dataLambdaFn, cognitoAuthorizer);
        
        // =============================================================
        // Captain Nova Lambda Function
        // =============================================================
        const captainLambdaFn = this.createLambdaFunction({
            name: 'captain-lambda',
            handler: 'handler.lambda_handler',
            description: 'Captain Nova AI agent for financial guidance',
            additionalDeps: ['./shared', './agent'],
             additionalEnv: {
                BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
                LOGFIRE_TOKEN: process.env.LOGFIRE_TOKEN || '',
             },
             timeout: cdk.Duration.seconds(60),
         });

        // Grant Bedrock access
        captainLambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: [
                `arn:aws:bedrock:*::foundation-model/anthropic.*`,
                `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`
            ],
        }));

        // =============================================================
        // Captain Nova API Resources
        // =============================================================
        this.createCaptainAPIResources(captainLambdaFn, cognitoAuthorizer);

        // =============================================================
        // VISA API Resources and Methods
        // =============================================================
        this.createVisaAPIResources(visaLambdaFn, cognitoAuthorizer);

        // CloudFormation Outputs
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: `${APP_NAME}ApiUrl`,
        });

        new cdk.CfnOutput(this, 'ApiId', {
            value: this.api.restApiId,
            description: 'API Gateway ID',
            exportName: `${APP_NAME}ApiId`,
        });

        // SSM Parameter for Amplify build
        new ssm.StringParameter(this, 'ApiUrlParam', {
          parameterName: `/${APP_NAME_LOWERCASE}/api-url`,
          stringValue: this.api.url,
          description: 'API Gateway URL for frontend',
        });
    }

    /**
     * Creates API Gateway resources and methods for user-related operations, all protected by Cognito Authorizer.
     * @param userLambdaFn The Lambda function that handles user-related API requests.
     * @param authorizer The Cognito User Pools Authorizer to secure the endpoints.
     */
    private createUserAPIResources(userLambdaFn: lambda.Function, authorizer: apigateway.CognitoUserPoolsAuthorizer) {
        const usersResource = this.api.root.addResource('users');

        // Health check endpoint
        const healthResource = usersResource.addResource('health');
        healthResource.addMethod('GET', new apigateway.LambdaIntegration(userLambdaFn));

        // POST /users
        usersResource.addMethod('POST', new apigateway.LambdaIntegration(userLambdaFn), {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: authorizer,
        });

        // GET /users
        usersResource.addMethod('GET', new apigateway.LambdaIntegration(userLambdaFn), {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: authorizer,
        });

        // GET, PUT, DELETE /users/{user_id}
        const userIdResource = usersResource.addResource('{user_id}');

        userIdResource.addMethod('GET', new apigateway.LambdaIntegration(userLambdaFn), {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: authorizer,
        });
        userIdResource.addMethod('PUT', new apigateway.LambdaIntegration(userLambdaFn), {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: authorizer,
        });
        userIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(userLambdaFn), {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: authorizer,
        });
    }

    /**
     * Creates API Gateway resources and methods for data/financial operations.
     * Health check is unauthenticated; all other endpoints require Cognito auth.
     */
    private createDataAPIResources(dataLambdaFn: lambda.Function, authorizer: apigateway.CognitoUserPoolsAuthorizer) {
        const apiResource = this.api.root.addResource('api');
        const lambdaIntegration = new apigateway.LambdaIntegration(dataLambdaFn);

        // All data endpoints are public for now (no Cognito auth)
        apiResource.addResource('health').addMethod('GET', lambdaIntegration);
        apiResource.addResource('snapshot').addMethod('GET', lambdaIntegration);
        apiResource.addResource('budget').addMethod('GET', lambdaIntegration);

        const asteroidsResource = apiResource.addResource('asteroids');
        asteroidsResource.addMethod('GET', lambdaIntegration);
        const asteroidIdResource = asteroidsResource.addResource('{asteroid_id}');
        asteroidIdResource.addResource('action').addMethod('POST', lambdaIntegration);

        apiResource.addResource('transactions').addMethod('GET', lambdaIntegration);

        // VISA Transaction Controls endpoints
        const visaResource = apiResource.addResource('visa');
        const visaControlsResource = visaResource.addResource('controls');
        visaControlsResource.addMethod('POST', lambdaIntegration);
        const visaControlIdResource = visaControlsResource.addResource('{document_id}');
        visaControlIdResource.addMethod('GET', lambdaIntegration);
        visaControlIdResource.addMethod('DELETE', lambdaIntegration);
    }

    /**
     * Creates API Gateway resources and methods for VISA operations.
     */
    private createVisaAPIResources(visaLambdaFn: lambda.Function, authorizer: apigateway.CognitoUserPoolsAuthorizer) {
        const apiResource = this.api.root.getResource('api') || this.api.root.addResource('api');
        const visaResource = apiResource.getResource('visa') || apiResource.addResource('visa');
        const lambdaIntegration = new apigateway.LambdaIntegration(visaLambdaFn);

        // VISA health check
        visaResource.addResource('health').addMethod('GET', lambdaIntegration);

        // VISA Transaction Controls endpoints
        const visaControlsResource = visaResource.addResource('controls');
        visaControlsResource.addMethod('POST', lambdaIntegration);
        const visaControlIdResource = visaControlsResource.addResource('{document_id}');
        visaControlIdResource.addMethod('GET', lambdaIntegration);
        visaControlIdResource.addMethod('DELETE', lambdaIntegration);
    }

    /**
     * Creates API Gateway resources for Captain Nova endpoints.
     * @param captainLambdaFn The Lambda function that handles Captain Nova API requests.
     * @param authorizer The Cognito User Pools Authorizer to secure the endpoints.
     */
    private createCaptainAPIResources(
        captainLambdaFn: lambda.Function,
        authorizer: apigateway.CognitoUserPoolsAuthorizer
    ) {
        const captainResource = this.api.root.addResource('captain');
        const lambdaIntegration = new apigateway.LambdaIntegration(captainLambdaFn);

        // Health check endpoint (no auth for testing)
        const healthResource = captainResource.addResource('health');
        healthResource.addMethod('GET', lambdaIntegration);

        // POST /captain/query (requires auth)
        const queryResource = captainResource.addResource('query');
        queryResource.addMethod('POST', lambdaIntegration);
    }

    /**
     * Utility method to create a Lambda function with specified configuration,
     * including bundling dependencies with uv and optionally copying source files.
     * @param config Lambda function configuration details
     * @returns The created Lambda function
     */
    private createLambdaFunction(config: LambdaFunctionConfig): lambda.Function {
        // Create CloudWatch Log Group
        const logGroup = new logs.LogGroup(this, `${config.name}LogGroup`, {
            logGroupName: `/aws/lambda/${APP_NAME_LOWERCASE}-${config.name.toLowerCase()}`,
            retention: process.env.ENVIRONMENT === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
            removalPolicy: process.env.ENVIRONMENT === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        let installPackages = `./lambda/${config.name}`;
        if (config.additionalDeps && config.additionalDeps.length > 0) {
            installPackages = installPackages.concat(` ${config.additionalDeps.join(' ')}`);
        }

        // Build bundling command based on whether we need to copy source files
        const bundlingCommands: string[] = [
            // Install uv to /tmp (writable location)
            'pip install --no-cache-dir --target /tmp/pip-packages uv',
            'export PYTHONPATH=/tmp/pip-packages:$PYTHONPATH',
            // Navigate to workspace root
            'cd /asset-input',
        ];

        // Copy source files first
        if (config.copySourceFiles) {
            const lambdaDir = `./lambda/${config.name}`;
            bundlingCommands.push(
                // Copy all source files from Lambda directory to output
                `cp -r ${lambdaDir}/* /asset-output/`,
                // Make shell scripts executable (e.g., run.sh)
                'find /asset-output -name "*.sh" -exec chmod +x {} \\;',
            );
        }

        // Install Python dependencies (always)
        bundlingCommands.push(
            `python -m uv pip install --python 3.12 --target /asset-output --no-cache ${installPackages}`,
        );

        const fn = new lambda.Function(this, config.name, {
            functionName: `${APP_NAME_LOWERCASE}-${config.name.toLowerCase()}`,
            description: config.description,
            handler: config.handler,
            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,
            memorySize: 512,
            timeout: config.timeout || cdk.Duration.seconds(300), // Default to 5 minutes, can be overridden
            code: lambda.Code.fromAsset(this.coreRoot, {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_12.bundlingImage,
                    platform: 'linux/arm64',
                    command: ['bash', '-c', bundlingCommands.join(' && ')],
                },
            }),
            environment: {
                ...this.commonEnv,
                ...config.additionalEnv,
            },
            tracing: lambda.Tracing.ACTIVE,
            logGroup: logGroup,
        });

        // Grant DynamoDB access
        config.tableGrants?.forEach((table) => {
            table.grantReadWriteData(fn);
        });

        return fn;
    }
}
