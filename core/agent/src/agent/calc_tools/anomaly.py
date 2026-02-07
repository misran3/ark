"""Transaction anomaly scoring tools."""


def calculate_anomaly_score(
    amount: float, category_avg: float, category_stddev: float
) -> float:
    """Z-score for transaction amount vs category average.

    Returns 10.0 if stddev is 0 and amount differs from average.
    """
    if category_stddev == 0:
        return 0.0 if amount == category_avg else 10.0
    return round(abs(amount - category_avg) / category_stddev, 2)


def calculate_merchant_novelty(
    merchant: str, known_merchants: list[str]
) -> bool:
    """Whether merchant is new (not in known merchant list)."""
    return merchant not in known_merchants
