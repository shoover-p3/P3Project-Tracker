# Treasury Futures Strategy - Modular Backtesting Framework

Production-ready Python codebase for backtesting and researching Treasury futures strategies.

## Quick Start

### Run Base Backtest
```bash
python main.py
```

### Run Research Modules
```bash
# Month-end timing optimization (PRIMARY RESEARCH FOCUS)
python research/research_monthend_timing.py

# Signal variation testing
python research/research_signal_variations.py

# Additional filter research
python research/research_additional_filters.py

# Fixed income opportunities
python research/research_fixed_income_opportunities.py
```

## Dependencies

```bash
pip install pandas numpy matplotlib seaborn xbbg xlsxwriter
```

## Module Overview

- **`config.py`**: Configuration management
- **`data_loader.py`**: Bloomberg data fetching and preprocessing
- **`strategies.py`**: Strategy signal generation
- **`backtest_engine.py`**: Backtesting framework
- **`performance.py`**: Performance analysis and visualization
- **`main.py`**: Main execution script

## Strategy Description

### Standard Portfolio (50/50)

1. **Tiered MA Cross (50%)**: 20/50 day MA with filters
2. **Month-End Long/Short (50%)**: Calendar-based pattern

### Configuration

Edit `config.py` or pass parameters to strategies:

```python
from config import BacktestConfig, TieredMAConfig, MonthEndConfig

backtest_config = BacktestConfig(
    years_back=10,
    total_exposure_mm=200.0
)

tiered_config = TieredMAConfig(
    ma_short=20,
    ma_long=50,
    require_both_filters=False
)

monthend_config = MonthEndConfig(
    days_before_monthend=5,
    days_after_monthend=5
)
```

## Output

All results saved to `./output/`:
- Excel files with detailed metrics
- Equity curve charts
- Performance comparison dashboards
- Research-specific visualizations in `./output/research/`

## Research Focus

See `../STATUS.md` for detailed research plan and priorities.
