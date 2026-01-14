"""
Strategy signal generation for Treasury futures.
"""
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Optional, Dict, Tuple


class BaseStrategy(ABC):
    """Abstract base class for trading strategies."""

    def __init__(self, name: str):
        """
        Initialize strategy.

        Args:
            name: Strategy name
        """
        self.name = name
        self.signals = None
        self.exposure_mm = None

    @abstractmethod
    def generate_signals(self, data: pd.DataFrame, **kwargs) -> pd.Series:
        """
        Generate trading signals.

        Args:
            data: Market data DataFrame
            **kwargs: Strategy-specific parameters

        Returns:
            Series with exposure in $mm for each date
        """
        pass

    def get_stats(self) -> Dict:
        """Get summary statistics of signals."""
        if self.exposure_mm is None:
            return {}

        return {
            'strategy': self.name,
            'long_days': (self.exposure_mm > 0).sum(),
            'short_days': (self.exposure_mm < 0).sum(),
            'flat_days': (self.exposure_mm == 0).sum(),
            'avg_long_exposure': self.exposure_mm[self.exposure_mm > 0].mean() if (self.exposure_mm > 0).any() else 0,
            'avg_short_exposure': self.exposure_mm[self.exposure_mm < 0].mean() if (self.exposure_mm < 0).any() else 0,
        }


class TieredMAStrategy(BaseStrategy):
    """Tiered Moving Average crossover strategy with filters."""

    def __init__(self, base_exposure_mm: float = 100.0):
        """
        Initialize Tiered MA strategy.

        Args:
            base_exposure_mm: Base exposure in $mm (before tiering)
        """
        super().__init__("Tiered_MA_Cross")
        self.base_exposure_mm = base_exposure_mm

    def generate_signals(self, data: pd.DataFrame,
                        ma_short: int = 20,
                        ma_long: int = 50,
                        price_dev_threshold: float = 0.001,
                        correlation_threshold: float = 0.0,
                        correlation_window: int = 20,
                        exposure_both: float = 1.0,
                        exposure_one: float = 0.5,
                        exposure_none: float = 0.0,
                        require_both_filters: bool = False) -> pd.Series:
        """
        Generate tiered MA crossover signals.

        Args:
            data: Market data with indicators
            ma_short: Short MA period
            ma_long: Long MA period
            price_dev_threshold: Price deviation threshold (Filter #8)
            correlation_threshold: Correlation threshold (Filter #19)
            correlation_window: Window for correlation calculation
            exposure_both: Exposure when both filters pass
            exposure_one: Exposure when one filter passes
            exposure_none: Exposure when no filters pass
            require_both_filters: If True, only trade when both filters pass

        Returns:
            Series with exposure in $mm
        """
        # Base direction signal
        ma_short_col = f'ma_{ma_short}'
        ma_long_col = f'ma_{ma_long}'
        corr_col = f'ty_spx_corr_{correlation_window}d'

        if ma_short_col not in data.columns or ma_long_col not in data.columns:
            raise ValueError(f"Missing MA columns. Available: {data.columns.tolist()}")

        direction = pd.Series(0, index=data.index)
        direction[data[ma_short_col] > data[ma_long_col]] = 1   # Bullish
        direction[data[ma_short_col] < data[ma_long_col]] = -1  # Bearish

        # Filter conditions
        filter_price_dev = (abs(data['price'] - data[ma_short_col]) / data['price']) >= price_dev_threshold
        filter_correlation = data[corr_col] <= correlation_threshold

        # Count filters passing
        both_pass = filter_price_dev & filter_correlation
        one_passes = (filter_price_dev & ~filter_correlation) | (~filter_price_dev & filter_correlation)
        neither_pass = ~filter_price_dev & ~filter_correlation

        # Tiered exposure
        exposure = pd.Series(0.0, index=data.index)

        if require_both_filters:
            # Strict: only trade when both filters pass
            exposure[both_pass] = self.base_exposure_mm * exposure_both
        else:
            # Tiered: scale exposure by filter count
            exposure[both_pass] = self.base_exposure_mm * exposure_both
            exposure[one_passes] = self.base_exposure_mm * exposure_one
            exposure[neither_pass] = self.base_exposure_mm * exposure_none

        # Apply direction
        exposure = exposure * direction

        # Store for analysis
        self.signals = direction
        self.exposure_mm = exposure
        self.filter_analysis = {
            'both_pass': both_pass,
            'one_passes': one_passes,
            'neither_pass': neither_pass,
            'filter_price_dev': filter_price_dev,
            'filter_correlation': filter_correlation,
        }

        return exposure

    def get_filter_breakdown(self) -> pd.DataFrame:
        """Get detailed breakdown of filter performance."""
        if self.filter_analysis is None:
            return pd.DataFrame()

        fa = self.filter_analysis
        only_price = fa['filter_price_dev'] & ~fa['filter_correlation']
        only_corr = ~fa['filter_price_dev'] & fa['filter_correlation']

        breakdown = pd.DataFrame({
            'State': ['Both Pass', 'Only Price Dev', 'Only Correlation', 'Neither Pass'],
            'Days': [
                fa['both_pass'].sum(),
                only_price.sum(),
                only_corr.sum(),
                fa['neither_pass'].sum()
            ]
        })

        breakdown['Pct_Days'] = 100 * breakdown['Days'] / len(self.exposure_mm)

        return breakdown


class MonthEndStrategy(BaseStrategy):
    """Month-End Long/Short pattern strategy."""

    def __init__(self, base_exposure_mm: float = 100.0):
        """
        Initialize Month-End strategy.

        Args:
            base_exposure_mm: Base exposure in $mm
        """
        super().__init__("MonthEnd_Long_Short")
        self.base_exposure_mm = base_exposure_mm

    def generate_signals(self, data: pd.DataFrame,
                        days_before: int = 5,
                        days_after: int = 5,
                        quarter_end_multiplier: float = 1.0) -> pd.Series:
        """
        Generate month-end long/short signals.

        Args:
            data: Market data with calendar features
            days_before: Days before month-end to go long
            days_after: Days after month-end (= first days of month) to go short
            quarter_end_multiplier: Multiplier for quarter-end positions

        Returns:
            Series with exposure in $mm
        """
        # Ensure we have the required calendar features
        if 'year_month' not in data.columns:
            data['year_month'] = data.index.to_period('M')

        exposure = pd.Series(0.0, index=data.index)

        # Group by month
        for period in data['year_month'].unique():
            month_mask = data['year_month'] == period
            month_idx = data[month_mask].index

            if len(month_idx) < max(days_before, days_after):
                continue  # Skip months with insufficient data

            # Long last N days of month
            long_indices = month_idx[-days_before:]
            exposure.loc[long_indices] = self.base_exposure_mm

            # Short first N days of month
            short_indices = month_idx[:days_after]
            exposure.loc[short_indices] = -self.base_exposure_mm

            # Apply quarter-end multiplier if applicable
            if quarter_end_multiplier != 1.0:
                # Check if any of the long days are quarter-end
                quarter_end_mask = data.loc[long_indices, 'is_quarter_end'] if 'is_quarter_end' in data.columns else False
                if quarter_end_mask.any():
                    exposure.loc[long_indices] *= quarter_end_multiplier

        self.exposure_mm = exposure
        return exposure

    def generate_signals_with_calendar_adjustments(self, data: pd.DataFrame,
                                                   days_before: int = 5,
                                                   days_after: int = 5,
                                                   fed_meeting_dates: Optional[pd.DatetimeIndex] = None,
                                                   jobs_report_dates: Optional[pd.DatetimeIndex] = None,
                                                   auction_dates: Optional[pd.DatetimeIndex] = None,
                                                   adjustment_window: int = 2) -> pd.Series:
        """
        Generate month-end signals with calendar event adjustments.

        This is for research - adjust month-end windows based on known market events.

        Args:
            data: Market data
            days_before: Base days before month-end
            days_after: Base days after month-end
            fed_meeting_dates: Dates of Fed meetings
            jobs_report_dates: Dates of jobs reports
            auction_dates: Dates of Treasury auctions
            adjustment_window: Days to adjust window around events

        Returns:
            Series with adjusted exposure
        """
        # Start with base signals
        exposure = self.generate_signals(data, days_before, days_after)

        # Adjust exposure around key events
        # This is a research template - actual implementation would depend on findings

        if fed_meeting_dates is not None:
            for date in fed_meeting_dates:
                if date in data.index:
                    # Example: reduce exposure around Fed meetings
                    window_mask = (data.index >= date - pd.Timedelta(days=adjustment_window)) & \
                                 (data.index <= date + pd.Timedelta(days=adjustment_window))
                    exposure[window_mask] *= 0.5

        # Similar logic could be added for jobs reports, auctions, etc.

        self.exposure_mm = exposure
        return exposure


class BuyAndHoldStrategy(BaseStrategy):
    """Simple buy-and-hold benchmark."""

    def __init__(self, exposure_mm: float = 200.0):
        """
        Initialize buy-and-hold strategy.

        Args:
            exposure_mm: Constant long exposure
        """
        super().__init__("Buy_And_Hold")
        self.constant_exposure_mm = exposure_mm

    def generate_signals(self, data: pd.DataFrame, **kwargs) -> pd.Series:
        """Generate constant long exposure."""
        exposure = pd.Series(self.constant_exposure_mm, index=data.index)
        self.exposure_mm = exposure
        return exposure


class CombinedStrategy(BaseStrategy):
    """Combine multiple strategies."""

    def __init__(self, strategies: Dict[str, BaseStrategy], name: str = "Combined"):
        """
        Initialize combined strategy.

        Args:
            strategies: Dict of strategy_name -> BaseStrategy
            name: Combined strategy name
        """
        super().__init__(name)
        self.strategies = strategies

    def generate_signals(self, data: pd.DataFrame, **kwargs) -> pd.Series:
        """
        Generate combined signals (sum of individual strategies).

        Args:
            data: Market data
            **kwargs: Strategy-specific parameters

        Returns:
            Combined exposure series
        """
        exposures = []

        for name, strategy in self.strategies.items():
            # Get strategy-specific config from kwargs if available
            strat_config = kwargs.get(name, {})
            exposure = strategy.generate_signals(data, **strat_config)
            exposures.append(exposure)

        # Sum all exposures
        combined_exposure = sum(exposures)
        self.exposure_mm = combined_exposure

        return combined_exposure

    def get_component_stats(self) -> pd.DataFrame:
        """Get statistics for each component strategy."""
        stats = []
        for name, strategy in self.strategies.items():
            stat = strategy.get_stats()
            if stat:
                stats.append(stat)

        return pd.DataFrame(stats)
