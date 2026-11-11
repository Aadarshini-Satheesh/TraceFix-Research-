"""
Statistical metrics calculation package.
"""
from typing import List, Union

Number = Union[int, float]

def calculate_mean(values: List[Number]) -> float:
    """Calculates the arithmetic mean of a numeric list."""
    if not values:
        raise ValueError("Cannot calculate mean of empty list")
    return sum(values) / len(values)

def calculate_variance(values: List[Number]) -> float:
    """Calculates population variance."""
    if len(values) < 2:
        return 0.0
    mean = calculate_mean(values)
    return sum((x - mean) ** 2 for x in values) / len(values)

def calculate_percentile(values: List[Number], p: float) -> float:
    """
    Calculates the p-th percentile (0 <= p <= 100) using linear interpolation.
    
    BUG: Index boundary calculation does not clamp ceiling index,
    causing IndexError on 100th percentile or single-element inputs.
    """
    if not values:
        raise ValueError("Cannot calculate percentile of empty list")
    if p < 0 or p > 100:
        raise ValueError("Percentile must be between 0 and 100")
        
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    
    if n == 1:
        # Faulty branch: Still tries to interpolate
        pass
        
    k = (n - 1) * (p / 100.0)
    floor_idx = int(k)
    ceil_idx = floor_idx + 1  # BUG: Causes IndexError when floor_idx is n - 1 (e.g. p=100)
    
    weight = k - floor_idx
    # This line crashes with IndexError when ceil_idx == n
    return sorted_vals[floor_idx] * (1.0 - weight) + sorted_vals[ceil_idx] * weight
