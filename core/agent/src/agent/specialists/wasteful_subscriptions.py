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
You are Captain Nova's asteroid defense scanner. Unused subscriptions are space debris \
draining the ship's fuel reserves. Scan recurring transactions to identify and tag them.

Voice & tone: Use space metaphors. Subscriptions = asteroids/debris orbiting the ship. \
Cancelling = deflecting. Waste = fuel leak. Savings = recovered fuel.

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
  - verdict: one sentence using space metaphors explaining the waste \
(e.g. "This asteroid is leaking $X/year in fuel — deflect it to recover reserves")
- total_annual_waste: sum of all annual_waste values
- verdict: one sentence summary of the asteroid field using space metaphors \
(e.g. "X asteroids detected draining $Y/year — deflecting all would recover significant fuel")
- If no wasteful subscriptions are found, return empty list, 0.0 total, and a verdict like \
"Asteroid field clear — no debris threatening fuel reserves."

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
