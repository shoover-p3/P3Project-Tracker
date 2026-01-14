"""
Broader Fixed Income Research

Explore opportunities beyond 10Y Treasury futures:
1. Other Treasury maturities (2Y, 5Y, 30Y)
2. Curve trades (steepening/flattening)
3. Cross-market strategies
4. Duration-weighted portfolios
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np


TREASURY_CONTRACTS = {
    'TU1 Comdty': '2Y Treasury Futures',
    'FV1 Comdty': '5Y Treasury Futures',
    'TY1 Comdty': '10Y Treasury Futures',
    'TN1 Comdty': '10Y Ultra Treasury Futures',
    'US1 Comdty': '30Y Treasury Futures',
    'WN1 Comdty': '30Y Ultra Treasury Futures',
}


def research_yield_curve_strategies():
    """
    Research yield curve momentum and mean reversion strategies.

    Potential strategies:
    1. 2s10s steepener/flattener based on momentum
    2. 5s30s curve trades
    3. Butterfly spreads (2s-5s-10s)
    """
    print("="*80)
    print("YIELD CURVE STRATEGIES")
    print("="*80)

    print("\nPotential strategies to implement:")
    print("  1. 2s10s Steepener: Long TY, Short TU when curve steepening")
    print("  2. 5s30s Flattener: Long FV, Short US when curve flattening")
    print("  3. Butterfly: Curve shape plays using 2s/5s/10s")
    print("  4. Barbell vs Bullet: 2s+30s vs 10Y")

    print("\nData requirements:")
    print("  - Multiple Treasury futures contracts")
    print("  - Calculate spread time series")
    print("  - Apply MA cross or mean reversion signals")


def research_cross_market_opportunities():
    """
    Research strategies that combine Treasuries with other markets.

    Ideas:
    1. TY vs SPX momentum divergence
    2. TY vs commodities (inflation hedge)
    3. TY vs FX (carry trade implications)
    """
    print("\n" + "="*80)
    print("CROSS-MARKET STRATEGIES")
    print("="*80)

    print("\nPotential cross-market strategies:")
    print("  1. Risk On/Off: Long TY + Short SPX when risk-off signal")
    print("  2. Inflation Trade: TY vs commodity index")
    print("  3. Fed Policy Trade: TY position based on Fed fund futures")


def main():
    """Run fixed income opportunity research."""

    print("="*80)
    print("FIXED INCOME RESEARCH OPPORTUNITIES")
    print("="*80)

    print("\nAvailable Treasury Futures Contracts:")
    for ticker, description in TREASURY_CONTRACTS.items():
        print(f"  {ticker}: {description}")

    research_yield_curve_strategies()
    research_cross_market_opportunities()

    print("\n" + "="*80)
    print("NEXT STEPS")
    print("="*80)
    print("1. Fetch data for all Treasury contracts")
    print("2. Calculate curve spreads and relationships")
    print("3. Test MA cross signals on curve spreads")
    print("4. Test month-end effects on different maturities")
    print("5. Develop multi-contract portfolio strategies")


if __name__ == "__main__":
    main()
