# MT5 Peak Single-Digit Drawdown Ensembles Master Vault

This directory contains dedicated packages for all **10 Optimized Single-Digit Drawdown (< 10%) Quantitative Ensembles** tested on 360,000 real MetaTrader 5 broker bars (`XAUUSD_M5_MT5.csv`, 2021–2026, $25,000 capital, $250 flat base risk).

## Directory Structure

```
MT5_Single_Digit_Ensembles/
│
├── INDEX.html                                # Master Visual Catalog Application
├── README.md                                 # This documentation index
│
├── Ensemble_01_6Engine_Peak_Champion/        # Rank #1 Peak Champion (+$125.8k, 9.41% DD, 2.06 PF)
│   ├── Stratmarket_Performance_Report.html   # StratMarket Dossier (clean publication format)
│   ├── backtest_runner.py                    # Standalone backtest execution script
│   ├── live_runner.py                        # Automated MT5 live execution bot
│   ├── backtest_trades.csv                   # All 781 closed trade records
│   ├── institutional_tear_sheet.html         # Interactive tear-sheet report
│   └── individual_strategies/                # Individual constituent strategy reports
│
├── Ensemble_02_7Engine_HighAlpha_Shield/     # Rank #2 (+$123.5k, 9.95% DD, 959 trades)
│   ├── Stratmarket_Performance_Report.html
│   ├── backtest_runner.py
│   ├── live_runner.py
│   ├── backtest_trades.csv
│   ├── institutional_tear_sheet.html
│   └── individual_strategies/
│
├── Ensemble_03_7Engine_Precision_Shield/     # Rank #3 (+$122.4k, 9.35% DD, 10.48 Calmar)
│   └── ...
├── Ensemble_04_6Engine_InverseDD_Fleet/      # Rank #4 (+$121.6k, 9.77% DD, 2.02 PF)
│   └── ...
├── Ensemble_05_5Engine_Ultra_Shield/         # Rank #5 (+$117.6k, 9.53% DD, 2.28 PF, 16 Max Losses)
│   └── ...
├── Ensemble_06_5Engine_Trend_Shield/         # Rank #6 (+$116.3k, 9.74% DD, 2.16 PF)
│   └── ...
├── Ensemble_07_6Engine_Multi_Regime/         # Rank #7 (+$115.9k, 9.80% DD, 2.04 PF)
│   └── ...
├── Ensemble_08_5Engine_HighSharpe_Fleet/     # Rank #8 (+$115.5k, 9.50% DD, 1.89 Sharpe, 16 Max Losses)
│   └── ...
├── Ensemble_09_5Engine_Asian_Squeeze/        # Rank #9 (+$115.1k, 9.96% DD, 2.21 PF)
│   └── ...
└── Ensemble_10_5Engine_LowLoss_Fleet/        # Rank #10 (+$115.0k, 9.43% DD, $5,882 Max DD)
    └── ...
```

## How to Run Any Ensemble

### 1. Run the Backtest
Navigate to any ensemble's subfolder and run:
```bash
python backtest_runner.py
```

### 2. Run the Live MT5 Bot
Ensure MetaTrader 5 terminal is running and open, then execute:
```bash
python live_runner.py
```

### 3. Open the Reports
- **StratMarket Performance Report**: Open `Stratmarket_Performance_Report.html` (or `Stratmarket report of every staergy.html`) in any browser for the clean, serif publication-grade performance report.
- **Institutional Tear-Sheet**: Open `institutional_tear_sheet.html` inside any browser to view interactive Chart.js equity curves, underwater drawdown charts, and trade tables.
- **Master Visual Catalog**: Open `INDEX.html` to browse and launch all 10 ensembles from one dashboard.
