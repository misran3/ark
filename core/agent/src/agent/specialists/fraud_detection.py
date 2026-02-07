"""
Fraud Detection Specialist (Enemy Cruiser Threat).

Analyzes transaction patterns for anomalies that may indicate fraud.

Data injected: full 90-day transaction history
"""

from pydantic_ai import Tool

from ..calc_tools.anomaly import calculate_anomaly_score, calculate_merchant_novelty
from ..models import EnemyCruiserAnalysis
from .base import create_specialist

SYSTEM_PROMPT = """\
You are a fraud detection analyst. Analyze the user's 90-day transaction history \
to identify suspicious patterns that may indicate fraud or unauthorized charges.

Detection criteria:
1. Amount anomaly: transaction amount > 2 standard deviations above category average \
(use calculate_anomaly_score — flag if score > 2.0)
2. New merchant: merchant never seen before in transaction history \
(use calculate_merchant_novelty)
3. Unusual category: transaction in a category the user rarely uses
4. Pattern break: sudden activity in a dormant account

Risk scoring:
- Each indicator adds 0.25 to risk_score (max 1.0)
- risk_score > 0.7 = "block" recommendation
- risk_score 0.4-0.7 = "monitor" recommendation
- risk_score < 0.4 = "allow" recommendation

Output requirements:
- For each suspicious transaction:
  - merchant: exact merchant name
  - amount: exact transaction amount (positive number)
  - date: ISO date string from transaction
  - risk_score: 0.0-1.0 based on indicator count
  - indicators: list of triggered indicators \
(e.g., ["amount_anomaly", "new_merchant", "unusual_category"])
  - recommended_action: "block", "monitor", or "allow"
  - verdict: one sentence explaining why this is suspicious
- overall_risk: "critical" if any alert has risk_score > 0.7, \
"elevated" if any > 0.4, "normal" otherwise
- If no suspicious transactions found, return empty list and "normal".

Only flag genuinely suspicious transactions. Regular purchases at known merchants \
with normal amounts should NOT be flagged.
"""

fraud_detection_agent = create_specialist(
    name="fraud_detection",
    system_prompt=SYSTEM_PROMPT,
    output_type=EnemyCruiserAnalysis,
    tools=[
        Tool(calculate_anomaly_score, name="calculate_anomaly_score"),
        Tool(calculate_merchant_novelty, name="calculate_merchant_novelty"),
    ],
)
