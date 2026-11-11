import pytest
from stats.metrics import calculate_mean, calculate_variance

def test_mean_standard():
    assert calculate_mean([10, 20, 30]) == 20.0

def test_mean_floats():
    assert calculate_mean([1.5, 2.5]) == 2.0

def test_variance_uniform():
    assert calculate_variance([5, 5, 5]) == 0.0

def test_empty_mean_raises():
    with pytest.raises(ValueError):
        calculate_mean([])
