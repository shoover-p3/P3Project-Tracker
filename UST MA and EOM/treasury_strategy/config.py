"""
Configuration parameters for Treasury futures strategy backtesting.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional


@dataclass
class BacktestConfig:
    """Configuration for backtest parameters."""

    # Date range
    start_date: datetime = None
    end_date: datetime = None
    years_back: int = 10

    # Exposure and allocation
    total_exposure_mm: float = 200.0  # Total portfolio exposure in $mm
    tiered_allocation: float = 0.50   # 50% to Tiered MA
    monthend_allocation: float = 0.50  # 50% to MonthEnd

    # Data tickers
    treasury_ticker: str = 'TY1 Comdty'  # 10Y Treasury Futures
    equity_ticker: str = 'SPX Index'     # S&P 500 for correlation filter

    def __post_init__(self):
        """Initialize derived parameters."""
        if self.end_date is None:
            self.end_date = datetime.now()
        if self.start_date is None:
            self.start_date = self.end_date - timedelta(days=365 * self.years_back)

        self.tiered_base_mm = self.total_exposure_mm * self.tiered_allocation
        self.monthend_base_mm = self.total_exposure_mm * self.monthend_allocation


@dataclass
class TieredMAConfig:
    """Configuration for Tiered Moving Average strategy."""

    # Moving average periods
    ma_short: int = 20
    ma_long: int = 50
    ma_trend: int = 200  # For potential future use

    # Filter thresholds
    filter_price_deviation_threshold: float = 0.001  # 0.1% (Filter #8)
    filter_correlation_threshold: float = 0.0        # TY/SPX correlation (Filter #19)
    correlation_window: int = 20

    # Tiered exposure levels
    exposure_both_filters: float = 1.0   # 100% when both filters pass
    exposure_one_filter: float = 0.5     # 50% when one filter passes
    exposure_no_filters: float = 0.0     # 0% when no filters pass

    # Alternative: require both filters
    require_both_filters: bool = False


@dataclass
class MonthEndConfig:
    """Configuration for Month-End Long/Short strategy."""

    # Standard month-end windows
    days_before_monthend: int = 5  # Long last N days
    days_after_monthend: int = 5   # Short first N days

    # Timing treatment
    use_shift: bool = False  # False = correct timing (knowable in advance)

    # Research parameters (for testing variations)
    adjust_for_fed_meetings: bool = False
    adjust_for_jobs_report: bool = False
    adjust_for_treasury_auctions: bool = False
    quarter_end_multiplier: float = 1.0  # Increase exposure at quarter-end


@dataclass
class ResearchConfig:
    """Configuration for research experiments."""

    # Month-end timing variations to test
    monthend_windows_to_test: list = None

    # MA combinations to test
    ma_combinations_to_test: list = None

    # Additional momentum indicators to test
    test_rsi: bool = True
    test_macd: bool = True
    test_atr: bool = True
    test_bollinger: bool = True

    # Additional filters to test
    test_volume_filter: bool = True
    test_volatility_filter: bool = True
    test_trend_filter: bool = True

    def __post_init__(self):
        """Initialize default test parameters."""
        if self.monthend_windows_to_test is None:
            self.monthend_windows_to_test = [
                (3, 3), (5, 5), (7, 7), (10, 10),  # Symmetric windows
                (5, 3), (7, 5), (10, 5),           # Asymmetric windows
            ]

        if self.ma_combinations_to_test is None:
            self.ma_combinations_to_test = [
                (10, 20), (10, 50), (20, 50),      # Short-term
                (20, 100), (50, 100), (50, 200),   # Medium-term
                (10, 30, 60), (20, 50, 100),       # Triple MA
            ]


def get_default_config() -> tuple:
    """Get default configuration objects."""
    return (
        BacktestConfig(),
        TieredMAConfig(),
        MonthEndConfig(),
        ResearchConfig()
    )
