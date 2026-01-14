"""
Signal Diversification Research

Test alternative moving average combinations and other momentum signals
to find complementary strategies that diversify returns.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime

from data_loader import DataLoader
from strategies import TieredMAStrategy
from backtest_engine import BacktestEngine
from config import BacktestConfig


def test_ma_combinations(data: pd.DataFrame, base_exposure_mm: float = 100.0) -> pd.DataFrame:
    """Test various MA period combinations."""

    combinations = [
        (10, 20), (10, 50), (20, 50), (20, 100),
        (50, 100), (50, 200), (100, 200),
        # Short-term
        (5, 10), (5, 20), (10, 30),
        # Long-term
        (100, 150), (150, 200),
    ]

    print("="*80)
    print("TESTING MA COMBINATIONS")
    print("="*80)

    results = []

    for ma_short, ma_long in combinations:
        # Ensure we have these MAs calculated
        if f'ma_{ma_short}' not in data.columns:
            data[f'ma_{ma_short}'] = data['price'].rolling(ma_short).mean()
        if f'ma_{ma_long}' not in data.columns:
            data[f'ma_{ma_long}'] = data['price'].rolling(ma_long).mean()

        data_clean = data.dropna()

        print(f"\nTesting MA({ma_short}, {ma_long})")

        strategy = TieredMAStrategy(base_exposure_mm=base_exposure_mm)
        engine = BacktestEngine(data_clean)

        engine.run_backtest(
            strategy=strategy,
            use_shift=True,
            ma_short=ma_short,
            ma_long=ma_long
        )

        comparison = engine.compare_strategies(['Tiered_MA_Cross'])
        metrics = comparison.iloc[0].to_dict()
        metrics['ma_short'] = ma_short
        metrics['ma_long'] = ma_long
        metrics['ma_ratio'] = ma_long / ma_short

        results.append(metrics)

        print(f"  Sharpe: {metrics['sharpe']:.3f}, Return: {metrics['annual_return_%']:.2f}%")

    return pd.DataFrame(results).sort_values('sharpe', ascending=False)


def test_rsi_strategy(data: pd.DataFrame) -> dict:
    """Test RSI-based strategy."""
    # Placeholder for RSI momentum strategy
    # Would implement: Buy when RSI < 30, Sell when RSI > 70
    print("\nRSI Strategy: To be implemented")
    return {}


def test_macd_strategy(data: pd.DataFrame) -> dict:
    """Test MACD-based strategy."""
    # Placeholder for MACD momentum strategy
    print("\nMACD Strategy: To be implemented")
    return {}


def main():
    """Run signal variation research."""

    print("="*80)
    print("SIGNAL VARIATION RESEARCH")
    print("="*80)

    # Load data
    config = BacktestConfig(years_back=10)
    loader = DataLoader()
    data = loader.fetch_data(config.start_date, config.end_date)
    data_clean = loader.calculate_indicators(ma_periods=list(range(5, 210, 5)))

    # Test MA combinations
    ma_results = test_ma_combinations(data_clean, base_exposure_mm=100.0)

    print("\n" + "="*80)
    print("TOP 10 MA COMBINATIONS")
    print("="*80)
    print(ma_results[['ma_short', 'ma_long', 'sharpe', 'annual_return_%', 'max_dd_%']].head(10))

    # Export
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    ma_results.to_excel(f'./output/research/signal_variations_{timestamp}.xlsx', index=False)
    print(f"\n  ✓ Results saved to ./output/research/signal_variations_{timestamp}.xlsx")


if __name__ == "__main__":
    main()
