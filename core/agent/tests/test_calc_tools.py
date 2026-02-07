"""Tests for specialist calculation tools."""

from agent.calc_tools.budget import calculate_burn_rate, calculate_surplus_deficit
from agent.calc_tools.debt import calculate_payoff_timeline, calculate_interest_saved
from agent.calc_tools.rewards import (
    calculate_lost_rewards,
    calculate_annual_opportunity_cost,
    calculate_reward_value,
)
from agent.calc_tools.anomaly import calculate_anomaly_score, calculate_merchant_novelty


# --- Budget tools ---

def test_burn_rate_with_deficit():
    assert calculate_burn_rate(12000.0, 400.0) == 30.0

def test_burn_rate_no_deficit():
    assert calculate_burn_rate(12000.0, 0.0) == -1.0

def test_burn_rate_negative_deficit():
    assert calculate_burn_rate(12000.0, -100.0) == -1.0

def test_surplus_deficit_surplus():
    assert calculate_surplus_deficit(5500.0, 4127.0) == 1373.0

def test_surplus_deficit_deficit():
    assert calculate_surplus_deficit(3000.0, 4127.0) == -1127.0


# --- Debt tools ---

def test_payoff_timeline_standard():
    months, interest = calculate_payoff_timeline(1847.32, 24.99, 340.0)
    assert months == 6
    assert interest > 0

def test_payoff_timeline_payment_too_low():
    months, interest = calculate_payoff_timeline(10000.0, 24.99, 10.0)
    assert months == -1
    assert interest == -1.0

def test_interest_saved():
    saved = calculate_interest_saved(1847.32, 24.99, 50.0, 340.0)
    assert saved > 0

def test_interest_saved_min_too_low():
    saved = calculate_interest_saved(10000.0, 24.99, 5.0, 340.0)
    assert saved == 0.0


# --- Rewards tools ---

def test_lost_rewards():
    points, cash = calculate_lost_rewards(100.0, 1.0, 3.0, 0.01)
    assert points == 200
    assert cash == 2.0

def test_annual_opportunity_cost():
    assert calculate_annual_opportunity_cost(13.50) == 162.0

def test_reward_value():
    assert calculate_reward_value(25.98, 3.0, 0.01) == 0.78


# --- Anomaly tools ---

def test_anomaly_score_normal():
    score = calculate_anomaly_score(50.0, 45.0, 10.0)
    assert score == 0.5

def test_anomaly_score_spike():
    score = calculate_anomaly_score(200.0, 50.0, 25.0)
    assert score == 6.0

def test_anomaly_score_zero_stddev():
    score = calculate_anomaly_score(100.0, 50.0, 0.0)
    assert score == 10.0

def test_anomaly_score_zero_stddev_exact_match():
    score = calculate_anomaly_score(50.0, 50.0, 0.0)
    assert score == 0.0

def test_merchant_novelty_new():
    assert calculate_merchant_novelty("Unknown Shop", ["Walmart", "Target"]) is True

def test_merchant_novelty_known():
    assert calculate_merchant_novelty("Walmart", ["Walmart", "Target"]) is False
