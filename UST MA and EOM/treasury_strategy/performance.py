"""
Performance analysis and visualization tools.
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings('ignore')


class PerformanceAnalyzer:
    """Analyze and visualize backtest performance."""

    def __init__(self, results: Dict[str, pd.DataFrame]):
        """
        Initialize performance analyzer.

        Args:
            results: Dict of strategy_name -> results DataFrame
        """
        self.results = results

    def plot_equity_curves(self, strategy_names: Optional[List[str]] = None,
                          figsize: tuple = (15, 8),
                          save_path: Optional[str] = None):
        """
        Plot equity curves for multiple strategies.

        Args:
            strategy_names: List of strategies to plot (None = all)
            figsize: Figure size
            save_path: Path to save figure (None = display only)
        """
        if strategy_names is None:
            strategy_names = list(self.results.keys())

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=figsize, height_ratios=[2, 1])

        colors = plt.cm.tab10(np.linspace(0, 1, len(strategy_names)))

        # Plot equity curves
        for idx, name in enumerate(strategy_names):
            if name not in self.results:
                continue

            results = self.results[name]
            if 'equity_curve' in results.columns:
                results['equity_curve'].plot(ax=ax1, label=name, color=colors[idx],
                                            linewidth=2, alpha=0.8)

        ax1.set_title('Equity Curves', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Equity (Starting = 1.0)')
        ax1.legend(loc='best')
        ax1.grid(True, alpha=0.3)

        # Plot drawdowns
        for idx, name in enumerate(strategy_names):
            if name not in self.results:
                continue

            results = self.results[name]
            if 'drawdown' in results.columns:
                (results['drawdown'] * 100).plot(ax=ax2, label=name, color=colors[idx],
                                                linewidth=2, alpha=0.8)

        ax2.set_title('Drawdowns', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Drawdown (%)')
        ax2.set_xlabel('Date')
        ax2.legend(loc='best')
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  [OK] Equity curves saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_performance_comparison(self, metrics_df: pd.DataFrame,
                                   figsize: tuple = (16, 10),
                                   save_path: Optional[str] = None):
        """
        Create comprehensive performance comparison dashboard.

        Args:
            metrics_df: DataFrame with performance metrics
            figsize: Figure size
            save_path: Path to save figure
        """
        fig = plt.figure(figsize=figsize)
        gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)

        strategies = metrics_df['strategy'].tolist()
        colors = plt.cm.Set3(np.linspace(0, 1, len(strategies)))

        # 1. Sharpe Ratio comparison
        ax1 = fig.add_subplot(gs[0, 0])
        ax1.barh(strategies, metrics_df['sharpe'], color=colors, edgecolor='black', alpha=0.8)
        ax1.set_xlabel('Sharpe Ratio')
        ax1.set_title('Sharpe Ratio Comparison', fontweight='bold')
        ax1.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        ax1.grid(True, alpha=0.3, axis='x')

        # 2. Annual Return vs Volatility
        ax2 = fig.add_subplot(gs[0, 1])
        scatter = ax2.scatter(metrics_df['annual_vol_%'], metrics_df['annual_return_%'],
                            s=200, c=range(len(strategies)), cmap='Set3',
                            edgecolors='black', linewidth=1.5, alpha=0.8)
        for idx, row in metrics_df.iterrows():
            ax2.annotate(row['strategy'], (row['annual_vol_%'], row['annual_return_%']),
                        fontsize=8, ha='center')
        ax2.set_xlabel('Annual Volatility (%)')
        ax2.set_ylabel('Annual Return (%)')
        ax2.set_title('Return vs Volatility', fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.5)

        # 3. Max Drawdown
        ax3 = fig.add_subplot(gs[0, 2])
        ax3.barh(strategies, metrics_df['max_dd_%'], color=colors, edgecolor='black', alpha=0.8)
        ax3.set_xlabel('Max Drawdown (%)')
        ax3.set_title('Maximum Drawdown', fontweight='bold')
        ax3.grid(True, alpha=0.3, axis='x')

        # 4. Win Rate
        ax4 = fig.add_subplot(gs[1, 0])
        ax4.barh(strategies, metrics_df['win_rate_%'], color=colors, edgecolor='black', alpha=0.8)
        ax4.set_xlabel('Win Rate (%)')
        ax4.set_title('Win Rate', fontweight='bold')
        ax4.axvline(x=50, color='red', linestyle='--', linewidth=1, label='50%')
        ax4.grid(True, alpha=0.3, axis='x')

        # 5. Sortino Ratio
        ax5 = fig.add_subplot(gs[1, 1])
        ax5.barh(strategies, metrics_df['sortino'], color=colors, edgecolor='black', alpha=0.8)
        ax5.set_xlabel('Sortino Ratio')
        ax5.set_title('Sortino Ratio', fontweight='bold')
        ax5.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        ax5.grid(True, alpha=0.3, axis='x')

        # 6. Annual P&L
        ax6 = fig.add_subplot(gs[1, 2])
        ax6.barh(strategies, metrics_df['annual_pnl_mm'], color=colors, edgecolor='black', alpha=0.8)
        ax6.set_xlabel('Annual P&L ($mm)')
        ax6.set_title('Annual P&L ($mm)', fontweight='bold')
        ax6.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        ax6.grid(True, alpha=0.3, axis='x')

        plt.suptitle('Performance Comparison Dashboard', fontsize=16, fontweight='bold', y=0.995)

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  [OK] Performance dashboard saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_monthly_returns_heatmap(self, strategy_name: str,
                                    monthly_returns: pd.Series,
                                    figsize: tuple = (14, 8),
                                    save_path: Optional[str] = None):
        """
        Create monthly returns heatmap.

        Args:
            strategy_name: Name of strategy
            monthly_returns: Series of monthly returns (fraction)
            figsize: Figure size
            save_path: Path to save figure
        """
        # Convert to percentage and reshape
        monthly_pct = monthly_returns * 100

        # Create year-month pivot
        df = pd.DataFrame({
            'return': monthly_pct,
            'year': monthly_pct.index.year,
            'month': monthly_pct.index.month
        })

        pivot = df.pivot(index='year', columns='month', values='return')
        pivot.columns = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        # Create heatmap
        fig, ax = plt.subplots(figsize=figsize)

        sns.heatmap(pivot, annot=True, fmt='.1f', cmap='RdYlGn', center=0,
                   linewidths=1, ax=ax, cbar_kws={'label': 'Return (%)'},
                   vmin=-5, vmax=5)

        ax.set_title(f'{strategy_name}: Monthly Returns Heatmap', fontsize=14, fontweight='bold')
        ax.set_xlabel('Month')
        ax.set_ylabel('Year')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  [OK] Monthly heatmap saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_rolling_metrics(self, strategy_name: str,
                            window: int = 252,
                            figsize: tuple = (15, 10),
                            save_path: Optional[str] = None):
        """
        Plot rolling performance metrics.

        Args:
            strategy_name: Name of strategy
            window: Rolling window in days
            figsize: Figure size
            save_path: Path to save figure
        """
        if strategy_name not in self.results:
            print(f"Strategy {strategy_name} not found")
            return

        results = self.results[strategy_name]
        pnl = results['pnl_daily']
        exposure = results['exposure_mm'].abs().mean()
        returns = pnl / exposure if exposure > 0 else pd.Series(0, index=pnl.index)

        fig, axes = plt.subplots(3, 1, figsize=figsize, sharex=True)

        # Rolling return
        rolling_return = returns.rolling(window).mean() * 252 * 100
        rolling_return.plot(ax=axes[0], color='blue', linewidth=2)
        axes[0].set_title(f'{strategy_name}: Rolling Annual Return ({window}d)', fontweight='bold')
        axes[0].set_ylabel('Annual Return (%)')
        axes[0].axhline(y=0, color='black', linestyle='--', linewidth=0.5)
        axes[0].grid(True, alpha=0.3)

        # Rolling volatility
        rolling_vol = returns.rolling(window).std() * np.sqrt(252) * 100
        rolling_vol.plot(ax=axes[1], color='orange', linewidth=2)
        axes[1].set_title(f'Rolling Annual Volatility ({window}d)', fontweight='bold')
        axes[1].set_ylabel('Annual Volatility (%)')
        axes[1].grid(True, alpha=0.3)

        # Rolling Sharpe
        rolling_sharpe = (returns.rolling(window).mean() / returns.rolling(window).std()) * np.sqrt(252)
        rolling_sharpe.plot(ax=axes[2], color='green', linewidth=2)
        axes[2].set_title(f'Rolling Sharpe Ratio ({window}d)', fontweight='bold')
        axes[2].set_ylabel('Sharpe Ratio')
        axes[2].set_xlabel('Date')
        axes[2].axhline(y=0, color='black', linestyle='--', linewidth=0.5)
        axes[2].grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  [OK] Rolling metrics saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def create_tearsheet(self, strategy_name: str, metrics: Dict,
                        monthly_returns: pd.Series,
                        save_dir: str = './output'):
        """
        Create comprehensive strategy tearsheet.

        Args:
            strategy_name: Name of strategy
            metrics: Dictionary of performance metrics
            monthly_returns: Monthly returns series
            save_dir: Directory to save outputs
        """
        print(f"\n{'='*80}")
        print(f"CREATING TEARSHEET: {strategy_name}")
        print(f"{'='*80}")

        # Create visualizations
        self.plot_equity_curves([strategy_name],
                               save_path=f"{save_dir}/{strategy_name}_equity.png")

        self.plot_monthly_returns_heatmap(strategy_name, monthly_returns,
                                         save_path=f"{save_dir}/{strategy_name}_monthly_heatmap.png")

        self.plot_rolling_metrics(strategy_name,
                                 save_path=f"{save_dir}/{strategy_name}_rolling.png")

        print(f"\n  [OK] Tearsheet visualizations created in {save_dir}")

    def print_performance_summary(self, metrics_df: pd.DataFrame):
        """Print formatted performance summary table."""
        print(f"\n{'='*80}")
        print("PERFORMANCE SUMMARY")
        print(f"{'='*80}\n")

        # Format and print table
        pd.options.display.float_format = '{:.2f}'.format

        display_cols = ['strategy', 'sharpe', 'annual_return_%', 'annual_vol_%',
                       'max_dd_%', 'win_rate_%', 'annual_pnl_mm']

        available_cols = [col for col in display_cols if col in metrics_df.columns]

        print(metrics_df[available_cols].to_string(index=False))
        print()
