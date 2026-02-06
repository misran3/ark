import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { APP_NAME } from './constants';

export class StorageStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly usersTableEmailIndexName: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Users table
    this.usersTable = new dynamodb.Table(this, `${APP_NAME}UsersTable`, {
      tableName: `${APP_NAME}UsersTable`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // Enable point-in-time recovery
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },

      // Enable encryption at rest
      encryption: dynamodb.TableEncryption.AWS_MANAGED,

      // TTL attribute for message queue (60s TTL)
      timeToLiveAttribute: 'ttl',

      // Removal policy
      removalPolicy: process.env.ENVIRONMENT === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by email
    this.usersTableEmailIndexName = 'UserEmailIndex';
    this.usersTable.addGlobalSecondaryIndex({
      indexName: this.usersTableEmailIndexName,
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, `${APP_NAME}UsersTableName`, {
      value: this.usersTable.tableName,
      description: 'Users DynamoDB Table Name',
      exportName: `${APP_NAME}UsersTableName`,
    });

    new cdk.CfnOutput(this, `${APP_NAME}UsersTableEmailIndexName`, {
      value: this.usersTableEmailIndexName,
      description: 'Users Table Email GSI Name',
      exportName: `${APP_NAME}UsersTableEmailIndexName`,
    });
  }
}