import os
from typing import Any

import boto3
from aws_lambda_powertools.logging import Logger
from boto3.dynamodb.conditions import ComparisonCondition, Key
from botocore.exceptions import ClientError

logger = Logger(service="DynamoDBClient")

class DynamoDBClient:
    """Base DynamoDB client with common operations."""

    def __init__(self, table_name: str):
        """
        Initialize DynamoDB client for a specific table.

        Args:
            table_name: Name of the DynamoDB table
            region_name: AWS region (default: uses boto3 default region)
        """
        self.dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
        self.table = self.dynamodb.Table(table_name)
        self.table_name = table_name

    def put_item(self, item: dict[str, Any]) -> bool:
        """
        Put an item into the table.

        Args:
            item: Item data with PK, SK, and attributes

        Returns:
            True if successful
        """
        try:
            self.table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(f"Error putting item in {self.table_name}", e)
            raise

    def get_item(self, pk: str, sk: str) -> dict[str, Any] | None:
        """
        Get an item by PK and SK.

        Args:
            pk: Partition key value
            sk: Sort key value

        Returns:
            Item data or None if not found
        """
        try:
            response = self.table.get_item(Key={'PK': pk, 'SK': sk})
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting item from {self.table_name}", e)
            raise

    def delete_item(self, pk: str, sk: str) -> bool:
        """
        Delete an item by PK and SK.

        Args:
            pk: Partition key value
            sk: Sort key value

        Returns:
            True if successful
        """
        try:
            self.table.delete_item(Key={'PK': pk, 'SK': sk})
            return True
        except ClientError as e:
            logger.error(f"Error deleting item from {self.table_name}", e)
            raise

    def query(
        self,
        pk: str,
        sk_prefix: str | None = None,
        filter_expression: ComparisonCondition | None = None,
        limit: int | None = None,
        scan_index_forward: bool = True
    ) -> list[dict[str, Any]]:
        """
        Query items by PK with optional SK prefix.

        Args:
            pk: Partition key value
            sk_prefix: Optional SK prefix for begins_with query
            filter_expression: Optional filter expression
            limit: Maximum number of items to return
            scan_index_forward: True for ascending, False for descending

        Returns:
            List of items
        """
        try:
            key_condition = Key('PK').eq(pk)

            if sk_prefix:
                key_condition = key_condition & Key('SK').begins_with(sk_prefix)

            query_kwargs = {
                'KeyConditionExpression': key_condition,
                'ScanIndexForward': scan_index_forward
            }

            if filter_expression:
                query_kwargs['FilterExpression'] = filter_expression

            if limit:
                query_kwargs['Limit'] = limit

            response = self.table.query(**query_kwargs)
            return response.get('Items', [])

        except ClientError as e:
            logger.error(f"Error querying {self.table_name}", e)
            raise
    
    def query_index(
            self,
            index_name: str,
            key_condition_expression: ComparisonCondition | None = None,
            filter_expression: ComparisonCondition | None = None,
            limit: int | None = None,
            scan_index_forward: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Query items using a secondary index.

        Args:
            index_name: Name of the secondary index
            key_condition_expression: Optional key condition expression for the query
            filter_expression: Optional filter expression
            limit: Optional maximum number of items to return
            scan_index_forward: True for ascending, False for descending

        Returns:
            List of items
        """
        try:
            query_kwargs = {
                'IndexName': index_name,
                'ScanIndexForward': scan_index_forward
            }

            if key_condition_expression:
                query_kwargs['KeyConditionExpression'] = key_condition_expression
            
            if filter_expression:
                query_kwargs['FilterExpression'] = filter_expression

            if limit:
                query_kwargs['Limit'] = limit

            response = self.table.query(**query_kwargs)
            return response.get('Items', [])

        except ClientError as e:
            logger.error(f"Error querying {self.table_name}", e)
            raise    

    def update_item(
        self,
        pk: str,
        sk: str,
        update_expression: str,
        expression_attribute_values: dict[str, Any],
        expression_attribute_names: dict[str, str] | None = None
    ) -> dict[str, Any]:
        """
        Update an item with UpdateExpression.

        Args:
            pk: Partition key value
            sk: Sort key value
            update_expression: DynamoDB update expression
            expression_attribute_values: Values for the expression
            expression_attribute_names: Optional attribute names mapping

        Returns:
            Updated attributes
        """
        try:
            update_kwargs = {
                'Key': {'PK': pk, 'SK': sk},
                'UpdateExpression': update_expression,
                'ExpressionAttributeValues': expression_attribute_values,
                'ReturnValues': 'ALL_NEW'
            }

            if expression_attribute_names:
                update_kwargs['ExpressionAttributeNames'] = expression_attribute_names

            response = self.table.update_item(**update_kwargs)
            return response.get('Attributes', {})

        except ClientError as e:
            logger.error(f"Error updating item in {self.table_name}", e)
            raise