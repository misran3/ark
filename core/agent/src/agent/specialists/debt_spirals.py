"""
Debt Spirals Specialist (Black Hole Threat).

Analyzes credit card and loan balances to identify compounding debt.

Data injected: credit_card accounts + loan/interest transactions
"""

from pydantic_ai import Tool

from ..calc_tools.debt import calculate_interest_saved, calculate_payoff_timeline
from ..models import BlackHoleAnalysis
from .base import create_specialist

SYSTEM_PROMPT = """\
You are a debt spiral analyst. Analyze credit card balances and loan data to \
identify dangerous debt patterns.

Analysis approach:
1. For each credit card with a negative balance (debt):
   - Assume standard 24.99% APR unless data indicates otherwise
   - Assume minimum payment = max(25, 1% of balance + monthly interest)
   - Use calculate_payoff_timeline to compute months at minimum payment
   - Use calculate_payoff_timeline again with a recommended higher payment
   - Use calculate_interest_saved to show the savings
2. Flag as critical if minimum payment timeline exceeds 60 months (5 years)

Output requirements:
- For each debt:
  - account: account nickname from data
  - balance: absolute balance (positive number)
  - apr: assumed or known APR
  - monthly_interest: balance * apr / 100 / 12 (use tool to verify)
  - minimum_payment_months: months at minimum payment (from tool)
  - recommended_payment: a higher monthly payment that clears debt in ~6-12 months
  - recommended_months: months at recommended payment (from tool)
  - interest_saved: from calculate_interest_saved tool
  - verdict: one sentence about the cost of minimum payments
- total_debt: sum of all balances
- total_monthly_interest: sum of monthly interest charges
- urgency: "critical" if any debt has minimum_payment_months > 60, \
"warning" if > 24, "stable" otherwise
- If no debts found, return empty lists and "stable".
"""

debt_spirals_agent = create_specialist(
    name="debt_spirals",
    system_prompt=SYSTEM_PROMPT,
    output_type=BlackHoleAnalysis,
    tools=[
        Tool(calculate_payoff_timeline, name="calculate_payoff_timeline"),
        Tool(calculate_interest_saved, name="calculate_interest_saved"),
    ],
)
