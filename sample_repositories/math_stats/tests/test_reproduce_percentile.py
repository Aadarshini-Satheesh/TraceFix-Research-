import pytest
from stats.metrics import calculate_percentile

def test_percentile_100th_boundary():
    # 100th percentile of [10, 20, 30] should be 30.0, but currently raises IndexError
    result = calculate_percentile([10, 20, 30], 100)
    assert result == 30.0

def test_percentile_single_element():
    # Single element list should return that element for any valid percentile
    result = calculate_percentile([42.0], 50)
    assert result == 42.0
