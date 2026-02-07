"""
Wasteful Subscriptions Specialist (Asteroid Threat).

Identifies recurring charges with low or zero usage.

Data injected: recurring transactions (non-income)
"""

from pydantic_ai import Tool

from ..calc_tools.rewards import calculate_annual_opportunity_cost
from ..models import AsteroidAnalysis
from .base import create_specialist


def calculate_annual_waste(monthly_cost: float) -> float:
    """Calculate yearly cost of a subscription."""
    return round(monthly_cost * 12, 2)


def calculate_usage_frequency(transaction_count: int, days: int) -> float:
    """Calculate average uses per month from transaction count and day window."""
    if days <= 0:
        return 0.0
    return round(transaction_count / (days / 30), 1)


SYSTEM_PROMPT = """\
You are a subscription waste analyst. Analyze recurring transactions to identify \
unused or underused subscriptions.

Detection criteria:
- Recurring transactions that appear only once in the provided data (low activity)
- Subscriptions in non-essential categories (dining, entertainment, gym, streaming, etc.)
- High cost relative to apparent usage frequency

Output requirements:
- For each wasteful subscription found:
  - merchant: exact merchant name from the data
  - monthly_cost: exact amount from transaction data (positive number)
  - last_used_days_ago: days since the most recent charge
  - annual_waste: use calculate_annual_waste tool
  - verdict: one sentence explaining why this is wasteful and the savings opportunity
- total_annual_waste: sum of all annual_waste values
- If no wasteful subscriptions are found, return empty list and 0.0 total.

Rank results by annual_waste descending.
"""

wasteful_subscriptions_agent = create_specialist(
    name="wasteful_subscriptions",
    system_prompt=SYSTEM_PROMPT,
    output_type=AsteroidAnalysis,
    tools=[
        Tool(calculate_annual_waste, name="calculate_annual_waste"),
        Tool(calculate_usage_frequency, name="calculate_usage_frequency"),
    ],
)
