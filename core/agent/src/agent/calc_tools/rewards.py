"""Reward optimization calculation tools."""


def calculate_lost_rewards(
    amount: float,
    current_multiplier: float,
    optimal_multiplier: float,
    point_value: float = 0.01,
) -> tuple[int, float]:
    """Points and cash value lost by using the wrong card.

    Returns (points_lost, cash_value_lost).
    """
    points_diff = int(abs(amount) * (optimal_multiplier - current_multiplier))
    cash_value = round(points_diff * point_value, 2)
    return (points_diff, cash_value)


def calculate_annual_opportunity_cost(monthly_loss: float) -> float:
    """Annualize a monthly rewards loss."""
    return round(monthly_loss * 12, 2)


def calculate_reward_value(
    amount: float, multiplier: float, point_value: float = 0.01
) -> float:
    """Calculate reward cash value for a transaction."""
    return round(abs(amount) * multiplier * point_value, 2)
