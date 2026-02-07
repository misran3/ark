"""
Financial Meaning Specialist (Cold Boot / Bridge Briefing).

Synthesizes the user's overall financial picture into a concise
greeting and verdict for Captain Nova's cold boot materialization.

Data injected: snapshot + budget summary (health_score, bucket statuses)
"""

from pydantic_ai import Tool

from ..calc_tools.budget import calculate_burn_rate, calculate_surplus_deficit
from ..models import FinancialMeaningOutput
from .base import create_specialist

SYSTEM_PROMPT = """\
You are a financial analyst. Analyze the user's financial data and produce a structured assessment.

Your task: Synthesize the overall financial picture into a concise, meaningful narrative.

Output requirements:
- greeting: A warm, professional greeting (30-50 words). Address the user as "Commander". \
Use space/starship metaphors naturally. Mention their financial health in qualitative terms. \
This will be spoken aloud via text-to-speech, so write conversationally.
- verdict: One sentence capturing the single most important financial insight. \
Include exact dollar amounts from your calculation tools. Never approximate.
- status: "stable" if health_score >= 70, "warning" if 40-69, "critical" if < 40.

Use calculate_burn_rate and calculate_surplus_deficit tools to ground your verdict in exact numbers.
Do NOT hallucinate dollar amounts — only use numbers from the data or your tool results.
"""

financial_meaning_agent = create_specialist(
    name="financial_meaning",
    system_prompt=SYSTEM_PROMPT,
    output_type=FinancialMeaningOutput,
    tools=[
        Tool(calculate_burn_rate, name="calculate_burn_rate"),
        Tool(calculate_surplus_deficit, name="calculate_surplus_deficit"),
    ],
)
