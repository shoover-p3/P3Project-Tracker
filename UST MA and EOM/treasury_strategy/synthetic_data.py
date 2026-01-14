"""
Synthetic data generation for Treasury futures strategy testing.

Generates realistic synthetic data when Bloomberg API is not available.
"""
import pandas as pd
import numpy as np
from datetime import datetime


def generate_synthetic_treasury_data(start_date: datetime, end_date: datetime) -> pd.DataFrame:
    """
    Generate synthetic Treasury futures and equity data.

    Args:
        start_date: Start date
        end_date: End date

    Returns:
        DataFrame with columns: open, high, low, close, volume, spx_close
    """
    # Generate business day date range
    dates = pd.bdate_range(start=start_date, end=end_date)
    n = len(dates)

    np.random.seed(42)  # For reproducibility

    # Generate Treasury futures price series (TY futures ~120-130 range)
    # Treasury futures have lower volatility than equities
    base_price = 125.0
    daily_returns = np.random.normal(0.0001, 0.004, n)  # ~0.4% daily vol

    # Add some trending behavior (mean reversion)
    trend = np.cumsum(np.random.normal(0, 0.002, n))
    returns_with_trend = daily_returns + trend * 0.1

    prices = base_price * np.exp(np.cumsum(returns_with_trend))

    # Generate OHLC from close prices
    close_prices = prices

    # High/Low relative to close (realistic intraday ranges)
    high_pct = np.abs(np.random.normal(0.002, 0.001, n))
    low_pct = -np.abs(np.random.normal(0.002, 0.001, n))

    high_prices = close_prices * (1 + high_pct)
    low_prices = close_prices * (1 + low_pct)

    # Open is random between previous close and current close
    open_prices = np.roll(close_prices, 1) + (close_prices - np.roll(close_prices, 1)) * np.random.uniform(0, 1, n)
    open_prices[0] = close_prices[0]

    # Ensure OHLC consistency (H >= O,C and L <= O,C)
    high_prices = np.maximum.reduce([high_prices, open_prices, close_prices])
    low_prices = np.minimum.reduce([low_prices, open_prices, close_prices])

    # Volume (Treasury futures have high volume)
    volume = np.random.lognormal(14, 0.5, n).astype(int)  # Mean ~1M contracts

    # Generate SPX Index (negative correlation with Treasuries)
    spx_base = 3000.0
    spx_returns = -0.3 * daily_returns + np.random.normal(0.0005, 0.01, n)  # Higher vol, slight negative corr
    spx_prices = spx_base * np.exp(np.cumsum(spx_returns))

    # Create DataFrame
    data = pd.DataFrame({
        'open': open_prices,
        'high': high_prices,
        'low': low_prices,
        'close': close_prices,
        'volume': volume,
        'spx_close': spx_prices,
    }, index=dates)

    return data


if __name__ == '__main__':
    # Test generation
    start = datetime(2016, 1, 1)
    end = datetime(2026, 1, 14)

    data = generate_synthetic_treasury_data(start, end)

    print("Synthetic Data Generated:")
    print(f"  Shape: {data.shape}")
    print(f"  Date Range: {data.index[0]} to {data.index[-1]}")
    print(f"\nFirst 5 rows:")
    print(data.head())
    print(f"\nLast 5 rows:")
    print(data.tail())
    print(f"\nSummary Statistics:")
    print(data.describe())
