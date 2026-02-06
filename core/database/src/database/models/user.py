from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from ..utils import from_iso_format, now_utc, remove_none_values, to_iso_format


class User(BaseModel):
    """User profile model for UsersTable.

    DynamoDB Schema:
    - PK: "USER#<user_id>"
    - SK: "PROFILE"
    """
    # Primary identifiers
    user_id: str = Field(..., description="Unique user identifier")
    email: EmailStr = Field(..., description="User email address")

    # General info
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")

    # Timestamps
    created_at: datetime = Field(
        default_factory=now_utc,
        description="Profile creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=now_utc,
        description="Profile last updated timestamp"
    )

    @property
    def pk(self) -> str:
        """DynamoDB partition key."""
        return f"USER#{self.user_id}"

    @property
    def sk(self) -> str:
        """DynamoDB sort key."""
        return "PROFILE"

    def to_dynamodb_item(self) -> dict:
        """Convert to DynamoDB item format."""
        item = {
            "PK": self.pk,
            "SK": self.sk,
            "user_id": self.user_id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "created_at": to_iso_format(self.created_at),
            "updated_at": to_iso_format(self.updated_at),
        }

        item = remove_none_values(item)
        return item

    @classmethod
    def from_dynamodb_item(cls, item: dict) -> "User":
        """Create User from DynamoDB item."""
        return cls(
            user_id=item["user_id"],
            email=item["email"],
            first_name=item["first_name"],
            last_name=item["last_name"],
            created_at=from_iso_format(item["created_at"]),
            updated_at=from_iso_format(item["updated_at"]),
        )
    
    @classmethod
    def from_dynamodb_items(cls, items: list[dict]) -> list["User"]:
        """Create list of UserProfiles from list of DynamoDB items."""
        return [cls.from_dynamodb_item(item) for item in items]
    
    def to_dto(self) -> dict:
        """Convert to DTO format for API responses."""
        return self.model_dump(mode="json")

    class Config:
        """Pydantic config."""
        json_encoders = {
            datetime: lambda v: to_iso_format(v)
        }