"""
Upcoming Bills Specialist (Solar Flare Threat).

Identifies recurring charges due within 30 days with card optimization.

Data injected: recurring transactions (with next_expected_date) + account list
"""

from pydantic_ai import Tool

from ..calc_tools.rewards import calculate_reward_value
from ..models import SolarFlareAnalysis
from .base import create_specialist


def calculate_total_upcoming(amounts: list[float]) -> float:
    """Sum total of all upcoming bill amounts."""
    return round(sum(amounts), 2)


SYSTEM_PROMPT = """\
You are an upcoming bills analyst. Analyze recurring transactions to identify \
all charges due within the next 30 days.

Output requirements:
- For each upcoming bill:
  - merchant: exact merchant name
  - amount: exact expected charge amount (positive number)
  - due_date: ISO date string (YYYY-MM-DD) from next_expected_date
  - days_until: integer days from today
  - recommended_card: if the user has multiple cards, suggest the best one \
for this merchant category based on common reward structures. Set to null \
if only one card or if card optimization doesn't apply.
  - estimated_rewards_value: use calculate_reward_value tool if recommending a card, \
else null
- total_upcoming_30_days: use calculate_total_upcoming for the sum
- Sort by days_until ascending (most urgent first).
- If no upcoming bills found, return empty list and 0.0 total.
"""

upcoming_bills_agent = create_specialist(
    name="upcoming_bills",
    system_prompt=SYSTEM_PROMPT,
    output_type=SolarFlareAnalysis,
    tools=[
        Tool(calculate_total_upcoming, name="calculate_total_upcoming"),
        Tool(calculate_reward_value, name="calculate_reward_value"),
    ],
)
