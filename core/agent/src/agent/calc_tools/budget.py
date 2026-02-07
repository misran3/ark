"""Budget and burn rate calculation tools."""


def calculate_burn_rate(savings: float, monthly_deficit: float) -> float:
    """Months until savings depleted at current deficit rate.

    Returns -1.0 if there is no deficit (surplus or zero).
    """
    if monthly_deficit <= 0:
        return -1.0
    return round(savings / monthly_deficit, 1)


def calculate_surplus_deficit(income: float, spending: float) -> float:
    """Monthly surplus (positive) or deficit (negative)."""
    return round(income - spending, 2)
