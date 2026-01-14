# Treasury Futures Strategy - Refactoring and Research Status

**Date:** January 13, 2026
**Status:** Core refactoring complete, research framework ready

---

## ✅ COMPLETED

### 1. Code Refactoring (100% Complete)

Successfully refactored the Jupyter notebook into production-ready modular Python code:

#### Core Modules Created:

- **`config.py`**: Configuration management with dataclasses
  - `BacktestConfig`: Date ranges, exposure, allocations
  - `TieredMAConfig`: MA parameters and filters
  - `MonthEndConfig`: Month-end strategy parameters
  - `ResearchConfig`: Research experiment configurations

- **`data_loader.py`**: Data acquisition and preprocessing
  - Bloomberg data fetching (TY1, SPX)
  - Technical indicator calculation (MAs, RSI, ATR, correlations)
  - Calendar feature engineering for month-end research
  - Data persistence (save/load CSV)

- **`strategies.py`**: Strategy signal generation
  - `BaseStrategy`: Abstract base class
  - `TieredMAStrategy`: MA crossover with tiered filters
  - `MonthEndStrategy`: Month-end long/short patterns
  - `BuyAndHoldStrategy`: Benchmark
  - `CombinedStrategy`: Portfolio composition

- **`backtest_engine.py`**: Backtesting framework
  - Run individual or combined backtests
  - Proper signal timing handling (shift vs no-shift)
  - Performance metrics calculation
  - Period aggregation (monthly/quarterly/annual)
  - Excel export functionality

- **`performance.py`**: Analysis and visualization
  - Equity curve plotting
  - Performance comparison dashboards
  - Monthly returns heatmaps
  - Rolling metrics analysis
  - Tearsheet generation

- **`main.py`**: Main execution script
  - Replicates original notebook functionality
  - Orchestrates full backtest workflow
  - Generates comprehensive outputs

#### Research Framework Created:

- **`research/research_monthend_timing.py`** (READY TO RUN)
  - Window optimization (15+ configurations)
  - Intra-month return pattern analysis
  - Quarter-end vs month-end comparison
  - Visualization tools for all analyses

- **`research/research_signal_variations.py`** (TEMPLATE)
  - MA combination testing framework
  - Placeholder for RSI/MACD strategies
  - Ready for expansion

- **`research/research_additional_filters.py`** (TEMPLATE)
  - Volume filter testing
  - Volatility regime filters
  - Framework for additional filter research

- **`research/research_fixed_income_opportunities.py`** (TEMPLATE)
  - Yield curve strategy templates
  - Cross-market opportunity ideas
  - Multi-contract portfolio concepts

---

## 🔄 IN PROGRESS

### Month-End Trade Research (PRIMARY FOCUS)

**Context from Analysis:**
- Original notebook had TWO versions of month-end timing
- Version 1: Used `.shift(1)` (lagged, INCORRECT but may have performed better)
- Version 2: No shift (correct timing for knowable dates)
- The "5 days before/after" is a CRUDE estimate

**Research Priority:**
Investigate what really drives month-end profitability and optimize timing

**Ready to Execute:**
```bash
cd treasury_strategy
python main.py  # Run base backtest
python research/research_monthend_timing.py  # Run month-end research
```

---

## 📋 TODO (Prioritized)

### HIGH PRIORITY

1. **Run Month-End Timing Research** 🎯
   - Execute `research_monthend_timing.py`
   - Analyze window optimization results
   - Identify optimal before/after day configurations
   - Document findings

2. **Calendar Event Integration**
   - Obtain Fed meeting dates (FOMC calendar)
   - Obtain jobs report dates (BLS calendar)
   - Obtain Treasury auction schedules
   - Integrate into month-end timing model
   - Test event-adjusted windows

3. **Complete Signal Variation Testing**
   - Run MA combination tests
   - Implement and test RSI strategy
   - Implement and test MACD strategy
   - Compare momentum signal correlations

### MEDIUM PRIORITY

4. **Additional Filter Research**
   - Implement volume filters
   - Test volatility regime filters
   - Test trend strength filters (ADX)
   - Evaluate filter combinations

5. **Fixed Income Expansion**
   - Fetch data for 2Y, 5Y, 30Y futures
   - Calculate curve spreads (2s10s, 5s30s)
   - Test MA signals on spreads
   - Test month-end on multiple maturities

### LOW PRIORITY

6. **Documentation and Reporting**
   - Create comprehensive research report
   - Document optimal configurations
   - Provide implementation recommendations
   - Create visualization summary

---

## 🚀 HOW TO RESUME TOMORROW

### Step 1: Environment Setup
```bash
cd "C:\Users\SHoover\ClaudeProjects\UST MA and EOM\treasury_strategy"

# Ensure dependencies installed
# pip install pandas numpy matplotlib seaborn xbbg xlsxwriter
```

### Step 2: Run Base Backtest (Verify Setup)
```bash
python main.py
```

**Expected Output:**
- Data fetched from Bloomberg
- Backtest completed for all strategies
- Excel file in `./output/`
- 4 chart files in `./output/`

### Step 3: Run Month-End Research (PRIMARY)
```bash
python research/research_monthend_timing.py
```

**This will:**
- Test 15+ window configurations
- Analyze intra-month patterns
- Compare quarter-end effects
- Generate optimization charts
- Export results to Excel

**Review:**
- `output/research/monthend_window_optimization.png` → Find best windows
- `output/research/monthend_intramonth_patterns.png` → Understand flow timing
- `output/research/monthend_research_[timestamp].xlsx` → Detailed metrics

### Step 4: Interpret Results

**Key Questions:**
1. What window configuration has highest Sharpe?
2. Does it differ from the original (5, 5)?
3. Are returns concentrated in specific days?
4. Is there a quarter-end premium?

### Step 5: Next Research Phases

Based on month-end findings:
```bash
# Test signal variations
python research/research_signal_variations.py

# Test additional filters
python research/research_additional_filters.py

# Explore fixed income
python research/research_fixed_income_opportunities.py
```

---

## 📊 KEY INSIGHTS FROM CODE REVIEW

### Original Strategy Composition:
- **50% Tiered MA (20/50)** with filters:
  - Filter #8: Price deviation ≥ 0.1% from MA20
  - Filter #19: TY/SPX correlation ≤ 0
  - Tiered exposure: 100% both filters, 50% one filter, 0% neither

- **50% Month-End**:
  - Long last 5 days of month
  - Short first 5 days of month

- **Total Exposure**: $200mm

### Timing Logic Clarified:
- **MA Strategy**: Signal(t) → shift(1) → Return(t+1) [Reactive]
- **Month-End**: Signal(t) → Return(t) [Pre-announced, NO shift]

### The Mystery:
The original notebook kept BOTH timing versions because the "incorrect" lagged version may have shown better performance. This suggests month-end flows occur at DIFFERENT times than assumed.

---

## 🔍 RESEARCH HYPOTHESES TO TEST

1. **Optimal Window Hypothesis**: 5/5 days is not optimal; actual flows concentrated in 3-7 days before, 3-5 days after

2. **Event Timing Hypothesis**: Month-end effects shift based on Fed meetings, jobs reports, and Treasury auctions

3. **Quarter-End Premium**: Quarter-ends show stronger/weaker effects than regular months

4. **Volatility Interaction**: Month-end effect stronger in certain volatility regimes

5. **Curve Position**: Different Treasury maturities show different month-end patterns

---

## 📁 FILE STRUCTURE

```
UST MA and EOM/
├── TY.Agent.ipynb                      # Original notebook (large)
├── TY_20_50_MA_ME_ Agent.ipynb        # Original notebook (two versions)
├── STATUS.md                           # This file
└── treasury_strategy/                  # New modular codebase
    ├── config.py                       # Configuration
    ├── data_loader.py                  # Data handling
    ├── strategies.py                   # Strategy logic
    ├── backtest_engine.py              # Backtesting
    ├── performance.py                  # Analysis
    ├── main.py                         # Main execution
    ├── output/                         # Results directory
    │   └── research/                   # Research outputs
    └── research/                       # Research scripts
        ├── research_monthend_timing.py
        ├── research_signal_variations.py
        ├── research_additional_filters.py
        └── research_fixed_income_opportunities.py
```

---

## ✅ DELIVERABLES STATUS

- [x] Clean modular codebase
- [ ] Comprehensive month-end analysis (READY TO RUN)
- [ ] Signal variation test results (FRAMEWORK READY)
- [ ] Additional filter research (FRAMEWORK READY)
- [ ] Fixed income research (FRAMEWORK READY)
- [ ] Final recommendations report (PENDING)

---

## 🎯 IMMEDIATE NEXT ACTION

**RUN THIS COMMAND:**
```bash
cd "C:\Users\SHoover\ClaudeProjects\UST MA and EOM\treasury_strategy"
python research/research_monthend_timing.py
```

This will generate the core research needed to answer the primary question about month-end timing optimization.

---

**Questions?** Review this STATUS.md file for context on any component.
