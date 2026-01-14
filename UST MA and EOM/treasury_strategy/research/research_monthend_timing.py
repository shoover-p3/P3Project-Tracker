"""
Month-End Trade Timing Research

PRIMARY RESEARCH FOCUS: Improve month-end trade timing beyond simple "5 days before/after"

Research Questions:
1. What is the optimal window size (symmetric vs asymmetric)?
2. How do calendar events (Fed, jobs, auctions) affect timing?
3. Are quarter-ends different from regular month-ends?
4. How does timing interact with volatility/volume patterns?

Historical Context:
- Original "5 days before/after" showed BETTER performance with timing bug (lagged)
- This suggests the actual month-end flows may occur at different times than assumed
- Need to investigate what drives the profitability of this trade
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

from data_loader import DataLoader
from strategies import MonthEndStrategy
from backtest_engine import BacktestEngine
from config import BacktestConfig


class MonthEndResearcher:
    """Research framework for month-end timing optimization."""

    def __init__(self, data: pd.DataFrame, base_exposure_mm: float = 100.0):
        """
        Initialize researcher.

        Args:
            data: Market data with calendar features
            base_exposure_mm: Base exposure for month-end trades
        """
        self.data = data
        self.base_exposure_mm = base_exposure_mm
        self.results = {}

    def test_window_variations(self, windows_to_test: list = None) -> pd.DataFrame:
        """
        Test various month-end window configurations.

        Args:
            windows_to_test: List of (days_before, days_after) tuples

        Returns:
            DataFrame with results for each window configuration
        """
        if windows_to_test is None:
            windows_to_test = [
                # Symmetric windows
                (3, 3), (5, 5), (7, 7), (10, 10),
                # Asymmetric - longer before
                (7, 3), (10, 5), (10, 3), (7, 5),
                # Asymmetric - longer after
                (3, 7), (5, 10), (3, 10), (5, 7),
                # Extended windows
                (15, 5), (5, 15), (15, 15),
            ]

        print("="*80)
        print("TESTING MONTH-END WINDOW VARIATIONS")
        print("="*80)

        results = []

        for days_before, days_after in windows_to_test:
            print(f"\nTesting window: {days_before} days before, {days_after} days after")

            # Create strategy
            strategy = MonthEndStrategy(base_exposure_mm=self.base_exposure_mm)

            # Run backtest
            engine = BacktestEngine(self.data)
            engine.run_backtest(
                strategy=strategy,
                use_shift=False,  # Correct timing
                days_before=days_before,
                days_after=days_after
            )

            # Get metrics
            comparison = engine.compare_strategies(['MonthEnd_Long_Short'])
            metrics = comparison.iloc[0].to_dict()
            metrics['days_before'] = days_before
            metrics['days_after'] = days_after
            metrics['total_days'] = days_before + days_after
            metrics['window_type'] = self._classify_window(days_before, days_after)

            results.append(metrics)

            print(f"  Sharpe: {metrics['sharpe']:.3f}, "
                  f"Annual Return: {metrics['annual_return_%']:.2f}%")

        results_df = pd.DataFrame(results)

        # Sort by Sharpe ratio
        results_df = results_df.sort_values('sharpe', ascending=False)

        self.results['window_variations'] = results_df

        return results_df

    def _classify_window(self, days_before: int, days_after: int) -> str:
        """Classify window type."""
        if days_before == days_after:
            return 'Symmetric'
        elif days_before > days_after:
            return 'Front-loaded'
        else:
            return 'Back-loaded'

    def analyze_intramonth_returns(self) -> pd.DataFrame:
        """
        Analyze return patterns throughout the month.

        Returns:
            DataFrame with average returns by day-of-month
        """
        print("\n" + "="*80)
        print("ANALYZING INTRA-MONTH RETURN PATTERNS")
        print("="*80)

        # Calculate day-from-month-end
        df = self.data.copy()
        df['year_month'] = df.index.to_period('M')

        # Group by month and calculate position from end
        grouped = df.groupby('year_month')
        df['days_to_month_end'] = grouped.cumcount(ascending=False)
        df['days_from_month_start'] = grouped.cumcount()

        # Average returns by position
        end_analysis = df.groupby('days_to_month_end')['returns'].agg([
            ('mean_return', 'mean'),
            ('std_return', 'std'),
            ('count', 'count'),
            ('positive_pct', lambda x: (x > 0).sum() / len(x) * 100)
        ]).reset_index()

        start_analysis = df.groupby('days_from_month_start')['returns'].agg([
            ('mean_return', 'mean'),
            ('std_return', 'std'),
            ('count', 'count'),
            ('positive_pct', lambda x: (x > 0).sum() / len(x) * 100)
        ]).reset_index()

        # Calculate cumulative returns
        end_analysis['cumulative_return'] = end_analysis['mean_return'].cumsum()
        start_analysis['cumulative_return'] = start_analysis['mean_return'].cumsum()

        self.results['end_analysis'] = end_analysis
        self.results['start_analysis'] = start_analysis

        return end_analysis, start_analysis

    def analyze_quarter_end_effect(self) -> pd.DataFrame:
        """
        Compare quarter-end vs regular month-end performance.

        Returns:
            DataFrame comparing quarter vs non-quarter month-ends
        """
        print("\n" + "="*80)
        print("ANALYZING QUARTER-END EFFECTS")
        print("="*80)

        if 'is_quarter_end' not in self.data.columns:
            print("  Warning: is_quarter_end column not found")
            return pd.DataFrame()

        # Test standard window for quarter vs non-quarter
        results = []

        for is_qtr_end in [True, False]:
            label = "Quarter-End" if is_qtr_end else "Non-Quarter"

            # Filter data
            if is_qtr_end:
                # Only keep months that are quarter-ends (March, June, Sep, Dec)
                data_filtered = self.data[self.data.index.month.isin([3, 6, 9, 12])].copy()
            else:
                # Only keep non-quarter-end months
                data_filtered = self.data[~self.data.index.month.isin([3, 6, 9, 12])].copy()

            if len(data_filtered) == 0:
                continue

            # Run backtest
            strategy = MonthEndStrategy(base_exposure_mm=self.base_exposure_mm)
            engine = BacktestEngine(data_filtered)
            engine.run_backtest(
                strategy=strategy,
                use_shift=False,
                days_before=5,
                days_after=5
            )

            # Get metrics
            comparison = engine.compare_strategies(['MonthEnd_Long_Short'])
            metrics = comparison.iloc[0].to_dict()
            metrics['period_type'] = label

            results.append(metrics)

            print(f"\n  {label}:")
            print(f"    Sharpe: {metrics['sharpe']:.3f}")
            print(f"    Annual Return: {metrics['annual_return_%']:.2f}%")
            print(f"    Observations: {metrics['days']}")

        results_df = pd.DataFrame(results)
        self.results['quarter_end_comparison'] = results_df

        return results_df

    def plot_window_optimization(self, save_path: str = None):
        """Visualize window optimization results."""
        if 'window_variations' not in self.results:
            print("Run test_window_variations() first")
            return

        results = self.results['window_variations']

        fig, axes = plt.subplots(2, 2, figsize=(16, 12))

        # 1. Sharpe by window configuration
        ax1 = axes[0, 0]
        top_n = 15
        top_results = results.head(top_n)
        labels = [f"({int(r['days_before'])}, {int(r['days_after'])})"
                 for _, r in top_results.iterrows()]
        colors = ['green' if r['sharpe'] > 0 else 'red' for _, r in top_results.iterrows()]

        ax1.barh(range(len(top_results)), top_results['sharpe'], color=colors, alpha=0.7, edgecolor='black')
        ax1.set_yticks(range(len(top_results)))
        ax1.set_yticklabels(labels)
        ax1.set_xlabel('Sharpe Ratio')
        ax1.set_title(f'Top {top_n} Window Configurations by Sharpe', fontweight='bold')
        ax1.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        ax1.grid(True, alpha=0.3, axis='x')

        # 2. Return vs Volatility scatter
        ax2 = axes[0, 1]
        scatter = ax2.scatter(results['annual_vol_%'], results['annual_return_%'],
                             c=results['sharpe'], cmap='RdYlGn', s=100,
                             edgecolors='black', linewidth=1, alpha=0.7)
        ax2.set_xlabel('Annual Volatility (%)')
        ax2.set_ylabel('Annual Return (%)')
        ax2.set_title('Return vs Volatility by Window Config', fontweight='bold')
        ax2.grid(True, alpha=0.3)
        plt.colorbar(scatter, ax=ax2, label='Sharpe Ratio')

        # 3. Heatmap: days_before vs days_after
        ax3 = axes[1, 0]
        pivot = results.pivot_table(values='sharpe', index='days_before', columns='days_after')
        sns.heatmap(pivot, annot=True, fmt='.2f', cmap='RdYlGn', center=0,
                   linewidths=1, ax=ax3, cbar_kws={'label': 'Sharpe Ratio'})
        ax3.set_title('Sharpe Ratio Heatmap: Days Before vs Days After', fontweight='bold')
        ax3.set_xlabel('Days After Month-End')
        ax3.set_ylabel('Days Before Month-End')

        # 4. Window type comparison
        ax4 = axes[1, 1]
        type_avg = results.groupby('window_type')['sharpe'].mean().sort_values()
        colors_type = ['green' if x > 0 else 'red' for x in type_avg.values]
        ax4.barh(type_avg.index, type_avg.values, color=colors_type, alpha=0.7, edgecolor='black')
        ax4.set_xlabel('Average Sharpe Ratio')
        ax4.set_title('Average Performance by Window Type', fontweight='bold')
        ax4.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        ax4.grid(True, alpha=0.3, axis='x')

        plt.suptitle('Month-End Window Optimization Analysis', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  ✓ Window optimization plot saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_intramonth_patterns(self, save_path: str = None):
        """Visualize intra-month return patterns."""
        if 'end_analysis' not in self.results or 'start_analysis' not in self.results:
            print("Run analyze_intramonth_returns() first")
            return

        end_analysis = self.results['end_analysis']
        start_analysis = self.results['start_analysis']

        fig, axes = plt.subplots(2, 2, figsize=(16, 10))

        # 1. Average returns by days to month-end
        ax1 = axes[0, 0]
        ax1.bar(end_analysis['days_to_month_end'][:20], end_analysis['mean_return'][:20] * 100,
               color=['green' if x > 0 else 'red' for x in end_analysis['mean_return'][:20]],
               alpha=0.7, edgecolor='black')
        ax1.set_xlabel('Days to Month-End')
        ax1.set_ylabel('Average Daily Return (%)')
        ax1.set_title('Average Returns by Days to Month-End', fontweight='bold')
        ax1.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
        ax1.grid(True, alpha=0.3, axis='y')
        ax1.invert_xaxis()

        # 2. Average returns by days from month-start
        ax2 = axes[0, 1]
        ax2.bar(start_analysis['days_from_month_start'][:20], start_analysis['mean_return'][:20] * 100,
               color=['green' if x > 0 else 'red' for x in start_analysis['mean_return'][:20]],
               alpha=0.7, edgecolor='black')
        ax2.set_xlabel('Days from Month-Start')
        ax2.set_ylabel('Average Daily Return (%)')
        ax2.set_title('Average Returns by Days from Month-Start', fontweight='bold')
        ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
        ax2.grid(True, alpha=0.3, axis='y')

        # 3. Cumulative returns from month-end
        ax3 = axes[1, 0]
        ax3.plot(end_analysis['days_to_month_end'][:20],
                end_analysis['cumulative_return'][:20] * 100,
                marker='o', linewidth=2, markersize=4, color='blue')
        ax3.set_xlabel('Days to Month-End')
        ax3.set_ylabel('Cumulative Return (%)')
        ax3.set_title('Cumulative Returns Leading to Month-End', fontweight='bold')
        ax3.axhline(y=0, color='black', linestyle='--', linewidth=0.5)
        ax3.grid(True, alpha=0.3)
        ax3.invert_xaxis()

        # 4. Cumulative returns from month-start
        ax4 = axes[1, 1]
        ax4.plot(start_analysis['days_from_month_start'][:20],
                start_analysis['cumulative_return'][:20] * 100,
                marker='o', linewidth=2, markersize=4, color='orange')
        ax4.set_xlabel('Days from Month-Start')
        ax4.set_ylabel('Cumulative Return (%)')
        ax4.set_title('Cumulative Returns from Month-Start', fontweight='bold')
        ax4.axhline(y=0, color='black', linestyle='--', linewidth=0.5)
        ax4.grid(True, alpha=0.3)

        plt.suptitle('Intra-Month Return Pattern Analysis', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  ✓ Intra-month patterns plot saved to {save_path}")
        else:
            plt.show()

        plt.close()


def main():
    """Run month-end timing research."""

    print("="*80)
    print("MONTH-END TIMING RESEARCH")
    print("="*80)

    # Load data
    print("\nLoading data...")
    config = BacktestConfig(years_back=10)
    loader = DataLoader()

    data = loader.fetch_data(config.start_date, config.end_date)
    data_clean = loader.calculate_indicators()
    data_clean = loader.get_calendar_features(data_clean)

    # Initialize researcher
    researcher = MonthEndResearcher(data_clean, base_exposure_mm=100.0)

    # Research 1: Test window variations
    print("\n1. Testing Window Variations...")
    window_results = researcher.test_window_variations()

    print("\nTop 10 Window Configurations:")
    print(window_results[['days_before', 'days_after', 'sharpe', 'annual_return_%',
                          'max_dd_%', 'win_rate_%']].head(10).to_string(index=False))

    # Research 2: Intra-month patterns
    print("\n2. Analyzing Intra-Month Patterns...")
    end_analysis, start_analysis = researcher.analyze_intramonth_returns()

    # Research 3: Quarter-end effects
    print("\n3. Analyzing Quarter-End Effects...")
    quarter_results = researcher.analyze_quarter_end_effect()

    # Create visualizations
    os.makedirs('./output/research', exist_ok=True)

    researcher.plot_window_optimization('./output/research/monthend_window_optimization.png')
    researcher.plot_intramonth_patterns('./output/research/monthend_intramonth_patterns.png')

    # Export results
    print("\nExporting results...")
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    with pd.ExcelWriter(f'./output/research/monthend_research_{timestamp}.xlsx',
                       engine='xlsxwriter') as writer:
        window_results.to_excel(writer, sheet_name='Window_Variations', index=False)
        end_analysis.to_excel(writer, sheet_name='Month_End_Patterns', index=False)
        start_analysis.to_excel(writer, sheet_name='Month_Start_Patterns', index=False)
        if not quarter_results.empty:
            quarter_results.to_excel(writer, sheet_name='Quarter_End_Analysis', index=False)

    print(f"  ✓ Results saved to ./output/research/monthend_research_{timestamp}.xlsx")

    print("\n" + "="*80)
    print("RESEARCH COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()
