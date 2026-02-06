"""
AWS DynamoDB client for UsersTable: user profiles, settings, and message queue.
"""
import os
from typing import Any

from aws_lambda_powertools.logging import Logger
from boto3.dynamodb.conditions import Key

from .base_client import DynamoDBClient
from .models.user import User

logger = Logger(service="UsersTableClient")


class UsersTableClient(DynamoDBClient):
    """
    Client for UsersTable.

    Handles:
    - User profiles (PK: USER#<user_id>, SK: PROFILE)
    - Message queue (PK: USER#<user_id>, SK: MSGQUEUE#<timestamp>)
    """

    def __init__(self):
        super().__init__(table_name=os.environ['USERS_TABLE_NAME'])
        self.email_index = os.getenv('USERS_TABLE_EMAIL_INDEX', 'EmailIndex')

    # User Profile Operations
    def get_user_profile_by_email(self, email: str) -> User | None:
        """Get user profiles by email"""
        items = self.query_index(
            index_name=self.email_index,
            key_condition_expression=Key("email").eq(email),
            limit=1,
        )
        if items:
            return User.from_dynamodb_item(items[0])
        return None

    def get_user_profile(self, user_id: str) -> User | None:
        """Get user profile by user_id."""
        pk = f"USER#{user_id}"
        sk = "PROFILE"
        item = self.get_item(pk, sk)

        if item:
            return User.from_dynamodb_item(item)
        return None

    def put_user_profile(self, profile: User) -> bool:
        """Save user profile."""
        item = profile.to_dynamodb_item()
        return self.put_item(item)

    def update_user_profile(
        self,
        user_id: str,
        updates: dict[str, Any]
    ) -> User:
        """
        Update user profile fields.

        Args:
            user_id: User identifier
            updates: Dict of field names to new values (e.g., {'timezone': 'America/New_York'})

        Returns:
            Updated UserProfile
        """
        pk = f"USER#{user_id}"
        sk = "PROFILE"

        # Build update expression
        update_parts = []
        attr_values = {}
        attr_names = {}

        for i, (key, value) in enumerate(updates.items()):
            placeholder = f":val{i}"
            name_placeholder = f"#name{i}"
            update_parts.append(f"{name_placeholder} = {placeholder}")
            attr_values[placeholder] = value
            attr_names[name_placeholder] = key

        update_expression = "SET " + ", ".join(update_parts)

        updated_item = self.update_item(
            pk, sk, update_expression, attr_values, attr_names
        )

        return User.from_dynamodb_item(updated_item)

    def delete_user_profile(self, user_id: str) -> bool:
        """Delete user profile."""
        pk = f"USER#{user_id}"
        sk = "PROFILE"
        return self.delete_item(pk, sk)