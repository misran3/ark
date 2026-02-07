import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';
import { APP_NAME, APP_NAME_LOWERCASE } from './constants';

export class AmplifyStack extends cdk.Stack {
    public readonly amplifyApp: amplify.CfnApp;
    public readonly amplifyBranch: amplify.CfnBranch;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // IAM Service Role for Amplify build to access SSM parameters
        const amplifyServiceRole = new iam.Role(this, `${APP_NAME}AmplifyServiceRole`, {
            assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
            description: 'Service role for Amplify build to access SSM parameters',
        });

        amplifyServiceRole.addToPolicy(new iam.PolicyStatement({
            actions: ['ssm:GetParameter'],
            resources: [`arn:aws:ssm:*:*:parameter/${APP_NAME_LOWERCASE}/*`],
        }));

        const amplifyAppConfig: any = {
            name: `${APP_NAME_LOWERCASE}-app`,
            description: `${APP_NAME}`,
            platform: 'WEB',
            iamServiceRole: amplifyServiceRole.roleArn,
            customRules: [
                {
                    source: '</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|html)$)([^.]+$)/>',
                    target: '/index.html',
                    status: '200',
                },
            ],
            environmentVariables: [
                {
                    name: 'NEXT_PUBLIC_USER_POOL_ID',
                    value: '', // Will be set after Cognito is created
                },
                {
                    name: 'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
                    value: '', // Will be set after Cognito is created
                },
                {
                    name: 'NEXT_PUBLIC_API_BASE_URL',
                    value: '', // Will be set after API Gateway is created
                },
            ],
        };

        this.amplifyApp = new amplify.CfnApp(this, `${APP_NAME}AmplifyApp`, amplifyAppConfig);

        this.amplifyBranch = new amplify.CfnBranch(this, `${APP_NAME}AmplifyBranch`, {
            appId: this.amplifyApp.attrAppId,
            branchName: 'main',
            stage: 'PRODUCTION',
            enableAutoBuild: true,
            enablePullRequestPreview: false,
        });

        new cdk.CfnOutput(this, 'AmplifyAppId', {
            value: this.amplifyApp.attrAppId,
            description: 'AWS Amplify App ID for frontend hosting',
            exportName: `${APP_NAME}AmplifyAppId`,
        });

        new cdk.CfnOutput(this, 'AmplifyAppName', {
            value: this.amplifyApp.name,
            description: 'AWS Amplify App Name',
            exportName: `${APP_NAME}AmplifyAppName`,
        });

        // Domain Output will be available after deployment
        new cdk.CfnOutput(this, 'AmplifyDomainUrl', {
            value: `https://${this.amplifyBranch.branchName}.${this.amplifyApp.attrAppId}.amplifyapp.com`,
            description: 'AWS Amplify frontend URL',
            exportName: `${APP_NAME}AmplifyDomainUrl`,
        });
    }
}