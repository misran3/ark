"""
Missed Rewards Specialist (Wormhole Threat).

Identifies transactions where using a different card would have earned more rewards.

Data injected: last 30 days transactions + account list (card types)
"""

from pydantic_ai import Tool

from ..calc_tools.rewards import (
    calculate_annual_opportunity_cost,
    calculate_lost_rewards,
)
from ..models import WormholeAnalysis
from .base import create_specialist

SYSTEM_PROMPT = """\
You are a rewards optimization analyst. Analyze transactions to identify cases \
where the user used a suboptimal card and missed reward points.

Common reward structures (use as reference):
- Sapphire Reserve: 3x dining, 3x travel, 1x everything else
- Freedom / Freedom Flex: 5x rotating categories, 3x dining, 1x everything else
- Basic rewards card: 1.5x everything (flat cashback)

Analysis approach:
1. For each transaction, determine the card used (from account_id → account nickname)
2. Determine the optimal card for that merchant category
3. If the optimal card differs from the card used, calculate lost rewards
4. Group results by category and aggregate

Output requirements:
- For each category with missed rewards:
  - category: spending category
  - current_card: card actually used (account nickname)
  - optimal_card: card that should have been used
  - transactions_affected: number of transactions in this category on the wrong card
  - points_lost: from calculate_lost_rewards tool (aggregate for the category)
  - cash_value_lost: from calculate_lost_rewards tool (aggregate)
  - verdict: one sentence explaining the routing recommendation
- annual_opportunity_cost: use calculate_annual_opportunity_cost with total monthly loss
- If no misuse detected, return empty list and 0.0.

Point value: assume $0.01 per point for cash back, $0.015 for travel redemption.
Use $0.01 as default.
"""

missed_rewards_agent = create_specialist(
    name="missed_rewards",
    system_prompt=SYSTEM_PROMPT,
    output_type=WormholeAnalysis,
    tools=[
        Tool(calculate_lost_rewards, name="calculate_lost_rewards"),
        Tool(calculate_annual_opportunity_cost, name="calculate_annual_opportunity_cost"),
    ],
)
