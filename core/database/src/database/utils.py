import os
from datetime import datetime, timezone


def validate_env_vars():
    """Validate that required environment variables are set."""
    required_vars = ['USERS_TABLE_NAME']
    missing_vars = [var for var in required_vars if var not in os.environ]

    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

def now_utc() -> datetime:
    """Get the current UTC datetime."""
    return datetime.now(timezone.utc)

def from_utc_timestamp(ts: float) -> datetime:
    """Convert a UTC timestamp to a datetime object."""
    return datetime.fromtimestamp(ts, tz=timezone.utc)

def to_iso_format(dt: datetime):
    """
    Convert a datetime object to ISO 8601 format. Ensures the datetime is in UTC before conversion.
    """
    if dt.tzinfo is None:
        _dt = dt.replace(tzinfo=timezone.utc)
    elif dt.tzinfo != timezone.utc:
        _dt = dt.astimezone(timezone.utc)
    else:
        _dt = dt

    return _dt.isoformat()

def from_iso_format(iso_str: str) -> datetime:
    """
    Convert an ISO 8601 formatted string to a datetime object in UTC.
    """
    dt = datetime.fromisoformat(iso_str)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    else:
        return dt.astimezone(timezone.utc)

def remove_none_values(d: dict) -> dict:
    """
    Remove keys with None values from a dictionary.

    Args:
        d: Input dictionary
    Returns:
        Dictionary without None values
    """
    return {k: v for k, v in d.items() if v is not None}