"""
Budget Overruns Specialist (Ion Storm Threat).

Flags spending categories exceeding 50/30/20 budget targets.

Data injected: full budget report + last 30 days transactions by category
"""

from typing import Literal

from pydantic_ai import Tool

from ..models import IonStormAnalysis
from .base import create_specialist


def calculate_daily_budget_remaining(
    budget: float, spent: float, days_left: int
) -> float:
    """Calculate how much can be spent per remaining day to stay on budget."""
    remaining = budget - spent
    if days_left <= 0:
        return remaining
    return round(remaining / days_left, 2)


def calculate_category_trend(
    week1: float, week2: float, week3: float, week4: float
) -> Literal["rising", "falling", "stable"]:
    """Classify spending trend from 4 weekly amounts (oldest to newest)."""
    recent_avg = (week3 + week4) / 2
    older_avg = (week1 + week2) / 2
    if older_avg == 0:
        return "rising" if recent_avg > 0 else "stable"
    ratio = recent_avg / older_avg
    if ratio > 1.15:
        return "rising"
    if ratio < 0.85:
        return "falling"
    return "stable"


SYSTEM_PROMPT = """\
You are a budget overrun analyst. Analyze the 50/30/20 budget report and transaction \
data to identify categories that are exceeding their targets.

The 50/30/20 framework:
- NEEDS (50%): rent, utilities, insurance, groceries, transportation, medical
- WANTS (30%): dining, entertainment, shopping, subscriptions, streaming, gym
- SAVINGS (20%): savings, investments, emergency fund, debt payoff

Output requirements:
- For each category that exceeds its proportional budget share:
  - category: exact category name
  - budget_amount: the proportional budget target for this category
  - actual_amount: actual spending from data
  - overspend_amount: actual - budget (positive number)
  - pct_over: percentage over budget
  - volatility: use calculate_category_trend if weekly data available, else "medium"
  - verdict: one actionable sentence (e.g., "Cut 3 DoorDash orders to save $45")
- overall_budget_status: "critical" if any bucket >120% target, "warning" if >100%, "on_track" otherwise
- If no overruns found, return empty list and "on_track".

Focus on the categories with the largest dollar overspend first.
"""

budget_overruns_agent = create_specialist(
    name="budget_overruns",
    system_prompt=SYSTEM_PROMPT,
    output_type=IonStormAnalysis,
    tools=[
        Tool(calculate_daily_budget_remaining, name="calculate_daily_budget_remaining"),
        Tool(calculate_category_trend, name="calculate_category_trend"),
    ],
)
