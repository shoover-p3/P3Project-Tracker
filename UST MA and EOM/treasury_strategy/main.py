"""
Main execution script for Treasury futures strategy backtest.

This replicates the functionality of the original notebook with improved modularity.
"""
import sys
import os
from datetime import datetime
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import BacktestConfig, TieredMAConfig, MonthEndConfig
from data_loader import DataLoader
from strategies import TieredMAStrategy, MonthEndStrategy, BuyAndHoldStrategy
from backtest_engine import BacktestEngine
from performance import PerformanceAnalyzer


def main():
    """Main execution function."""

    print("="*80)
    print("TREASURY FUTURES STRATEGY BACKTEST")
    print("="*80)

    # ========================================================================
    # CONFIGURATION
    # ========================================================================
    print("\n1. Loading Configuration...")

    backtest_config = BacktestConfig(
        years_back=10,
        total_exposure_mm=200.0,
        tiered_allocation=0.50,
        monthend_allocation=0.50
    )

    tiered_config = TieredMAConfig(
        ma_short=20,
        ma_long=50,
        filter_price_deviation_threshold=0.001,
        filter_correlation_threshold=0.0,
        correlation_window=20,
        require_both_filters=False  # Set to True for stricter version
    )

    monthend_config = MonthEndConfig(
        days_before_monthend=5,
        days_after_monthend=5,
        use_shift=False  # False = correct timing (knowable in advance)
    )

    print(f"  Date Range: {backtest_config.start_date.strftime('%Y-%m-%d')} to "
          f"{backtest_config.end_date.strftime('%Y-%m-%d')}")
    print(f"  Total Exposure: ${backtest_config.total_exposure_mm}mm")
    print(f"  Tiered MA: {backtest_config.tiered_allocation*100:.0f}% "
          f"(${backtest_config.tiered_base_mm}mm)")
    print(f"  MonthEnd: {backtest_config.monthend_allocation*100:.0f}% "
          f"(${backtest_config.monthend_base_mm}mm)")

    # ========================================================================
    # DATA ACQUISITION
    # ========================================================================
    print("\n2. Data Acquisition...")

    data_loader = DataLoader(
        treasury_ticker=backtest_config.treasury_ticker,
        equity_ticker=backtest_config.equity_ticker
    )

    # Fetch data
    data = data_loader.fetch_data(
        start_date=backtest_config.start_date,
        end_date=backtest_config.end_date
    )

    # Calculate indicators
    data_clean = data_loader.calculate_indicators(
        ma_periods=[tiered_config.ma_short, tiered_config.ma_long, tiered_config.ma_trend],
        correlation_window=tiered_config.correlation_window
    )

    # Add calendar features for month-end strategy
    data_clean = data_loader.get_calendar_features(data_clean)

    # ========================================================================
    # STRATEGY SETUP
    # ========================================================================
    print("\n3. Setting up Strategies...")

    tiered_strategy = TieredMAStrategy(
        base_exposure_mm=backtest_config.tiered_base_mm
    )

    monthend_strategy = MonthEndStrategy(
        base_exposure_mm=backtest_config.monthend_base_mm
    )

    buyhold_strategy = BuyAndHoldStrategy(
        exposure_mm=backtest_config.total_exposure_mm
    )

    print(f"  ✓ Tiered MA Strategy (${backtest_config.tiered_base_mm}mm base)")
    print(f"  ✓ MonthEnd Strategy (${backtest_config.monthend_base_mm}mm base)")
    print(f"  ✓ Buy & Hold Benchmark (${backtest_config.total_exposure_mm}mm)")

    # ========================================================================
    # BACKTESTING
    # ========================================================================
    print("\n4. Running Backtests...")

    engine = BacktestEngine(data_clean)

    # Run combined strategy (standard portfolio)
    strategies_dict = {
        'Tiered_MA': (
            tiered_strategy,
            True,  # use_shift = True (reactive to MA signals)
            {
                'ma_short': tiered_config.ma_short,
                'ma_long': tiered_config.ma_long,
                'price_dev_threshold': tiered_config.filter_price_deviation_threshold,
                'correlation_threshold': tiered_config.filter_correlation_threshold,
                'correlation_window': tiered_config.correlation_window,
                'require_both_filters': tiered_config.require_both_filters,
            }
        ),
        'MonthEnd': (
            monthend_strategy,
            monthend_config.use_shift,  # use_shift = False (knowable in advance)
            {
                'days_before': monthend_config.days_before_monthend,
                'days_after': monthend_config.days_after_monthend,
            }
        )
    }

    # Run combined backtest
    combined_results = engine.run_combined_backtest(
        strategies=strategies_dict,
        combined_name='Standard_Portfolio'
    )

    # Run buy & hold benchmark
    buyhold_results = engine.run_backtest(
        strategy=buyhold_strategy,
        use_shift=True
    )

    # ========================================================================
    # PERFORMANCE ANALYSIS
    # ========================================================================
    print("\n5. Performance Analysis...")

    # Compare strategies
    comparison = engine.compare_strategies()

    # Print performance summary
    analyzer = PerformanceAnalyzer(engine.results)
    analyzer.print_performance_summary(comparison)

    # ========================================================================
    # VISUALIZATIONS
    # ========================================================================
    print("\n6. Creating Visualizations...")

    output_dir = './output'
    os.makedirs(output_dir, exist_ok=True)

    # Plot equity curves
    analyzer.plot_equity_curves(
        strategy_names=['Standard_Portfolio', 'Tiered_MA', 'MonthEnd', 'Buy_And_Hold'],
        save_path=f'{output_dir}/equity_curves.png'
    )

    # Plot performance comparison
    analyzer.plot_performance_comparison(
        metrics_df=comparison,
        save_path=f'{output_dir}/performance_comparison.png'
    )

    # Monthly returns heatmap for standard portfolio
    monthly_returns = engine.aggregate_returns('Standard_Portfolio', 'M')
    analyzer.plot_monthly_returns_heatmap(
        strategy_name='Standard_Portfolio',
        monthly_returns=monthly_returns,
        save_path=f'{output_dir}/monthly_heatmap.png'
    )

    # Rolling metrics
    analyzer.plot_rolling_metrics(
        strategy_name='Standard_Portfolio',
        window=252,
        save_path=f'{output_dir}/rolling_metrics.png'
    )

    # ========================================================================
    # EXPORT RESULTS
    # ========================================================================
    print("\n7. Exporting Results...")

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    excel_filename = f'{output_dir}/Treasury_Backtest_{timestamp}.xlsx'

    engine.export_results(excel_filename)

    # ========================================================================
    # FILTER ANALYSIS (for Tiered MA)
    # ========================================================================
    print("\n8. Filter State Analysis...")

    filter_breakdown = tiered_strategy.get_filter_breakdown()
    print("\nTiered MA Filter Breakdown:")
    print(filter_breakdown.to_string(index=False))

    # ========================================================================
    # SUMMARY
    # ========================================================================
    print("\n" + "="*80)
    print("BACKTEST COMPLETE")
    print("="*80)

    std_metrics = comparison[comparison['strategy'] == 'Standard_Portfolio'].iloc[0]
    print(f"\n📊 STANDARD PORTFOLIO (${backtest_config.total_exposure_mm}mm exposure):")
    print(f"   Annual Return:  {std_metrics['annual_return_%']:>6.2f}%")
    print(f"   Annual P&L:     ${std_metrics['annual_pnl_mm']:>6.1f}mm")
    print(f"   Sharpe Ratio:   {std_metrics['sharpe']:>7.2f}")
    print(f"   Max Drawdown:   {std_metrics['max_dd_%']:>6.2f}%")
    print(f"   Win Rate:       {std_metrics['win_rate_%']:>6.1f}%")

    print(f"\n📁 Files Generated:")
    print(f"   Excel: {excel_filename}")
    print(f"   Charts: {output_dir}/")

    print("\n" + "="*80)
    print("READY FOR ANALYSIS")
    print("="*80)


if __name__ == "__main__":
    main()
