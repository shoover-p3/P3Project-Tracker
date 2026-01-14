"""
Backtesting engine for Treasury futures strategies.
"""
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
from strategies import BaseStrategy


class BacktestEngine:
    """Core backtesting engine for strategy evaluation."""

    def __init__(self, data: pd.DataFrame):
        """
        Initialize backtest engine.

        Args:
            data: Market data with returns
        """
        self.data = data
        self.results = {}

    def run_backtest(self, strategy: BaseStrategy,
                    use_shift: bool = True,
                    **strategy_kwargs) -> pd.DataFrame:
        """
        Run backtest for a strategy.

        Args:
            strategy: Strategy object to backtest
            use_shift: Whether to shift signals by 1 day (True for reactive signals)
            **strategy_kwargs: Parameters to pass to strategy.generate_signals()

        Returns:
            DataFrame with daily P&L and performance metrics
        """
        print(f"\n{'='*80}")
        print(f"BACKTESTING: {strategy.name}")
        print(f"{'='*80}")

        # Generate signals
        exposure_mm = strategy.generate_signals(self.data, **strategy_kwargs)

        # Calculate P&L
        if use_shift:
            # Reactive signals: position at t generates return at t+1
            pnl_daily = exposure_mm.shift(1) * self.data['returns']
            timing_note = "shifted (reactive)"
        else:
            # Knowable signals: position at t generates return at t
            pnl_daily = exposure_mm * self.data['returns']
            timing_note = "unshifted (pre-announced)"

        print(f"  Signal timing: {timing_note}")

        # Store results
        results_df = pd.DataFrame(index=self.data.index)
        results_df['exposure_mm'] = exposure_mm
        results_df['pnl_daily'] = pnl_daily
        results_df['returns'] = self.data['returns']

        # Calculate cumulative equity
        results_df['equity_curve'] = (1 + pnl_daily / exposure_mm.abs().mean()).cumprod()

        # Calculate drawdown
        results_df['cummax'] = results_df['equity_curve'].expanding().max()
        results_df['drawdown'] = (results_df['equity_curve'] - results_df['cummax']) / results_df['cummax']

        # Store in engine
        self.results[strategy.name] = results_df

        # Print summary stats
        stats = strategy.get_stats()
        if stats:
            print(f"  Long days:  {stats.get('long_days', 0)}")
            print(f"  Short days: {stats.get('short_days', 0)}")
            print(f"  Flat days:  {stats.get('flat_days', 0)}")

        return results_df

    def run_combined_backtest(self, strategies: Dict[str, Tuple[BaseStrategy, bool, dict]],
                            combined_name: str = "Combined") -> pd.DataFrame:
        """
        Run backtest for multiple strategies and combine results.

        Args:
            strategies: Dict of {name: (strategy, use_shift, kwargs)}
            combined_name: Name for combined strategy

        Returns:
            DataFrame with combined P&L
        """
        print(f"\n{'='*80}")
        print(f"BACKTESTING: {combined_name} Strategy")
        print(f"{'='*80}")

        component_pnls = []
        component_exposures = []

        for name, (strategy, use_shift, kwargs) in strategies.items():
            print(f"\n  Component: {strategy.name}")

            # Generate signals
            exposure_mm = strategy.generate_signals(self.data, **kwargs)

            # Calculate P&L with appropriate timing
            if use_shift:
                pnl_daily = exposure_mm.shift(1) * self.data['returns']
                print(f"    Timing: shifted (reactive)")
            else:
                pnl_daily = exposure_mm * self.data['returns']
                print(f"    Timing: unshifted (knowable)")

            component_pnls.append(pnl_daily)
            component_exposures.append(exposure_mm)

            # Store individual component
            comp_results = pd.DataFrame(index=self.data.index)
            comp_results['exposure_mm'] = exposure_mm
            comp_results['pnl_daily'] = pnl_daily
            comp_results['returns'] = self.data['returns']

            # Calculate equity curve and drawdown for component
            comp_results['equity_curve'] = (1 + pnl_daily / exposure_mm.abs().mean()).cumprod()
            comp_results['cummax'] = comp_results['equity_curve'].expanding().max()
            comp_results['drawdown'] = (comp_results['equity_curve'] - comp_results['cummax']) / comp_results['cummax']

            self.results[name] = comp_results

            # Print stats
            stats = strategy.get_stats()
            if stats:
                print(f"    Long: {stats.get('long_days', 0)} days, "
                      f"Short: {stats.get('short_days', 0)} days, "
                      f"Flat: {stats.get('flat_days', 0)} days")

        # Combine results
        combined_pnl = sum(component_pnls)
        combined_exposure = sum(component_exposures)

        results_df = pd.DataFrame(index=self.data.index)
        results_df['exposure_mm'] = combined_exposure
        results_df['pnl_daily'] = combined_pnl
        results_df['returns'] = self.data['returns']

        # Calculate performance metrics
        results_df['equity_curve'] = (1 + combined_pnl / combined_exposure.abs().mean()).cumprod()
        results_df['cummax'] = results_df['equity_curve'].expanding().max()
        results_df['drawdown'] = (results_df['equity_curve'] - results_df['cummax']) / results_df['cummax']

        self.results[combined_name] = results_df

        print(f"\n  {combined_name} P&L combined from {len(strategies)} components")

        return results_df

    def get_results(self, strategy_name: str) -> Optional[pd.DataFrame]:
        """Get backtest results for a specific strategy."""
        return self.results.get(strategy_name)

    def compare_strategies(self, strategy_names: Optional[list] = None) -> pd.DataFrame:
        """
        Compare performance across multiple strategies.

        Args:
            strategy_names: List of strategy names to compare (None = all)

        Returns:
            DataFrame with comparison metrics
        """
        if strategy_names is None:
            strategy_names = list(self.results.keys())

        comparison = []

        for name in strategy_names:
            if name not in self.results:
                continue

            results = self.results[name]
            metrics = self._calculate_metrics(results)
            metrics['strategy'] = name
            comparison.append(metrics)

        return pd.DataFrame(comparison)

    def _calculate_metrics(self, results: pd.DataFrame) -> Dict:
        """Calculate performance metrics for a strategy."""
        pnl = results['pnl_daily'].dropna()
        exposure = results['exposure_mm']

        # Calculate returns as fraction of exposure
        avg_exposure = exposure.abs().mean()
        if avg_exposure == 0:
            returns = pd.Series(0, index=pnl.index)
        else:
            returns = pnl / avg_exposure

        # Basic metrics
        total_return = (1 + returns).prod() - 1
        years = len(returns) / 252
        annual_return = (1 + total_return) ** (1 / years) - 1
        annual_vol = returns.std() * np.sqrt(252)

        # Risk-adjusted metrics
        sharpe = annual_return / annual_vol if annual_vol > 0 else 0

        downside_returns = returns[returns < 0]
        downside_vol = downside_returns.std() * np.sqrt(252) if len(downside_returns) > 0 else 0
        sortino = annual_return / downside_vol if downside_vol > 0 else 0

        # Drawdown metrics
        max_dd = results['drawdown'].min()
        calmar = annual_return / abs(max_dd) if max_dd != 0 else 0

        # Win metrics
        win_rate = (returns > 0).sum() / len(returns) if len(returns) > 0 else 0
        avg_win = returns[returns > 0].mean() if (returns > 0).any() else 0
        avg_loss = returns[returns < 0].mean() if (returns < 0).any() else 0
        profit_factor = abs(avg_win / avg_loss) if avg_loss != 0 else 0

        # Dollar metrics
        total_pnl_mm = pnl.sum()
        annual_pnl_mm = total_pnl_mm / years

        return {
            'total_return_%': total_return * 100,
            'annual_return_%': annual_return * 100,
            'annual_vol_%': annual_vol * 100,
            'sharpe': sharpe,
            'sortino': sortino,
            'max_dd_%': max_dd * 100,
            'calmar': calmar,
            'win_rate_%': win_rate * 100,
            'avg_win_%': avg_win * 100,
            'avg_loss_%': avg_loss * 100,
            'profit_factor': profit_factor,
            'total_pnl_mm': total_pnl_mm,
            'annual_pnl_mm': annual_pnl_mm,
            'avg_exposure_mm': avg_exposure,
            'days': len(returns)
        }

    def aggregate_returns(self, strategy_name: str, period: str = 'M') -> pd.Series:
        """
        Aggregate daily returns to monthly/quarterly/annual.

        Args:
            strategy_name: Name of strategy
            period: 'M' for monthly, 'Q' for quarterly, 'Y' for yearly

        Returns:
            Series with aggregated returns
        """
        if strategy_name not in self.results:
            raise ValueError(f"Strategy {strategy_name} not found in results")

        results = self.results[strategy_name]
        pnl = results['pnl_daily'].dropna()
        exposure = results['exposure_mm'].abs().mean()

        returns = pnl / exposure if exposure > 0 else pd.Series(0, index=pnl.index)

        # Aggregate by period
        df = pd.DataFrame({'ret': returns})
        df['year'] = returns.index.year

        if period == 'M':
            df['month'] = returns.index.month
            grouped = df.groupby(['year', 'month'])
            period_returns = grouped['ret'].apply(lambda x: (1 + x).prod() - 1)
            period_returns.index = pd.to_datetime([f"{y}-{m:02d}-01" for y, m in period_returns.index])
        elif period == 'Q':
            df['quarter'] = returns.index.quarter
            grouped = df.groupby(['year', 'quarter'])
            period_returns = grouped['ret'].apply(lambda x: (1 + x).prod() - 1)
            period_returns.index = [f"{y}Q{q}" for y, q in period_returns.index]
        elif period == 'Y':
            period_returns = df.groupby('year')['ret'].apply(lambda x: (1 + x).prod() - 1)
        else:
            raise ValueError("period must be 'M', 'Q', or 'Y'")

        return period_returns

    def export_results(self, filename: str, strategy_names: Optional[list] = None):
        """
        Export backtest results to Excel.

        Args:
            filename: Output Excel filename
            strategy_names: List of strategies to export (None = all)
        """
        if strategy_names is None:
            strategy_names = list(self.results.keys())

        print(f"\n{'='*80}")
        print("EXPORTING RESULTS")
        print(f"{'='*80}")

        with pd.ExcelWriter(filename, engine='xlsxwriter') as writer:
            # Summary comparison
            comparison = self.compare_strategies(strategy_names)
            comparison.to_excel(writer, sheet_name='Performance_Summary', index=False)
            print(f"  [OK] Performance summary exported")

            # Daily results for each strategy
            for name in strategy_names:
                if name not in self.results:
                    continue

                results = self.results[name]
                results.to_excel(writer, sheet_name=f'{name[:30]}_Daily')

            print(f"  [OK] Daily results exported for {len(strategy_names)} strategies")

            # Monthly/Quarterly/Annual aggregations
            for period, sheet_suffix in [('M', 'Monthly'), ('Q', 'Quarterly'), ('Y', 'Annual')]:
                agg_df = pd.DataFrame()
                for name in strategy_names:
                    try:
                        period_returns = self.aggregate_returns(name, period)
                        agg_df[f'{name}_%'] = period_returns * 100
                    except:
                        pass

                if not agg_df.empty:
                    agg_df.to_excel(writer, sheet_name=f'{sheet_suffix}_Returns')
                    print(f"  [OK] {sheet_suffix} returns exported")

        print(f"\n  [OK] Excel file saved: {filename}")
