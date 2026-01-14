"""
Data loading and preprocessing for Treasury futures strategy.
"""
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional, Dict
import warnings
warnings.filterwarnings('ignore')


class DataLoader:
    """Handles data acquisition and preprocessing for backtesting."""

    def __init__(self, treasury_ticker: str = 'TY1 Comdty',
                 equity_ticker: str = 'SPX Index',
                 use_synthetic: bool = False):
        """
        Initialize DataLoader.

        Args:
            treasury_ticker: Bloomberg ticker for Treasury futures
            equity_ticker: Bloomberg ticker for equity index (correlation filter)
            use_synthetic: If True, use synthetic data instead of Bloomberg
        """
        self.treasury_ticker = treasury_ticker
        self.equity_ticker = equity_ticker
        self.use_synthetic = use_synthetic
        self.raw_data = None
        self.processed_data = None

    def fetch_data(self, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Fetch market data from Bloomberg or generate synthetic data.

        Args:
            start_date: Start date for data
            end_date: End date for data

        Returns:
            Combined DataFrame with Treasury and equity data
        """
        print(f"\n{'='*80}")
        print("DATA ACQUISITION")
        print(f"{'='*80}")

        # Use synthetic data if requested or if Bloomberg not available
        if self.use_synthetic:
            return self._fetch_synthetic_data(start_date, end_date)

        # Try to import Bloomberg API
        try:
            import blpapi  # Test this first
            from xbbg import blp
        except (ImportError, ModuleNotFoundError, Exception) as e:
            print(f"\n  WARNING: Bloomberg not available: {str(e)[:100]}")
            print("  -> Falling back to synthetic data for testing")
            self.use_synthetic = True
            return self._fetch_synthetic_data(start_date, end_date)

        # Fetch Treasury futures data
        print(f"\nFetching {self.treasury_ticker}...")
        try:
            ty_data = blp.bdh(
                tickers=self.treasury_ticker,
                flds=['PX_OPEN', 'PX_HIGH', 'PX_LOW', 'PX_LAST', 'PX_VOLUME'],
                start_date=start_date,
                end_date=end_date
            )

            ty_data.columns = ['_'.join(col).strip() for col in ty_data.columns.values]
            ty_data.columns = ['open', 'high', 'low', 'close', 'volume']

            print(f"  [OK] Treasury data: {len(ty_data)} observations")
            print(f"  [OK] Date range: {ty_data.index[0]} to {ty_data.index[-1]}")

        except Exception as e:
            print(f"  [ERROR] {e}")
            raise

        # Fetch equity index data
        print(f"\nFetching {self.equity_ticker} (for correlation filter)...")
        try:
            spx_data = blp.bdh(
                tickers=self.equity_ticker,
                flds='PX_LAST',
                start_date=start_date,
                end_date=end_date
            )

            spx_data.columns = ['spx_close']

            print(f"  [OK] Equity data: {len(spx_data)} observations")

        except Exception as e:
            print(f"  [ERROR] {e}")
            raise

        # Merge data
        data = pd.concat([ty_data, spx_data], axis=1).fillna(method='ffill')

        print(f"\n  Combined dataset: {len(data)} observations")
        print(f"  Missing values: {data.isnull().sum().sum()}")

        self.raw_data = data
        return data

    def _fetch_synthetic_data(self, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Generate synthetic data for testing when Bloomberg is not available.

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            DataFrame with synthetic Treasury and equity data
        """
        from synthetic_data import generate_synthetic_treasury_data

        print("\n  Using SYNTHETIC DATA for testing")
        print("  " + "="*76)

        data = generate_synthetic_treasury_data(start_date, end_date)

        # Rename columns to match expected format
        if 'returns' in data.columns:
            data = data.drop('returns', axis=1)  # Will be recalculated

        self.raw_data = data
        return data

    def calculate_indicators(self, data: Optional[pd.DataFrame] = None,
                           ma_periods: list = [20, 50, 200],
                           correlation_window: int = 20) -> pd.DataFrame:
        """
        Calculate technical indicators and features.

        Args:
            data: Input DataFrame (uses self.raw_data if None)
            ma_periods: List of moving average periods to calculate
            correlation_window: Window for rolling correlation

        Returns:
            DataFrame with calculated indicators
        """
        if data is None:
            if self.raw_data is None:
                raise ValueError("No data available. Call fetch_data() first.")
            data = self.raw_data.copy()
        else:
            data = data.copy()

        print(f"\n{'='*80}")
        print("CALCULATING INDICATORS")
        print(f"{'='*80}")

        # Price and returns
        data['price'] = data['close']
        data['returns'] = data['price'].pct_change()

        # Moving averages
        for period in ma_periods:
            data[f'ma_{period}'] = data['price'].rolling(period).mean()

        print(f"  [OK] Moving averages calculated: {ma_periods}")

        # Equity returns and correlation
        data['spx_returns'] = data['spx_close'].pct_change()
        data['ty_spx_corr_{0}d'.format(correlation_window)] = \
            data['returns'].rolling(correlation_window).corr(data['spx_returns'])

        print(f"  [OK] TY/SPX correlation calculated ({correlation_window}-day rolling)")

        # Additional technical indicators (for research)
        data['atr_14'] = self._calculate_atr(data, period=14)
        data['rsi_14'] = self._calculate_rsi(data['price'], period=14)

        print(f"  [OK] Additional indicators: ATR(14), RSI(14)")

        # Clean data
        data_clean = data.dropna()
        print(f"  [OK] Clean data: {len(data_clean)} observations (after removing NaN)")

        self.processed_data = data_clean
        return data_clean

    def _calculate_atr(self, data: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Average True Range."""
        high = data['high']
        low = data['low']
        close = data['close']

        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())

        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(period).mean()

        return atr

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index."""
        delta = prices.diff()

        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        return rsi

    def get_calendar_features(self, data: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Add calendar-based features for month-end research.

        Args:
            data: Input DataFrame (uses self.processed_data if None)

        Returns:
            DataFrame with calendar features added
        """
        if data is None:
            if self.processed_data is None:
                raise ValueError("No processed data. Call calculate_indicators() first.")
            data = self.processed_data.copy()
        else:
            data = data.copy()

        # Ensure index is DatetimeIndex
        if not isinstance(data.index, pd.DatetimeIndex):
            data.index = pd.to_datetime(data.index)

        # Date features
        data['year'] = data.index.year
        data['month'] = data.index.month
        data['quarter'] = data.index.quarter
        data['day_of_week'] = data.index.dayofweek
        data['is_month_end'] = data.index.is_month_end
        data['is_quarter_end'] = data.index.is_quarter_end

        # Days from month boundaries
        data['year_month'] = data.index.to_period('M')
        data['days_in_month'] = data.index.days_in_month
        data['day_of_month'] = data.index.day

        # Calculate days from start and end of month
        month_groups = data.groupby('year_month')
        data['day_from_month_start'] = month_groups.cumcount()
        data['day_from_month_end'] = month_groups['day_from_month_start'].transform('max') - \
                                     data['day_from_month_start']

        return data

    def save_data(self, filename: str, data: Optional[pd.DataFrame] = None):
        """Save processed data to CSV."""
        if data is None:
            data = self.processed_data

        if data is None:
            raise ValueError("No data to save.")

        data.to_csv(filename)
        print(f"  [OK] Data saved to {filename}")

    def load_data(self, filename: str) -> pd.DataFrame:
        """Load previously saved data from CSV."""
        data = pd.read_csv(filename, index_col=0, parse_dates=True)
        self.processed_data = data
        print(f"  [OK] Data loaded from {filename}")
        return data
