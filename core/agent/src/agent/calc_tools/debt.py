"""Debt payoff and interest calculation tools."""


def calculate_payoff_timeline(
    balance: float, apr: float, monthly_payment: float
) -> tuple[int, float]:
    """Calculate months to pay off and total interest paid.

    Returns (months, total_interest).
    Returns (-1, -1.0) if monthly payment doesn't cover interest.
    """
    monthly_rate = apr / 100 / 12
    if monthly_payment <= balance * monthly_rate:
        return (-1, -1.0)

    months = 0
    total_interest = 0.0
    remaining = balance
    while remaining > 0 and months < 600:
        interest = remaining * monthly_rate
        total_interest += interest
        principal = monthly_payment - interest
        remaining -= principal
        months += 1

    return (months, round(total_interest, 2))


def calculate_interest_saved(
    balance: float,
    apr: float,
    min_payment: float,
    recommended_payment: float,
) -> float:
    """Difference in total interest between minimum and recommended payment plans."""
    _, min_interest = calculate_payoff_timeline(balance, apr, min_payment)
    _, rec_interest = calculate_payoff_timeline(balance, apr, recommended_payment)
    if min_interest < 0 or rec_interest < 0:
        return 0.0
    return round(min_interest - rec_interest, 2)
